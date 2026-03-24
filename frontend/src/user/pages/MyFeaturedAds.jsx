import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useBoost } from '../../contexts/BoostContext';
import apiService from '../../services/api';
import {
  Star,
  TrendingUp,
  Package,
  Plus,
  Zap,
  ArrowLeft,
  BadgeCheck,
  Clock
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ImageCarousel from '../../components/common/ImageCarousel';

const MyFeaturedAds = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    userSubscription,
    subscriptionPlans,
    hasActiveSubscription,
    getRemainingListings,
    loadUserSubscription,
    loading: subscriptionLoading
  } = useSubscription();
  const { boostCredits, loading: boostLoading, forceReloadBoostCredits } = useBoost();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rentalListings, setRentalListings] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(false);

  // Store loadUserSubscription function reference to avoid dependency issues
  const loadUserSubscriptionRef = useRef(loadUserSubscription);
  loadUserSubscriptionRef.current = loadUserSubscription;

  // Load subscription and rental data when component mounts or when location changes
  useEffect(() => {
    console.log('MyFeaturedAds - User data:', user);

    // CRITICAL: Force reload boost credits from API to ensure fresh data
    if (user?.id || user?._id) {
      console.log('🔄 MyFeaturedAds: Force reloading boost credits from API...');
      if (forceReloadBoostCredits) {
        forceReloadBoostCredits();
      }
    }

    // Fetch user's rental listings
    const fetchRentalListings = async () => {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        console.log('No token or user found, skipping rental listings fetch');
        return;
      }

      setLoadingRentals(true);
      try {
        const response = await apiService.getUserRentalListings();
        if (response.success) {
          setRentalListings(response.data.requests || []);
        } else {
          console.error('API returned success: false', response);
        }
      } catch (error) {
        console.error('Error fetching rental listings:', error);
      } finally {
        setLoadingRentals(false);
      }
    };

    if (user) {
      // Load subscription data
      if (user?.id || user?._id) {
        const userId = user.id || user._id;
        console.log('MyFeaturedAds - Loading subscription for userId:', userId);
        loadUserSubscriptionRef.current(userId);
      }
      // Load rental listings
      fetchRentalListings();
    } else {
      console.log('MyFeaturedAds - No user ID found');
    }
  }, [user?.id, user?._id, location.pathname]);

  // Use real subscription data
  const effectiveUserSubscription = userSubscription;

  // Get current subscription plan
  const currentPlan = subscriptionPlans.find(p => p.id === effectiveUserSubscription?.planId);

  // Calculate remaining available Post Ads from all sources
  const calculateRemainingAvailable = () => {
    let remainingPostAds = 0;

    // Handle real subscription data
    if (effectiveUserSubscription && effectiveUserSubscription.status === 'active') {
      const plan = subscriptionPlans.find(p => p.id === effectiveUserSubscription.planId);
      if (plan) {
        // Calculate remaining Post Ads
        const currentListings = effectiveUserSubscription.currentListings || 0;
        const maxListings = plan.maxListings === -1 ? Infinity : plan.maxListings;
        remainingPostAds += Math.max(0, maxListings - currentListings);
      } else {
        // Fallback for custom plans (like new_user_default)
        const currentListings = effectiveUserSubscription.currentListings || 0;
        const maxListings = effectiveUserSubscription.maxListings || 0;
        remainingPostAds += Math.max(0, maxListings - currentListings);
      }
    } else if (!effectiveUserSubscription && !subscriptionLoading) {
      // If no subscription data and not loading, assume new user with 2 free post ads
      // This is a fallback for cases where subscription data hasn't loaded yet
      console.log('No subscription data found, assuming new user with 2 free post ads');
      remainingPostAds = 2; // Default for new users
    }

    // From referrals (mock data for now - replace with actual referral system)
    const referralBenefits = user?.referralBenefits || {
      postAds: 0
    };

    remainingPostAds += referralBenefits.postAds || 0;

    // From other sources (promotional offers, etc.)
    const promotionalBenefits = user?.promotionalBenefits || {
      postAds: 0
    };

    remainingPostAds += promotionalBenefits.postAds || 0;

    return {
      remainingPostAds: remainingPostAds === Infinity ? '∞' : remainingPostAds
    };
  };

  const remainingAvailable = calculateRemainingAvailable();

  // Calculate stats
  const calculatePostAdsStats = () => {
    if (effectiveUserSubscription && effectiveUserSubscription.status === 'active') {
      const plan = subscriptionPlans.find(p => p.id === effectiveUserSubscription.planId);
      if (plan) {
        const usedPostAds = effectiveUserSubscription.currentListings || 0;
        const totalPostAds = plan.maxListings === -1 ? Infinity : plan.maxListings;
        const remainingPostAds = totalPostAds === Infinity ? Infinity : Math.max(0, totalPostAds - usedPostAds);

        return {
          usedPostAds,
          totalPostAds,
          remainingPostAds
        };
      } else {
        // Fallback for custom plans
        const usedPostAds = effectiveUserSubscription.currentListings || 0;
        const totalPostAds = effectiveUserSubscription.maxListings || 0;
        const remainingPostAds = Math.max(0, totalPostAds - usedPostAds);

        return {
          usedPostAds,
          totalPostAds,
          remainingPostAds
        };
      }
    } else {
      // No active subscription but not loading - might be a new user with default credits
      if (!subscriptionLoading) {
        // Show default 2 free post ads for new users
        return {
          usedPostAds: 0,
          totalPostAds: 2,
          remainingPostAds: 2
        };
      }
      // Still loading - show 0
      return {
        usedPostAds: 0,
        totalPostAds: 0,
        remainingPostAds: 0
      };
    }
  };

  const postAdsStats = calculatePostAdsStats();

  // CRITICAL: Validate and recalculate boost credits to prevent showing invalid values
  const validateBoostCredits = () => {
    // Recalculate remainingBoosts to ensure it's correct
    const calculatedRemaining = (boostCredits.freeBoosts || 0) +
      (boostCredits.purchasedBoosts || 0) -
      (boostCredits.usedBoosts || 0);

    // If remainingBoosts is invalid (NaN, negative, or extremely high), use calculated value
    let validRemainingBoosts = boostCredits.remainingBoosts;
    if (isNaN(validRemainingBoosts) ||
      validRemainingBoosts < 0 ||
      validRemainingBoosts > 10000 ||
      Math.abs(validRemainingBoosts - calculatedRemaining) > 10) {
      console.warn('⚠️ Invalid boost credits detected, using calculated value:', {
        stored: validRemainingBoosts,
        calculated: calculatedRemaining,
        boostCredits
      });
      validRemainingBoosts = Math.max(0, calculatedRemaining);
    }

    return {
      totalBoosts: (boostCredits.freeBoosts || 0) + (boostCredits.purchasedBoosts || 0),
      remainingBoosts: validRemainingBoosts,
      usedBoosts: boostCredits.usedBoosts || 0
    };
  };

  const validatedBoostStats = validateBoostCredits();

  const stats = {
    // Post Ads stats
    usedPostAds: postAdsStats.usedPostAds,
    totalPostAds: postAdsStats.totalPostAds,
    remainingPostAds: postAdsStats.remainingPostAds,
    // Boost stats from validated context
    totalBoosts: validatedBoostStats.totalBoosts,
    remainingBoosts: validatedBoostStats.remainingBoosts,
    usedBoosts: validatedBoostStats.usedBoosts
  };

  // Debug logging
  console.log('MyFeaturedAds Debug Info:', {
    userSubscription: effectiveUserSubscription,
    subscriptionLoading,
    currentPlan,
    remainingAvailable,
    postAdsStats,
    stats,
    user: user?.id || user?._id
  });

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state while subscription data is being fetched
  if (subscriptionLoading || boostLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/dashboard/account')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Featured Ads</h2>
              <p className="text-sm text-gray-600">Manage your Post-ads</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Post Ads Stats */}
          <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package size={20} />
                  <h3 className="font-bold text-lg">Post Ads</h3>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {stats.totalPostAds === Infinity ? '∞' : stats.totalPostAds}
                </div>
                <div className="text-sm opacity-90">
                  {effectiveUserSubscription && effectiveUserSubscription.status === 'active' ? (
                    <>
                      {stats.totalPostAds === Infinity ? (
                        'Unlimited'
                      ) : (
                        <>
                          {stats.remainingPostAds} remaining
                          {stats.usedPostAds > 0 && (
                            <div className="text-xs opacity-75 mt-1">
                              {stats.usedPostAds} used
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-xs opacity-75">
                      {stats.remainingPostAds > 0 ?
                        `${stats.remainingPostAds} from referrals & offers` :
                        'No active subscription'
                      }
                    </div>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>
          </Card>

          {/* Boost Stats */}
          <Card className={`p-4 text-white ${stats.remainingBoosts === 0
              ? 'bg-gradient-to-br from-red-500 to-red-600'
              : stats.remainingBoosts <= 1
                ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                : 'bg-gradient-to-br from-purple-500 to-pink-600'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={20} />
                  <h3 className="font-bold text-lg">Boost</h3>
                  {stats.remainingBoosts === 0 && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">No Credits</span>
                  )}
                  {stats.remainingBoosts === 1 && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Low Credits</span>
                  )}
                </div>
                <div className="text-2xl font-bold mb-1">{stats.remainingBoosts}</div>
                <div className="text-sm opacity-90">
                  {stats.remainingBoosts > 0 ? `${stats.remainingBoosts} remaining` : 'No boosts left'}
                </div>
                {stats.usedBoosts > 0 && (
                  <div className="text-xs opacity-75 mt-1">
                    {stats.usedBoosts} used
                  </div>
                )}
                {stats.remainingBoosts === 0 && (
                  <div className="text-xs opacity-90 mt-2">
                    <button
                      onClick={() => navigate('/buy-boost')}
                      className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                    >
                      Buy More
                    </button>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Products Listing Section */}
        {loadingRentals ? (
          <Card className="p-8 md:p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your listings...</p>
          </Card>
        ) : rentalListings.length === 0 ? (
          <Card className="p-8 md:p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg md:text-xl font-bold mb-2">No Post Ads yet</h3>
            <p className="text-sm text-gray-600 mb-6">Subscribe to start posting your rental ads</p>
            <Button onClick={() => navigate('/subscription')}>
              Subscribe Now
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rentalListings.map((listing) => (
                <Card key={listing._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Status Badge */}
                  <div className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${listing.status === 'approved' ? 'bg-green-500 text-white' :
                      listing.status === 'pending' ? 'bg-yellow-500 text-white' :
                        listing.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-500 text-white'
                    }`}>
                    {listing.status === 'approved' && <BadgeCheck size={14} />}
                    {listing.status === 'pending' && <Clock size={14} />}
                    {listing.status?.toUpperCase() || 'UNKNOWN'}
                  </div>

                  <div className="relative h-32">
                    {listing.images && listing.images.length > 0 ? (
                      <ImageCarousel images={listing.images.map(img => img.url)} className="h-full" />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <Package size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-gray-900 mb-1 truncate">{listing.title}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-blue-600">
                        ₹{listing.price?.amount || listing.price?.pricePerDay}/day
                      </span>
                      <span className="text-xs text-gray-500">
                        {listing.location?.city || listing.location?.address}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* No Active Subscription Banner */}
            {stats.totalPostAds === 0 && (
              <Card className="mt-6 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl mb-2">Want to post more ads?</h3>
                    <p className="text-sm opacity-90">Subscribe now and boost your rental business!</p>
                  </div>
                  <Button
                    onClick={() => navigate('/subscription')}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Subscribe Now
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default MyFeaturedAds;