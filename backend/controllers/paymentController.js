import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Project from "../models/Project.js";
import BankDetails from "../models/BankDetails.js";
import Settings from "../models/Settings.js";
import { validationResult } from "express-validator";
import { sendInvoiceStatusEmail } from "./emailController.js";

const roundMoney = (amount) => Math.round((Number(amount) || 0) * 100) / 100;

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  return value === "true";
};

const getInvoicePrincipalRatio = (invoice) => {
  const invoiceTotal = Number(invoice?.total_amount || invoice?.amount || 0);
  if (invoiceTotal <= 0) return 1;
  const subtotal = Number(invoice?.subtotal || invoiceTotal);
  return Math.min(Math.max(subtotal / invoiceTotal, 0), 1);
};

const calculateTdsFromNetPayment = (amount, invoice, tdsPercentage) => {
  const netAmount = Number(amount) || 0;
  const tdsRate = ((Number(tdsPercentage) || 0) / 100) * getInvoicePrincipalRatio(invoice);

  if (tdsRate <= 0 || tdsRate >= 1) return 0;

  return roundMoney((netAmount / (1 - tdsRate)) * tdsRate);
};

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
        path: "project_id",
        select: "name user_id",
        populate: {
          path: "client_id",
          select: "name",
        },
      })
      .populate("invoice_id", "invoice_number amount total_amount currency")
      .sort({ payment_date: -1 })
      .skip(startIndex)
      .limit(limit);

    // Transform data for frontend compatibility
    const transformedPayments = payments.map((payment) => ({
      ...payment.toObject(),
      id: payment._id,
    }));

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: transformedPayments.length,
      pagination,
      data: transformedPayments,
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
        path: "project_id",
        select: "name user_id",
        populate: {
          path: "client_id",
          select: "name",
        },
      })
      .populate("invoice_id", "invoice_number amount total_amount currency");

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    // Transform data for frontend compatibility
    const transformedPayment = {
      ...payment.toObject(),
      id: payment._id,
    };

    res.status(200).json({
      success: true,
      data: transformedPayment,
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
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const {
      invoice_id,
      project_id,
      amount,
      currency,
      payment_method,
      bank_account_id,
      custom_payment_details,
      payment_date,
      remark,
      include_tds,
      tds_percentage,
      usd_to_inr_rate,
    } = req.body;

    let projectIdToUse = project_id;
    let invoice = null;

    // If project_id is missing but invoice_id is present, infer it
    if (!projectIdToUse && invoice_id) {
      invoice = await Invoice.findById(invoice_id);
      if (invoice) {
        projectIdToUse = invoice.project_id;
      }
    }

    // Verify project exists
    const project = await Project.findById(projectIdToUse);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // If invoice_id provided, verify invoice exists
    if (invoice_id) {
      invoice = invoice || (await Invoice.findById(invoice_id));
      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: "Invoice not found",
        });
      }
    }

    const settings = await Settings.findOne();
    const paymentCurrency = currency || invoice?.currency || project.currency || "INR";
    const shouldIncludeTds = toBoolean(include_tds, false);
    const effectiveTdsPercentage = shouldIncludeTds
      ? Number(
          tds_percentage ??
            settings?.tds_settings?.default_percentage ??
            10
        )
      : Number(tds_percentage ?? settings?.tds_settings?.default_percentage ?? 10);
    const tdsAmount = shouldIncludeTds
      ? calculateTdsFromNetPayment(amount, invoice, effectiveTdsPercentage)
      : 0;
    const creditedAmount = roundMoney(Number(amount) + tdsAmount);
    const effectiveUsdToInrRate =
      paymentCurrency === "USD"
        ? Number(
            usd_to_inr_rate ??
              settings?.currency_settings?.usd_to_inr_rate ??
              0
          )
        : 0;
    const inrConvertedAmount =
      paymentCurrency === "USD"
        ? roundMoney(Number(amount) * effectiveUsdToInrRate)
        : 0;

    const payment = await Payment.create({
      invoice_id,
      project_id: projectIdToUse,
      amount,
      currency: paymentCurrency,
      payment_method,
      bank_account_id,
      custom_payment_details,
      payment_date,
      remark,
      include_tds: shouldIncludeTds,
      tds_percentage: effectiveTdsPercentage,
      tds_amount: tdsAmount,
      credited_amount: creditedAmount,
      usd_to_inr_rate: effectiveUsdToInrRate,
      inr_converted_amount: inrConvertedAmount,
    });

    // Update invoice status and amounts
    if (invoice_id) {
      invoice = invoice || (await Invoice.findById(invoice_id));
      if (invoice) {
        const newPaidAmount = roundMoney(
          (invoice.paid_amount || 0) + creditedAmount
        );
        const payableAmount = invoice.total_amount || invoice.amount || 0;
        const newBalanceDue = roundMoney(payableAmount - newPaidAmount);

        let newStatus = invoice.status;
        if (newBalanceDue <= 0) {
          newStatus = "paid";
        } else if (newPaidAmount > 0) {
          newStatus = "partial";
        }

        invoice.paid_amount = newPaidAmount;
        invoice.balance_due = Math.max(newBalanceDue, 0);
        invoice.status = newStatus;
        if (newStatus === "paid") {
          invoice.paid_date = payment_date;
        }

        await invoice.save();

        // Send email notification for payment
        if (newStatus === "paid" || newStatus === "partial") {
          try {
            await sendInvoiceStatusEmail(invoice._id, newStatus, {
              amount: amount,
            });
          } catch (emailError) {
            console.error("Failed to send payment email:", emailError);
          }
        }
      }
    }

    await payment.populate({
      path: "project_id",
      select: "name user_id",
      populate: {
        path: "client_id",
        select: "name",
      },
    });
    await payment.populate("invoice_id", "invoice_number amount total_amount currency");

    // Transform data for frontend compatibility
    const transformedPayment = {
      ...payment.toObject(),
      id: payment._id,
    };

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: transformedPayment,
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
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const oldPayment = await Payment.findById(req.params.id);

    if (!oldPayment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    const updateData = { ...req.body };

    let invoice = null;
    if (oldPayment.invoice_id) {
      invoice = await Invoice.findById(oldPayment.invoice_id);
    }

    // Recalculate TDS and credited amount if payment details are updated
    const newAmount = updateData.amount !== undefined ? Number(updateData.amount) : oldPayment.amount;
    const newIncludeTds = updateData.include_tds !== undefined ? toBoolean(updateData.include_tds) : oldPayment.include_tds;
    
    const settings = await Settings.findOne();
    const newTdsPercentage = updateData.tds_percentage !== undefined 
      ? Number(updateData.tds_percentage) 
      : (oldPayment.tds_percentage ?? settings?.tds_settings?.default_percentage ?? 10);

    const shouldIncludeTds = toBoolean(newIncludeTds, false);
    const newTdsAmount = shouldIncludeTds && invoice
      ? calculateTdsFromNetPayment(newAmount, invoice, newTdsPercentage)
      : 0;
    const newCreditedAmount = roundMoney(Number(newAmount) + newTdsAmount);

    updateData.tds_amount = newTdsAmount;
    updateData.credited_amount = newCreditedAmount;
    updateData.tds_percentage = newTdsPercentage;
    updateData.include_tds = shouldIncludeTds;

    const paymentCurrency = updateData.currency || oldPayment.currency || invoice?.currency || "INR";
    const newUsdToInrRate = updateData.usd_to_inr_rate !== undefined
      ? Number(updateData.usd_to_inr_rate)
      : (oldPayment.usd_to_inr_rate ?? settings?.currency_settings?.usd_to_inr_rate ?? 0);
    const newInrConvertedAmount = paymentCurrency === "USD"
      ? roundMoney(Number(newAmount) * newUsdToInrRate)
      : 0;
    
    updateData.usd_to_inr_rate = newUsdToInrRate;
    updateData.inr_converted_amount = newInrConvertedAmount;

    // Recalculate invoice financials
    if (oldPayment.invoice_id && invoice) {
      const oldCredited = oldPayment.credited_amount ?? oldPayment.amount;
      // Revert old payment credit
      invoice.paid_amount = Math.max(0, roundMoney((invoice.paid_amount || 0) - oldCredited));
      // Apply new payment credit
      invoice.paid_amount = roundMoney(invoice.paid_amount + newCreditedAmount);
      invoice.balance_due = roundMoney((invoice.total_amount || invoice.amount || 0) - invoice.paid_amount);

      // Recalculate status
      if (invoice.balance_due <= 0) {
        invoice.status = 'paid';
        invoice.balance_due = 0;
      } else if (invoice.paid_amount > 0) {
        invoice.status = 'partial';
      } else {
        invoice.status = 'unpaid';
      }
      await invoice.save();
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await payment.populate({
      path: "project_id",
      select: "name user_id",
      populate: {
        path: "client_id",
        select: "name",
      },
    });
    await payment.populate("invoice_id", "invoice_number amount total_amount currency");

    // Transform data for frontend compatibility
    const transformedPayment = {
      ...payment.toObject(),
      id: payment._id,
    };

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: transformedPayment,
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
        error: "Payment not found",
      });
    }

    // Reverse invoice financial state
    if (payment.invoice_id) {
      const invoice = await Invoice.findById(payment.invoice_id);
      if (invoice) {
        const creditedAmt = payment.credited_amount ?? payment.amount;
        invoice.paid_amount = Math.max(0, roundMoney((invoice.paid_amount || 0) - creditedAmt));
        invoice.balance_due = roundMoney((invoice.total_amount || invoice.amount) - invoice.paid_amount);

        // Recalculate status
        if (invoice.paid_amount <= 0) {
          invoice.status = 'unpaid';
        } else if (invoice.balance_due <= 0) {
          invoice.status = 'paid';
        } else {
          invoice.status = 'partial';
        }
        await invoice.save();
      }
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
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
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyAmount = await Payment.aggregate([
      { $match: { payment_date: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const paymentMethods = await Payment.aggregate([
      {
        $group: {
          _id: "$payment_method",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyAmount: monthlyAmount[0]?.total || 0,
        paymentMethods,
      },
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
      .select("accountHolderName accountNumber ifscCode bankName accountType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bankAccounts.length,
      data: bankAccounts,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getDashboardStats,
  getBankAccounts,
};
