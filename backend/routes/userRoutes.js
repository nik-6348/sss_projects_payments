const express = require('express');
const { body, param } = require('express-validator');

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be admin, manager, or user'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const updateUserValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be admin, manager, or user'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// All routes require authentication
router.use(protect);

// Routes accessible by admin and manager
router.get('/', authorize('admin', 'manager'), getUsers);
router.post('/', authorize('admin', 'manager'), createUserValidation, createUser);

// Routes for user management
router.get('/:id', param('id').isMongoId().withMessage('Invalid user ID'), getUser);
router.put('/:id', param('id').isMongoId().withMessage('Invalid user ID'), updateUserValidation, updateUser);
router.delete('/:id', authorize('admin'), param('id').isMongoId().withMessage('Invalid user ID'), deleteUser);

// User activation/deactivation routes
router.put('/:id/deactivate', authorize('admin', 'manager'), param('id').isMongoId().withMessage('Invalid user ID'), deactivateUser);
router.put('/:id/activate', authorize('admin', 'manager'), param('id').isMongoId().withMessage('Invalid user ID'), activateUser);

module.exports = router;
