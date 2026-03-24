const asyncHandler = require('express-async-handler');
const Subscription = require('../models/Subscription');

// @desc    Get user subscriptions
// @route   GET /api/subscription/user/:userId
// @access  Public
const getUserSubscriptions = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    const subscriptions = await Subscription.find({ userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});

// @desc    Get all subscriptions (for admin)
// @route   GET /api/subscription/all
// @access  Public
const getAllSubscriptions = asyncHandler(async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});


// @desc    Get active subscription for user
// @route   GET /api/subscription/active/:userId
// @access  Public
const getActiveSubscription = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    // Reduced logging - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching active subscription for userId:', userId);
    }

    // Validate userId is a valid ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        error: 'User ID must be a valid MongoDB ObjectId'
      });
    }

    let subscription = null;
    try {
      subscription = await Subscription.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        endDate: { $gt: new Date() }
      }).populate('userId', 'name email phone');

      // Reduced logging - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Found subscription:', subscription ? subscription._id : 'None');
      }
    } catch (queryError) {
      console.error('Error querying subscription:', queryError);
      throw queryError;
    }

    if (!subscription) {
      // Auto-provision default subscription for new users without any
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 365);

        const defaultSub = new Subscription({
          userId: new mongoose.Types.ObjectId(userId),
          planId: 'new_user_default',
          planName: 'New User Default',
          status: 'active',
          startDate,
          endDate,
          price: 0,
          paymentStatus: 'paid',
          paymentCompletedAt: new Date(),
          currentListings: 0,
          totalViews: 0,
          totalRevenue: 0,
          maxListings: 2,
          maxPhotos: 10
        });

        await defaultSub.save();
        subscription = await Subscription.findById(defaultSub._id).populate('userId', 'name email phone');
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Auto-provisioned default subscription for user', userId);
        }
      } catch (provErr) {
        console.error('❌ Failed to auto-provision default subscription:', {
          error: provErr.message,
          stack: provErr.stack,
          userId: userId
        });
        // Return null subscription instead of error - frontend will handle it
        return res.json({
          success: true,
          data: null,
          message: 'No active subscription found'
        });
      }
    }

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('❌ Error fetching active subscription:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Cancel subscription
// @route   PUT /api/subscription/cancel/:subscriptionId
// @access  Public
const cancelSubscription = asyncHandler(async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

// @desc  Update subscription counters (listings)
// @route PUT /api/subscription/update-counters/:userId
// @access  Public
const updateSubscriptionCounters = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, action } = req.body; // type: 'listing', action: 'increment' or 'decrement'

    if (!type || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type and action'
      });
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Update counters based on type and action
    if (type === 'listing') {
      if (action === 'increment') {
        subscription.currentListings += 1;
      } else if (action === 'decrement') {
        subscription.currentListings = Math.max(0, subscription.currentListings - 1);
      }
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription counters updated successfully',
      data: {
        currentListings: subscription.currentListings
      }
    });

  } catch (error) {
    console.error('Error updating subscription counters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription counters',
      error: error.message
    });
  }
});

// @desc    Update subscription (admin)
// @route   PUT /api/subscription/:subscriptionId
// @access  Public
const updateSubscription = asyncHandler(async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const updateData = req.body;

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update allowed fields
    const allowedFields = ['maxListings', 'currentListings', 'status', 'endDate', 'startDate', 'paymentStatus', 'paymentCompletedAt', 'price'];
    const updates = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    });

    // Update the subscription
    Object.assign(subscription, updates);
    await subscription.save();

    // Populate user data for response
    await subscription.populate('userId', 'name email phone');

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
});

// @desc Get subscription by ID
// @route GET /api/subscription/:subscriptionId
// @access  Public
const getSubscriptionById = asyncHandler(async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId)
      .populate('userId', 'name email phone');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
});

module.exports = {
  getUserSubscriptions,
  getAllSubscriptions,
  getActiveSubscription,
  cancelSubscription,
  updateSubscriptionCounters,
  updateSubscription,
  getSubscriptionById
};

// --- Admin: Delete subscription ---
// @desc    Delete subscription by ID
// @route   DELETE /api/subscription/:subscriptionId
// @access  Public (consider protecting with admin middleware later)
module.exports.deleteSubscription = asyncHandler(async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const deleted = await Subscription.findByIdAndDelete(subscriptionId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subscription', error: error.message });
  }
});
