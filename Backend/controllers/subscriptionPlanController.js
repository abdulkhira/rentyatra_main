const asyncHandler = require('express-async-handler');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// @desc    Get all subscription plans
// @route   GET /api/subscription-plans
// @access  Public
const getAllPlans = asyncHandler(async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    let query = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const plans = await SubscriptionPlan.find(query)
      .sort({ displayOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message
    });
  }
});

// @desc    Get subscription plan by ID
// @route   GET /api/subscription-plans/:planId
// @access  Public
const getPlanById = asyncHandler(async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await SubscriptionPlan.findOne({ planId });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plan',
      error: error.message
    });
  }
});

// @desc    Create new subscription plan
// @route   POST /api/subscription-plans
// @access  Public (should be protected with admin middleware)
const createPlan = asyncHandler(async (req, res) => {
  try {
    const {
      planId,
      name,
      price,
      duration,
      features,
      maxListings,
      maxPhotos,
      gradient,
      popular,
      isActive,
      displayOrder
    } = req.body;

    // Validate required fields
    if (!planId || !name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: planId, name, and price are required'
      });
    }

    // Check if planId already exists
    const existingPlan = await SubscriptionPlan.findOne({ planId });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan with this planId already exists'
      });
    }

    // Create new plan
    const plan = new SubscriptionPlan({
      planId,
      name,
      price,
      duration: duration || 30,
      features: features || [],
      maxListings: maxListings || 0,
      maxPhotos: maxPhotos || 0,
      gradient: gradient || 'from-gray-400 to-gray-500',
      popular: popular || false,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0
    });

    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription plan',
      error: error.message
    });
  }
});

// @desc    Update subscription plan
// @route   PUT /api/subscription-plans/:planId
// @access  Public (should be protected with admin middleware)
const updatePlan = asyncHandler(async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    // Find the plan
    const plan = await SubscriptionPlan.findOne({ planId });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'name',
      'price',
      'duration',
      'features',
      'maxListings',
      'maxPhotos',
      'gradient',
      'popular',
      'isActive',
      'displayOrder'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        plan[field] = updateData[field];
      }
    });

    await plan.save();

    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription plan',
      error: error.message
    });
  }
});

// @desc    Delete subscription plan
// @route   DELETE /api/subscription-plans/:planId
// @access  Public (should be protected with admin middleware)
const deletePlan = asyncHandler(async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await SubscriptionPlan.findOneAndDelete({ planId });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription plan',
      error: error.message
    });
  }
});

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};

