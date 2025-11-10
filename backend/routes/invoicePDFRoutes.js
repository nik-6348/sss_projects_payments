const express = require('express');
const router = express.Router();
const invoicePDFController = require('../controllers/invoicePDFController');
const { protect } = require('../middleware/auth');

router.get('/:id/pdf/download', protect, invoicePDFController.generatePDF);
router.get('/:id/pdf/view', protect, invoicePDFController.viewPDF);

module.exports = router;
