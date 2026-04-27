import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Package, MessageCircle, User, Edit, Trash2, Calendar, Zap,
  CreditCard, Rocket, LogOut, MapPin, Eye, Menu, X, Home,
  Star, ShoppingCart,
  Mail, Info, FileText, Lock, ChevronRight, Shield, BadgeCheck, Clock, Save, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useBoost } from '../../contexts/BoostContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ImageCarousel from '../../components/common/ImageCarousel';
import BoostAnimation from '../../components/common/BoostAnimation';
import { useSubscription } from '../../contexts/SubscriptionContext';
import apiService from '../../services/api';

const Dashboard = () => {
  const { isAuthenticated, user, logout, loading: authLoading, updateUser } = useAuth();
  const { items, favorites, deleteItem } = useApp();
  const { boostCredits, hasBoostCredits, getBoostStatus, updateBoostCredits } = useBoost();

  // Safe subscription hook usage with error handling
  let subscriptionData = null;
  try {
    subscriptionData = useSubscription();
  } catch (error) {
    console.error('Subscription context error:', error);
    // Fallback values when subscription context is not available
    subscriptionData = {
      hasActiveSubscription: () => false,
      canAddProduct: () => false,
      getRemainingListings: () => 0,
      userSubscription: null,
      subscriptionPlans: []
    };
  }

  const { hasActiveSubscription, canAddProduct, getRemainingListings, userSubscription, subscriptionPlans, loadUserSubscription } = subscriptionData;
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile-menu');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rentalListings, setRentalListings] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    serviceRadius: ''
  });
  const [showBoostAnimation, setShowBoostAnimation] = useState(false);
  const [boostedRental, setBoostedRental] = useState(null);
  const [profileForm, setProfileForm] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [localProfileImage, setLocalProfileImage] = useState(null);
  const navigate = useNavigate();
  const profileFileInputRef = useRef(null);

  // Cleanup object URL on component unmount
  useEffect(() => {
    return () => {
      if (localProfileImage && localProfileImage.startsWith('blob:')) {
        URL.revokeObjectURL(localProfileImage);
      }
    };
  }, [localProfileImage]);

  // Handle navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // Handle URL parameter for tab selection
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length > 2 && pathSegments[1] === 'dashboard') {
      const tabFromUrl = pathSegments[2];
      if (tabFromUrl) {
        // Map 'account' to 'profile-menu' for the account section
        if (tabFromUrl === 'account') {
          setActiveTab('profile-menu');
        } else {
          setActiveTab(tabFromUrl);
        }
      }
    }
  }, [location.pathname]);

  // Set default tab based on screen size and route
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile && activeTab === 'profile-menu' && location.pathname === '/dashboard') {
        const hasTabInUrl = location.pathname.split('/').length > 2;
        if (!hasTabInUrl) {
          setActiveTab('my-ads');
        }
      }
    };

    const isMobile = window.innerWidth < 768;
    if (!isMobile && location.pathname === '/dashboard') {
      const hasTabInUrl = location.pathname.split('/').length > 2;
      if (!hasTabInUrl) {
        setActiveTab('my-ads');
      }
    }

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check if user has remaining post ads
  const checkPostAdsAvailability = () => {
    if (!userSubscription || userSubscription.status !== 'active') {
      return 0;
    }
    const plan = subscriptionPlans.find(p => p.id === userSubscription.planId);
    if (plan) {
      const currentListings = userSubscription.currentListings || 0;
      const maxListings = plan.maxListings === -1 ? Infinity : plan.maxListings;
      return Math.max(0, maxListings - currentListings);
    } else {
      const currentListings = userSubscription.currentListings || 0;
      const maxListings = userSubscription.maxListings || 0;
      return Math.max(0, maxListings - currentListings);
    }
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isSmallViewport = window.matchMedia('(max-width: 768px)').matches;
    return isMobileUA || isSmallViewport;
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (isMobileDevice()) {
        navigate('/login', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (isMobileDevice()) {
        navigate('/login', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  // Fetch user's rental listings
  const fetchRentalListings = async () => {
    if (!isAuthenticated || !localStorage.getItem('token') || !user?.id) return;

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

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    if (activeTab === 'my-ads') {
      fetchRentalListings();
    }
  }, [activeTab, isAuthenticated, authLoading, user]);

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      if (user.address) {
        setProfileForm({
          street: user.address.street || '',
          city: user.address.city || '',
          state: user.address.state || '',
          pincode: user.address.pincode || '',
          landmark: user.address.landmark || ''
        });
      } else {
        setProfileForm({ street: '', city: '', state: '', pincode: '', landmark: '' });
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'profile' && user && user.address) {
      setProfileForm({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        pincode: user.address.pincode || '',
        landmark: user.address.landmark || ''
      });
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'profile' && isAuthenticated) {
      const refreshUserData = async () => {
        try {
          const response = await apiService.getMe();
          if (response.success && response.data?.user?.address) {
            setProfileForm({
              street: response.data.user.address.street || '',
              city: response.data.user.address.city || '',
              state: response.data.user.address.state || '',
              pincode: response.data.user.address.pincode || '',
              landmark: response.data.user.address.landmark || ''
            });
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      };
      refreshUserData();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (user?.id || user?._id) {
      const userId = user.id || user._id;
      if (loadUserSubscription) {
        loadUserSubscription(userId);
      }
    }
  }, [user?.id, user?._id, loadUserSubscription]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center px-4 font-sans">
        <Card className="p-8 text-center max-w-md rounded-3xl shadow-sm border border-gray-100 bg-white">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
            <User size={32} className="text-[#fc8019]" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">Login Required</h2>
          <p className="text-gray-500 mb-8 font-medium">Please login to view your dashboard</p>
          <Button onClick={() => navigate('/login')} className="w-full bg-[#fc8019] hover:bg-orange-600 rounded-xl font-bold py-3 text-base">
            Login
          </Button>
        </Card>
      </div>
    );
  }

  // Simplified Menu for Swiggy Style
  const menuSections = [
    {
      title: '',
      items: [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'featured-ads', label: 'My Featured Ads', icon: Star },
      ]
    },
    {
      title: 'Services',
      items: [
        { id: 'buy-boost', label: 'Buy Boost', icon: Zap },
        { id: 'my-boost', label: 'My Boost Balance', icon: Sparkles },
      ]
    },
    {
      title: 'Help & Legal',
      items: [
        { id: 'faqs', label: 'FAQs', icon: Info },
        { id: 'contact-us', label: 'Contact Support', icon: MessageCircle },
        { id: 'terms', label: 'Terms & Conditions', icon: FileText },
        { id: 'privacy', label: 'Privacy Policy', icon: Shield },
      ]
    },
    {
      title: '',
      items: [
        { id: 'logout', label: 'Logout', icon: LogOut, isLogout: true },
      ]
    }
  ];

  const handleDeleteAd = (itemId) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      deleteItem(itemId);
    }
  };

  const handleBoostRental = async (listing) => {
    try {
      if (!hasBoostCredits()) {
        const status = getBoostStatus();
        alert(
          `You have used all your boost credits (${status.usedBoosts}/${status.totalBoosts}).\n\nYou had ${status.freeBoosts} free boosts and ${status.purchasedBoosts} purchased boosts.\n\nBoost purchase functionality has been disabled. You can only use free boosts.`
        );
        return;
      }
      setBoostedRental(listing);
      setShowBoostAnimation(true);
    } catch (error) {
      console.error('Error boosting rental:', error);
      alert('Failed to boost rental. Please try again.');
    }
  };

  const handleBoostComplete = async () => {
    try {
      if (!boostedRental) return;
      const response = await apiService.boostRental(boostedRental._id);
      if (response.success) {
        const updatedCredits = {
          ...boostCredits,
          usedBoosts: boostCredits.usedBoosts + 1,
          remainingBoosts: response.data.remainingBoosts
        };
        updateBoostCredits(updatedCredits);
        setRentalListings(prev => {
          const filtered = prev.filter(item => item._id !== boostedRental._id);
          const boostedItem = { ...boostedRental, isBoosted: true, boostedAt: new Date().toISOString() };
          return [boostedItem, ...filtered];
        });
        alert(`${boostedRental.title} has been boosted to featured listings! Remaining boosts: ${response.data.remainingBoosts}`);
      } else {
        alert('Failed to boost rental. Please try again.');
      }
    } catch (error) {
      console.error('Error completing boost:', error);
      alert('Failed to boost rental. Please try again.');
    } finally {
      setShowBoostAnimation(false);
      setBoostedRental(null);
    }
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing._id);
    setEditForm({
      description: listing.description || '',
      amount: listing.price?.amount || '',
      serviceRadius: listing.location?.serviceRadius || 7
    });
  };

  const handleSaveEdit = async (listingId) => {
    try {
      const serviceRadius = parseInt(editForm.serviceRadius);
      if (isNaN(serviceRadius) || serviceRadius < 1 || serviceRadius > 50) {
        alert('Service radius must be a number between 1 and 50 km');
        return;
      }
      const response = await apiService.updateRentalRequest(listingId, {
        description: editForm.description,
        priceAmount: editForm.amount,
        serviceRadius: serviceRadius
      });

      if (response.success) {
        setRentalListings(prev => prev.map(listing =>
          listing._id === listingId
            ? {
              ...listing,
              description: editForm.description,
              price: { ...listing.price, amount: parseFloat(editForm.amount) },
              location: { ...listing.location, serviceRadius: parseInt(editForm.serviceRadius) }
            }
            : listing
        ));
        setEditingListing(null);
        setEditForm({ description: '', amount: '', serviceRadius: '' });
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update rental request. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingListing(null);
    setEditForm({ description: '', amount: '', serviceRadius: '' });
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await apiService.updateUserProfile({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: {
          street: profileForm.street,
          city: profileForm.city,
          state: profileForm.state,
          pincode: profileForm.pincode,
          landmark: profileForm.landmark
        }
      });

      if (response.success) {
        alert('Profile updated successfully!');
        try {
          const refreshResponse = await apiService.getMe();
          if (refreshResponse.success && refreshResponse.data?.user) {
            updateUser(refreshResponse.data.user);
            if (refreshResponse.data.user.address) {
              setProfileForm({
                street: refreshResponse.data.user.address.street || '',
                city: refreshResponse.data.user.address.city || '',
                state: refreshResponse.data.user.address.state || '',
                pincode: refreshResponse.data.user.address.pincode || '',
                landmark: refreshResponse.data.user.address.landmark || ''
              });
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing user data:', refreshError);
        }
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    setUploadingImage(true);
    if (type === 'profile') {
      const imageUrl = URL.createObjectURL(file);
      setLocalProfileImage(imageUrl);
    }
    try {
      let response;
      if (type === 'profile') {
        response = await apiService.uploadProfileImage(file);
      } else if (type === 'aadhar-front') {
        const dummyFile = new File([''], 'dummy.txt', { type: 'text/plain' });
        response = await apiService.uploadAadharCard(null, file, dummyFile);
      } else if (type === 'aadhar-back') {
        response = await apiService.uploadProfileImage(file);
      } else {
        response = await apiService.uploadProfileImage(file);
      }

      if (response.success) {
        alert('Image uploaded successfully!');
        try {
          const refreshResponse = await apiService.getMe();
          if (refreshResponse.success && refreshResponse.data?.user) {
            updateUser(refreshResponse.data.user);
            if (type === 'profile' && refreshResponse.data.user.profileImage) {
              setLocalProfileImage(refreshResponse.data.user.profileImage);
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing user data:', refreshError);
        }
      } else {
        alert('Failed to upload image. Please try again.');
        if (type === 'profile') setLocalProfileImage(null);
      }
    } catch (error) {
      alert('Failed to upload image. Please try again.');
      if (type === 'profile') setLocalProfileImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMenuClick = (tabId) => {
    if (tabId === 'logout') { handleLogout(); return; }
    if (tabId === 'buy-subscription') {
      sessionStorage.removeItem('subscriptionPageRefreshed');
      navigate('/subscription');
    } else if (tabId === 'buy-boost') { navigate('/buy-boost'); }
    else if (tabId === 'subscription') { navigate('/my-subscription'); }
    else if (tabId === 'my-boost') { navigate('/my-boost'); }
    else if (tabId === 'faqs') { navigate('/faqs'); }
    else if (tabId === 'contact-us') { navigate('/support-ticket'); }
    else if (tabId === 'privacy') { navigate('/privacy-policy'); }
    else if (tabId === 'terms') { navigate('/terms-and-conditions'); }
    else if (tabId === 'about-us') { navigate('/about-us'); }
    else if (tabId === 'featured-ads') { navigate('/my-featured-ads'); }
    else if (tabId === 'profile') { navigate('/dashboard/profile'); }
    else { setActiveTab(tabId); }

    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20">
      <main className="w-full max-w-[1200px] mx-auto">

        {/* My Rentals Tab - Sticky Header */}
        {activeTab === 'my-ads' && (
          <div className="sticky top-0 z-30 bg-white px-4 md:px-6 pt-5 pb-4 border-b border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 tracking-tight">My Rentals</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Manage your listings</p>
              </div>
              <Button onClick={() => navigate('/post-ad')} className="text-sm md:text-base py-2.5 md:py-3 px-4 md:px-6 bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold shadow-sm">
                <Package size={18} className="mr-2" />
                Add New
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6">
          {/* My Rentals Tab Content */}
          {activeTab === 'my-ads' && (
            <div>
              {loadingRentals ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
                  <p className="text-gray-500 font-bold">Loading your rentals...</p>
                </div>
              ) : rentalListings.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full flex items-center justify-center shadow-sm">
                    <Package size={36} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2 tracking-tight text-gray-900">No rentals yet</h3>
                  <p className="text-gray-500 mb-8 font-medium">Start listing your items for rent</p>
                  <Button onClick={() => navigate('/post-ad')} className="bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold py-3 px-6 shadow-sm">
                    Create Your First Rental
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rentalListings.map((listing) => {
                    return (
                      <div key={listing._id} className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 bg-white group">

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <div className={`px-3 py-1 text-[10px] uppercase font-extrabold tracking-wider rounded-full shadow-sm flex items-center gap-1 backdrop-blur-md ${listing.status === 'approved' ? 'bg-green-500/90 text-white' :
                              listing.status === 'pending' ? 'bg-yellow-500/90 text-white' :
                                listing.status === 'rejected' ? 'bg-red-500/90 text-white' :
                                  'bg-gray-500/90 text-white'
                            }`}>
                            {listing.status === 'approved' && <BadgeCheck size={12} strokeWidth={3} />}
                            {listing.status === 'pending' && <Clock size={12} strokeWidth={3} />}
                            {listing.status === 'rejected' && <X size={12} strokeWidth={3} />}
                            {listing.status?.toUpperCase() || 'UNKNOWN'}
                          </div>
                        </div>

                        <div className="relative h-40 bg-gray-50">
                          {listing.images && listing.images.length > 0 ? (
                            <ImageCarousel images={listing.images.map(img => img.url)} className="h-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package size={32} className="text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          {editingListing === listing._id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-1">Description</label>
                                <textarea
                                  value={editForm.description}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                                  rows="2"
                                  placeholder="Enter description"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-1">Amount</label>
                                  <input
                                    type="number"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                                    placeholder="Amount"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-1">Radius (km)</label>
                                  <input
                                    type="number"
                                    min="1" max="50"
                                    value={editForm.serviceRadius}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 50)) {
                                        setEditForm(prev => ({ ...prev, serviceRadius: value }));
                                      }
                                    }}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                                    placeholder="1-50 km"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={() => handleSaveEdit(listing._id)}
                                  className="flex-1 text-xs py-2.5 bg-[#fc8019] hover:bg-orange-600 text-white rounded-xl font-bold border-none"
                                >
                                  <Save size={14} className="mr-1.5" /> Save
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outline"
                                  className="flex-1 text-xs py-2.5 rounded-xl font-bold text-gray-600 border-gray-200 hover:bg-gray-50"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-extrabold text-gray-900 mb-1.5 line-clamp-1 text-base tracking-tight group-hover:text-[#fc8019] transition-colors">{listing.title}</h3>
                              <div className="flex flex-col gap-2 mb-4">
                                <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                                  ₹{listing.price?.amount || 0}<span className="text-[10px] text-gray-500 font-medium uppercase ml-1">/ {listing.price?.period || 'day'}</span>
                                </span>
                                <div className="flex items-center text-gray-500 text-xs font-medium">
                                  <MapPin size={12} className="mr-1 text-gray-400" />
                                  <span className="truncate">
                                    {listing.location?.address || (listing.location?.city && listing.location.city.length > 2 ? listing.location.city : 'Location not specified')}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          {editingListing !== listing._id && (
                            <>
                              <div className="w-full h-px bg-gray-100 mb-3"></div>
                              <div className="flex gap-2">
                                {listing.status === 'approved' && (
                                  <Button
                                    variant="outline"
                                    className="flex-1 text-xs py-2 rounded-xl font-bold border-gray-200 text-gray-700 hover:bg-gray-50 group/btn"
                                    onClick={() => navigate(`/rental/${listing._id}`)}
                                  >
                                    <Eye size={14} className="mr-1.5 text-gray-400 group-hover/btn:text-gray-700" /> View
                                  </Button>
                                )}

                                {listing.status === 'approved' && (
                                  <Button
                                    variant="outline"
                                    className={`flex-1 text-xs py-2 rounded-xl font-bold border-gray-200 group/btn ${hasBoostCredits()
                                      ? 'text-orange-600 hover:bg-orange-50 border-orange-200'
                                      : 'text-gray-400 cursor-not-allowed'}`}
                                    onClick={() => handleBoostRental(listing)}
                                    disabled={!hasBoostCredits()}
                                  >
                                    <Zap size={14} className={`mr-1.5 ${hasBoostCredits() ? 'text-[#fc8019]' : 'text-gray-400'}`} />
                                    {hasBoostCredits() ? 'Boost' : 'Boost'}
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  className="flex-1 text-xs py-2 rounded-xl font-bold border-gray-200 text-gray-700 hover:bg-gray-50 group/btn"
                                  onClick={() => handleEditListing(listing)}
                                >
                                  <Edit size={14} className="mr-1.5 text-gray-400 group-hover/btn:text-gray-700" /> Edit
                                </Button>

                                <button
                                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors shrink-0"
                                  onClick={() => handleDeleteAd(listing._id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Edit Profile</h2>
                <div className="w-10"></div>
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                {/* Profile Image Section */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                  <div className="relative group cursor-pointer" onClick={() => !uploadingImage && profileFileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-gray-300 group-hover:border-[#fc8019] transition-colors">
                      {(localProfileImage || user.profileImage || user.profile?.image || user.image) ? (
                        <img
                          src={localProfileImage || user.profileImage || user.profile?.image || user.image}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-orange-50 rounded-full flex items-center justify-center text-[#fc8019] text-3xl font-extrabold" style={{ display: (localProfileImage || user.profileImage || user.profile?.image || user.image) ? 'none' : 'flex' }}>
                        {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 group-hover:text-[#fc8019]">
                      <Edit size={14} />
                    </div>
                    <input type="file" accept="image/*" ref={profileFileInputRef} style={{ display: 'none' }} disabled={uploadingImage} onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], 'profile'); }} />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{user.name}</h3>
                    <p className="text-sm font-medium text-gray-500 mb-2">{user.email}</p>
                    {uploadingImage && <span className="text-[10px] font-bold text-[#fc8019] uppercase tracking-wider bg-orange-50 px-2 py-1 rounded-full">Uploading...</span>}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Full Name</label>
                      <input type="text" value={user.name || ''} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 focus:outline-none cursor-not-allowed" readOnly />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Email Address</label>
                      <input type="email" value={user.email || ''} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 focus:outline-none cursor-not-allowed" readOnly />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Phone Number</label>
                    <input type="tel" value={user.phone || ''} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 focus:outline-none cursor-not-allowed" readOnly />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Street Address</label>
                    <textarea
                      value={profileForm.street}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Add your street address"
                      rows="2"
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">City</label>
                      <input type="text" value={profileForm.city} onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))} placeholder="Add your city" className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">State</label>
                      <input type="text" value={profileForm.state} onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))} placeholder="Add your state" className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Pincode</label>
                      <input type="text" value={profileForm.pincode} onChange={(e) => setProfileForm(prev => ({ ...prev, pincode: e.target.value }))} placeholder="Add your pincode" className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Landmark</label>
                      <input type="text" value={profileForm.landmark} onChange={(e) => setProfileForm(prev => ({ ...prev, landmark: e.target.value }))} placeholder="Add nearby landmark" className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all" />
                    </div>
                  </div>

                  {/* Document Section */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="text-lg font-extrabold text-gray-900 tracking-tight mb-5">Verification Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Aadhar Front */}
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Aadhar Card Front</label>
                        {user.rentalProfile?.documents?.aadhar?.frontImage?.url ? (
                          <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50">
                            <img src={user.rentalProfile.documents.aadhar.frontImage.url} alt="Aadhar Card Front" className="w-full h-40 object-cover rounded-xl" onError={(e) => { e.target.style.display = 'none'; }} />
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 text-center flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                              <FileText size={20} className="text-gray-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-500">No Document</span>
                          </div>
                        )}
                      </div>
                      {/* Aadhar Back */}
                      <div>
                        <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">Aadhar Card Back</label>
                        {user.rentalProfile?.documents?.aadhar?.backImage?.url ? (
                          <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50">
                            <img src={user.rentalProfile.documents.aadhar.backImage.url} alt="Aadhar Card Back" className="w-full h-40 object-cover rounded-xl" onError={(e) => { e.target.style.display = 'none'; }} />
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 text-center flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                              <FileText size={20} className="text-gray-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-500">No Document</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3 pt-4">
                    <Button onClick={handleSaveProfile} disabled={savingProfile} className="flex-1 py-3.5 bg-[#fc8019] hover:bg-orange-600 text-white font-bold rounded-xl border-none">
                      {savingProfile ? 'Saving...' : 'Save Details'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setProfileForm({ street: user.address?.street || '', city: user.address?.city || '', state: user.address?.state || '', pincode: user.address?.pincode || '', landmark: user.address?.landmark || '' });
                    }} className="flex-1 py-3.5 font-bold rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Menu - Mobile View */}
          {activeTab === 'profile-menu' && (
            <div className="md:hidden">
              {/* Swiggy Style User Card */}
              <div className="bg-gradient-to-r from-[#fc8019] to-[#ffc107] rounded-3xl p-6 mb-6 text-white shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    {(localProfileImage || user.profileImage || user.profile?.image || user.image) ? (
                      <img
                        src={localProfileImage || user.profileImage || user.profile?.image || user.image}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/50 shadow-sm"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-extrabold border-2 border-white/40 shadow-sm" style={{ display: (localProfileImage || user.profileImage || user.profile?.image || user.image) ? 'none' : 'flex' }}>
                      {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-white text-xl tracking-tight truncate">{user.name}</h3>
                    <p className="text-sm font-medium text-white/90 truncate">{user.phone || user.email}</p>
                    <div className="mt-1 inline-flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      <Shield size={10} className="text-white" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white">USR{String(user._id || user.id || '000').slice(-4).padStart(4, '0')}</span>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-white/60" onClick={() => handleMenuClick('profile')} />
                </div>
              </div>

              {/* Menu Sections - Swiggy clean box style */}
              <div className="space-y-6">
                {menuSections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    {section.title && (
                      <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-2 mb-3">
                        {section.title}
                      </h4>
                    )}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      {section.items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-4 transition-colors group hover:bg-orange-50/30 ${index !== section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.isLogout ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500 group-hover:bg-orange-50 group-hover:text-[#fc8019]'}`}>
                                <Icon size={18} strokeWidth={2.5} />
                              </div>
                              <span className={`font-bold text-[15px] tracking-tight ${item.isLogout ? 'text-red-500' : 'text-gray-800'}`}>
                                {item.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.count !== undefined && item.count > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-[#fc8019]">
                                  {item.count}
                                </span>
                              )}
                              <ChevronRight size={18} className="text-gray-300 group-hover:text-[#fc8019] transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Tabs - Placeholder */}
          {!['my-ads', 'profile', 'profile-menu'].includes(activeTab) && (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto mt-8">
              <div className="w-16 h-16 mx-auto mb-5 bg-gray-50 rounded-full flex items-center justify-center">
                {menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.icon &&
                  (() => {
                    const Icon = menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.icon;
                    return <Icon size={28} className="text-gray-400" strokeWidth={2.5} />;
                  })()
                }
              </div>
              <h3 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">
                {menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label}
              </h3>
              <p className="text-gray-500 font-medium">This feature is coming soon!</p>
            </div>
          )}
        </div>
      </main>

      {/* Boost Animation */}
      <BoostAnimation
        isVisible={showBoostAnimation}
        onComplete={handleBoostComplete}
        rentalTitle={boostedRental?.title || ''}
      />
    </div>
  );
};

export default Dashboard;