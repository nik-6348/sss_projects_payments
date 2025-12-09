import axios from "axios";
import Invoice from "../models/Invoice.js";
import env from "../config/env.js";

// Meta API Configuration
// Ensure these are added to your env.js / .env
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const WA_BUSINESS_ACCOUNT_ID = process.env.WA_BUSINESS_ACCOUNT_ID;

export const sendInvoiceWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      to,
      templateName = "invoice_available",
      languageCode = "en_US",
    } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: "Recipient phone number is required",
      });
    }

    if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "WhatsApp API credentials are not configured",
      });
    }

    const invoice = await Invoice.findById(id).populate({
      path: "project_id",
      populate: { path: "client_id" },
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Format Data for Template
    // Using a generic template structure: "invoice_available" (Standard Utility)
    // Variables: {{1}}=Client Name, {{2}}=Invoice Number, {{3}}=Amount, {{4}}=Due Date, {{5}}=Link

    // NOTE: You must create a template in Meta Business Manager with these parameters or adjust this payload.
    // For this implementation, we will try to use a standard 'text' message if template fails OR suggest template usage.
    // However, business-initiated messages MUST be templates.
    // We will assume a template named "invoice_notification" exists with 5 vars.

    // Construct public link (assuming frontend URL)
    const invoiceLink = `${
      env.CLIENT_URL || "http://localhost:5173"
    }/invoices/${invoice._id}/view`;

    const payload = {
      messaging_product: "whatsapp",
      to: to, // Phone number with country code (e.g., 919876543210)
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: invoice.project_id?.client_id?.name || "Client",
              },
              { type: "text", text: invoice.invoice_number },
              { type: "text", text: `${invoice.currency} ${invoice.amount}` },
              {
                type: "text",
                text: new Date(invoice.due_date).toLocaleDateString(),
              },
              { type: "text", text: invoiceLink },
            ],
          },
        ],
      },
    };

    console.log("Sending WhatsApp message to:", to);

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WA_PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update invoice status if needed (e.g. mark as sent if draft)
    if (invoice.status === "draft") {
      invoice.status = "sent";
      invoice.status_history.push({
        status: "sent",
        remark: "Sent via WhatsApp",
        date: new Date(),
      });
      await invoice.save();
    }

    res.status(200).json({
      success: true,
      data: response.data,
      message: "WhatsApp message sent successfully",
    });
  } catch (error) {
    console.error("WhatsApp API Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: "Failed to send WhatsApp message",
      details: error.response?.data || error.message,
    });
  }
};
