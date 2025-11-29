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
      website: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);
