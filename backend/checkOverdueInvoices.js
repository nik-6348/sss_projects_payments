// Scheduled task to check for overdue invoices and send reminders
// This can be run via cron job: node checkOverdueInvoices.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import Invoice from "./models/Invoice.js";
import { sendInvoiceStatusEmail } from "./controllers/emailController.js";

export async function checkOverdueInvoices() {
  try {
    console.log(`Checking for overdue invoices at ${new Date().toISOString()}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find invoices that are due and should be marked as overdue
    // Logic: Status is 'sent', due_date < today, and not already overdue or paid
    const overdueInvoices = await Invoice.find({
      status: "sent",
      due_date: { $lt: today },
      isDeleted: false,
    });

    console.log(
      `Found ${
        overdueInvoices.length
      } overdue invoices at ${today.toISOString()}`
    );

    for (const invoice of overdueInvoices) {
      try {
        // Update status to overdue
        invoice.status = "overdue";
        invoice.status_history.push({
          status: "overdue",
          remark: "Automatically marked as overdue by system",
          date: new Date(),
        });
        await invoice.save();

        // Send overdue reminder email
        const emailResult = await sendInvoiceStatusEmail(
          invoice._id,
          "overdue"
        );

        console.log(
          `Invoice ${
            invoice.invoice_number
          }: Status updated to overdue, Email: ${
            emailResult.success ? "Sent" : "Failed"
          }`
        );
      } catch (invoiceError) {
        console.error(
          `Error processing invoice ${invoice.invoice_number}:`,
          invoiceError
        );
      }
    }

    console.log("Overdue check complete");
  } catch (error) {
    console.error("Error checking overdue invoices:", error);
  }
}
