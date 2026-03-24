const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getRentalRequestReviews,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  removeVote,
  getUserReviews,
  getProductReviewStats
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/product/:productId', getProductReviews);
router.get('/product/:productId/stats', getProductReviewStats);
router.get('/rental-request/:rentalRequestId', getRentalRequestReviews);
router.get('/user/:userId', getUserReviews);

// Protected routes (authentication required)
router.post('/product/:productId', protect, createReview);
router.post('/rental-request/:rentalRequestId', protect, createReview);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);
router.post('/:reviewId/vote', protect, voteReview);
router.delete('/:reviewId/vote', protect, removeVote);

module.exports = router;
