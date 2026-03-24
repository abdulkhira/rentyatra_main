const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  
  reviewText: {
    type: String,
    required: [true, 'Review text is required'],
    trim: true,
    minlength: [10, 'Review must be at least 10 characters long'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  
  rentalRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalRequest',
    default: null
  },
  
  // Review Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved'
  },
  
  // Moderation
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  moderatedAt: {
    type: Date,
    default: null
  },
  
  moderationReason: {
    type: String,
    default: null
  },
  
  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  notHelpfulVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // User who voted helpful/not helpful
  helpfulVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  notHelpfulVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Review metadata
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  // Response from owner
  ownerResponse: {
    text: {
      type: String,
      trim: true,
      maxlength: [500, 'Owner response cannot exceed 500 characters']
    },
    respondedAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Custom validation to ensure either product or rentalRequest is provided
reviewSchema.pre('validate', function(next) {
  if (!this.product && !this.rentalRequest) {
    return next(new Error('Either product or rentalRequest must be provided'));
  }
  if (this.product && this.rentalRequest) {
    return next(new Error('Cannot provide both product and rentalRequest'));
  }
  next();
});

// Indexes for better performance
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  const totalVotes = this.helpfulVotes + this.notHelpfulVotes;
  if (totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / totalVotes) * 100);
});

// Virtual for time ago
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
});

// Pre-save middleware to update product and user statistics
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Update product average rating and review count
      if (this.product) {
        await this.constructor.updateProductStats(this.product);
      }
      
      // Update rental request average rating and review count
      if (this.rentalRequest) {
        await this.constructor.updateRentalRequestStats(this.rentalRequest);
      }
      
      // Update user average rating and review count
      await this.constructor.updateUserStats(this.user);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }
  next();
});

// Pre-remove middleware to update statistics when review is deleted
reviewSchema.pre('remove', async function(next) {
  try {
    // Update product average rating and review count
    if (this.product) {
      await this.constructor.updateProductStats(this.product);
    }
    
    // Update rental request average rating and review count
    if (this.rentalRequest) {
      await this.constructor.updateRentalRequestStats(this.rentalRequest);
    }
    
    // Update user average rating and review count
    await this.constructor.updateUserStats(this.user);
  } catch (error) {
    console.error('Error updating stats on delete:', error);
  }
  next();
});

// Static method to update product statistics
reviewSchema.statics.updateProductStats = async function(productId) {
  const Product = mongoose.model('Product');
  
  const stats = await this.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const { averageRating, totalReviews, ratingDistribution } = stats[0];
    
    // Calculate rating distribution
    const distribution = {
      5: ratingDistribution.filter(r => r === 5).length,
      4: ratingDistribution.filter(r => r === 4).length,
      3: ratingDistribution.filter(r => r === 3).length,
      2: ratingDistribution.filter(r => r === 2).length,
      1: ratingDistribution.filter(r => r === 1).length
    };
    
    await Product.findByIdAndUpdate(productId, {
      $set: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        ratingDistribution: distribution
      }
    });
  } else {
    // No reviews, reset to default
    await Product.findByIdAndUpdate(productId, {
      $set: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    });
  }
};

// Static method to update rental request statistics
reviewSchema.statics.updateRentalRequestStats = async function(rentalRequestId) {
  const RentalRequest = mongoose.model('RentalRequest');
  
  const stats = await this.aggregate([
    { $match: { rentalRequest: mongoose.Types.ObjectId(rentalRequestId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const { averageRating, totalReviews, ratingDistribution } = stats[0];
    
    // Calculate rating distribution
    const distribution = {
      5: ratingDistribution.filter(r => r === 5).length,
      4: ratingDistribution.filter(r => r === 4).length,
      3: ratingDistribution.filter(r => r === 3).length,
      2: ratingDistribution.filter(r => r === 2).length,
      1: ratingDistribution.filter(r => r === 1).length
    };
    
    await RentalRequest.findByIdAndUpdate(rentalRequestId, {
      $set: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        ratingDistribution: distribution
      }
    });
  } else {
    // No reviews, reset to default
    await RentalRequest.findByIdAndUpdate(rentalRequestId, {
      $set: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    });
  }
};

// Static method to update user statistics
reviewSchema.statics.updateUserStats = async function(userId) {
  const User = mongoose.model('User');
  
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const { averageRating, totalReviews } = stats[0];
    
    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.averageRating': Math.round(averageRating * 10) / 10,
        'stats.totalReviews': totalReviews
      }
    });
  } else {
    // No reviews, reset to default
    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.averageRating': 0,
        'stats.totalReviews': 0
      }
    });
  }
};

// Static method to get reviews with pagination
reviewSchema.statics.getReviews = function(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    rating = null,
    status = 'approved'
  } = options;
  
  const query = { product: productId, status };
  
  if (rating) {
    query.rating = rating;
  }
  
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(query)
    .populate('user', 'name profileImage')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = function(productId) {
  return this.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: {
          $reduce: {
            input: '$ratingDistribution',
            initialValue: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $let: {
                    vars: { rating: '$$this' },
                    in: {
                      $cond: {
                        if: { $eq: ['$$rating', 5] },
                        then: { 5: { $add: ['$$value.5', 1] } },
                        else: {
                          $cond: {
                            if: { $eq: ['$$rating', 4] },
                            then: { 4: { $add: ['$$value.4', 1] } },
                            else: {
                              $cond: {
                                if: { $eq: ['$$rating', 3] },
                                then: { 3: { $add: ['$$value.3', 1] } },
                                else: {
                                  $cond: {
                                    if: { $eq: ['$$rating', 2] },
                                    then: { 2: { $add: ['$$value.2', 1] } },
                                    else: { 1: { $add: ['$$value.1', 1] } }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Method to vote helpful/not helpful
reviewSchema.methods.voteHelpful = async function(userId, isHelpful) {
  if (isHelpful) {
    // Remove from not helpful if exists
    if (this.notHelpfulVoters.includes(userId)) {
      this.notHelpfulVoters.pull(userId);
      this.notHelpfulVotes -= 1;
    }
    
    // Add to helpful if not already there
    if (!this.helpfulVoters.includes(userId)) {
      this.helpfulVoters.push(userId);
      this.helpfulVotes += 1;
    }
  } else {
    // Remove from helpful if exists
    if (this.helpfulVoters.includes(userId)) {
      this.helpfulVoters.pull(userId);
      this.helpfulVotes -= 1;
    }
    
    // Add to not helpful if not already there
    if (!this.notHelpfulVoters.includes(userId)) {
      this.notHelpfulVoters.push(userId);
      this.notHelpfulVotes += 1;
    }
  }
  
  return this.save();
};

// Method to remove vote
reviewSchema.methods.removeVote = async function(userId) {
  if (this.helpfulVoters.includes(userId)) {
    this.helpfulVoters.pull(userId);
    this.helpfulVotes -= 1;
  }
  
  if (this.notHelpfulVoters.includes(userId)) {
    this.notHelpfulVoters.pull(userId);
    this.notHelpfulVotes -= 1;
  }
  
  return this.save();
};

// Export the model
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
