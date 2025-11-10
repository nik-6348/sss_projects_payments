const { generateInvoicePDF } = require('./utils/generatePDF');
const fs = require('fs');

// Dummy invoice data with services
const invoiceData = {
  invoice_number: 'INV-2024-001',
  issue_date: new Date('2024-01-15'),
  currency: 'INR',
  services: [
    { description: 'Web Development Services', amount: 50000 },
    { description: 'UI/UX Design', amount: 30000 },
    { description: 'API Integration', amount: 20000 }
  ],
  subtotal: 100000,
  gst_percentage: 18,
  gst_amount: 18000,
  total_amount: 118000,
  amount: 118000
};

// Dummy client data
const clientData = {
  name: 'ABC Corporation',
  address: {
    street: '123 Business Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India'
  },
  gst_number: 'GST123456789'
};

// Dummy bank details
const bankDetails = {
  accountHolderName: 'Your Company Name',
  accountNumber: '1234567890',
  ifscCode: 'BANK0001234',
  bankName: 'State Bank of India'
};

try {
  console.log('Generating PDF...');
  const pdfBase64 = generateInvoicePDF(invoiceData, clientData, bankDetails);
  
  // Save PDF to file
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  fs.writeFileSync('test-invoice.pdf', pdfBuffer);
  
  console.log('✓ PDF generated successfully!');
  console.log('✓ File saved as: test-invoice.pdf');
} catch (error) {
  console.error('✗ Error generating PDF:', error.message);
  console.error(error);
}
