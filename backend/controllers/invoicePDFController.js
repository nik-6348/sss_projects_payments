import Invoice from "../models/Invoice.js";
import Client from "../models/Client.js";
import BankDetails from "../models/BankDetails.js";
import { generateInvoicePDF } from "../utils/generatePDF.js";

export const generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
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

    const pdfBase64 = generateInvoicePDF(invoice, client, bankDetails);

    await Invoice.findByIdAndUpdate(req.params.id, {
      pdf_base64: pdfBase64,
      pdf_generated_at: new Date(),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${invoice.invoice_number}.pdf`
    );
    res.send(Buffer.from(pdfBase64, "base64"));
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const viewPDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("project_id")
      .populate("bank_account_id");
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // If PDF not generated, generate it now
    if (!invoice.pdf_base64) {
      const client = await Client.findById(invoice.project_id.client_id);
      const bankDetails =
        invoice.bank_account_id || (await BankDetails.findOne());
      const pdfBase64 = generateInvoicePDF(invoice, client, bankDetails);

      await Invoice.findByIdAndUpdate(req.params.id, {
        pdf_base64: pdfBase64,
        pdf_generated_at: new Date(),
      });

      return res
        .status(200)
        .json({ success: true, data: { pdf_base64: pdfBase64 } });
    }

    res
      .status(200)
      .json({ success: true, data: { pdf_base64: invoice.pdf_base64 } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
