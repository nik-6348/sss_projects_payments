import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },
    invoice_number: {
      type: String,
      required: [true, "Invoice number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      // default: generated in controller via settings
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
    status: {
      type: String,
      enum: ["draft", "sent", "unpaid", "paid", "partial", "overdue", "cancelled"],
      default: "draft",
    },
    paid_amount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    balance_due: {
      type: Number,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    issue_date: {
      type: Date,
      default: Date.now,
    },
    due_date: {
      type: Date,
    },
    deletion_remark: {
      type: String,
      trim: true,
    },
    status_history: [
      {
        status: {
          type: String,
          required: true,
          enum: ["draft", "sent", "unpaid", "paid", "partial", "overdue", "cancelled"],
        },
        remark: {
          type: String,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    services: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        hours: {
          type: Number,
          default: 0,
        },
        rate: {
          type: Number,
          default: 0,
        },
        team_role: {
          type: String,
          trim: true,
        },
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    gst_percentage: {
      type: Number,
      default: 18,
    },
    gst_amount: {
      type: Number,
      default: 0,
    },
    include_gst: {
      type: Boolean,
      default: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["bank_account", "other"],
      default: "bank_account",
    },
    bank_account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankDetails",
    },
    custom_payment_details: {
      type: String,
      trim: true,
    },
    pdf_base64: {
      type: String,
    },
    pdf_generated_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Invoice number is now generated automatically via default function above

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);
