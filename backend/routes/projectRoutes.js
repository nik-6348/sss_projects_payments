const express = require('express');

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
const {
  createProjectValidation,
  updateProjectValidation,
  updateProjectStatusValidation,
  mongoIdValidation,
  paginationValidation
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project CRUD routes
router.get('/', paginationValidation, getProjects);
router.get('/:id', mongoIdValidation, getProject);
router.post('/', createProjectValidation, createProject);
router.put('/:id', updateProjectValidation, updateProject);
router.delete('/:id', mongoIdValidation, deleteProject);

// Project status update route
router.put('/:id/status', updateProjectStatusValidation, updateProjectStatus);

// Dashboard stats route
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
