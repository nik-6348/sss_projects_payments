const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Client email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Client phone is required'],
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  gst_number: {
    type: String,
    trim: true,
    uppercase: true
  },
  pan_number: {
    type: String,
    trim: true,
    uppercase: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Client || mongoose.model('Client', clientSchema);