import express from "express";
import {
  sendInvoiceEmail,
  testSMTP,
  sendTestEmail,
  getEmailTemplate,
} from "../controllers/emailController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/send-invoice/:id", protect, sendInvoiceEmail);
router.post("/test-smtp", protect, testSMTP);
router.post("/test-email", protect, sendTestEmail);
router.post("/template", protect, getEmailTemplate);

export default router;
