const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login - Public
router.post('/login', login);

// GET /api/auth/me - Authenticated
router.get('/me', authenticate, getMe);

module.exports = router;
