import test from "node:test";
import assert from "node:assert/strict";
import { validationResult } from "express-validator";
import {
  createClientValidation,
  createInvoiceValidation,
  createPaymentValidation,
  createProjectValidation,
  mongoIdValidation,
  paginationValidation,
  updateClientValidation,
  updateInvoiceValidation,
  updateInvoiceStatusValidation,
  updatePaymentValidation,
  updateProjectValidation,
  updateProjectStatusValidation,
} from "../middleware/validation.js";

const VALID_OBJECT_ID = "507f1f77bcf86cd799439011";

const runValidation = async (
  rules,
  { body = {}, params = {}, query = {} } = {}
) => {
  const req = { body, params, query };
  await Promise.all(rules.map((rule) => rule.run(req)));
  return validationResult(req).array();
};

const errorMessages = (errors) => errors.map((error) => error.msg);

test("createProjectValidation requires create-only fields", async () => {
  const errors = await runValidation(createProjectValidation, {
    body: { name: "A" },
  });
  const messages = errorMessages(errors);

  assert.ok(
    messages.includes("Project name must be between 2 and 100 characters")
  );
  assert.ok(messages.includes("Valid client ID is required"));
  assert.ok(messages.includes("Please provide a valid start date"));
});

test("createProjectValidation accepts valid minimal project payload", async () => {
  const errors = await runValidation(createProjectValidation, {
    body: {
      name: "Internal CRM",
      client_id: VALID_OBJECT_ID,
      start_date: "2026-05-01",
      currency: "USD",
      status: "active",
    },
  });

  assert.deepEqual(errors, []);
});

test("updateProjectValidation allows partial updates with a valid id", async () => {
  const errors = await runValidation(updateProjectValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { status: "completed" },
  });

  assert.deepEqual(errors, []);
});

test("createInvoiceValidation requires project and dates", async () => {
  const errors = await runValidation(createInvoiceValidation, {
    body: { status: "unknown" },
  });
  const messages = errorMessages(errors);

  assert.ok(messages.includes("Valid project ID is required"));
  assert.ok(messages.includes("Please provide a valid issue date"));
  assert.ok(messages.includes("Please provide a valid due date"));
  assert.ok(messages.includes("Invalid status"));
});

test("createInvoiceValidation rejects invalid service rows and tax percentages", async () => {
  const errors = await runValidation(createInvoiceValidation, {
    body: {
      project_id: VALID_OBJECT_ID,
      issue_date: "2026-05-01",
      due_date: "2026-05-31",
      services: [{ description: "", amount: -1 }],
      gst_percentage: 101,
      tds_percentage: -1,
    },
  });
  const messages = errorMessages(errors);

  assert.ok(
    messages.includes(
      "Service description is required and cannot exceed 200 characters"
    )
  );
  assert.ok(messages.includes("Service amount must be a positive number"));
  assert.ok(messages.includes("GST percentage must be between 0 and 100"));
  assert.ok(messages.includes("TDS percentage must be between 0 and 100"));
});

test("updateInvoiceValidation allows partial status updates with a valid id", async () => {
  const errors = await runValidation(updateInvoiceValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { status: "paid" },
  });

  assert.deepEqual(errors, []);
});

test("createPaymentValidation accepts valid bank-account payment payload", async () => {
  const errors = await runValidation(createPaymentValidation, {
    body: {
      project_id: VALID_OBJECT_ID,
      invoice_id: VALID_OBJECT_ID,
      amount: 100,
      currency: "INR",
      payment_method: "bank_account",
      payment_date: "2026-05-02",
    },
  });

  assert.deepEqual(errors, []);
});

