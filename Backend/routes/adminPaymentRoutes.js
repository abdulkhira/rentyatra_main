const express = require('express');
const router = express.Router();
const { getAllPayments } = require('../controllers/adminPaymentController');
const { adminAuth } = require('../middleware/adminAuth');

// Payment management routes
router.get('/all', adminAuth, getAllPayments);

module.exports = router;
