import express from "express";
import { sendInvoiceEmail, testSMTP } from "../controllers/emailController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/send-invoice/:id", protect, sendInvoiceEmail);
router.post("/test-smtp", protect, testSMTP);

export default router;
