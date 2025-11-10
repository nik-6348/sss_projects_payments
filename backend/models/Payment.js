const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    enum: ['INR', 'USD'],
    default: 'INR'
  },
  payment_method: {
    type: String,
    enum: ['bank_account', 'other'],
    default: 'bank_account'
  },
  bank_account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankDetails'
  },
  custom_payment_details: {
    type: String,
    trim: true
  },
  payment_date: {
    type: Date,
    required: [true, 'Payment date is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
paymentSchema.index({ project_id: 1 });
paymentSchema.index({ invoice_id: 1 });
paymentSchema.index({ payment_date: -1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
