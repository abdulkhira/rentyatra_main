const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getPaymentMethods,
  createSubscription,
  razorpayRedirectCallback
} = require('../controllers/paymentController');

// @route   GET /api/payment/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', getPaymentMethods);

// Note: OPTIONS requests are handled globally by CORS middleware in server.js
// No need for route-level OPTIONS handler as it can cause conflicts

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order
// @access  Public
router.post('/create-order', createOrder);

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment
// @access  Public
router.post('/verify', verifyPayment);

// @route   POST /api/payment/create-subscription
// @desc    Create subscription before payment
// @access  Public
router.post('/create-subscription', createSubscription);

// @route   GET /api/payment/:paymentId
// @desc    Get payment details
// @access  Public
router.get('/:paymentId', getPaymentDetails);

// Razorpay redirect callback (accept both GET and POST; respond with 302 to SPA)
router.all('/razorpay-callback', razorpayRedirectCallback);

module.exports = router;
