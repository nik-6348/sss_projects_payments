const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const {
  createClientValidation,
  updateClientValidation,
  mongoIdValidation,
  paginationValidation
} = require('../middleware/validation');

// All routes require authentication
router.use(protect);

router.post('/', createClientValidation, clientController.createClient);
router.get('/', paginationValidation, clientController.getClients);
router.get('/:id', mongoIdValidation, clientController.getClient);
router.put('/:id', updateClientValidation, clientController.updateClient);
router.delete('/:id', mongoIdValidation, clientController.deleteClient);

module.exports = router;
