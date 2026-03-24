const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const RentalRequest = require('../models/RentalRequest');

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      rating = null
    } = req.query;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get reviews with pagination
    const reviews = await Review.find({
      product: productId,
      status: 'approved',
      ...(rating && { rating: parseInt(rating) })
    })
      .populate('user', 'name profileImage')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get review statistics
    const stats = await Review.aggregate([
      { $match: { product: productId, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const reviewStats = stats.length > 0 ? stats[0] : {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: []
    };

    // Calculate rating distribution
    if (reviewStats.ratingDistribution && Array.isArray(reviewStats.ratingDistribution)) {
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewStats.ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
      reviewStats.ratingDistribution = distribution;
    } else {
      // If no reviews or ratingDistribution is not an array, set default distribution
      reviewStats.ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      product: productId,
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: reviewStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Get reviews for a rental request
const getRentalRequestReviews = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      rating = null
    } = req.query;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(rentalRequestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rental request ID format'
      });
    }

    // Validate rental request exists
    const rentalRequest = await RentalRequest.findById(rentalRequestId);
    if (!rentalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Rental request not found'
      });
    }

    // Get reviews with pagination
    const reviews = await Review.find({
      rentalRequest: rentalRequestId,
      status: 'approved',
      ...(rating && { rating: parseInt(rating) })
    })
      .populate('user', 'name profileImage')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get review statistics
    const stats = await Review.aggregate([
      { $match: { rentalRequest: rentalRequestId, status: 'approved' } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const reviewStats = stats.length > 0 ? stats[0] : {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: []
    };

    // Calculate rating distribution
    if (reviewStats.ratingDistribution && Array.isArray(reviewStats.ratingDistribution)) {
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviewStats.ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
      reviewStats.ratingDistribution = distribution;
    } else {
      // If no reviews or ratingDistribution is not an array, set default distribution
      reviewStats.ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({
      rentalRequest: rentalRequestId,
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: reviewStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching rental request reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Create a new review
const createReview = async (req, res) => {
  try {
    const { productId, rentalRequestId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Rating and review text are required'
      });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number between 1 and 5'
      });
    }

    if (reviewText.length < 10 || reviewText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Review text must be between 10 and 1000 characters'
      });
    }

    // Allow multiple reviews from the same user for the same item

    // Validate product or rental request exists
    let targetExists = false;
    if (productId) {
      const product = await Product.findById(productId);
      targetExists = !!product;
    } else if (rentalRequestId) {
      const rentalRequest = await RentalRequest.findById(rentalRequestId);
      targetExists = !!rentalRequest;
    }

    if (!targetExists) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Create review
    const reviewData = {
      rating,
      reviewText,
      user: userId,
      status: 'approved' // Auto-approve for now, can be changed to 'pending' for moderation
    };

    if (productId) {
      reviewData.product = productId;
    } else if (rentalRequestId) {
      reviewData.rentalRequest = rentalRequestId;
    }

    const review = new Review(reviewData);
    await review.save();

    // Populate user data for response
    await review.populate('user', 'name profileImage');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.userId;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Validate input
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be a whole number between 1 and 5'
        });
      }
      review.rating = rating;
    }

    if (reviewText !== undefined) {
      if (reviewText.length < 10 || reviewText.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Review text must be between 10 and 1000 characters'
        });
      }
      review.reviewText = reviewText;
    }

    await review.save();
    await review.populate('user', 'name profileImage');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Vote helpful/not helpful
const voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    const userId = req.user.userId;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is trying to vote on their own review
    if (review.user.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own review'
      });
    }

    await review.voteHelpful(userId, isHelpful);

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulVotes: review.helpfulVotes,
        notHelpfulVotes: review.notHelpfulVotes,
        helpfulPercentage: review.helpfulPercentage
      }
    });
  } catch (error) {
    console.error('Error voting on review:', error);
    res.status(500).json({
      success: false,
      message: 'Error voting on review',
      error: error.message
    });
  }
};

// Remove vote
const removeVote = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.removeVote(userId);

    res.status(200).json({
      success: true,
      message: 'Vote removed successfully',
      data: {
        helpfulVotes: review.helpfulVotes,
        notHelpfulVotes: review.notHelpfulVotes,
        helpfulPercentage: review.helpfulPercentage
      }
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing vote',
      error: error.message
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Get reviews
    const reviews = await Review.find({
      user: userId,
      status: 'approved'
    })
      .populate('product', 'name images')
      .populate('rentalRequest', 'title images')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const totalReviews = await Review.countDocuments({
      user: userId,
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: page * limit < totalReviews,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
};

// Get review statistics for a product
const getProductReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const stats = await Review.getReviewStats(productId);
    const reviewStats = stats.length > 0 ? stats[0] : {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    res.status(200).json({
      success: true,
      data: reviewStats
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};

module.exports = {
  getProductReviews,
  getRentalRequestReviews,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  removeVote,
  getUserReviews,
  getProductReviewStats
};
