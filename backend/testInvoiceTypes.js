import fs from "fs";
import { generateInvoicePDF } from "./utils/generateInvoiceNew.js";

// Mock Data Builders
const createProject = (type, allocation) => ({
  name: `Test Project - ${type} ${allocation}`,
  project_type: type,
  allocation_type: allocation,
  client_id: {
    name: "Test Client",
    address: { street: "123 Test St", city: "Test City" },
  },
});

const createInvoice = (project, services) => ({
  invoice_number: `INV-${project.project_type.substring(0, 3).toUpperCase()}`,
  project_id: project,
  services: services,
  amount: services.reduce((sum, s) => sum + s.amount, 0),
  subtotal: services.reduce((sum, s) => sum + s.amount, 0),
  gst_percentage: 18,
  gst_amount: services.reduce((sum, s) => sum + s.amount, 0) * 0.18,
  total_amount: services.reduce((sum, s) => sum + s.amount, 0) * 1.18,
  issue_date: new Date(),
  due_date: new Date(Date.now() + 86400000 * 7),
  currency: "INR",
  status: "draft",
});

const clientData = {
  name: "Test Client Co",
  address: { street: "123 Biz Park", city: "Tech City" },
  gst_number: "27ABCDE1234F1Z5",
};
const companyDetails = {
  name: "My Tech Agency",
  address: "456 Dev Lane",
  email: "finance@agency.com",
  contact: "9999999999",
};
const bankDetails = {
  bankName: "HDFC Bank",
  accountNumber: "1234567890",
  ifscCode: "HDFC0001234",
  accountHolderName: "My Tech Agency",
};

// 1. Fixed Contract (Overall)
const projectFixed = createProject("fixed_contract", "overall");
const invoiceFixed = createInvoice(projectFixed, [
  { description: "Milestone 1 Payment", amount: 50000 },
  { description: "Milestone 2 Payment", amount: 50000 },
]);

// 2. Hourly Billing (Employee Based)
const projectHourly = createProject("hourly_billing", "employee_based");
const invoiceHourly = createInvoice(projectHourly, [
  {
    description: "Backend Dev",
    team_role: "Senior Dev",
    hours: 10,
    rate: 2000,
    amount: 20000,
  },
  {
    description: "Frontend Dev",
    team_role: "UI Dev",
    hours: 20,
    rate: 1500,
    amount: 30000,
  },
]);

// 3. Monthly Retainer (Employee Based) - NEW CASE
const projectMonthly = createProject("monthly_retainer", "employee_based");
const invoiceMonthly = createInvoice(projectMonthly, [
  {
    description: "April Retainer - Dev 1",
    team_role: "Lead Dev",
    rate: 150000,
    amount: 150000,
  }, // No hours
  {
    description: "April Retainer - Dev 2",
    team_role: "Junior Dev",
    rate: 80000,
    amount: 80000,
  },
]);

// Generate PDFs
console.log("Generating Fixed Invoice...");
const pdfFixed = generateInvoicePDF(
  invoiceFixed,
  clientData,
  bankDetails,
  companyDetails
);
fs.writeFileSync("test_invoice_fixed.pdf", Buffer.from(pdfFixed, "base64"));

console.log("Generating Hourly Invoice...");
const pdfHourly = generateInvoicePDF(
  invoiceHourly,
  clientData,
  bankDetails,
  companyDetails
);
fs.writeFileSync("test_invoice_hourly.pdf", Buffer.from(pdfHourly, "base64"));

console.log("Generating Monthly Invoice...");
const pdfMonthly = generateInvoicePDF(
  invoiceMonthly,
  clientData,
  bankDetails,
  companyDetails
);
fs.writeFileSync("test_invoice_monthly.pdf", Buffer.from(pdfMonthly, "base64"));

console.log("Done! Check test_invoice_*.pdf files.");