test("createPaymentValidation rejects invalid payment payload", async () => {
  const errors = await runValidation(createPaymentValidation, {
    body: {
      project_id: "bad-id",
      invoice_id: "bad-id",
      amount: -1,
      currency: "EUR",
      payment_method: "upi",
      payment_date: "not-date",
    },
  });
  const messages = errorMessages(errors);

  assert.ok(messages.includes("Valid project ID is required"));
  assert.ok(messages.includes("Invalid invoice ID"));
  assert.ok(messages.includes("Amount must be a positive number"));
  assert.ok(messages.includes("Currency must be either INR or USD"));
  assert.ok(messages.includes("Invalid payment method"));
  assert.ok(messages.includes("Please provide a valid payment date"));
});

test("updatePaymentValidation allows partial updates with a valid id", async () => {
  const errors = await runValidation(updatePaymentValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { amount: 250 },
  });

  assert.deepEqual(errors, []);
});

test("createClientValidation accepts valid client payload", async () => {
  const errors = await runValidation(createClientValidation, {
    body: {
      name: "Acme Corp",
      email: "billing@acme.com",
      phone: "9876543210",
      address: {
        street: "Main Road",
        city: "Indore",
        state: "MP",
        pincode: "452001",
        country: "India",
      },
      gst_number: "23ABMCS3140D1ZP",
      pan_number: "ABMCS3140D",
    },
  });

  assert.deepEqual(errors, []);
});

test("createClientValidation rejects invalid client payload", async () => {
  const errors = await runValidation(createClientValidation, {
    body: {
      name: "A",
      email: "bad-email",
      phone: "123",
      address: { street: "x".repeat(201) },
      gst_number: "x".repeat(16),
      pan_number: "x".repeat(11),
    },
  });
  const messages = errorMessages(errors);

  assert.ok(messages.includes("Client name must be between 2 and 100 characters"));
  assert.ok(messages.includes("Please provide a valid email address"));
  assert.ok(messages.includes("Phone number must be between 10 and 15 characters"));
  assert.ok(messages.includes("Street address cannot exceed 200 characters"));
  assert.ok(messages.includes("GST number cannot exceed 15 characters"));
  assert.ok(messages.includes("PAN number cannot exceed 10 characters"));
});

test("updateClientValidation allows partial updates with a valid id", async () => {
  const errors = await runValidation(updateClientValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { finance_email: "finance@example.com" },
  });

  assert.deepEqual(errors, []);
});

test("status validators accept allowed statuses and reject invalid status", async () => {
  const validProjectErrors = await runValidation(updateProjectStatusValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { status: "on_hold", progress: 50 },
  });
  assert.deepEqual(validProjectErrors, []);

  const invalidProjectErrors = await runValidation(updateProjectStatusValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { status: "archived", progress: 101 },
  });
  const invalidProjectMessages = errorMessages(invalidProjectErrors);
  assert.ok(invalidProjectMessages.includes("Invalid project status"));
  assert.ok(invalidProjectMessages.includes("Progress must be between 0 and 100"));

  const validInvoiceErrors = await runValidation(updateInvoiceStatusValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { status: "partial", paidDate: "2026-05-02" },
  });
  assert.deepEqual(validInvoiceErrors, []);

  const invalidInvoiceErrors = await runValidation(updateInvoiceStatusValidation, {
    params: { id: VALID_OBJECT_ID },
    body: { status: "closed", paidDate: "bad-date" },
  });
  const invalidInvoiceMessages = errorMessages(invalidInvoiceErrors);
  assert.ok(invalidInvoiceMessages.includes("Invalid invoice status"));
  assert.ok(invalidInvoiceMessages.includes("Please provide a valid paid date"));
});

test("mongoIdValidation rejects invalid route ids", async () => {
  const errors = await runValidation(mongoIdValidation, {
    params: { id: "not-a-mongo-id" },
  });

  assert.deepEqual(errorMessages(errors), ["Invalid ID format"]);
});

test("paginationValidation rejects out-of-range query values", async () => {
  const errors = await runValidation(paginationValidation, {
    query: { page: "0", limit: "101" },
  });
  const messages = errorMessages(errors);

  assert.ok(messages.includes("Page must be a positive integer"));
  assert.ok(messages.includes("Limit must be between 1 and 100"));
});
