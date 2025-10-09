const express = require('express');
const {
  getDashboardOverview,
  getProjectDashboard,
  getInvoiceDashboard,
  getPaymentDashboard
} = require('../controllers/dashboardController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get('/overview', getDashboardOverview);
router.get('/projects', getProjectDashboard);
router.get('/invoices', getInvoiceDashboard);
router.get('/payments', getPaymentDashboard);

module.exports = router;
