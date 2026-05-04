import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import BankDetails from "../models/BankDetails.js";
import Client from "../models/Client.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

const objectId = () => new mongoose.Types.ObjectId();
const messages = (error) =>
  Object.values(error.errors).map((fieldError) => fieldError.message);

test("Project model applies defaults, trimming, and valid enums", () => {
  const project = new Project({
    name: "  Website Redesign  ",
    description: "  Sprint work  ",
    total_amount: 50000,
    start_date: "2026-05-01",
    client_id: objectId(),
    user_id: objectId(),
  });

  const error = project.validateSync();

  assert.equal(error, undefined);
  assert.equal(project.name, "Website Redesign");
  assert.equal(project.description, "Sprint work");
  assert.equal(project.currency, "INR");
  assert.equal(project.status, "active");
  assert.equal(project.include_gst, false);
  assert.equal(project.gst_percentage, 0);
  assert.equal(project.include_tds, false);
  assert.equal(project.tds_percentage, 0);
});

test("Project model rejects missing required fields and invalid values", () => {
  const project = new Project({
    total_amount: -1,
    status: "archived",
    currency: "EUR",
    project_type: "support",
    allocation_type: "team",
  });

  const error = project.validateSync();
  const errorMessages = messages(error);

  assert.ok(errorMessages.includes("Project name is required"));
  assert.ok(errorMessages.includes("Total amount cannot be negative"));
  assert.ok(errorMessages.includes("Start date is required"));
  assert.ok(errorMessages.includes("Client is required"));
  assert.ok(errorMessages.includes("User is required"));
  assert.ok(error.errors.status);
  assert.ok(error.errors.currency);
  assert.ok(error.errors.project_type);
  assert.ok(error.errors.allocation_type);
});

test("Invoice model applies defaults and normalizes invoice number", () => {
  const invoice = new Invoice({
    project_id: objectId(),
    invoice_number: " inv-2026/0001 ",
    amount: 1180,
    total_amount: 1180,
    services: [{ description: "Development", amount: 1000 }],
  });

  const error = invoice.validateSync();

  assert.equal(error, undefined);
  assert.equal(invoice.invoice_number, "INV-2026/0001");
  assert.equal(invoice.currency, "INR");
  assert.equal(invoice.status, "draft");
  assert.equal(invoice.paid_amount, 0);
  assert.equal(invoice.isDeleted, false);
  assert.equal(invoice.payment_method, "bank_account");
  assert.equal(invoice.include_gst, true);
  assert.equal(invoice.include_tds, false);
  assert.equal(invoice.tds_percentage, 0);
});

test("Invoice model rejects missing required fields, invalid status, and negative amounts", () => {
  const invoice = new Invoice({
    amount: -10,
    paid_amount: -1,
    status: "pending",
    payment_method: "cash",
    services: [{ description: "", amount: -5 }],
  });

  const error = invoice.validateSync();
  const errorMessages = messages(error);

  assert.ok(errorMessages.includes("Project ID is required"));
  assert.ok(errorMessages.includes("Invoice number is required"));
  assert.ok(errorMessages.includes("Amount cannot be negative"));
  assert.ok(errorMessages.includes("Paid amount cannot be negative"));
  assert.ok(error.errors.status);
  assert.ok(error.errors.payment_method);
  assert.ok(error.errors["services.0.description"]);
  assert.ok(error.errors["services.0.amount"]);
  assert.ok(error.errors.total_amount);
});

test("Payment model applies defaults and validates payment methods", () => {
  const payment = new Payment({
    project_id: objectId(),
    amount: 1500,
    payment_date: "2026-05-02",
    custom_payment_details: "  UTR 123  ",
  });

  const error = payment.validateSync();

  assert.equal(error, undefined);
  assert.equal(payment.currency, "INR");
  assert.equal(payment.payment_method, "bank_account");
  assert.equal(payment.custom_payment_details, "UTR 123");
  assert.equal(payment.include_tds, false);
  assert.equal(payment.tds_percentage, 10);
  assert.equal(payment.tds_amount, 0);
  assert.equal(payment.credited_amount, 0);

  payment.payment_method = "upi";
  assert.equal(payment.validateSync(), undefined);

  payment.payment_method = "card";
  assert.ok(payment.validateSync().errors.payment_method);
});

test("Payment model rejects missing required fields and negative amount", () => {
  const payment = new Payment({ amount: -1 });

  const error = payment.validateSync();
  const errorMessages = messages(error);

  assert.ok(errorMessages.includes("Project ID is required"));
  assert.ok(errorMessages.includes("Amount cannot be negative"));
  assert.ok(errorMessages.includes("Payment date is required"));
});

test("Client model trims, lowercases, uppercases tax IDs, and defaults country", () => {
  const client = new Client({
    name: "  Acme Corp  ",
    email: "  Billing@ACME.COM  ",
    phone: "  9876543210  ",
    gst_number: "  23abmcs3140d1zp  ",
    pan_number: " abmcs3140d ",
  });

  const error = client.validateSync();

  assert.equal(error, undefined);
  assert.equal(client.name, "Acme Corp");
  assert.equal(client.email, "billing@acme.com");
  assert.equal(client.phone, "9876543210");
  assert.equal(client.gst_number, "23ABMCS3140D1ZP");
  assert.equal(client.pan_number, "ABMCS3140D");
  assert.equal(client.address.country, "India");
});

test("Client model requires core contact fields", () => {
  const client = new Client({});
  const errorMessages = messages(client.validateSync());

  assert.ok(errorMessages.includes("Client name is required"));
  assert.ok(errorMessages.includes("Client email is required"));
  assert.ok(errorMessages.includes("Client phone is required"));
});

test("BankDetails model requires all banking fields except swift code", () => {
  const invalidBank = new BankDetails({});
  const error = invalidBank.validateSync();

  assert.ok(error.errors.accountHolderName);
  assert.ok(error.errors.accountNumber);
  assert.ok(error.errors.ifscCode);
  assert.ok(error.errors.bankName);
  assert.ok(error.errors.accountType);

  const validBank = new BankDetails({
    accountHolderName: "SSS",
    accountNumber: "1234567890",
    ifscCode: "SBIN0001234",
    bankName: "State Bank",
    accountType: "current",
  });

  assert.equal(validBank.validateSync(), undefined);
});

test("User model validates email and hides sensitive fields in JSON", () => {
  const invalidUser = new User({
    name: "A",
    email: "not-an-email",
  });

  const invalidError = invalidUser.validateSync();
  assert.ok(invalidError.errors.name);
  assert.ok(invalidError.errors.email);

  const user = new User({
    name: "Admin User",
    email: " ADMIN@SSS.COM ",
    password: "plain-secret",
    resetPasswordToken: "secret-reset-hash",
    resetPasswordExpire: new Date(),
  });

  const error = user.validateSync();
  const json = user.toJSON();

  assert.equal(error, undefined);
  assert.equal(user.email, "admin@sss.com");
  assert.equal(json.password, undefined);
  assert.equal(json.resetPasswordToken, undefined);
  assert.equal(json.resetPasswordExpire, undefined);
  assert.deepEqual(user.getJWTPayload(), {
    id: user._id,
    email: "admin@sss.com",
  });
});

test("User reset password token stores only the hashed token", () => {
  const user = new User({
    name: "Reset User",
    email: "reset@example.com",
  });

  const token = user.getResetPasswordToken();

  assert.equal(typeof token, "string");
  assert.equal(token.length, 40);
  assert.notEqual(user.resetPasswordToken, token);
  assert.equal(user.resetPasswordToken.length, 64);
  assert.ok(user.resetPasswordExpire > Date.now());
});
