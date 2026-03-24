const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserBoostCredits,
  getBoostPackages,
  getUserBoosts,
  getBoostStats,
  createBoostOrder,
  getRentalRequestBoosts,
  updateBoostPayment,
  cancelBoostOrder,
  syncBoostUsage,
  createBoostPaymentOrder,
  verifyBoostPayment
} = require('../controllers/boostController');

// Get boost packages (public route)
router.get('/packages', getBoostPackages);

// Get user boost credits
router.get('/credits', protect, getUserBoostCredits);

// Get user's boost orders
router.get('/user', protect, getUserBoosts);

// Get boost statistics
router.get('/stats', protect, getBoostStats);

// Create boost order
router.post('/create', protect, createBoostOrder);

// Create boost payment order
router.post('/create-payment-order', protect, createBoostPaymentOrder);

// Verify boost payment
router.post('/verify-payment', protect, verifyBoostPayment);

// Get boosts for a specific rental request
router.get('/rental/:rentalRequestId', getRentalRequestBoosts);

// Update boost payment status
router.patch('/:boostId/payment', protect, updateBoostPayment);

// Cancel boost order
router.delete('/:boostId', protect, cancelBoostOrder);

// Sync boost usage (for debugging)
router.post('/sync-usage', protect, syncBoostUsage);

module.exports = router;