import { body, param, query } from "express-validator";

// Project validation rules
const createProjectValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Project name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("total_amount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number"),
  body("currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be either INR or USD"),
  body("client_id").isMongoId().withMessage("Valid client ID is required"),
  body("start_date")
    .isISO8601()
    .withMessage("Please provide a valid start date"),
  body("end_date")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid end date"),
  body("status")
    .optional()
    .isIn(["active", "on_hold", "completed", "cancelled", "draft"])
    .withMessage("Invalid status"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
];

const updateProjectValidation = [
  param("id").isMongoId().withMessage("Invalid project ID"),
  ...createProjectValidation.map((rule) => rule.optional()),
];

// Invoice validation rules
const createInvoiceValidation = [
  body("project_id").isMongoId().withMessage("Valid project ID is required"),
  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be either INR or USD"),
  body("issue_date")
    .isISO8601()
    .withMessage("Please provide a valid issue date"),
  body("due_date").isISO8601().withMessage("Please provide a valid due date"),
  body("status")
    .optional()
    .isIn(["draft", "sent", "paid", "overdue", "cancelled"])
    .withMessage("Invalid status"),
  body("services")
    .optional()
    .isArray()
    .withMessage("Services must be an array"),
  body("services.*.description")
    .if(body("services").exists())
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage(
      "Service description is required and cannot exceed 200 characters"
    ),
  body("services.*.amount")
    .if(body("services").exists())
    .isFloat({ min: 0 })
    .withMessage("Service amount must be a positive number"),
  body("gst_percentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("GST percentage must be between 0 and 100"),
];

const updateInvoiceValidation = [
  param("id").isMongoId().withMessage("Invalid invoice ID"),
  ...createInvoiceValidation.map((rule) => rule.optional()),
];

// Payment validation rules
const createPaymentValidation = [
  body("project_id").isMongoId().withMessage("Valid project ID is required"),
  body("invoice_id").optional().isMongoId().withMessage("Invalid invoice ID"),
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),
  body("currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be either INR or USD"),
  body("payment_method")
    .isIn(["bank_account", "other"])
    .withMessage("Invalid payment method"),
  body("payment_date")
    .isISO8601()
    .withMessage("Please provide a valid payment date"),
];

const updatePaymentValidation = [
  param("id").isMongoId().withMessage("Invalid payment ID"),
  ...createPaymentValidation.map((rule) => rule.optional()),
];

// Client validation rules
const createClientValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Client name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("phone")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),
  body("address.street")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Street address cannot exceed 200 characters"),
  body("address.city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City cannot exceed 50 characters"),
  body("address.state")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("State cannot exceed 50 characters"),
  body("address.pincode")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("Pincode cannot exceed 10 characters"),
  body("address.country")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Country cannot exceed 50 characters"),
  body("gst_number")
    .optional()
    .trim()
    .isLength({ max: 15 })
    .withMessage("GST number cannot exceed 15 characters"),
  body("pan_number")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("PAN number cannot exceed 10 characters"),
];

const updateClientValidation = [
  param("id").isMongoId().withMessage("Invalid client ID"),
  ...createClientValidation.map((rule) => rule.optional()),
];

// Status update validation
const updateStatusValidation = [
  param("id").isMongoId().withMessage("Invalid ID"),
  body("status").notEmpty().withMessage("Status is required"),
];

const updateProjectStatusValidation = [
  ...updateStatusValidation,
  body("status")
    .isIn(["active", "on_hold", "completed", "cancelled", "draft"])
    .withMessage("Invalid project status"),
  body("progress")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Progress must be between 0 and 100"),
];

const updateInvoiceStatusValidation = [
  ...updateStatusValidation,
  body("status")
    .isIn(["draft", "sent", "paid", "overdue", "cancelled"])
    .withMessage("Invalid invoice status"),
  body("paidDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid paid date"),
];

// Common parameter validation
const mongoIdValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

// Query parameter validation
const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

export {
  // Project validations
  createProjectValidation,
  updateProjectValidation,
  updateProjectStatusValidation,

  // Invoice validations
  createInvoiceValidation,
  updateInvoiceValidation,
  updateInvoiceStatusValidation,

  // Payment validations
  createPaymentValidation,
  updatePaymentValidation,

  // Client validations
  createClientValidation,
  updateClientValidation,

  // Common validations
  mongoIdValidation,
  paginationValidation,
};
