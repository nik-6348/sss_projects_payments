const express = require('express');
const { body, param } = require('express-validator');

const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  generateInvoicePDF,
  getDashboardStats
} = require('../controllers/invoiceController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createInvoiceValidation = [
  body('project_id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('issue_date')
    .isISO8601()
    .withMessage('Please provide a valid issue date'),
  body('due_date')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status')
];

const updateInvoiceValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid invoice ID'),
  body('project_id')
    .optional()
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('issue_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid issue date'),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status')
];

const updateInvoiceStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid invoice ID'),
  body('status')
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('Invalid status'),
  body('paidDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid paid date')
];

// All routes require authentication
router.use(protect);

// Invoice CRUD routes
router.get('/', getInvoices);
router.get('/:id', param('id').isMongoId().withMessage('Invalid invoice ID'), getInvoice);
router.post('/', createInvoiceValidation, createInvoice);
router.put('/:id', updateInvoiceValidation, updateInvoice);
router.delete('/:id', param('id').isMongoId().withMessage('Invalid invoice ID'), deleteInvoice);

// Invoice status update route
router.put('/:id/status', updateInvoiceStatusValidation, updateInvoiceStatus);

// Invoice PDF generation route
router.get('/:id/pdf', param('id').isMongoId().withMessage('Invalid invoice ID'), generateInvoicePDF);

// Dashboard stats route
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
