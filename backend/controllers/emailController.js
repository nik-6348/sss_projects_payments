import nodemailer from "nodemailer";
import crypto from "crypto";
import Settings from "../models/Settings.js";
import Invoice from "../models/Invoice.js";
import Client from "../models/Client.js";
import BankDetails from "../models/BankDetails.js";
import { generateInvoicePDF } from "../utils/generatePDF.js";

// Encryption settings
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-secret-key-should-be-32-bytes-long"; // 32 bytes
const IV_LENGTH = 16;

// Helper to encrypt text
export const encrypt = (text) => {
  if (!text) return text;
  // Ensure key is 32 bytes
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

// Helper to decrypt text
export const decrypt = (text) => {
  if (!text) return text;
  try {
    const textParts = text.split(":");
    if (textParts.length < 2) return text; // Not encrypted or invalid format
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption error:", error);
    return text; // Return original if decryption fails (e.g. plain text during migration)
  }
};

// Create transporter from settings
const createTransporter = async () => {
  const settings = await Settings.findOne();
  if (!settings || !settings.smtp_settings || !settings.smtp_settings.host) {
    throw new Error("SMTP settings not configured");
  }

  const { host, port, user, pass, secure } = settings.smtp_settings;
  const decryptedPass = decrypt(pass);

  return nodemailer.createTransport({
    host,
    port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user,
      pass: decryptedPass,
    },
  });
};

// Test SMTP Connection
export const testSMTP = async (req, res) => {
  try {
    const { host, port, user, pass, secure } = req.body;

    // Create a temporary transporter for testing
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass, // Use plain password from request for testing
      },
    });

    await transporter.verify();
    res
      .status(200)
      .json({ success: true, message: "SMTP Connection Successful" });
  } catch (error) {
    console.error("SMTP Test Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Send Invoice Email
export const sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { to, cc, bcc, subject, body } = req.body;

    const invoice = await Invoice.findById(id)
      .populate("project_id")
      .populate("bank_account_id");

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    const client = await Client.findById(invoice.project_id.client_id);
    const bankDetails =
      invoice.bank_account_id || (await BankDetails.findOne());
    const settings = await Settings.findOne();
    const companyDetails = settings?.company_details || {};

    // Generate PDF or use existing
    let pdfBase64 = invoice.pdf_base64;

    if (!pdfBase64) {
      pdfBase64 = generateInvoicePDF(
        invoice,
        client,
        bankDetails,
        companyDetails
      );

      // Save generated PDF to invoice
      invoice.pdf_base64 = pdfBase64;
      invoice.pdf_generated_at = new Date();
      await invoice.save();
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Create Transporter
    const transporter = await createTransporter();

    // Helper to replace variables
    const replaceVars = (text) => {
      if (!text) return "";
      return text
        .replace(
          /{client_name}/g,
          invoice.project_id?.client_name || client?.name || "Client"
        )
        .replace(/{invoice_number}/g, invoice.invoice_number)
        .replace(/{company_name}/g, companyDetails.name || "Company")
        .replace(
          /{amount}/g,
          `${invoice.currency || settings.currency || "INR"} ${
            invoice.total_amount || invoice.amount
          }`
        )
        .replace(/{due_date}/g, new Date(invoice.due_date).toLocaleDateString())
        .replace(/{project_name}/g, invoice.project_id?.name || "Project")
        .replace(/{currency}/g, invoice.currency || settings.currency || "INR");
    };

    const finalSubject = replaceVars(subject);
    const finalBody = replaceVars(body);

    // Send Email
    const mailOptions = {
      from: `"${settings?.company_details?.name || "Invoice System"}" <${
        settings?.smtp_settings?.user
      }>`,
      to,
      cc,
      bcc,
      subject: finalSubject,
      html: finalBody.replace(/\n/g, "<br>"), // Convert newlines to HTML breaks
    };

    // Attach PDF if requested (default to true if not specified)
    if (req.body.attachInvoice !== false) {
      mailOptions.attachments = [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    // Update invoice status if needed (optional)
    if (invoice.status === "draft") {
      invoice.status = "sent";
      await invoice.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Invoice sent successfully" });
  } catch (error) {
    console.error("Send Email Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send Invoice Status Email (cancelled, overdue, paid)
import emailTemplates from "../config/emailTemplates.js";
import Project from "../models/Project.js";

export const sendInvoiceStatusEmail = async (invoiceId, status) => {
  try {
    // Validate status
    if (!["cancelled", "overdue", "paid"].includes(status)) {
      console.log(`Status "${status}" does not require email notification`);
      return { success: false, message: "No email required for this status" };
    }

    // Fetch invoice with project details
    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "project_id",
        populate: {
          path: "client_id",
          select: "name email",
        },
      })
      .populate("bank_account_id");

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Get project and client details
    const project = await Project.findById(invoice.project_id._id).populate(
      "client_id"
    );
    if (!project) {
      throw new Error("Project not found");
    }

    // Get client from project
    const client = project.client_id;

    // Determine recipient email - prioritize finance_email for invoices
    const recipientEmail =
      client?.finance_email || client?.business_email || client?.email;

    if (!recipientEmail) {
      console.log("No recipient email found for invoice notification");
      return { success: false, message: "No recipient email configured" };
    }

    // Get settings and company details
    const settings = await Settings.findOne();
    const companyDetails = settings?.company_details || {};

    // Get email template
    const template = emailTemplates[status];
    if (!template) {
      throw new Error(`Email template not found for status: ${status}`);
    }

    // Replace placeholders in template
    const replaceVars = (text) => {
      if (!text) return "";
      return text
        .replace(/{client_name}/g, client?.name || "Client")
        .replace(/{invoice_number}/g, invoice.invoice_number)
        .replace(/{company_name}/g, companyDetails.name || "Company")
        .replace(
          /{amount}/g,
          `${invoice.currency || "INR"} ${
            invoice.total_amount || invoice.amount
          }`
        )
        .replace(/{due_date}/g, new Date(invoice.due_date).toLocaleDateString())
        .replace(/{paid_date}/g, new Date().toLocaleDateString())
        .replace(/{project_name}/g, invoice.project_id?.name || "Project");
    };

    const finalSubject = replaceVars(template.subject);
    const finalBody = replaceVars(template.body);

    // Create transporter and send email
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${companyDetails.name || "Invoice System"}" <${
        settings?.smtp_settings?.user
      }>`,
      to: recipientEmail,
      subject: finalSubject,
      html: finalBody,
    };

    await transporter.sendMail(mailOptions);

    console.log(
      `Status email sent successfully: ${status} - ${invoice.invoice_number} to ${recipientEmail}`
    );
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Send Status Email Error:", error);
    return { success: false, error: error.message };
  }
};
