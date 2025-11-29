import express from "express";
import {
  getBankAccounts,
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "../controllers/bankDetailsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getBankAccounts)
  .post(protect, createBankAccount);

router
  .route("/:id")
  .get(protect, getBankAccount)
  .put(protect, updateBankAccount)
  .delete(protect, deleteBankAccount);

export default router;
