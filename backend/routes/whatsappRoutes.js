import express from "express";
import { sendInvoiceWhatsApp } from "../controllers/whatsappController.js";

const router = express.Router();

router.post("/send-invoice/:id", sendInvoiceWhatsApp);

export default router;
