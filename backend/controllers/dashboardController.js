import Project from "../models/Project.js";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/dashboard/overview
// @access  Private
const getDashboardOverview = async (req, res, next) => {
  try {
    const { period = "monthly" } = req.query;

    // Calculate date range based on period
    const startDate = new Date();
    if (period === "yearly") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // monthly - show last 6 months for trends
      startDate.setMonth(startDate.getMonth() - 6);
    }

    const sixMonthsAgo = startDate;

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      projectStatusStats,
      totalProjectValue,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      invoiceStatusStats,
      totalInvoiceAmount,
      paidInvoiceAmount,
      totalPayments,
      totalPaymentAmount,
      monthlyProjectTrends,
      monthlyInvoiceTrends,
      monthlyPaymentTrends,
      recentProjects,
      recentInvoices,
      recentPayments,
    ] = await Promise.all([
      // Project stats
      Project.countDocuments({ user_id: req.user.id }),
      Project.countDocuments({ user_id: req.user.id, status: "active" }),
      Project.countDocuments({ user_id: req.user.id, status: "completed" }),
      Project.aggregate([
        { $match: { user_id: req.user.id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: { user_id: req.user.id } },
        { $group: { _id: null, total: { $sum: "$total_amount" } } },
      ]),

      // Invoice stats
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: "paid" }),
      Invoice.countDocuments({ status: "sent" }),
      Invoice.countDocuments({
        status: { $in: ["sent", "overdue"] },
        due_date: { $lt: new Date() },
      }),
      Invoice.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Invoice.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Invoice.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // Payment stats
      Payment.countDocuments(),
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // Trends
      Project.aggregate([
        { $match: { user_id: req.user.id, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
            totalValue: { $sum: "$total_amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Payment.aggregate([
        { $match: { payment_date: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$payment_date" },
              month: { $month: "$payment_date" },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Recent activities
      Project.find({ user_id: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name status createdAt"),
      Invoice.find()
        .populate({
          path: "project_id",
          select: "name user_id",
          populate: {
            path: "client_id",
            select: "name",
          },
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("invoice_number amount status project_id createdAt"),
      Payment.find()
        .populate({
          path: "project_id",
          select: "name user_id",
          populate: {
            path: "client_id",
            select: "name",
          },
        })
        .populate("invoice_id", "invoice_number")
        .sort({ payment_date: -1 })
        .limit(5)
        .select("amount payment_method payment_date project_id invoice_id"),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          statusBreakdown: projectStatusStats,
          totalValue: totalProjectValue[0]?.total || 0,
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
          overdue: overdueInvoices,
          statusBreakdown: invoiceStatusStats,
          totalAmount: totalInvoiceAmount[0]?.total || 0,
          paidAmount: paidInvoiceAmount[0]?.total || 0,
        },
        payments: {
          total: totalPayments,
          totalAmount: totalPaymentAmount[0]?.total || 0,
        },
        trends: {
          projects: monthlyProjectTrends,
          invoices: monthlyInvoiceTrends,
          payments: monthlyPaymentTrends,
        },
        recentActivities: {
          projects: recentProjects,
          invoices: recentInvoices,
          payments: recentPayments,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project-specific dashboard statistics
// @route   GET /api/dashboard/projects
// @access  Private
const getProjectDashboard = async (req, res, next) => {
  try {
    const projectStats = await Project.aggregate([
      { $match: { user_id: req.user.id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBudget: { $sum: "$total_amount" },
          avgBudget: { $avg: "$total_amount" },
        },
      },
    ]);

    const projectTimeline = await Project.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name status total_amount createdAt client_name");

    res.status(200).json({
      success: true,
      data: {
        statistics: projectStats,
        timeline: projectTimeline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice-specific dashboard statistics
// @route   GET /api/dashboard/invoices
// @access  Private
const getInvoiceDashboard = async (req, res, next) => {
  try {
    const invoiceStats = await Invoice.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
        },
      },
    ]);

    const overdueInvoices = await Invoice.find({
      status: { $in: ["sent", "overdue"] },
      due_date: { $lt: new Date() },
    })
      .populate({
        path: "project_id",
        select: "name user_id",
        populate: {
          path: "client_id",
          select: "name",
        },
      })
      .sort({ due_date: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        statistics: invoiceStats,
        overdue: overdueInvoices,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment-specific dashboard statistics
// @route   GET /api/dashboard/payments
// @access  Private
const getPaymentDashboard = async (req, res, next) => {
  try {
    const paymentMethodStats = await Payment.aggregate([
      {
        $group: {
          _id: "$payment_method",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const recentPayments = await Payment.find()
      .populate({
        path: "project_id",
        select: "name user_id",
        populate: {
          path: "client_id",
          select: "name",
        },
      })
      .populate("invoice_id", "invoice_number")
      .sort({ payment_date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        paymentMethods: paymentMethodStats,
        recent: recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get filtered dashboard statistics with year/month filters
// @route   GET /api/dashboard/stats
// @access  Private
const getFilteredDashboardStats = async (req, res, next) => {
  try {
    const { year, month, projectId, allTime } = req.query; // Added projectId and allTime
    const currentYear = new Date().getFullYear();
    const selectedYear = parseInt(year) || currentYear;

    let startDate, endDate;

    if (allTime === "true") {
      // Filter for all time (wide range)
      startDate = new Date(2000, 0, 1);
      endDate = new Date(2100, 11, 31, 23, 59, 59, 999);
    } else if (month) {
      // Filter by specific month
      startDate = new Date(selectedYear, parseInt(month) - 1, 1);
      endDate = new Date(selectedYear, parseInt(month), 0, 23, 59, 59, 999);
    } else {
      // Filter by entire year
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    }

    // Build Project Match Query
    const projectMatch = {
      user_id: req.user.id,
      start_date: { $gte: startDate, $lte: endDate },
    };
    if (projectId) {
      projectMatch._id = new mongoose.Types.ObjectId(projectId);
    }

    // Build Invoice Match Query
    const invoiceMatch = {
      isDeleted: { $ne: true },
      issue_date: { $gte: startDate, $lte: endDate },
    };
    if (projectId) {
      invoiceMatch.project_id = new mongoose.Types.ObjectId(projectId);
    }

    // Build Payment Match Query
    const paymentMatch = {
      payment_date: { $gte: startDate, $lte: endDate },
    };
    if (projectId) {
      paymentMatch.project_id = new mongoose.Types.ObjectId(projectId);
    }

    // Get available years for dropdown (unchanged logic)
    const projectYears = await Project.aggregate([
      { $match: { user_id: req.user.id } },
      {
        $group: {
          _id: { $year: "$start_date" },
        },
      },
    ]);

    const invoiceYears = await Invoice.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $year: "$issue_date" },
        },
      },
    ]);

    const paymentYears = await Payment.aggregate([
      {
        $group: {
          _id: { $year: "$payment_date" },
        },
      },
    ]);

    // Combine and deduplicate years
    const allYears = new Set([
      ...projectYears.map((y) => y._id),
      ...invoiceYears.map((y) => y._id),
      ...paymentYears.map((y) => y._id),
    ]);
    // Always include current year
    allYears.add(currentYear);
    const availableYears = [...allYears].filter((y) => y).sort((a, b) => b - a);

    // Get all active projects count (not date filtered - shows current active projects)
    // Filter active projects count by projectId if selected
    const activeProjectsQuery = {
      user_id: req.user.id,
      status: "active",
    };
    if (projectId) {
      activeProjectsQuery._id = new mongoose.Types.ObjectId(projectId);
    }
    const activeProjectsCount = await Project.countDocuments(
      activeProjectsQuery
    );

    // Aggregate project stats for the selected period (by start_date)
    const projectStats = await Project.aggregate([
      {
        $match: projectMatch,
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          onHold: {
            $sum: { $cond: [{ $eq: ["$status", "on_hold"] }, 1, 0] },
          },
          totalValue: { $sum: "$total_amount" },
        },
      },
    ]);

    // Aggregate invoice stats (by issue_date) - for Total Invoiced
    const invoiceStats = await Invoice.aggregate([
      {
        $match: invoiceMatch,
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          paid: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$status", ["sent", "overdue"]] },
                    { $lt: ["$due_date", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalAmount: { $sum: "$amount" },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    // Aggregate payment stats (by payment_date) - for Total Paid
    const paymentStats = await Payment.aggregate([
      {
        $match: paymentMatch,
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Calculate totals - ensuring Ex-GST basis
    const totalInvoiced = invoiceStats[0]?.totalAmount || 0; // Ex-GST (Subtotal)
    // Use the calculated paid amount from invoices (Ex-GST) instead of raw payments (Inc-GST)
    // This ensures consistency with the user request to exclude GST from paid amounts
    const totalPaid = invoiceStats[0]?.paidAmount || 0;
    const totalDue = totalInvoiced - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        availableYears,
        selectedYear: year,
        selectedMonth: month,
        stats: {
          projects: {
            total: projectStats[0]?.total || 0,
            active: activeProjectsCount, // Use all-time active count
            completed: projectStats[0]?.completed || 0,
            onHold: projectStats[0]?.onHold || 0,
            totalValue: projectStats[0]?.totalValue || 0,
          },
          invoices: {
            total: invoiceStats[0]?.total || 0,
            paid: invoiceStats[0]?.paid || 0,
            pending: invoiceStats[0]?.pending || 0,
            overdue: invoiceStats[0]?.overdue || 0,
            totalAmount: totalInvoiced,
            paidAmount: totalPaid,
          },
          payments: {
            total: paymentStats[0]?.total || 0,
            totalAmount: totalPaid, // Show Ex-GST Paid Amount here too for consistency in Dashboard
          },
          summary: {
            totalRevenue: totalInvoiced,
            totalPaid: totalPaid,
            totalDue: totalDue > 0 ? totalDue : 0,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  getDashboardOverview,
  getProjectDashboard,
  getInvoiceDashboard,
  getPaymentDashboard,
  getFilteredDashboardStats,
};
