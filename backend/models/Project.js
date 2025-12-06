import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    total_amount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
    status: {
      type: String,
      enum: ["active", "on_hold", "completed", "cancelled", "draft"],
      default: "active",
    },
    start_date: {
      type: Date,
      required: [true, "Start date is required"],
    },
    end_date: {
      type: Date,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    team_members: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          trim: true,
        },
        weekly_hours: {
          type: Number,
          default: 0,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    // GST Settings (moved from Invoice to Project level)
    gst_percentage: {
      type: Number,
      default: 18,
    },
    include_gst: {
      type: Boolean,
      default: true,
    },
    // Multi-Email Support
    client_emails: {
      business_email: { type: String, trim: true },
      finance_email: { type: String, trim: true },
      support_email: { type: String, trim: true },
    },
    // Project Type
    project_type: {
      type: String,
      enum: ["fixed_contract", "monthly_retainer", "hourly_billing", ""],
      default: "",
    },
    // Fixed Contract fields
    contract_amount: {
      type: Number,
      default: 0,
    },
    contract_length: {
      type: Number, // in months
      default: 0,
    },
    // Monthly Retainer fields
    monthly_fee: {
      type: Number,
      default: 0,
    },
    billing_cycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", ""],
      default: "",
    },
    // Hourly Billing fields
    hourly_rate: {
      type: Number,
      default: 0,
    },
    estimated_hours: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.models.Project ||
  mongoose.model("Project", projectSchema);
