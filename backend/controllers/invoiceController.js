import Invoice from "../models/Invoice.js";
import Project from "../models/Project.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import { sendInvoiceStatusEmail } from "./emailController.js";
import { generateInvoiceNumber } from "../utils/invoiceUtils.js";

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      project,
      issueDateFrom,
      issueDateTo,
      dueDateFrom,
      dueDateTo,
      deleted, // 'true' or 'false'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build match stage
    const matchStage = {};

    // Handle deleted status
    if (deleted === "true") {
      matchStage.isDeleted = true;
    } else {
      matchStage.isDeleted = false;
    }

    // Status filter
    if (status) {
      matchStage.status = status;
    }

    // Project filter
    if (project) {
      matchStage.project_id = new mongoose.Types.ObjectId(project);
    }

    // Date range filters
    if (issueDateFrom || issueDateTo) {
      matchStage.issue_date = {};
      if (issueDateFrom) matchStage.issue_date.$gte = new Date(issueDateFrom);
      if (issueDateTo) matchStage.issue_date.$lte = new Date(issueDateTo);
    }

    if (dueDateFrom || dueDateTo) {
      matchStage.due_date = {};
      if (dueDateFrom) matchStage.due_date.$gte = new Date(dueDateFrom);
      if (dueDateTo) matchStage.due_date.$lte = new Date(dueDateTo);
    }

    // Aggregation pipeline
    const pipeline = [
      // 1. Lookup Project
      {
        $lookup: {
          from: "projects",
          localField: "project_id",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

      // 2. Lookup Client (via Project)
      {
        $lookup: {
          from: "clients",
          localField: "project.client_id",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

      // 3. Initial Match (Filters)
      { $match: matchStage },
    ];

    // 4. Search (if provided)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { invoice_number: searchRegex },
            { "project.name": searchRegex },
            { "client.name": searchRegex },
          ],
        },
      });
    }

    // 5. Facet for Pagination and Data
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { createdAt: -1 } }, // Newest first
          { $skip: skip },
          { $limit: limitNum },
          // Project the fields we need
          {
            $project: {
              _id: 1,
              invoice_number: 1,
              amount: 1,
              currency: 1,
              status: 1,
              issue_date: 1,
              due_date: 1,
              services: 1,
              subtotal: 1,
              gst_percentage: 1,
              gst_amount: 1,
              include_gst: 1,
              total_amount: 1,
              payment_method: 1,
              bank_account_id: 1,
              custom_payment_details: 1,
              isDeleted: 1,
              deletion_remark: 1,
              createdAt: 1,
              updatedAt: 1,
              paid_amount: 1,
              balance_due: 1,
              // Reconstruct project_id as populated object
              project_id: {
                _id: "$project._id",
                name: "$project.name",
                client_id: "$project.client_id",
                client_name: "$client.name",
              },
            },
          },
        ],
      },
    });

    const result = await Invoice.aggregate(pipeline);

    const metadata = result[0].metadata[0];
    const totalItems = metadata ? metadata.total : 0;
    const totalPages = Math.ceil(totalItems / limitNum);
    const invoices = result[0].data;

    res.json({
      success: true,
      count: invoices.length,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalItems: totalItems,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      data: invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "project_id",
      select: "name user_id",
      populate: {
        path: "client_id",
        select: "name email",
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || "Unknown Client",
        client_id: invoice.project_id.client_id,
        id: invoice.project_id._id,
      },
    };

    res.status(200).json({
      success: true,
      data: transformedInvoice,
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
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const project = await Project.findById(req.body.project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const { services = [], gst_percentage = 18, include_gst = true } = req.body;
    const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);

    let gst_amount = 0;
    if (include_gst) {
      gst_amount = (subtotal * gst_percentage) / 100;
    }

    const total_amount = subtotal + gst_amount;

    // Check project budget
    // We compare Principal (Subtotal) against Project Budget (Principal)
    const existingInvoices = await Invoice.aggregate([
      {
        $match: {
          project_id: project._id,
          isDeleted: false,
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$subtotal" } } },
    ]);
    const currentTotal = existingInvoices[0]?.total || 0;

    if (currentTotal + subtotal > project.total_amount) {
      return res.status(400).json({
        success: false,
        error: `Project budget exceeded. Remaining budget: ${
          project.total_amount - currentTotal
        }`,
      });
    }

    const invoice_number = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      ...req.body,
      invoice_number,
      services,
      subtotal,
      gst_percentage,
      gst_amount,
      include_gst,
      total_amount,
      amount: subtotal, // Save Subtotal as the main Amount (for Analytics/Project Value)
      balance_due: subtotal, // Initial balance is Principal Amount (Excl GST)
    });

    await invoice.populate({
      path: "project_id",
      select: "name user_id",
      populate: {
        path: "client_id",
        select: "name email",
      },
    });

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || "Unknown Client",
        client_id: invoice.project_id.client_id,
        id: invoice.project_id._id,
      },
    };

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: transformedInvoice,
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
        error: "Validation failed",
        details: errors.array(),
      });
    }

    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    if (invoice.status !== "draft") {
      return res.status(400).json({
        success: false,
        error: "Only draft invoices can be edited",
      });
    }

    // Handle services calculation if services are provided
    let updateData = { ...req.body };
    if (req.body.services) {
      const {
        services = [],
        gst_percentage = 18,
        include_gst = req.body.include_gst !== undefined
          ? req.body.include_gst
          : invoice.include_gst,
      } = req.body;

      const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);

      let gst_amount = 0;
      if (include_gst) {
        gst_amount = (subtotal * gst_percentage) / 100;
      }

      const total_amount = subtotal + gst_amount;

      updateData = {
        ...updateData,
        services,
        subtotal,
        gst_percentage,
        gst_amount,
        include_gst,
        total_amount,
        amount: subtotal, // Save Subtotal as Amount
      };

      // Check project budget if amount changed
      const project = await Project.findById(invoice.project_id);
      const existingInvoices = await Invoice.aggregate([
        {
          $match: {
            project_id: invoice.project_id,
            isDeleted: false,
            _id: { $ne: invoice._id },
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]);
      const currentTotal = existingInvoices[0]?.total || 0;

      if (currentTotal + subtotal > project.total_amount) {
        return res.status(400).json({
          success: false,
          error: `Project budget exceeded. Remaining budget: ${
            project.total_amount - currentTotal
          }`,
        });
      }
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "project_id",
      select: "name user_id",
      populate: {
        path: "client_id",
        select: "name email",
      },
    });

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || "Unknown Client",
        client_id: invoice.project_id.client_id,
        id: invoice.project_id._id,
      },
    };

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: transformedInvoice,
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
        error: "Invoice not found",
      });
    }

    // Smart Delete Logic
    if (invoice.status === "draft") {
      // Hard delete for drafts
      await Invoice.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Draft invoice permanently deleted",
      });
    } else {
      // Soft delete for sent/paid invoices
      const { remark } = req.body;
      if (!remark) {
        return res.status(400).json({
          success: false,
          error: "Deletion remark is required for sent/paid invoices",
        });
      }

      invoice.isDeleted = true;
      invoice.deletion_remark = remark;
      await invoice.save();

      return res.status(200).json({
        success: true,
        message: "Invoice soft deleted successfully",
      });
    }
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
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { status, paidDate } = req.body;
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Validate status
    const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const updateData = { status };

    // If marking as paid, add paid date and update amounts
    if (status === "paid") {
      updateData.paid_date = paidDate || new Date();
      updateData.paid_amount = invoice.total_amount;
      updateData.balance_due = 0;
    } else if (status === "partial") {
      // For partial, we expect paid_amount in body
      const { paid_amount } = req.body;
      if (!paid_amount) {
        return res.status(400).json({
          success: false,
          error: "Paid amount is required for partial status",
        });
      }
      updateData.paid_amount = (invoice.paid_amount || 0) + Number(paid_amount);
      updateData.balance_due = invoice.total_amount - updateData.paid_amount;

      // Auto-switch to paid if balance is 0
      if (updateData.balance_due <= 0) {
        updateData.status = "paid";
        updateData.paid_date = new Date();
        updateData.balance_due = 0;
      }
    } else {
      // Reset if moving back to sent/draft (optional, depending on business logic)
      // For now, we keep paid history unless explicitly cleared
    }

    // Add to status history
    const { remark } = req.body;
    const historyEntry = {
      status,
      remark,
      date: new Date(),
    };

    // Use findByIdAndUpdate with $set and $push
    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData,
        $push: { status_history: historyEntry },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "project_id",
      select: "name user_id",
      populate: {
        path: "client_id",
        select: "name email",
      },
    });

    // Transform data for frontend compatibility
    const transformedInvoice = {
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || "Unknown Client",
        client_id: invoice.project_id.client_id,
        id: invoice.project_id._id,
      },
    };

    // Send email notification for status changes
    if (["cancelled", "overdue", "paid"].includes(status)) {
      try {
        await sendInvoiceStatusEmail(invoice._id, status);
      } catch (emailError) {
        console.error("Failed to send status email:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Invoice status updated successfully",
      data: transformedInvoice,
    });
  } catch (error) {
    next(error);
  }
};

