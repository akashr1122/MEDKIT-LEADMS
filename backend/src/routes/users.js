const express = require('express');
const router = express.Router();
const { getAll, create, update, deactivate } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// GET /api/users - Get all users
router.get('/', getAll);

// POST /api/users - Create user
router.post('/', create);

// PUT /api/users/:id - Update user
router.put('/:id', update);

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', deactivate);

module.exports = router;
