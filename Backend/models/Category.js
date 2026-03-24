const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Product Reference
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },

  // Category Information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters long'],
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },

  // Category Images
  images: {
    type: [{
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      isPrimary: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },

  // Category Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },

  // Admin Information
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Admin who added the category is required']
  },

  // Verification and Approval
  isVerified: {
    type: Boolean,
    default: true // Admin added categories are auto-verified
  },

  verifiedAt: {
    type: Date,
    default: Date.now
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ product: 1 });
categorySchema.index({ name: 'text' });
categorySchema.index({ status: 1 });
categorySchema.index({ addedBy: 1 });
categorySchema.index({ createdAt: -1 });

// Virtual for primary image
categorySchema.virtual('primaryImage').get(function() {
  const imageArray = Array.isArray(this.images) ? this.images : [];
  const primaryImg = imageArray.find(img => img && img.isPrimary);
  return primaryImg || imageArray[0] || null;
});

// Pre-save middleware to set primary image
categorySchema.pre('save', function(next) {
  if (this.images && Array.isArray(this.images) && this.images.length > 0) {
    // If no primary image is set, make the first one primary
    if (!this.images.some(img => img && img.isPrimary)) {
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Method to update status
categorySchema.methods.updateStatus = function(newStatus, adminId) {
  this.status = newStatus;

  if (newStatus === 'active' && !this.isVerified) {
    this.isVerified = true;
    this.verifiedAt = new Date();
    this.verifiedBy = adminId;
  }

  return this.save();
};

// Static method to search categories
categorySchema.statics.searchCategories = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    ...filters
  };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  return this.find(searchQuery)
    .populate('product', 'name images')
    .populate('addedBy', 'name email')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

// Static method to get category statistics
categorySchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        activeCategories: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        verifiedCategories: { $sum: { $cond: ['$isVerified', 1, 0] } }
      }
    }
  ]);
};

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
