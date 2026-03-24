const express = require('express');
const router = express.Router();
const {
  adminSignup,
  adminLogin,
  validateAdminToken,
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfileImage,
  changePassword,
  adminLogout,
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getUserDetails
} = require('../controllers/adminController');

const { adminAuth, checkAdminRole, checkAdminPermission } = require('../middleware/adminAuth');
const { uploadProfile } = require('../config/cloudinary');

// @route   POST /api/admin/signup
// @desc    Register new admin
// @access  Public
router.post('/signup', adminSignup);

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', adminLogin);

// @route   GET /api/admin/me
// @desc    Get current admin profile
// @access  Private (Admin)
router.get('/me', adminAuth, getAdminProfile);

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private (Admin)
router.put('/profile', adminAuth, updateAdminProfile);

// @route   POST /api/admin/upload-profile-image
// @desc    Upload admin profile image
// @access  Private (Admin)
router.post('/upload-profile-image', adminAuth, uploadProfile.single('image'), uploadAdminProfileImage);

// @route   PUT /api/admin/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.put('/change-password', adminAuth, changePassword);

// @route   POST /api/admin/logout
// @desc    Admin logout
// @access  Private (Admin)
router.post('/logout', adminAuth, adminLogout);

// @route   GET /api/admin/stats
// @desc    Get admin statistics
// @access  Private (Admin)
router.get('/stats', adminAuth, getAdminStats);

// @route   GET /api/admin/validate-token
// @desc    Validate admin token
// @access  Private (Admin)
router.get('/validate-token', adminAuth, validateAdminToken);

// @route   GET /api/admin/permissions
// @desc    Get admin permissions
// @access  Private (Admin)
router.get('/permissions', adminAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      permissions: req.admin.permissions,
      role: req.admin.role
    }
  });
});

// @route   GET /api/admin/users
// @desc    Get all users for admin management
// @access  Private (Admin)
router.get('/users', adminAuth, checkAdminPermission('userManagement'), getAllUsers);

// @route   GET /api/admin/users/:userId
// @desc    Get user details for admin view
// @access  Private (Admin)
router.get('/users/:userId', adminAuth, checkAdminPermission('userManagement'), getUserDetails);

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status (ban/unban, activate/deactivate)
// @access  Private (Admin)
router.put('/users/:userId/status', adminAuth, checkAdminPermission('userManagement'), updateUserStatus);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:userId', adminAuth, checkAdminPermission('userManagement'), deleteUser);

// @route   GET /api/admin/health
// @desc    Admin API health check
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