import { generateInvoicePDF as generatePDF } from "../utils/generateInvoiceNew.js";
import BankDetails from "../models/BankDetails.js";
import companyDetails from "../config/companyDetails.js";

// ... (keep existing imports)

// @desc    Generate invoice PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const generateInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "project_id",
      populate: {
        path: "client_id",
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Fetch Bank Details
    let bankDetails;
    if (invoice.bank_account_id) {
      bankDetails = await BankDetails.findById(invoice.bank_account_id);
    }

    // Fallback to first bank account if not found or not specified
    if (!bankDetails) {
      const banks = await BankDetails.find();
      if (banks.length > 0) bankDetails = banks[0];
    }

    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        error: "Bank details not found. Please add a bank account.",
      });
    }

    // Prepare Data
    const invoiceData = invoice.toObject();
    const clientData = invoice.project_id.client_id;

    // Generate PDF
    const pdfBase64 = generatePDF(
      invoiceData,
      clientData,
      bankDetails,
      companyDetails
    );

    res.status(200).json({
      success: true,
      message: "Invoice PDF generated",
      data: {
        pdf_base64: pdfBase64,
        filename: `invoice-${invoice.invoice_number}.pdf`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    next(error);
  }
};

// @desc    Get invoice dashboard stats
// @route   GET /api/invoices/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: "paid" });
    const pendingInvoices = await Invoice.countDocuments({ status: "sent" });
    const overdueInvoices = await Invoice.countDocuments({
      status: { $in: ["sent", "overdue"] },
      due_date: { $lt: new Date() },
    });

    const totalAmount = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const paidAmount = await Invoice.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get deleted invoices
// @route   GET /api/invoices/deleted
// @access  Private
const getDeletedInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ isDeleted: true })
      .populate({
        path: "project_id",
        select: "name user_id",
        populate: {
          path: "client_id",
          select: "name email",
        },
      })
      .sort({ updatedAt: -1 });

    // Transform data for frontend compatibility
    const transformedInvoices = invoices.map((invoice) => ({
      ...invoice.toObject(),
      id: invoice._id,
      project_id: {
        _id: invoice.project_id._id,
        name: invoice.project_id.name,
        client_name: invoice.project_id.client_id?.name || "Unknown Client",
        client_id: invoice.project_id.client_id,
        id: invoice.project_id._id,
      },
    }));

    res.status(200).json({
      success: true,
      count: transformedInvoices.length,
      data: transformedInvoices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore deleted invoice
// @route   PUT /api/invoices/:id/restore
// @access  Private
const restoreInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    invoice.isDeleted = false;
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Invoice restored successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate invoice
// @route   POST /api/invoices/:id/duplicate
// @access  Private
const duplicateInvoice = async (req, res, next) => {
  try {
    const sourceInvoice = await Invoice.findById(req.params.id);

    if (!sourceInvoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check project budget
    const project = await Project.findById(sourceInvoice.project_id);
    const existingInvoices = await Invoice.aggregate([
      {
        $match: {
          project_id: sourceInvoice.project_id,
          isDeleted: false,
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$subtotal" } } },
    ]);
    const currentTotal = existingInvoices[0]?.total || 0;

    // Use source subtotal for check
    if (currentTotal + sourceInvoice.subtotal > project.total_amount) {
      return res.status(400).json({
        success: false,
        error: `Project budget exceeded. Remaining budget: ${
          project.total_amount - currentTotal
        }`,
      });
    }

    // Prepare new invoice data
    const newInvoiceData = sourceInvoice.toObject();

    // Clean up fields to ensure new unique creation
    delete newInvoiceData._id;
    delete newInvoiceData.invoice_number; // Will be auto-generated by model default
    delete newInvoiceData.createdAt;
    delete newInvoiceData.updatedAt;
    delete newInvoiceData.__v;
    delete newInvoiceData.pdf_base64;
    delete newInvoiceData.pdf_generated_at;

    // Reset status and dates
    newInvoiceData.status = "draft";
    newInvoiceData.issue_date = new Date(); // Set to Today
    newInvoiceData.due_date = new Date(); // Set to Today
    newInvoiceData.paid_amount = 0;
    newInvoiceData.balance_due = newInvoiceData.total_amount;
    newInvoiceData.isDeleted = false;
    newInvoiceData.deletion_remark = undefined;
    newInvoiceData.paid_date = undefined;

    // Reset history
    newInvoiceData.status_history = [
      {
        status: "draft",
        remark: `Duplicated from ${sourceInvoice.invoice_number}`,
        date: new Date(),
      },
    ];

    // Create new invoice
    const newInvoice = await Invoice.create(newInvoiceData);

    await newInvoice.populate({
      path: "project_id",
      select: "name user_id",
      populate: {
        path: "client_id",
        select: "name email",
      },
    });

    // Transform data
    const transformedInvoice = {
      ...newInvoice.toObject(),
      id: newInvoice._id,
      project_id: {
        _id: newInvoice.project_id._id,
        name: newInvoice.project_id.name,
        client_name: newInvoice.project_id.client_id?.name || "Unknown Client",
        client_id: newInvoice.project_id.client_id,
        id: newInvoice.project_id._id,
      },
    };

    res.status(201).json({
      success: true,
      message: "Invoice duplicated successfully",
      data: transformedInvoice,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  generateInvoicePDF,
  getDashboardStats,
  getDeletedInvoices,
  restoreInvoice,
  duplicateInvoice,
};
