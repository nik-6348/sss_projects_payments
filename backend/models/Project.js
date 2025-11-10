const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  total_amount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  currency: {
    type: String,
    enum: ['INR', 'USD'],
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed', 'cancelled', 'draft'],
    default: 'active'
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
