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
    // Logic: Status is 'sent' OR 'overdue', due_date < today
    // This allows sending reminders for already overdue invoices too
    const overdueInvoices = await Invoice.find({
      status: { $in: ["sent", "overdue"] },
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
        let statusUpdated = false;

        // Only update status if it was "sent" (newly overdue)
        if (invoice.status === "sent") {
          invoice.status = "overdue";
          invoice.status_history.push({
            status: "overdue",
            remark: "Automatically marked as overdue by system",
            date: new Date(),
          });
          await invoice.save();
          statusUpdated = true;
        }

        // Send overdue reminder email (for both newly overdue and existing overdue)
        // Note: This will send daily reminders if scheduled daily
        const emailResult = await sendInvoiceStatusEmail(
          invoice._id,
          "overdue"
        );

        console.log(
          `Invoice ${invoice.invoice_number}: ${
            statusUpdated ? "Marked as overdue & " : ""
          }Reminder Sent. Email: ${emailResult.success ? "Success" : "Failed"}`
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
