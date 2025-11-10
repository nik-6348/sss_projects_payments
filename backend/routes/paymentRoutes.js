const express = require('express');

const {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getDashboardStats,
  getBankAccounts
} = require('../controllers/paymentController');

const { protect } = require('../middleware/auth');
const {
  createPaymentValidation,
  updatePaymentValidation,
  mongoIdValidation,
  paginationValidation
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Bank accounts route - must be before /:id route
router.get('/bank-accounts', getBankAccounts);

// Dashboard stats route
router.get('/dashboard/stats', getDashboardStats);

// Payment CRUD routes
router.get('/', paginationValidation, getPayments);
router.get('/:id', mongoIdValidation, getPayment);
router.post('/', createPaymentValidation, createPayment);
router.put('/:id', updatePaymentValidation, updatePayment);
router.delete('/:id', mongoIdValidation, deletePayment);

module.exports = router;
