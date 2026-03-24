const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/subscriptionPlanController');

// @route   GET /api/subscription-plans
// @desc    Get all subscription plans
// @access  Public
router.get('/', getAllPlans);

// @route   GET /api/subscription-plans/:planId
// @desc    Get subscription plan by ID
// @access  Public
router.get('/:planId', getPlanById);

// @route   POST /api/subscription-plans
// @desc    Create new subscription plan
// @access  Public (should be protected with admin middleware)
router.post('/', createPlan);

// @route   PUT /api/subscription-plans/:planId
// @desc    Update subscription plan
// @access  Public (should be protected with admin middleware)
router.put('/:planId', updatePlan);

// @route   DELETE /api/subscription-plans/:planId
// @desc    Delete subscription plan
// @access  Public (should be protected with admin middleware)
router.delete('/:planId', deletePlan);


module.exports = router;

