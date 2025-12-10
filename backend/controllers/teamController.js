import User from "../models/User.js";
import { validationResult } from "express-validator";

// @desc    Get all team members (employees & managers)
// @route   GET /api/team
// @access  Private (Admin/Manager)
const getTeamMembers = async (req, res, next) => {
  try {
    const teamMembers = await User.find({
      role: { $in: ["employee", "manager"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new team member
// @route   POST /api/team
// @access  Private (Admin/Manager)
const addTeamMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { name, email, password, role, phone, designation } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    // Force role to be employee if not specified or invalid for this endpoint
    // (Though validation middleware should handle this, good to be safe)
    // Allow admin role creation
    const userRole =
      role && ["employee", "manager", "admin"].includes(role)
        ? role
        : "employee";

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone,
      // designation field might need to be added to User model if strictly required,
      // but for now we'll stick to standard User fields or add it if requested.
      // Assuming 'designation' might be stored in a profile or just mapped to role for now.
      // If the user explicitly asked for designation, I'd add it to the model.
      // For now, I'll omit it from creation if it's not in the schema, or put it in a 'profile' object if I were extending it further.
      // Let's stick to the existing User schema for now to avoid scope creep unless necessary.
    });

    res.status(201).json({
      success: true,
      message: "Team member added successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team member
// @route   PUT /api/team/:id
// @access  Private (Admin/Manager)
const updateTeamMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Prevent non-admins from updating admins via this endpoint
    if (user.role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Cannot update admin via team management",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete team member (or deactivate)
// @route   DELETE /api/team/:id
// @access  Private (Admin/Manager)
const deleteTeamMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        error: "Cannot delete admin",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember };
