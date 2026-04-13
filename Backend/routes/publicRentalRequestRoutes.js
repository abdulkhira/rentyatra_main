const express = require('express');
const router = express.Router();
const {
  getPublicRentalRequests,
  getPublicRentalRequest,
  getFeaturedRentalRequests,
  createRentalRequest,
  getUserRentalRequests,
  updateRentalRequest,
  boostRentalRequest
} = require('../controllers/publicRentalRequestController');

const { protect } = require('../middleware/auth');
const { uploadRentalRequest } = require('../config/cloudinary');

// @route   GET /api/rental-requests
// @desc    Get all public approved rental requests
// @access  Public
router.get('/', getPublicRentalRequests);

// @route   POST /api/rental-requests
// @desc    Create rental request (for users)
// @access  Private (User)
router.post('/',
  protect,
  uploadRentalRequest.none(),
  createRentalRequest
);

// @route   GET /api/rental-requests/featured
// @desc    Get featured rental requests for homepage
// @access  Public
router.get('/featured', getFeaturedRentalRequests);

// @route   GET /api/rental-requests/my-requests
// @desc    Get user's own rental requests
// @access  Private (User)
router.get('/my-requests', protect, getUserRentalRequests);

// @route   PUT /api/rental-requests/:id
// @desc    Update user's own rental request
// @access  Private (User)
router.put('/:id', protect, updateRentalRequest);

// @route   POST /api/rental-requests/:id/boost
// @desc    Boost a rental request
// @access  Private (User)
router.post('/:id/boost', protect, boostRentalRequest);

// @route   GET /api/rental-requests/:id
// @desc    Get single public rental request
// @access  Public
router.get('/:id', getPublicRentalRequest);

module.exports = router;
