const mongoose = require('mongoose');

const boostPackageSchema = new mongoose.Schema({
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
  currency: {
    type: String,
    default: 'INR'
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
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentMethod: String,
    paymentDate: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  features: [{
    type: String
  }],
  // Track how many boosts have been used from this package
  usedBoosts: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBoosts: {
    type: Number,
    required: true,
    min: 0
  },
  // Package validity period
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  // Additional metadata
  metadata: {
    purchaseSource: {
      type: String,
      default: 'web'
    },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  _id: true // Ensure _id is properly handled
});

// Indexes for efficient queries
boostPackageSchema.index({ user: 1, status: 1 });
boostPackageSchema.index({ packageId: 1 });
boostPackageSchema.index({ paymentStatus: 1 });
boostPackageSchema.index({ validUntil: 1 });
boostPackageSchema.index({ createdAt: -1 });

// Virtual for checking if package is valid
boostPackageSchema.virtual('isValid').get(function() {
  return this.status === 'active' && this.validUntil > new Date();
});

// Virtual for checking if package has remaining boosts
boostPackageSchema.virtual('hasRemainingBoosts').get(function() {
  return this.remainingBoosts > 0 && this.isValid;
});

// Method to use a boost from this package
boostPackageSchema.methods.useBoost = function() {
  if (!this.hasRemainingBoosts) {
    throw new Error('No remaining boosts in this package');
  }
  
  this.usedBoosts += 1;
  this.remainingBoosts -= 1;
  
  return this.save();
};

// Method to check if package is expired
boostPackageSchema.methods.isExpired = function() {
  return this.validUntil <= new Date();
};

// Method to expire the package
boostPackageSchema.methods.expire = function() {
  this.status = 'expired';
  return this.save();
};

// Static method to get active packages for a user
boostPackageSchema.statics.getActivePackages = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    validUntil: { $gt: new Date() },
    remainingBoosts: { $gt: 0 }
  }).sort({ createdAt: -1 });
};

// Static method to get total remaining boosts for a user
boostPackageSchema.statics.getTotalRemainingBoosts = async function(userId) {
  const packages = await this.getActivePackages(userId);
  return packages.reduce((total, pkg) => total + pkg.remainingBoosts, 0);
};

// Pre-save middleware to update remaining boosts and ensure data integrity
boostPackageSchema.pre('save', function(next) {
  try {
    // Ensure _id is properly set
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    
    // Update remaining boosts if usedBoosts changed
    if (this.isModified('usedBoosts')) {
      this.remainingBoosts = this.boostCount - this.usedBoosts;
    }
    
    // Ensure remainingBoosts is not negative
    if (this.remainingBoosts < 0) {
      this.remainingBoosts = 0;
    }
    
    next();
  } catch (error) {
    console.error('Error in BoostPackage pre-save middleware:', error);
    next(error);
  }
});

module.exports = mongoose.model('BoostPackage', boostPackageSchema);