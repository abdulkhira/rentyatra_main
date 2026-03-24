const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: false, // Made optional for initial OTP sending
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: false, // Made optional for initial OTP sending
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },
  
  // Authentication
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user'
  },
  
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode']
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, 'Landmark cannot exceed 100 characters']
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isBlocked: {
    type: Boolean,
    default: false
  },
  
  // OTP and Verification
  otp: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  
  // FCM Token for push notifications (Web tokens)
  fcmTokens: {
    type: [String],
    default: [],
  },
  // FCM Token for Mobile/APK (Android/iOS)
  fcmTokenMobile: {
    type: [String],
    default: [],
  }, 
  
  // Persistent auth sessions (refresh tokens)
  authSessions: [
    {
      refreshToken: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
      deviceInfo: {
        type: String,
        default: null,
      },
      lastUsedAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
    }
  },
  
  // Rental-specific Statistics
  stats: {
    totalRentals: {
      type: Number,
      default: 0
    },
    completedRentals: {
      type: Number,
      default: 0
    },
    cancelledRentals: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    isFirstTimeUser: {
      type: Boolean,
      default: true
    },
    firstRentalDate: {
      type: Date,
      default: null
    },
    // Rating and reviews
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  
  // Rental-specific fields
  rentalProfile: {
    // For users who also rent out items
    isRenter: {
      type: Boolean,
      default: false
    },
    renterSince: {
      type: Date,
      default: null
    },
    itemsListed: {
      type: Number,
      default: 0
    },
    itemsActive: {
      type: Number,
      default: 0
    },
    // Verification documents
    documents: {
      aadhar: {
        number: String,
        frontImage: {
          url: String,
          publicId: String,
          uploadedAt: Date
        },
        backImage: {
          url: String,
          publicId: String,
          uploadedAt: Date
        },
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        rejectionReason: String
      },
      pan: {
        number: String,
        frontImage: {
          url: String,
          publicId: String,
          uploadedAt: Date
        },
        backImage: {
          url: String,
          publicId: String,
          uploadedAt: Date
        },
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
        rejectionReason: String
      }
    }
  },
  
  // Wallet for payments
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },

  // Boost Credits
  boostCredits: {
    freeBoosts: {
      type: Number,
      default: 2,
      min: 0
    },
    purchasedBoosts: {
      type: Number,
      default: 0,
      min: 0
    },
    usedBoosts: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingBoosts: {
      type: Number,
      default: 2,
      min: 0
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
// Note: email doesn't have unique constraint, but if it did, index would be auto-created
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'rentalProfile.isRenter': 1 });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address.street) return null;
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for formatted phone number
userSchema.virtual('formattedPhone').get(function() {
  if (!this.phone) return null;
  
  // Remove any non-digit characters and format as +91 XXXXXXXXXX
  const digits = this.phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  return this.phone;
});

// Pre-save middleware to format phone number
userSchema.pre('save', function(next) {
  if (this.isModified('phone')) {
    // Remove any non-digit characters
    const digits = this.phone.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 prefix
    if (digits.length === 10) {
      this.phone = `+91${digits}`;
    }
  }
  next();
});

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otpCode) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  if (new Date() > this.otp.expiresAt) {
    return false; // OTP expired
  }
  
  return this.otp.code === otpCode;
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = {
    code: null,
    expiresAt: null
  };
};

// Method to add auth session (refresh token)
userSchema.methods.addAuthSession = function(refreshToken, expiresAt, deviceInfo = null) {
  if (!refreshToken) {
    return;
  }

  this.authSessions = this.authSessions || [];
  this.authSessions.push({
    refreshToken,
    createdAt: new Date(),
    expiresAt,
    deviceInfo,
    lastUsedAt: new Date(),
  });

  // Keep only latest 10 sessions to prevent unbounded growth
  if (this.authSessions.length > 10) {
    this.authSessions = this.authSessions.slice(-10);
  }

  this.markModified('authSessions');
};

// Method to remove auth session
userSchema.methods.removeAuthSession = function(refreshToken) {
  if (!refreshToken || !this.authSessions) return;

  this.authSessions = this.authSessions.filter(
    (session) => session.refreshToken !== refreshToken
  );

  this.markModified('authSessions');
};

// Method to clean expired auth sessions
userSchema.methods.cleanupExpiredSessions = function() {
  if (!this.authSessions || this.authSessions.length === 0) return;

  const now = new Date();
  this.authSessions = this.authSessions.filter(
    (session) => session.expiresAt && session.expiresAt > now
  );

  this.markModified('authSessions');
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.stats.lastLoginAt = new Date();
  return this.save();
};

// Method to increment rental stats
userSchema.methods.incrementRentalStats = function(status, amount = 0, isRenter = false) {
  this.stats.totalRentals += 1;
  
  if (status === 'completed') {
    this.stats.completedRentals += 1;
    if (isRenter) {
      this.stats.totalEarned += amount;
    } else {
      this.stats.totalSpent += amount;
    }
  } else if (status === 'cancelled') {
    this.stats.cancelledRentals += 1;
  }
  
  return this.save();
};

// Method to update rating
userSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.stats.averageRating * this.stats.totalReviews) + newRating;
  this.stats.totalReviews += 1;
  this.stats.averageRating = totalRating / this.stats.totalReviews;
  return this.save();
};

// Method to add wallet balance
userSchema.methods.addWalletBalance = function(amount) {
  this.wallet.balance += amount;
  return this.save();
};

// Method to deduct wallet balance
userSchema.methods.deductWalletBalance = function(amount) {
  if (this.wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  this.wallet.balance -= amount;
  return this.save();
};

// Static method to find user by phone or email
userSchema.statics.findByPhoneOrEmail = function(identifier) {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  
  if (phoneRegex.test(identifier)) {
    // Format phone number
    const digits = identifier.replace(/\D/g, '');
    const formattedPhone = digits.length === 10 ? `+91${digits}` : identifier;
    return this.findOne({ phone: formattedPhone });
  } else if (emailRegex.test(identifier)) {
    return this.findOne({ email: identifier.toLowerCase() });
  }
  
  return null;
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isPhoneVerified', 1, 0] } },
        renters: { $sum: { $cond: ['$rentalProfile.isRenter', 1, 0] } },
        usersByRole: {
          $push: {
            role: '$role',
            isActive: '$isActive'
          }
        }
      }
    }
  ]);
};

// Export the model
const User = mongoose.model('User', userSchema);
module.exports = User;
