const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const BankDetails = require('../models/BankDetails');
const { validationResult } = require('express-validator');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by project
    if (req.query.project_id) {
      query.project_id = req.query.project_id;
    }

    // Filter by invoice
    if (req.query.invoice_id) {
      query.invoice_id = req.query.invoice_id;
    }

    // Filter by payment method
    if (req.query.payment_method) {
      query.payment_method = req.query.payment_method;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.payment_date = {};
      if (req.query.startDate) {
        query.payment_date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.payment_date.$lte = new Date(req.query.endDate);
      }
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      })
      .populate('invoice_id', 'invoice_number amount')
      .sort({ payment_date: -1 })
      .skip(startIndex)
      .limit(limit);

    // Transform data for frontend compatibility
    const transformedPayments = payments.map(payment => ({
      ...payment.toObject(),
      id: payment._id
    }));

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    };

    res.status(200).json({
      success: true,
      count: transformedPayments.length,
      pagination,
      data: transformedPayments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      })
      .populate('invoice_id', 'invoice_number amount');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Transform data for frontend compatibility
    const transformedPayment = {
      ...payment.toObject(),
      id: payment._id
    };

    res.status(200).json({
      success: true,
      data: transformedPayment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { invoice_id, project_id, amount, payment_method, payment_date } = req.body;

    // Verify project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // If invoice_id provided, verify invoice exists
    if (invoice_id) {
      const invoice = await Invoice.findById(invoice_id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
      }
    }

    const payment = await Payment.create({
      invoice_id,
      project_id,
      amount,
      payment_method,
      payment_date
    });

    await payment.populate({
      path: 'project_id',
      select: 'name user_id',
      populate: {
        path: 'client_id',
        select: 'name'
      }
    });
    await payment.populate('invoice_id', 'invoice_number amount');

    // Transform data for frontend compatibility
    const transformedPayment = {
      ...payment.toObject(),
      id: payment._id
    };

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: transformedPayment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    let payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    await payment.populate({
      path: 'project_id',
      select: 'name user_id',
      populate: {
        path: 'client_id',
        select: 'name'
      }
    });
    await payment.populate('invoice_id', 'invoice_number amount');

    // Transform data for frontend compatibility
    const transformedPayment = {
      ...payment.toObject(),
      id: payment._id
    };

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: transformedPayment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment dashboard stats
// @route   GET /api/payments/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const totalPayments = await Payment.countDocuments();

    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyAmount = await Payment.aggregate([
      { $match: { payment_date: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentMethods = await Payment.aggregate([
      { $group: { _id: '$payment_method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyAmount: monthlyAmount[0]?.total || 0,
        paymentMethods
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available bank accounts for payment methods
// @route   GET /api/payments/bank-accounts
// @access  Private
const getBankAccounts = async (req, res, next) => {
  try {
    const bankAccounts = await BankDetails.find()
      .select('accountHolderName accountNumber ifscCode bankName accountType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bankAccounts.length,
      data: bankAccounts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getDashboardStats,
  getBankAccounts
};
