import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    gst_settings: {
      default_percentage: {
        type: Number,
        default: 18,
      },
      enable_gst: {
        type: Boolean,
        default: true,
      },
    },
    invoice_settings: {
      format: {
        type: String,
        default: "INV-{YYYY}-{SEQ}",
        trim: true,
      },
      current_sequence: {
        type: Number,
        default: 1,
      },
    },
    company_details: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      contact: { type: String, trim: true },
      email: { type: String, trim: true },
      gst_number: { type: String, trim: true },
      LUTNumber: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    smtp_settings: {
      host: { type: String, trim: true },
      port: { type: Number },
      user: { type: String, trim: true },
      pass: { type: String, trim: true }, // Will be encrypted
      secure: { type: Boolean, default: true },
    },
    email_settings: {
      default_cc: { type: String, trim: true },
      default_bcc: { type: String, trim: true },
    },
    email_templates: {
      invoice_default: {
        subject: {
          type: String,
          default: "Invoice {invoice_number} from {company_name}",
        },
        body: {
          type: String,
          default:
            "Dear {client_name},\n\nPlease find attached the invoice {invoice_number}.\n\nRegards,\n{company_name}",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);
