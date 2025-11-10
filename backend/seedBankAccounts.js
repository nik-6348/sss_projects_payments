const mongoose = require('mongoose');
const BankDetails = require('./models/BankDetails');

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
    await mongoose.connect('mongodb+srv://sss_db:Singaji123@cluster0.ybuk2zo.mongodb.net/sss_project?retryWrites=true&w=majority')

    // Drop the collection to remove any problematic indexes
    await BankDetails.collection.drop().catch(() => console.log('Collection does not exist'));
    console.log('Dropped bank details collection');

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