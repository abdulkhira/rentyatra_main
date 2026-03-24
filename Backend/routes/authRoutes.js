const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  sendOTP,
  verifyOTP,
  register,
  login,
  refreshAuthToken,
  logout,
  getMe
} = require('../controllers/authController');

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', sendOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/signup user
// @access  Public
router.post('/verify-otp', verifyOTP);

// @route   POST /api/auth/register
// @desc    Register new user with complete information
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user with phone and OTP
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT using refresh token
// @access  Public
router.post('/refresh', refreshAuthToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public (allows logout even without valid token)
router.post('/logout', optionalAuth, logout);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;
