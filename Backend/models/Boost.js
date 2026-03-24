const mongoose = require('mongoose');

const boostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rentalRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalRequest',
    required: true
  },
  boostType: {
    type: String,
    enum: ['boost-1', 'boost-3', 'boost-7'],
    required: true
  },
  boostName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  durationHours: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
  },
  features: [{
    type: String
  }],
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

// Index for efficient queries
boostSchema.index({ user: 1, status: 1 });
boostSchema.index({ rentalRequest: 1, status: 1 });
boostSchema.index({ endDate: 1 });

// Method to check if boost is active
boostSchema.methods.isActive = function() {
  return this.status === 'active' && this.endDate > new Date();
};

// Method to calculate remaining time
boostSchema.methods.getRemainingTime = function() {
  if (!this.isActive()) return 0;
  return Math.max(0, this.endDate - new Date());
};

module.exports = mongoose.model('Boost', boostSchema);
