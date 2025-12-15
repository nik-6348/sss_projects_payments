import nodemailer from "nodemailer";
import crypto from "crypto";
import Settings from "../models/Settings.js";
import Invoice from "../models/Invoice.js";
import Client from "../models/Client.js";
import BankDetails from "../models/BankDetails.js";
import Project from "../models/Project.js";
import { generateInvoicePDF } from "../utils/generateInvoiceNew.js";

import { wrapEmailBody } from "../config/emailBaseTemplate.js";
import emailTemplates from "../config/emailTemplates.js";

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

    // Generate Dummy PDF for testing using the same generator
    // Mock Data
    const mockInvoice = {
      invoice_number: "TEST-001",
      status: "sent",
      due_date: new Date(),
      subtotal: 1000,
      gst_percentage: 18,
      gst_amount: 180,
      total_amount: 1180,
      currency: "INR",
      project_id: {
        name: "Test Project",
        project_type: "fixed",
        allocation_type: "overall",
      },
      services: [{ description: "Test Service 1", amount: 1000 }],
    };
    const mockClient = {
      name: "Test Client",
      email: user, // Send to self? Or just use for name
      address: { street: "123 Test St", city: "Test City" },
    };
    const mockBank = {
      bankName: "Test Bank",
      accountNumber: "1234567890",
      ifscCode: "TEST0001",
    };
    const mockCompany = {
      name: "Your Company",
      email: user,
    };

    const pdfBase64 = generateInvoicePDF(
      mockInvoice,
      mockClient,
      mockBank,
      mockCompany
    );
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const mailOptions = {
      from: `Test <${user}>`,
      to: user, // Send test email to the sender
      subject: "SMTP Test Email (with Attachment)",
      html: "<p>This is a test email to verify your SMTP settings. Find attached a sample invoice PDF.</p>",
      attachments: [
        {
          filename: "Test-Invoice.pdf",
          content: pdfBuffer,
        },
      ],
    };

    await transporter.verify();
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "SMTP Connection Successful. Test email sent.",
    });
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

    // Update invoice status if needed (Update BEFORE sending to ensure PDF has correct status)
    if (invoice.status === "draft") {
      invoice.status = "sent";
    }

    // Prepare Invoice Data for PDF Generation
    // User wants "UNPAID" status on PDF when sent, not "SENT"
    const pdfInvoiceData = invoice.toObject
      ? invoice.toObject()
      : { ...invoice };
    if (pdfInvoiceData.status === "sent") {
      pdfInvoiceData.status = "UNPAID";
    }

    // Always Regenerate PDF to ensure it matches current data AND status
    const pdfBase64 = generateInvoicePDF(
      pdfInvoiceData,
      client,
      bankDetails,
      companyDetails
    );

    // Update the saved PDF in DB
    invoice.pdf_base64 = pdfBase64;
    invoice.pdf_generated_at = new Date();
    await invoice.save(); // Save status and PDF

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Create Transporter
    const transporter = await createTransporter();

    // Use hardcoded template for defaults variables/structure if needed,
    // but here we trust the frontend sent the correct body/subject
    // OR we can re-generate them from hardcoded templates if we want to enforce it.
    // User asked to "hard code" templates. Assuming frontend might send custom body?
    // User said "Templates hard code rakho".
    // If the frontend sends body, it's used. If not, we should probably fetch default.
    // However, existing logic uses body from request. Let's keep it but wrap it.

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
    // Use the wrapped email body
    const finalBody = wrapEmailBody(replaceVars(body), companyDetails);

    // Send Email
    const mailOptions = {
      from: `"${settings?.company_details?.name || "Invoice System"}" <${
        settings?.smtp_settings?.user
      }>`,
      to,
      cc,
      bcc,
      subject: finalSubject,
      html: finalBody, // Already HTML
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

    res
      .status(200)
      .json({ success: true, message: "Invoice sent successfully" });
  } catch (error) {
    console.error("Send Email Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send Invoice Status Email (cancelled, overdue, paid, partial)
export const sendInvoiceStatusEmail = async (
  invoiceId,
  status,
  extraData = {}
) => {
  try {
    // Validate status
    if (!["cancelled", "overdue", "paid", "partial"].includes(status)) {
      console.log(`Status "${status}" does not require email notification`);
      return { success: false, message: "No email required for this status" };
    }

    // Fetch invoice with project details
    const invoice = await Invoice.findById(invoiceId)
      .populate({
        path: "project_id",
        populate: {
          path: "client_id",
          // Removed select to ensure we get all email fields (finance_email, etc)
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

    // Get email template from hardcoded config
    let template = emailTemplates[status];

    if (!template) {
      console.log(`Email template not configured for status: ${status}`);
      return { success: false, message: "Template not found" };
    }

    // Helper to get cancellation remark
    const getCancellationRemark = () => {
      if (status !== "cancelled") return "";
      // Check top level
      if (invoice.deletion_remark) return invoice.deletion_remark;
      if (invoice.remark) return invoice.remark;

      // Check history
      if (Array.isArray(invoice.status_history)) {
        const cancelledEntry = [...invoice.status_history]
          .reverse()
          .find((h) => h.status === "cancelled");
        return cancelledEntry?.remark || "";
      }
      return "";
    };

    // Helper to generate Invoice Table HTML
    const generateInvoiceTableHtml = (inv) => {
      const { project_type, allocation_type } = inv.project_id || {};
      const currencySymbol =
        inv.currency === "USD" ? "$" : inv.currency === "INR" ? "₹" : "₹"; // Default to ₹ if undefined or other
      const isEmployeeBased =
        project_type === "hourly_billing" &&
        allocation_type === "employee_based";

      const thStyle =
        "background-color: #f8fafc; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; white-space: nowrap;";
      const tdStyle =
        "padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;";
      const tdNumStyle =
        "padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: right; white-space: nowrap;";
      const trFooterStyle = "background-color: #f8fafc;";

      let headers = "";
      if (isEmployeeBased) {
        headers = `
          <tr>
            <th style="${thStyle} width: 40%">Role / Description</th>
            <th style="${thStyle} width: 15%; text-align: center">Hours</th>
            <th style="${thStyle} width: 20%; text-align: right">Rate</th>
            <th style="${thStyle} width: 25%; text-align: right">Amount</th>
          </tr>`;
      } else {
        headers = `
          <tr>
            <th style="${thStyle} width: 70%">Description</th>
            <th style="${thStyle} width: 30%; text-align: right">Amount</th>
          </tr>`;
      }

      const rows = (inv.services || [])
        .map((service) => {
          const amountFormatted = `${currencySymbol} ${Number(
            service.amount
          ).toFixed(2)}`;
          if (isEmployeeBased) {
            const roleDesc = service.team_role
              ? `${service.team_role} - ${service.description}`
              : service.description;
            const rateFormatted = service.rate
              ? `${currencySymbol} ${Number(service.rate).toFixed(2)}`
              : "-";
            const hours = service.hours || 0;
            return `
            <tr>
              <td style="${tdStyle}">${roleDesc}</td>
              <td style="${tdStyle} text-align: center">${hours}</td>
              <td style="${tdNumStyle}">${rateFormatted}</td>
              <td style="${tdNumStyle} font-weight: 600;">${amountFormatted}</td>
            </tr>`;
          } else {
            const desc = service.description || "Service";
            return `
            <tr>
              <td style="${tdStyle}">${desc}</td>
              <td style="${tdNumStyle} font-weight: 600;">${amountFormatted}</td>
            </tr>`;
          }
        })
        .join("");

      // Footer Rows
      const colspanLabel = isEmployeeBased ? 3 : 1;
      let footerRows = "";

      // Subtotal
      footerRows += `
        <tr>
          <td colspan="${colspanLabel}" style="${tdStyle} text-align: right; font-weight: 600; color: #64748b;">Sub Total</td>
          <td style="${tdNumStyle} font-weight: 600;">${currencySymbol} ${Number(
        inv.subtotal || inv.amount
      ).toFixed(2)}</td>
        </tr>
      `;

      // Tax
      if (inv.gst_amount > 0) {
        footerRows += `
        <tr>
          <td colspan="${colspanLabel}" style="${tdStyle} text-align: right; font-weight: 600; color: #64748b;">GST (${
          inv.gst_percentage
        }%)</td>
          <td style="${tdNumStyle} font-weight: 600;">${currencySymbol} ${Number(
          inv.gst_amount
        ).toFixed(2)}</td>
        </tr>
      `;
      }

      // Total
      footerRows += `
        <tr style="${trFooterStyle}">
          <td colspan="${colspanLabel}" style="${tdStyle} text-align: right; font-weight: 700; color: #334155; font-size: 16px;">Total Payable</td>
          <td style="${tdNumStyle} font-weight: 700; color: #2563eb; font-size: 16px;">${currencySymbol} ${Number(
        inv.total_amount || inv.amount
      ).toFixed(2)}</td>
        </tr>
      `;

      // Wrapping in responsive div with header info
      return `
        <div style="margin-bottom: 24px; font-size: 14px; color: #334155;">
          <p style="margin: 0 0 8px 0;"><strong>Project:</strong> ${
            inv.project_id?.name || "-"
          }</p>
          <p style="margin: 0;"><strong>Due Date:</strong> ${new Date(
            inv.due_date
          ).toLocaleDateString()}</p>
        </div>
        <div style="margin-bottom: 32px; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
            <thead>${headers}</thead>
            <tbody>${rows}${footerRows}</tbody>
          </table>
        </div>
      `;
    };

    // Replace placeholders in template
    const replaceVars = (text) => {
      if (!text) return "";
      const currencyCode = invoice.currency || "INR";
      const currencySymbol =
        currencyCode === "USD" ? "$" : currencyCode === "INR" ? "₹" : "₹";

      return text
        .replace(/{client_name}/g, client?.name || "Client")
        .replace(/{invoice_number}/g, invoice.invoice_number)
        .replace(/{company_name}/g, companyDetails.name || "Company")
        .replace(
          /{amount}/g,
          `${currencySymbol} ${invoice.total_amount || invoice.amount}`
        )
        .replace(
          /{total_amount}/g,
          `${currencySymbol} ${invoice.total_amount || invoice.amount}`
        )
        .replace(
          /{paid_now}/g,
          `${currencySymbol} ${extraData.amount || invoice.paid_amount || 0}`
        )
        .replace(
          /{balance_due}/g,
          `${currencySymbol} ${invoice.balance_due || 0}`
        )
        .replace(/{due_date}/g, new Date(invoice.due_date).toLocaleDateString())
        .replace(/{paid_date}/g, new Date().toLocaleDateString())
        .replace(/{project_name}/g, invoice.project_id?.name || "Project")
        .replace(/{deletion_remark}/g, getCancellationRemark() || "")
        .replace(/{table_details}/g, generateInvoiceTableHtml(invoice));
    };

    const finalSubject = replaceVars(template.subject);
    // Wrap with standardized template
    const finalBody = wrapEmailBody(replaceVars(template.body), companyDetails);

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

// Get Email Template
export const getEmailTemplate = async (req, res) => {
  try {
    const { type } = req.body; // e.g., 'invoice_default', 'paid', 'overdue'

    // Use hardcoded templates from config
    let template = emailTemplates[type];

    // Fallback if not exact match (optional, or just return default)
    if (!template && type === "default")
      template = emailTemplates["invoice_default"];

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: "Template not found" });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Get Template Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send Test Email
export const sendTestEmail = async (req, res) => {
  try {
    const { templateKey, toEffect } = req.body;
    let { to } = req.body;
    if (!to && toEffect) to = toEffect; // Handle potential naming confusion if any

    const settings = await Settings.findOne();
    const companyDetails = settings?.company_details || {};

    // Use hardcoded templates
    let template = emailTemplates[templateKey];

    // Fallback mapping if frontend sends different keys
    if (!template) {
      const map = {
        invoice_default: "invoice_default", // standard
        payment_receipt: "paid",
        invoice_overdue: "overdue",
        invoice_cancelled: "cancelled",
      };
      template = emailTemplates[map[templateKey]];
    }

    if (!template) {
      return res
        .status(404)
        .json({ success: false, error: "Template not found" });
    }

    // Dummy Data for Preview
    const dummyData = {
      client_name: "John Doe",
      invoice_number: "INV-TEST-001",
      company_name: companyDetails.name || "Your Company",
      amount: `${settings?.currency || "INR"} 1,000.00`,
      due_date: new Date().toLocaleDateString(),
      project_name: "Test Project",
      paid_date: new Date().toLocaleDateString(),
      deletion_remark: "Created by mistake (Test)",
    };

    const replaceVars = (text) => {
      let newText = text;
      for (const [key, value] of Object.entries(dummyData)) {
        newText = newText.replace(new RegExp(`{${key}}`, "g"), value);
      }
      return newText;
    };

    const finalSubject = "[TEST] " + replaceVars(template.subject);
    const finalBody = wrapEmailBody(replaceVars(template.body), companyDetails);

    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"${companyDetails.name || "Invoice System"}" <${
        settings?.smtp_settings?.user
      }>`,
      to: to,
      subject: finalSubject,
      html: finalBody,
    });

    res.json({ success: true, message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
