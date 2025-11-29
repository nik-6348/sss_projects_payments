import express from "express";
import * as invoicePDFController from "../controllers/invoicePDFController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/:id/pdf/download", protect, invoicePDFController.generatePDF);
router.get("/:id/pdf/view", protect, invoicePDFController.viewPDF);

export default router;
