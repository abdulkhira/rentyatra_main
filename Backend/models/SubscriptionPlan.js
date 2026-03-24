const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    default: 30,
    min: 1
  },
  features: {
    type: [String],
    required: true,
    default: []
  },
  maxListings: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  maxPhotos: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  gradient: {
    type: String,
    required: true,
    default: 'from-gray-400 to-gray-500'
  },
  popular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionPlanSchema.index({ planId: 1 });
subscriptionPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

