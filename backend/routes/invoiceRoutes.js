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

// Invoice PDF generation route
router.get("/:id/pdf", mongoIdValidation, generateInvoicePDF);

// Dashboard stats route
router.get("/dashboard/stats", getDashboardStats);

export default router;
