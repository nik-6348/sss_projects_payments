import Project from "../models/Project.js";
import { validationResult } from "express-validator";

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ user_id: req.user.id })
      .populate("client_id", "name email phone")
      .sort({ createdAt: -1 });

    // Transform data to include client_name for frontend compatibility
    const transformedProjects = projects.map((project) => ({
      ...project.toObject(),
      id: project._id,
      client_name: project.client_id?.name || "Unknown Client",
    }));

    res.status(200).json({
      success: true,
      count: transformedProjects.length,
      data: transformedProjects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "client_id",
      "name email phone"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if user owns this project
    if (project.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this project",
      });
    }

    // Transform data to include client_name for frontend compatibility
    const transformedProject = {
      ...project.toObject(),
      id: project._id,
      client_name: project.client_id?.name || "Unknown Client",
    };

    res.status(200).json({
      success: true,
      data: transformedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const projectData = {
      ...req.body,
      user_id: req.user.id,
    };

    const project = await Project.create(projectData);
    await project.populate("client_id", "name email phone");

    // Transform data to include client_name for frontend compatibility
    const transformedProject = {
      ...project.toObject(),
      id: project._id,
      client_name: project.client_id?.name || "Unknown Client",
    };

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: transformedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if user owns this project
    if (project.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this project",
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("client_id", "name email phone");

    // Transform data to include client_name for frontend compatibility
    const transformedProject = {
      ...project.toObject(),
      id: project._id,
      client_name: project.client_id?.name || "Unknown Client",
    };

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: transformedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if user owns this project
    if (project.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this project",
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project status
// @route   PUT /api/projects/:id/status
// @access  Private
const updateProjectStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { status, progress } = req.body;
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Check if user owns this project
    if (project.user_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this project",
      });
    }

    // Validate status
    const validStatuses = [
      "active",
      "on_hold",
      "completed",
      "cancelled",
      "draft",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const updateData = { status };
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("client_id", "name email phone");

    // Transform data to include client_name for frontend compatibility
    const transformedProject = {
      ...project.toObject(),
      id: project._id,
      client_name: project.client_id?.name || "Unknown Client",
    };

    res.status(200).json({
      success: true,
      message: "Project status updated successfully",
      data: transformedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project dashboard stats
// @route   GET /api/projects/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const totalProjects = await Project.countDocuments({
      user_id: req.user.id,
    });
    const activeProjects = await Project.countDocuments({
      user_id: req.user.id,
      status: "active",
    });
    const completedProjects = await Project.countDocuments({
      user_id: req.user.id,
      status: "completed",
    });
    const totalAmount = await Project.aggregate([
      { $match: { user_id: req.user.id } },
      { $group: { _id: null, total: { $sum: "$total_amount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalAmount: totalAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getDashboardStats,
};
