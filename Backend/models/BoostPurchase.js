const mongoose = require('mongoose');

const boostPurchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageId: {
    type: String,
    required: true
  },
  packageName: {
    type: String,
    required: true
  },
  boostCount: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Razorpay payment details
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  // Boost credits added to user
  creditsAdded: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Additional metadata
  source: {
    type: String,
    enum: ['web', 'mobile_apk'],
    default: 'web'
  },
  userAgent: String,
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
boostPurchaseSchema.index({ user: 1, status: 1 });
boostPurchaseSchema.index({ razorpayOrderId: 1 });
boostPurchaseSchema.index({ razorpayPaymentId: 1 });
boostPurchaseSchema.index({ paymentStatus: 1 });
boostPurchaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BoostPurchase', boostPurchaseSchema);

