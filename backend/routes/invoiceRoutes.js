import express from "express";
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  generateInvoicePDF,
  getDashboardStats,
  getDeletedInvoices,
  restoreInvoice,
  duplicateInvoice,
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/auth.js";
import {
  createInvoiceValidation,
  updateInvoiceValidation,
  updateInvoiceStatusValidation,
  mongoIdValidation,
  paginationValidation,
} from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Invoice CRUD routes
router.get("/", paginationValidation, getInvoices);
router.get("/:id", mongoIdValidation, getInvoice);
router.post("/", createInvoiceValidation, createInvoice);
router.put("/:id", updateInvoiceValidation, updateInvoice);
router.delete("/:id", mongoIdValidation, deleteInvoice);

// Invoice status update route
router.put("/:id/status", updateInvoiceStatusValidation, updateInvoiceStatus);

// Duplicate invoice route
router.post("/:id/duplicate", mongoIdValidation, duplicateInvoice);

// Invoice PDF generation route
router.get("/:id/pdf", mongoIdValidation, generateInvoicePDF);

// Dashboard stats route
router.get("/dashboard/stats", getDashboardStats);

// Deleted invoices routes
router.get("/deleted/all", getDeletedInvoices);
router.put("/:id/restore", mongoIdValidation, restoreInvoice);

export default router;
