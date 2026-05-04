import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
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
    payment_method: {
      type: String,
      enum: [
        "bank_account",
        "cash",
        "upi",
        "cheque",
        "contract",
        "outsource",
        "other",
      ],
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
    include_tds: {
      type: Boolean,
      default: false,
    },
    tds_percentage: {
      type: Number,
      default: 10,
    },
    tds_amount: {
      type: Number,
      default: 0,
    },
    credited_amount: {
      type: Number,
      default: 0,
    },
    usd_to_inr_rate: {
      type: Number,
      default: 0,
    },
    inr_converted_amount: {
      type: Number,
      default: 0,
    },
    remark: {
      type: String,
      trim: true,
    },
    payment_date: {
      type: Date,
      required: [true, "Payment date is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
paymentSchema.index({ project_id: 1 });
paymentSchema.index({ invoice_id: 1 });
paymentSchema.index({ payment_date: -1 });

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
