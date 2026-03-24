const express = require('express');
const router = express.Router();
const {
  getUserSubscriptions,
  getAllSubscriptions,
  getActiveSubscription,
  cancelSubscription,
  updateSubscriptionCounters,
  updateSubscription,
  getSubscriptionById,
  deleteSubscription
} = require('../controllers/subscriptionController');

// @route   GET /api/subscription/user/:userId
// @desc    Get user subscriptions
// @access  Public
router.get('/user/:userId', getUserSubscriptions);

// @route   GET /api/subscription/active/:userId
// @desc    Get active subscription for user
// @access  Public
router.get('/active/:userId', getActiveSubscription);

// @route   GET /api/subscription/all
// @desc    Get all subscriptions (for admin)
// @access  Public
router.get('/all', getAllSubscriptions);

// @route   PUT /api/subscription/cancel/:subscriptionId
// @desc    Cancel subscription
// @access  Public
router.put('/cancel/:subscriptionId', cancelSubscription);

// @route   PUT /api/subscription/update-counters/:userId
// @desc    Update subscription counters (listings)
// @access  Public
router.put('/update-counters/:userId', updateSubscriptionCounters);

// @route   PUT /api/subscription/:subscriptionId
// @desc    Update subscription (admin)
// @access  Public
router.put('/:subscriptionId', updateSubscription);

// @route   DELETE /api/subscription/:subscriptionId
// @desc    Delete subscription (admin)
// @access  Public
router.delete('/:subscriptionId', deleteSubscription);

// @route   GET /api/subscription/:subscriptionId
// @desc    Get subscription by ID
// @access  Public
router.get('/:subscriptionId', getSubscriptionById);

module.exports = router;
