import BankDetails from "../models/BankDetails.js";
import { validationResult } from "express-validator";

// @desc    Get all bank accounts
// @route   GET /api/bank-accounts
// @access  Private
const getBankAccounts = async (req, res, next) => {
  try {
    const bankAccounts = await BankDetails.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bankAccounts.length,
      data: bankAccounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bank account
// @route   GET /api/bank-accounts/:id
// @access  Private
const getBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await BankDetails.findById(req.params.id);

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        error: "Bank account not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bankAccount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create bank account
// @route   POST /api/bank-accounts
// @access  Private
const createBankAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const bankAccount = await BankDetails.create(req.body);

    res.status(201).json({
      success: true,
      message: "Bank account created successfully",
      data: bankAccount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update bank account
// @route   PUT /api/bank-accounts/:id
// @access  Private
const updateBankAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    let bankAccount = await BankDetails.findById(req.params.id);

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        error: "Bank account not found",
      });
    }

    bankAccount = await BankDetails.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Bank account updated successfully",
      data: bankAccount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bank account
// @route   DELETE /api/bank-accounts/:id
// @access  Private
const deleteBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await BankDetails.findById(req.params.id);

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        error: "Bank account not found",
      });
    }

    await BankDetails.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Bank account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getBankAccounts,
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
};
