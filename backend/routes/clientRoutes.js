import express from "express";
import * as clientController from "../controllers/clientController.js";
import { protect } from "../middleware/auth.js";
import {
  createClientValidation,
  updateClientValidation,
  mongoIdValidation,
  paginationValidation,
} from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/", createClientValidation, clientController.createClient);
router.get("/", paginationValidation, clientController.getClients);
router.get("/:id", mongoIdValidation, clientController.getClient);
router.put("/:id", updateClientValidation, clientController.updateClient);
router.delete("/:id", mongoIdValidation, clientController.deleteClient);

export default router;
