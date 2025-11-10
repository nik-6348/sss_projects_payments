const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankName: { type: String, required: true },
  accountType: { type: String, required: true },
  swiftCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.BankDetails || mongoose.model('BankDetails', bankDetailsSchema);
