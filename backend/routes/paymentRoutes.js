const express = require('express');
const { body, param } = require('express-validator');

const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getDashboardStats
} = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createPaymentValidation = [
  body('project_id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('payment_date')
    .isISO8601()
    .withMessage('Please provide a valid payment date'),
  body('payment_method')
    .optional()
    .isIn(['bank_transfer', 'credit_card', 'upi', 'cash', 'other'])
    .withMessage('Invalid payment method'),
  body('invoice_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid invoice ID')
];

const updatePaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('project_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('payment_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid payment date'),
  body('payment_method')
    .optional()
    .isIn(['bank_transfer', 'credit_card', 'upi', 'cash', 'other'])
    .withMessage('Invalid payment method'),
  body('invoice_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid invoice ID')
];

// All routes require authentication
router.use(protect);

// Payment CRUD routes
router.get('/', getPayments);
router.get('/:id', param('id').isMongoId().withMessage('Invalid payment ID'), getPayment);
router.post('/', createPaymentValidation, createPayment);
router.put('/:id', updatePaymentValidation, updatePayment);
router.delete('/:id', param('id').isMongoId().withMessage('Invalid payment ID'), deletePayment);

// Dashboard stats route
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
