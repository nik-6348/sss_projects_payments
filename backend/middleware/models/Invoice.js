const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  invoice_number: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    default: function() {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `INV-${year}-${random}`;
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  issue_date: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  due_date: {
    type: Date,
    required: [true, 'Due date is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Invoice number is now generated automatically via default function above

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
