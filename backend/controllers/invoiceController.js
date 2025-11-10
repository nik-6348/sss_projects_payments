const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find()
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    // Transform data for frontend compatibility
    const transformedInvoices = invoices.map(invoice => ({
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || 'Unknown Client',
        id: invoice.project_id._id
      }
    }));

    res.status(200).json({
      success: true,
      count: transformedInvoices.length,
      data: transformedInvoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({
        path: 'project_id',
        select: 'name user_id',
        populate: {
          path: 'client_id',
          select: 'name'
        }
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || 'Unknown Client',
        id: invoice.project_id._id
      }
    };

    res.status(200).json({
      success: true,
      data: transformedInvoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const project = await Project.findById(req.body.project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const { services = [], gst_percentage = 18 } = req.body;
    const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);
    const gst_amount = (subtotal * gst_percentage) / 100;
    const total_amount = subtotal + gst_amount;

    const invoice = await Invoice.create({
      ...req.body,
      services,
      subtotal,
      gst_percentage,
      gst_amount,
      total_amount,
      amount: total_amount
    });

    await invoice.populate({
      path: 'project_id',
      select: 'name user_id',
      populate: {
        path: 'client_id',
        select: 'name'
      }
    });

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || 'Unknown Client',
        id: invoice.project_id._id
      }
    };

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: transformedInvoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Handle services calculation if services are provided
    let updateData = { ...req.body };
    if (req.body.services) {
      const { services = [], gst_percentage = 18 } = req.body;
      const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);
      const gst_amount = (subtotal * gst_percentage) / 100;
      const total_amount = subtotal + gst_amount;
      
      updateData = {
        ...updateData,
        services,
        subtotal,
        gst_percentage,
        gst_amount,
        total_amount,
        amount: total_amount
      };
    }

    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'project_id',
      select: 'name user_id',
      populate: {
        path: 'client_id',
        select: 'name'
      }
    });

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || 'Unknown Client',
        id: invoice.project_id._id
      }
    };

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: transformedInvoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status, paidDate } = req.body;
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Validate status
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const updateData = { status };

    // If marking as paid, add paid date
    if (status === 'paid' && paidDate) {
      updateData.paid_date = paidDate;
    } else if (status !== 'paid') {
      updateData.paid_date = undefined;
    }

    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'project_id',
      select: 'name user_id',
      populate: {
        path: 'client_id',
        select: 'name'
      }
    });

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || 'Unknown Client',
        id: invoice.project_id._id
      }
    };

    res.status(200).json({
      success: true,
      message: 'Invoice status updated successfully',
      data: transformedInvoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate invoice PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const generateInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('project_id', 'name client_name');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // For now, return a simple JSON representation
    // In a real application, you would generate an actual PDF
    const pdfData = {
      invoiceNumber: invoice.invoice_number,
      projectName: invoice.project_id.name,
      clientName: invoice.project_id.client_name,
      amount: invoice.amount,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      status: invoice.status
    };

    res.status(200).json({
      success: true,
      message: 'Invoice PDF data generated',
      data: pdfData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice dashboard stats
// @route   GET /api/invoices/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const pendingInvoices = await Invoice.countDocuments({ status: 'sent' });
    const overdueInvoices = await Invoice.countDocuments({
      status: { $in: ['sent', 'overdue'] },
      due_date: { $lt: new Date() }
    });

    const totalAmount = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paidAmount = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  generateInvoicePDF,
  getDashboardStats
};
