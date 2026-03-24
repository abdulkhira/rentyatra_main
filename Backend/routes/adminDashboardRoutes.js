const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminDashboardController');
const { adminAuth } = require('../middleware/adminAuth');

// Dashboard statistics route
router.get('/stats', adminAuth, getDashboardStats);

module.exports = router;
