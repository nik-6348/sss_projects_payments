import express from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getDashboardStats,
} from "../controllers/projectController.js";
import { protect } from "../middleware/auth.js";
import {
  createProjectValidation,
  updateProjectValidation,
  updateProjectStatusValidation,
  mongoIdValidation,
  paginationValidation,
} from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project CRUD routes
router.get("/", paginationValidation, getProjects);
router.get("/:id", mongoIdValidation, getProject);
router.post("/", createProjectValidation, createProject);
router.put("/:id", updateProjectValidation, updateProject);
router.delete("/:id", mongoIdValidation, deleteProject);

// Project status update route
router.put("/:id/status", updateProjectStatusValidation, updateProjectStatus);

// Dashboard stats route
router.get("/dashboard/stats", getDashboardStats);

export default router;
