const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Product Information
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  
  // Product Images
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
  
  // Product Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  // Product Tags for categorization
  tags: {
    type: [String],
    default: []
  },
  
  // Admin Information
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Admin who added the product is required']
  },
  
  // Verification and Approval
  isVerified: {
    type: Boolean,
    default: true // Admin added products are auto-verified
  },
  
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Review Statistics
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  
  ratingDistribution: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ name: 'text' });
productSchema.index({ status: 1 });
productSchema.index({ addedBy: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const imageArray = Array.isArray(this.images) ? this.images : [];
  const primaryImg = imageArray.find(img => img && img.isPrimary);
  return primaryImg || imageArray[0] || null;
});

// Pre-save middleware to set primary image
productSchema.pre('save', function(next) {
  if (this.images && Array.isArray(this.images) && this.images.length > 0) {
    // If no primary image is set, make the first one primary
    const hasPrimary = this.images.some(img => img && img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Method to update status
productSchema.methods.updateStatus = function(newStatus, adminId) {
  this.status = newStatus;
  
  if (newStatus === 'active' && !this.isVerified) {
    this.isVerified = true;
    this.verifiedAt = new Date();
    this.verifiedBy = adminId;
  }
  
  return this.save();
};

// Static method to search products
productSchema.statics.searchProducts = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery)
    .populate('addedBy', 'name email')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

// Static method to get product statistics
productSchema.statics.getProductStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        verifiedProducts: { $sum: { $cond: ['$isVerified', 1, 0] } }
      }
    }
  ]);
};

// Export the model
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
