import express from "express";
import {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getDashboardStats,
  getBankAccounts,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";
import {
  createPaymentValidation,
  updatePaymentValidation,
  mongoIdValidation,
  paginationValidation,
} from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Bank accounts route - must be before /:id route
router.get("/bank-accounts", getBankAccounts);

// Dashboard stats route
router.get("/dashboard/stats", getDashboardStats);

// Payment CRUD routes
router.get("/", paginationValidation, getPayments);
router.get("/:id", mongoIdValidation, getPayment);
router.post("/", createPaymentValidation, createPayment);
router.put("/:id", updatePaymentValidation, updatePayment);
router.delete("/:id", mongoIdValidation, deletePayment);

export default router;
