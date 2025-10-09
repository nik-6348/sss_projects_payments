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
  payment_method: {
    type: String,
    enum: ['bank_transfer', 'credit_card', 'upi', 'cash', 'other'],
    default: 'bank_transfer'
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

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
