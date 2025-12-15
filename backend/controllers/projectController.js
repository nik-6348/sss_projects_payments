import Project from "../models/Project.js";
import { validationResult } from "express-validator";

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const { search, status, project_type, allocation_type } = req.query;

    const query = { user_id: req.user.id };

    if (status) {
      query.status = status;
    }

    if (project_type) {
      query.project_type = project_type;
    }

    if (allocation_type) {
      query.allocation_type = allocation_type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .populate("client_id", "name email phone")
      .populate("team_members.user_id", "name email role avatar")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Transform data to include client_name for frontend compatibility
    const transformedProjects = projects.map((project) => ({
      ...project.toObject(),
      id: project._id,
      client_name: project.client_id?.name || "Unknown Client",
    }));

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    };

    res.status(200).json({
      success: true,
      count: transformedProjects.length,
      pagination,
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
    const project = await Project.findById(req.params.id)
      .populate("client_id", "name email phone")
      .populate("team_members.user_id", "name email role avatar");

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

    // Auto-calculate total_amount if not provided or 0
    if (
      projectData.total_amount === undefined ||
      projectData.total_amount === null ||
      projectData.total_amount === 0
    ) {
      const hasTeamMembers =
        projectData.team_members && projectData.team_members.length > 0;
      const isRetainerOrHourly =
        projectData.project_type === "monthly_retainer" ||
        projectData.project_type === "hourly_billing";

      // Infer allocation type if missing but team members exist for relevant project types
      if (
        !projectData.allocation_type &&
        hasTeamMembers &&
        isRetainerOrHourly
      ) {
        projectData.allocation_type = "employee_based";
      }

      if (projectData.allocation_type === "employee_based" && hasTeamMembers) {
        // Calculate Duration in Months
        let durationMonths = 1;

        if (projectData.contract_length && projectData.contract_length > 0) {
          durationMonths = projectData.contract_length;
        } else if (projectData.start_date && projectData.end_date) {
          const start = new Date(projectData.start_date);
          const end = new Date(projectData.end_date);
          // Calculate difference in milliseconds
          const diffTime = Math.abs(end - start);
          // Convert to days
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          // Approximate months (days / 30)
          durationMonths = diffDays / 30;
          if (durationMonths < 1) durationMonths = 1;
        }

        // Calculate based on project type
        if (projectData.project_type === "hourly_billing") {
          // For hourly: (Rate * Monthly Hours) * Duration
          const monthlyBurn = projectData.team_members.reduce(
            (sum, member) =>
              sum + (member.rate || 0) * (member.monthly_hours || 0),
            0
          );
          projectData.total_amount = Math.round(monthlyBurn * durationMonths);
        } else if (projectData.project_type === "monthly_retainer") {
          // For monthly retainer: (Sum of monthly fees) * Duration
          const monthlyBurn = projectData.team_members.reduce(
            (sum, member) => sum + (member.rate || 0),
            0
          );
          projectData.total_amount = Math.round(monthlyBurn * durationMonths);
        } else {
          projectData.total_amount = 0;
        }
      } else {
        // Overall Allocation or Fixed Contract Logic
        // Calculate Duration in Months
        let durationMonths = 1;

        if (projectData.start_date && projectData.end_date) {
          const start = new Date(projectData.start_date);
          const end = new Date(projectData.end_date);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          durationMonths = diffDays / 30;
          if (durationMonths < 1) durationMonths = 1;
        }

        if (projectData.project_type === "monthly_retainer") {
          // Monthly Fee * Duration
          projectData.total_amount = Math.round(
            (projectData.monthly_fee || 0) * durationMonths
          );
        } else if (projectData.project_type === "hourly_billing") {
          // Hourly Rate * Estimated Hours
          projectData.total_amount =
            (projectData.hourly_rate || 0) * (projectData.estimated_hours || 0);
        } else if (projectData.project_type === "fixed_contract") {
          // Already should be in total_amount, but if null preserve 0 or let validation fail if strictly required (validation is optional now)
          // If total_amount is null, try to use contract_amount alias if exists, otherwise 0
          projectData.total_amount = projectData.contract_amount || 0;
        } else {
          projectData.total_amount = 0;
        }
      }
    }

    const project = await Project.create(projectData);
    await project.populate("client_id", "name email phone");
    await project.populate("team_members.user_id", "name email role avatar");

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

    // Check for auto-calculation needs
    const projectData = { ...req.body };

    // Auto-calculate total_amount if not provided or 0
    if (
      projectData.total_amount === undefined ||
      projectData.total_amount === null ||
      projectData.total_amount === 0
    ) {
      const hasTeamMembers =
        projectData.team_members && projectData.team_members.length > 0;
      const isRetainerOrHourly =
        projectData.project_type === "monthly_retainer" ||
        projectData.project_type === "hourly_billing";

      // Infer allocation type if missing but team members exist for relevant project types
      if (
        !projectData.allocation_type &&
        hasTeamMembers &&
        isRetainerOrHourly
      ) {
        projectData.allocation_type = "employee_based";
      }

      if (projectData.allocation_type === "employee_based" && hasTeamMembers) {
        // Calculate Duration in Months
        let durationMonths = 1;

        if (projectData.contract_length && projectData.contract_length > 0) {
          durationMonths = projectData.contract_length;
        } else if (projectData.start_date && projectData.end_date) {
          const start = new Date(projectData.start_date);
          const end = new Date(projectData.end_date);
          // Calculate difference in milliseconds
          const diffTime = Math.abs(end - start);
          // Convert to days
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          // Approximate months (days / 30)
          durationMonths = diffDays / 30;
          if (durationMonths < 1) durationMonths = 1;
        }

        // Calculate based on project type
        if (projectData.project_type === "hourly_billing") {
          // For hourly: (Rate * Monthly Hours) * Duration
          const monthlyBurn = projectData.team_members.reduce(
            (sum, member) =>
              sum + (member.rate || 0) * (member.monthly_hours || 0),
            0
          );
          projectData.total_amount = Math.round(monthlyBurn * durationMonths);
        } else if (projectData.project_type === "monthly_retainer") {
          // For monthly retainer: (Sum of monthly fees) * Duration
          const monthlyBurn = projectData.team_members.reduce(
            (sum, member) => sum + (member.rate || 0),
            0
          );
          projectData.total_amount = Math.round(monthlyBurn * durationMonths);
        } else {
          projectData.total_amount = 0;
        }
      } else {
        // Overall Allocation or Fixed Contract Logic
        // Calculate Duration in Months
        let durationMonths = 1;

        if (projectData.start_date && projectData.end_date) {
          const start = new Date(projectData.start_date);
          const end = new Date(projectData.end_date);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          durationMonths = diffDays / 30;
          if (durationMonths < 1) durationMonths = 1;
        }

        if (projectData.project_type === "monthly_retainer") {
          // Monthly Fee * Duration
          projectData.total_amount = Math.round(
            (projectData.monthly_fee || 0) * durationMonths
          );
        } else if (projectData.project_type === "hourly_billing") {
          // Hourly Rate * Estimated Hours
          projectData.total_amount =
            (projectData.hourly_rate || 0) * (projectData.estimated_hours || 0);
        } else if (projectData.project_type === "fixed_contract") {
          // Already should be in total_amount, but if null preserve 0
          projectData.total_amount = projectData.contract_amount || 0;
        } else {
          projectData.total_amount = 0;
        }
      }
    }

    project = await Project.findByIdAndUpdate(req.params.id, projectData, {
      new: true,
      runValidators: true,
    })
      .populate("client_id", "name email phone")
      .populate("team_members.user_id", "name email role avatar");

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
    })
      .populate("client_id", "name email phone")
      .populate("team_members.user_id", "name email role avatar");

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
