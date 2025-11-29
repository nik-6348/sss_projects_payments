import express from "express";
import {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../controllers/teamController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(protect);
// Only admin and manager can manage team
router.use(authorize("admin", "manager"));

router.route("/").get(getTeamMembers).post(addTeamMember);

router.route("/:id").put(updateTeamMember).delete(deleteTeamMember);

export default router;
