import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';
import StarRating from '../common/StarRating';
import apiService from '../../services/api';

const ReviewsSection = ({ itemId, isRentalRequest = false }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // Removed userHasReviewed state to allow multiple reviews

  // Fetch reviews and stats
  const fetchReviews = async (page = 1, reset = false) => {
    if (!itemId) {
      console.warn('No itemId provided to ReviewsSection');
      return;
    }
    
    try {
      setLoading(true);
      const response = isRentalRequest 
        ? await apiService.getRentalRequestReviews(itemId, { page, limit: 5 })
        : await apiService.getProductReviews(itemId, { page, limit: 5 });
      
      if (response.success) {
        if (reset) {
          setReviews(response.data.reviews);
        } else {
          setReviews(prev => [...prev, ...response.data.reviews]);
        }
        setStats(response.data.stats);
        setHasMore(response.data.pagination.hasNext);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Set default stats if there's an error
      setStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user votes for reviews
  const fetchUserVotes = async () => {
    if (!isAuthenticated) return;
    
    try {
      // This would be implemented based on your API structure
      // For now, we'll use localStorage to track votes
      const savedVotes = localStorage.getItem(`reviewVotes_${itemId}`);
      if (savedVotes) {
        setUserVotes(JSON.parse(savedVotes));
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  useEffect(() => {
    fetchReviews(1, true);
    fetchUserVotes();
  }, [itemId, isRentalRequest]);

  // Handle vote on review
  const handleVote = async (reviewId, isHelpful) => {
    if (!isAuthenticated) {
      alert('Please login to vote on reviews');
      return;
    }

    try {
      const response = await apiService.voteReview(reviewId, isHelpful);

      if (response.success) {
        // Update local state
        setUserVotes(prev => ({
          ...prev,
          [reviewId]: isHelpful
        }));

        // Save to localStorage
        const newVotes = { ...userVotes, [reviewId]: isHelpful };
        localStorage.setItem(`reviewVotes_${itemId}`, JSON.stringify(newVotes));

        // Refresh reviews to get updated vote counts
        fetchReviews(1, true);
      }
    } catch (error) {
      console.error('Error voting on review:', error);
      alert('Error voting on review');
    }
  };

  // Handle remove vote
  const handleRemoveVote = async (reviewId) => {
    if (!isAuthenticated) return;

    try {
      const response = await apiService.removeVote(reviewId);

      if (response.success) {
        // Update local state
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[reviewId];
          return newVotes;
        });

        // Save to localStorage
        const newVotes = { ...userVotes };
        delete newVotes[reviewId];
        localStorage.setItem(`reviewVotes_${itemId}`, JSON.stringify(newVotes));

        // Refresh reviews to get updated vote counts
        fetchReviews(1, true);
      }
    } catch (error) {
      console.error('Error removing vote:', error);
    }
  };

  // Load more reviews
  const loadMoreReviews = () => {
    fetchReviews(currentPage + 1, false);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  // Get user initials
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate percentage for rating distribution
  const getRatingPercentage = (count) => {
    if (stats.totalReviews === 0) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  if (loading && reviews.length === 0) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <div className="flex flex-col">
                  <StarRating rating={stats.averageRating} size={20} />
                  <span className="text-sm text-gray-600">
                    Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {isAuthenticated && (
            <Button
              icon={MessageCircle}
              onClick={() => setShowWriteReview(true)}
              className="mt-4 md:mt-0"
            >
              Write a Review
            </Button>
          )}
        </div>

        {/* Rating Distribution */}
        {stats.totalReviews > 0 && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getRatingPercentage(stats.ratingDistribution[rating])}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {stats.ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Write Review Form */}
      {showWriteReview && (
        <Card className="p-4 md:p-6">
          <ReviewForm
            itemId={itemId}
            isRentalRequest={isRentalRequest}
            onClose={() => setShowWriteReview(false)}
            onSuccess={() => {
              setShowWriteReview(false);
              fetchReviews(1, true);
            }}
          />
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                {/* User Avatar */}
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base flex-shrink-0">
                  {review.user.profileImage ? (
                    <img
                      src={review.user.profileImage}
                      alt={review.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getUserInitials(review.user.name)
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.user.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size={16} />
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-3">
                    {review.reviewText}
                  </p>

                  {/* Helpful Votes */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">Was this review helpful?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (userVotes[review._id] === true) {
                            handleRemoveVote(review._id);
                          } else {
                            handleVote(review._id, true);
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                          userVotes[review._id] === true
                            ? 'bg-green-100 text-green-700'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <ThumbsUp size={14} />
                        <span>{review.helpfulVotes}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (userVotes[review._id] === false) {
                            handleRemoveVote(review._id);
                          } else {
                            handleVote(review._id, false);
                          }
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                          userVotes[review._id] === false
                            ? 'bg-red-100 text-red-700'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <ThumbsDown size={14} />
                        <span>{review.notHelpfulVotes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button
                onClick={loadMoreReviews}
                disabled={loading}
                variant="outline"
                className="w-full md:w-auto"
              >
                {loading ? 'Loading...' : 'Load More Reviews'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* No Reviews State */
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to review this item!
            </p>
            {isAuthenticated ? (
              <Button
                onClick={() => setShowWriteReview(true)}
                className="w-full md:w-auto"
              >
                Write First Review
              </Button>
            ) : (
              <p className="text-sm text-gray-500">
                Please login to write a review
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

// Review Form Component
const ReviewForm = ({ itemId, isRentalRequest, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (reviewText.length < 10) {
      alert('Review must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const response = isRentalRequest 
        ? await apiService.createRentalRequestReview(itemId, { rating, reviewText })
        : await apiService.createProductReview(itemId, { rating, reviewText });

      if (response.success) {
        onSuccess();
        setRating(0);
        setReviewText('');
      } else {
        alert(response.message || 'Error submitting review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('Invalid or expired OTP')) {
        alert('Please log in again to submit a review.');
      } else {
        alert('Error submitting review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Write Your Review</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  size={24}
                  className={`${
                    star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this item... (minimum 10 characters)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {reviewText.length} characters
            </span>
            <span className="text-xs text-gray-500">
              {reviewText.length < 10 ? `${10 - reviewText.length} more required` : ''}
            </span>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting || rating === 0 || reviewText.length < 10}
            className="flex-1"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReviewsSection;