const express = require('express');
const { body, param } = require('express-validator');

const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getDashboardStats
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Project name is required'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description is required'),
  body('total_amount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('client_name')
    .trim()
    .notEmpty()
    .withMessage('Client name is required'),
  body('start_date')
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('status')
    .optional()
    .isIn(['active', 'on_hold', 'completed', 'cancelled', 'draft'])
    .withMessage('Invalid status')
];

const updateProjectValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Project name must be at least 2 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('total_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('client_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Client name is required'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('status')
    .optional()
    .isIn(['active', 'on_hold', 'completed', 'cancelled', 'draft'])
    .withMessage('Invalid status')
];

const updateProjectStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('status')
    .isIn(['active', 'on_hold', 'completed', 'cancelled', 'draft'])
    .withMessage('Invalid status'),
  body('progress')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100')
];

// All routes require authentication
router.use(protect);

// Project CRUD routes
router.get('/', getProjects);
router.get('/:id', param('id').isMongoId().withMessage('Invalid project ID'), getProject);
router.post('/', createProjectValidation, createProject);
router.put('/:id', updateProjectValidation, updateProject);
router.delete('/:id', param('id').isMongoId().withMessage('Invalid project ID'), deleteProject);

// Project status update route
router.put('/:id/status', updateProjectStatusValidation, updateProjectStatus);

// Dashboard stats route
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
