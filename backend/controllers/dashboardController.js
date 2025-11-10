const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const User = require('../models/User');

// @desc    Get comprehensive dashboard statistics
// @route   GET /api/dashboard/overview
// @access  Private
const getDashboardOverview = async (req, res, next) => {
  try {
    // Project statistics
    const totalProjects = await Project.countDocuments({ user_id: req.user.id });
    const activeProjects = await Project.countDocuments({
      user_id: req.user.id,
      status: 'active'
    });
    const completedProjects = await Project.countDocuments({
      user_id: req.user.id,
      status: 'completed'
    });

    const projectStatusStats = await Project.aggregate([
      { $match: { user_id: req.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalProjectValue = await Project.aggregate([
      { $match: { user_id: req.user.id } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);

    // Invoice statistics
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const pendingInvoices = await Invoice.countDocuments({ status: 'sent' });
    const overdueInvoices = await Invoice.countDocuments({
      status: { $in: ['sent', 'overdue'] },
      due_date: { $lt: new Date() }
    });

    const invoiceStatusStats = await Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalInvoiceAmount = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paidInvoiceAmount = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Payment statistics
    const totalPayments = await Payment.countDocuments();
    const totalPaymentAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyProjectTrends = await Project.aggregate([
      { $match: { user_id: req.user.id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$total_amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthlyInvoiceTrends = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthlyPaymentTrends = await Payment.aggregate([
      { $match: { payment_date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$payment_date' },
            month: { $month: '$payment_date' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent activities
    const recentProjects = await Project.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status createdAt');

    const recentInvoices = await Invoice.find()
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('invoice_number amount status project_id createdAt');

    const recentPayments = await Payment.find()
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      })
      .populate('invoice_id', 'invoice_number')
      .sort({ payment_date: -1 })
      .limit(5)
      .select('amount payment_method payment_date project_id invoice_id');

    res.status(200).json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          statusBreakdown: projectStatusStats,
          totalValue: totalProjectValue[0]?.total || 0
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
          overdue: overdueInvoices,
          statusBreakdown: invoiceStatusStats,
          totalAmount: totalInvoiceAmount[0]?.total || 0,
          paidAmount: paidInvoiceAmount[0]?.total || 0
        },
        payments: {
          total: totalPayments,
          totalAmount: totalPaymentAmount[0]?.total || 0
        },
        trends: {
          projects: monthlyProjectTrends,
          invoices: monthlyInvoiceTrends,
          payments: monthlyPaymentTrends
        },
        recentActivities: {
          projects: recentProjects,
          invoices: recentInvoices,
          payments: recentPayments
        }
      }
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
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$total_amount' },
          avgBudget: { $avg: '$total_amount' }
        }
      }
    ]);

    const projectTimeline = await Project.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name status total_amount createdAt client_name');

    res.status(200).json({
      success: true,
      data: {
        statistics: projectStats,
        timeline: projectTimeline
      }
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
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const overdueInvoices = await Invoice.find({
      status: { $in: ['sent', 'overdue'] },
      due_date: { $lt: new Date() }
    })
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      })
      .sort({ due_date: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        statistics: invoiceStats,
        overdue: overdueInvoices
      }
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
          _id: '$payment_method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const recentPayments = await Payment.find()
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      })
      .populate('invoice_id', 'invoice_number')
      .sort({ payment_date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        paymentMethods: paymentMethodStats,
        recent: recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getProjectDashboard,
  getInvoiceDashboard,
  getPaymentDashboard
};
