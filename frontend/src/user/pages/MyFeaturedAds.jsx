import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useBoost } from '../../contexts/BoostContext';
import apiService from '../../services/api';
import {
  TrendingUp,
  Package,
  Zap,
  ArrowLeft,
  BadgeCheck,
  Clock,
  PackageSearch,
  ChevronRight,
  ShieldAlert
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
    if (user?.id || user?._id) {
      if (forceReloadBoostCredits) {
        forceReloadBoostCredits();
      }
    }

    const fetchRentalListings = async () => {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      setLoadingRentals(true);
      try {
        const response = await apiService.getUserRentalListings();
        if (response.success) {
          setRentalListings(response.data.requests || []);
        }
      } catch (error) {
        console.error('Error fetching rental listings:', error);
      } finally {
        setLoadingRentals(false);
      }
    };

    if (user) {
      if (user?.id || user?._id) {
        const userId = user.id || user._id;
        loadUserSubscriptionRef.current(userId);
      }
      fetchRentalListings();
    }
  }, [user?.id, user?._id, location.pathname]);

  // Use real subscription data
  const effectiveUserSubscription = userSubscription;

  // Get current subscription plan
  const currentPlan = subscriptionPlans.find(p => p.id === effectiveUserSubscription?.planId);

  // Calculate remaining available Post Ads from all sources
  const calculateRemainingAvailable = () => {
    let remainingPostAds = 0;

    if (effectiveUserSubscription && effectiveUserSubscription.status === 'active') {
      const plan = subscriptionPlans.find(p => p.id === effectiveUserSubscription.planId);
      if (plan) {
        const currentListings = effectiveUserSubscription.currentListings || 0;
        const maxListings = plan.maxListings === -1 ? Infinity : plan.maxListings;
        remainingPostAds += Math.max(0, maxListings - currentListings);
      } else {
        const currentListings = effectiveUserSubscription.currentListings || 0;
        const maxListings = effectiveUserSubscription.maxListings || 0;
        remainingPostAds += Math.max(0, maxListings - currentListings);
      }
    } else if (!effectiveUserSubscription && !subscriptionLoading) {
      remainingPostAds = 2; // Default for new users
    }

    const referralBenefits = user?.referralBenefits || { postAds: 0 };
    remainingPostAds += referralBenefits.postAds || 0;

    const promotionalBenefits = user?.promotionalBenefits || { postAds: 0 };
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

        return { usedPostAds, totalPostAds, remainingPostAds };
      } else {
        const usedPostAds = effectiveUserSubscription.currentListings || 0;
        const totalPostAds = effectiveUserSubscription.maxListings || 0;
        const remainingPostAds = Math.max(0, totalPostAds - usedPostAds);

        return { usedPostAds, totalPostAds, remainingPostAds };
      }
    } else {
      if (!subscriptionLoading) {
        return { usedPostAds: 0, totalPostAds: 2, remainingPostAds: 2 };
      }
      return { usedPostAds: 0, totalPostAds: 0, remainingPostAds: 0 };
    }
  };

  const postAdsStats = calculatePostAdsStats();

  // Validate and recalculate boost credits
  const validateBoostCredits = () => {
    const calculatedRemaining = (boostCredits.freeBoosts || 0) +
      (boostCredits.purchasedBoosts || 0) -
      (boostCredits.usedBoosts || 0);

    let validRemainingBoosts = boostCredits.remainingBoosts;
    if (isNaN(validRemainingBoosts) ||
      validRemainingBoosts < 0 ||
      validRemainingBoosts > 10000 ||
      Math.abs(validRemainingBoosts - calculatedRemaining) > 10) {
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
    usedPostAds: postAdsStats.usedPostAds,
    totalPostAds: postAdsStats.totalPostAds,
    remainingPostAds: postAdsStats.remainingPostAds,
    totalBoosts: validatedBoostStats.totalBoosts,
    remainingBoosts: validatedBoostStats.remainingBoosts,
    usedBoosts: validatedBoostStats.usedBoosts
  };

  // Show loading state while subscription data is being fetched
  if (subscriptionLoading || boostLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center font-sans">
        <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full">
          <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
          <p className="text-gray-500 font-bold tracking-tight">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-6 md:py-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/account')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#fc8019] transition-colors shrink-0"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">My Featured Ads</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Manage Your Inventory</p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">

          {/* Post Ads Stats */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 z-0"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Package size={24} />
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                  <TrendingUp size={16} className="text-gray-400" />
                </div>
              </div>

              <h3 className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Post Ads Quota</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {stats.totalPostAds === Infinity ? '∞' : stats.totalPostAds}
                </span>
                <span className="text-sm font-bold text-gray-400">Total</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50">
                {effectiveUserSubscription && effectiveUserSubscription.status === 'active' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                      {stats.totalPostAds === Infinity ? 'Unlimited Available' : `${stats.remainingPostAds} Remaining`}
                    </span>
                    {stats.usedPostAds > 0 && (
                      <span className="text-xs font-bold text-gray-500">
                        {stats.usedPostAds} Used
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-gray-400" />
                    {stats.remainingPostAds > 0 ? `${stats.remainingPostAds} from offers` : 'No active subscription'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Boost Stats */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 z-0"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${stats.remainingBoosts === 0 ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-[#fc8019]'
                  }`}>
                  <Zap size={24} />
                </div>
                {stats.remainingBoosts <= 1 && (
                  <div className={`px-3 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${stats.remainingBoosts === 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-yellow-50 border-yellow-100 text-yellow-600'
                    }`}>
                    {stats.remainingBoosts === 0 ? 'No Credits' : 'Low Credits'}
                  </div>
                )}
              </div>

              <h3 className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Available Boosts</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {stats.remainingBoosts}
                </span>
                <span className="text-sm font-bold text-gray-400">Credits</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                {stats.usedBoosts > 0 ? (
                  <span className="text-xs font-bold text-gray-500">
                    {stats.usedBoosts} Previously Used
                  </span>
                ) : (
                  <span className="text-xs font-bold text-gray-500">Ready to use</span>
                )}

                {stats.remainingBoosts === 0 && (
                  <button
                    onClick={() => navigate('/buy-boost')}
                    className="text-xs font-extrabold text-white bg-gray-900 hover:bg-black px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Buy More
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Listing Section */}
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-6">Your Active Ads</h2>

          {loadingRentals ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
              <p className="text-gray-500 font-bold">Loading your listings...</p>
            </div>
          ) : rentalListings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm border-dashed">
              <div className="w-20 h-20 mx-auto mb-5 bg-gray-50 rounded-full flex items-center justify-center">
                <PackageSearch size={36} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">No Ads Posted Yet</h3>
              <p className="text-gray-500 mb-8 font-medium">Get a subscription and start earning by renting out your items.</p>
              <Button
                onClick={() => navigate('/subscription')}
                className="bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold py-3 px-8 shadow-sm transition-colors"
              >
                Subscribe Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rentalListings.map((listing) => (
                <div key={listing._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 group flex flex-col">

                  {/* Status Badge Over Image */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 rounded-full shadow-sm backdrop-blur-md ${listing.status === 'approved' ? 'bg-green-500/90 text-white' :
                        listing.status === 'pending' ? 'bg-yellow-500/90 text-white' :
                          listing.status === 'rejected' ? 'bg-red-500/90 text-white' :
                            'bg-gray-500/90 text-white'
                      }`}>
                      {listing.status === 'approved' && <BadgeCheck size={12} />}
                      {listing.status === 'pending' && <Clock size={12} />}
                      {listing.status?.toUpperCase() || 'UNKNOWN'}
                    </div>
                  </div>

                  {/* Image Area */}
                  <div className="relative h-40 bg-gray-50">
                    {listing.images && listing.images.length > 0 ? (
                      <ImageCarousel images={listing.images.map(img => img.url)} className="h-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package size={32} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex flex-col flex-1">
                    <h4 className="font-extrabold text-gray-900 mb-1.5 truncate text-base group-hover:text-[#fc8019] transition-colors">{listing.title}</h4>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 font-medium leading-relaxed">{listing.description}</p>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                      <div>
                        <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                          ₹{listing.price?.amount || listing.price?.pricePerDay}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">/ day</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 truncate max-w-[100px]">
                        {listing.location?.city || listing.location?.address || 'Location'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* No Active Subscription Banner - Swiggy Style */}
        {stats.totalPostAds === 0 && rentalListings.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-extrabold text-xl mb-1 tracking-tight">Want to post more ads?</h3>
              <p className="text-sm font-medium text-gray-300">Unlock more inventory slots by subscribing to a premium plan.</p>
            </div>
            <button
              onClick={() => navigate('/subscription')}
              className="bg-[#fc8019] hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap shadow-sm shrink-0"
            >
              View Subscription Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFeaturedAds;