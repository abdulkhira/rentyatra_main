const express = require('express');
const router = express.Router();
const {
  getAllRentalRequests,
  getRentalRequest,
  updateRentalRequestStatus,
  deleteRentalRequest,
  getRentalRequestStats,
  bulkUpdateRentalRequestStatus,
  getRentalRequestsByUser,
  cleanupOrphanedRentalRequests
} = require('../controllers/rentalRequestController');

const { adminAuth, checkAdminPermission } = require('../middleware/adminAuth');

// @route   GET /api/admin/rental-requests
// @desc    Get all rental requests (Admin)
// @access  Private (Admin)
router.get('/', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  getAllRentalRequests
);

// @route   GET /api/admin/rental-requests/stats
// @desc    Get rental request statistics (Admin)
// @access  Private (Admin)
router.get('/stats', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  getRentalRequestStats
);

// @route   GET /api/admin/rental-requests/user/:userId
// @desc    Get rental requests by user (Admin)
// @access  Private (Admin)
router.get('/user/:userId', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  getRentalRequestsByUser
);

// @route   GET /api/admin/rental-requests/:id
// @desc    Get single rental request (Admin)
// @access  Private (Admin)
router.get('/:id', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  getRentalRequest
);

// @route   PUT /api/admin/rental-requests/:id/status
// @desc    Update rental request status (Admin)
// @access  Private (Admin)
router.put('/:id/status', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  updateRentalRequestStatus
);

// @route   PUT /api/admin/rental-requests/bulk-status
// @desc    Bulk update rental request status (Admin)
// @access  Private (Admin)
router.put('/bulk-status', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  bulkUpdateRentalRequestStatus
);

// @route   DELETE /api/admin/rental-requests/:id
// @desc    Delete rental request (Admin)
// @access  Private (Admin)
router.delete('/:id', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  deleteRentalRequest
);

// @route   POST /api/admin/rental-requests/cleanup-orphaned
// @desc    Cleanup orphaned rental requests (Admin)
// @access  Private (Admin)
router.post('/cleanup-orphaned', 
  adminAuth, 
  checkAdminPermission('rentalManagement'),
  cleanupOrphanedRentalRequests
);

module.exports = router;
