const mongoose = require('mongoose');
const BankDetails = require('./models/BankDetails');
require('dotenv').config();

const sampleBankAccounts = [
  {
    accountHolderName: 'SSS Projects',
    accountNumber: '1234567890123456',
    ifscCode: 'SBIN0001234',
    bankName: 'State Bank of India',
    accountType: 'Current'
  },
  {
    accountHolderName: 'SSS Projects',
    accountNumber: '9876543210987654',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
    accountType: 'Current'
  },
  {
    accountHolderName: 'SSS Projects',
    accountNumber: '5555666677778888',
    ifscCode: 'ICIC0001234',
    bankName: 'ICICI Bank',
    accountType: 'Savings'
  }
];

const seedBankAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sss_projects');
    console.log('Connected to MongoDB');

    // Clear existing bank accounts
    await BankDetails.deleteMany({});
    console.log('Cleared existing bank accounts');

    // Insert sample bank accounts
    const createdAccounts = await BankDetails.insertMany(sampleBankAccounts);
    console.log(`Created ${createdAccounts.length} bank accounts:`);
    createdAccounts.forEach(account => {
      console.log(`- ${account.bankName}: ${account.accountNumber}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding bank accounts:', error);
    process.exit(1);
  }
};

seedBankAccounts();