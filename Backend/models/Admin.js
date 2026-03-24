const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // Admin Role and Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  
  permissions: {
    userManagement: {
      type: Boolean,
      default: true
    },
    productManagement: {
      type: Boolean,
      default: true
    },
    orderManagement: {
      type: Boolean,
      default: true
    },
    rentalManagement: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: true
    },
    settings: {
      type: Boolean,
      default: false
    },
    systemSettings: {
      type: Boolean,
      default: false
    }
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number']
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Security
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date,
    default: null
  },
  
  // Admin-specific fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Admin statistics
  stats: {
    totalLogins: {
      type: Number,
      default: 0
    },
    lastLoginIP: {
      type: String,
      default: null
    },
    actionsPerformed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
// email index automatically created by unique: true
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to format phone number
adminSchema.pre('save', function(next) {
  if (this.isModified('phone') && this.phone) {
    // Remove any non-digit characters
    const digits = this.phone.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 prefix
    if (digits.length === 10) {
      this.phone = `+91${digits}`;
    }
  }
  next();
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
adminSchema.methods.incLoginAttempts = function() {
  const now = Date.now();

  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < now) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const currentAttempts = typeof this.loginAttempts === 'number' ? this.loginAttempts : 0;
  const nextAttempts = currentAttempts + 1;

  const updates = {
    $set: { loginAttempts: nextAttempts }
  };

  // Lock account after 5 failed attempts for 2 hours
  if (nextAttempts >= 5 && !this.isLocked) {
    updates.$set.lockUntil = new Date(now + 2 * 60 * 60 * 1000); // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method to update last login
adminSchema.methods.updateLastLogin = function(ipAddress = null) {
  this.stats.lastLoginAt = new Date();
  this.stats.totalLogins += 1;
  if (ipAddress) {
    this.stats.lastLoginIP = ipAddress;
  }
  this.lastActivity = new Date();
  return this.save();
};

// Method to increment actions performed
adminSchema.methods.incrementActions = function() {
  this.stats.actionsPerformed += 1;
  this.lastActivity = new Date();
  return this.save();
};

// Static method to find admin by email
adminSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get admin statistics
adminSchema.statics.getAdminStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalAdmins: { $sum: 1 },
        activeAdmins: { $sum: { $cond: ['$isActive', 1, 0] } },
        superAdmins: { $sum: { $cond: [{ $eq: ['$role', 'super_admin'] }, 1, 0] } },
        admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
        moderators: { $sum: { $cond: [{ $eq: ['$role', 'moderator'] }, 1, 0] } }
      }
    }
  ]);
};

// Export the model
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
