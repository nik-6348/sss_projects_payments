import express from "express";
import {
  getDashboardOverview,
  getProjectDashboard,
  getInvoiceDashboard,
  getPaymentDashboard,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get("/overview", getDashboardOverview);
router.get("/projects", getProjectDashboard);
router.get("/invoices", getInvoiceDashboard);
router.get("/payments", getPaymentDashboard);

export default router;
