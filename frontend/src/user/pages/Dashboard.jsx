import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, MessageCircle, User, Edit, Trash2, Calendar, Zap, 
  CreditCard, Rocket, LogOut, MapPin, Eye, Menu, X, Home, 
  Star, ShoppingCart,
  Mail, Info, FileText, Lock, ChevronRight, Shield, BadgeCheck, Clock, Save
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
      // Only change tab if we're on the base dashboard route and it's the initial load
      // But don't change if we're explicitly on the account route
      if (!isMobile && activeTab === 'profile-menu' && location.pathname === '/dashboard') {
        // Check if we came from account navigation (no specific tab in URL)
        const hasTabInUrl = location.pathname.split('/').length > 2;
        if (!hasTabInUrl) {
        setActiveTab('my-ads');
        }
      }
    };
    
    // Only run on initial mount, not on every activeTab change
    const isMobile = window.innerWidth < 768;
    if (!isMobile && location.pathname === '/dashboard') {
      // Check if we came from account navigation (no specific tab in URL)
      const hasTabInUrl = location.pathname.split('/').length > 2;
      if (!hasTabInUrl) {
        setActiveTab('my-ads');
      }
    }
    
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []); // Remove activeTab dependency to prevent infinite loops

  // Check if user has remaining post ads
  const checkPostAdsAvailability = () => {
    if (!userSubscription || userSubscription.status !== 'active') {
      return 0; // No subscription
    }

    const plan = subscriptionPlans.find(p => p.id === userSubscription.planId);
    if (plan) {
      const currentListings = userSubscription.currentListings || 0;
      const maxListings = plan.maxListings === -1 ? Infinity : plan.maxListings;
      return Math.max(0, maxListings - currentListings);
    } else {
      // Fallback for custom plans (like new_user_default)
      const currentListings = userSubscription.currentListings || 0;
      const maxListings = userSubscription.maxListings || 0;
      return Math.max(0, maxListings - currentListings);
    }
  };

  // Helper function to detect if user is on mobile device
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
      // Redirect based on device type after logout completes
      // Mobile: redirect to login page
      // Desktop: redirect to home page
      if (isMobileDevice()) {
        navigate('/login', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect user
      if (isMobileDevice()) {
        navigate('/login', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  // Fetch user's rental listings
  const fetchRentalListings = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping rental listings fetch');
      return;
    }
    
    // Check if token exists before making the request
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping rental listings fetch');
      return;
    }
    
    // Check if user exists
    if (!user || !user.id) {
      console.log('User data not available, skipping rental listings fetch');
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
      
      // Handle authentication errors
      if (error.message && (
        error.message.includes('Not authorized') || 
        error.message.includes('user not found') ||
        error.message.includes('Authentication failed')
      )) {
        console.log('⚠️ Authentication error detected, but NOT logging out automatically');
        // DON'T automatically logout - let API service handle token refresh
        // Only logout if user explicitly clicks logout button
        // localStorage.removeItem('token'); // REMOVED - don't clear token automatically
        // logout(); // REMOVED - don't logout automatically
      }
    } finally {
      setLoadingRentals(false);
    }
  };

  // Fetch rental listings when component mounts or when activeTab changes to my-ads
  useEffect(() => {
    // Don't fetch if auth is still loading or user is not available
    if (authLoading || !isAuthenticated || !user) {
      return;
    }
    
    if (activeTab === 'my-ads') {
      fetchRentalListings();
    }
  }, [activeTab, isAuthenticated, authLoading, user]);

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      console.log('User data available:', user);
      console.log('User address data:', user.address);
      
      if (user.address) {
        console.log('Initializing profile form with user address data:', user.address);
        setProfileForm({
          street: user.address.street || '',
          city: user.address.city || '',
          state: user.address.state || '',
          pincode: user.address.pincode || '',
          landmark: user.address.landmark || ''
        });
      } else {
        console.log('No address data found in user object');
        // Initialize with empty values if no address data
        setProfileForm({
          street: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        });
      }
    }
  }, [user]);

  // Also initialize when activeTab changes to profile
  useEffect(() => {
    if (activeTab === 'profile' && user && user.address) {
      console.log('Profile tab activated, loading user address data:', user.address);
      setProfileForm({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        pincode: user.address.pincode || '',
        landmark: user.address.landmark || ''
      });
    }
  }, [activeTab, user]);

  // Force refresh user data when profile tab is accessed
  useEffect(() => {
    if (activeTab === 'profile' && isAuthenticated) {
      // Refresh user data to get latest address information
      const refreshUserData = async () => {
        try {
          console.log('Refreshing user data for profile tab...');
          const response = await apiService.getMe();
          console.log('API response:', response);
          
          if (response.success && response.data && response.data.user) {
            console.log('Refreshed user data:', response.data.user);
            console.log('Address data from API:', response.data.user.address);
            
            // Directly update the form with fresh data
            if (response.data.user.address) {
              setProfileForm({
                street: response.data.user.address.street || '',
                city: response.data.user.address.city || '',
                state: response.data.user.address.state || '',
                pincode: response.data.user.address.pincode || '',
                landmark: response.data.user.address.landmark || ''
              });
              console.log('Form updated with fresh data');
            }
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      };
      refreshUserData();
    }
  }, [activeTab, isAuthenticated]);

  // Load user subscription on mount
  useEffect(() => {
    if (user?.id || user?._id) {
      const userId = user.id || user._id;
      console.log('Dashboard - Loading subscription for userId:', userId);
      if (loadUserSubscription) {
        loadUserSubscription(userId);
      }
    }
  }, [user?.id, user?._id, loadUserSubscription]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your dashboard</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }


  // Grouped menu items for better organization
  const menuSections = [
    {
      title: '',
      items: [
        { id: 'profile', label: 'Profile', icon: User, color: 'blue' },
        { id: 'featured-ads', label: 'My Featured Ads', icon: Star, color: 'yellow' },
      ]
    },
    {
      title: 'Account & Services',
      items: [
        // { id: 'buy-subscription', label: 'Buy Subscription', icon: ShoppingCart, color: 'purple' },
        { id: 'buy-boost', label: 'Buy Boost', icon: Zap, color: 'orange' },
        // { id: 'subscription', label: 'My Subscription', icon: CreditCard, color: 'indigo' },
        { id: 'my-boost', label: 'My Boost', icon: Zap, color: 'orange' },
      ]
    },
    {
      title: 'Support & Info',
      items: [
        { id: 'faqs', label: 'FAQs', icon: Info, color: 'lime' },
        { id: 'contact-us', label: 'Contact Us', icon: Mail, color: 'blue' },
        { id: 'about-us', label: 'About Us', icon: Info, color: 'slate' },
      ]
    },
    {
      title: 'Legal',
      items: [
        { id: 'terms', label: 'Terms & Conditions', icon: FileText, color: 'gray' },
        { id: 'privacy', label: 'Privacy Policy', icon: Lock, color: 'gray' },
      ]
    },
    {
      title: '',
      items: [
        { id: 'logout', label: 'Logout', icon: LogOut, color: 'red' },
      ]
    }
  ];

  const handleDeleteAd = (itemId) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      deleteItem(itemId);
    }
  };

  // Boost functionality
  const handleBoostRental = async (listing) => {
    try {
      // Check if user has boost credits
      if (!hasBoostCredits()) {
        const status = getBoostStatus();
        // Show a more informative message - boost purchase is disabled
        alert(
          `You have used all your boost credits (${status.usedBoosts}/${status.totalBoosts}).\n\nYou had ${status.freeBoosts} free boosts and ${status.purchasedBoosts} purchased boosts.\n\nBoost purchase functionality has been disabled. You can only use free boosts.`
        );
        return;
      }

      // Set the rental to be boosted and show animation
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

      // Call API to boost the rental
      const response = await apiService.boostRental(boostedRental._id);
      
      if (response.success) {
        // Update boost credits from the response (backend handles deduction)
        const updatedCredits = {
          ...boostCredits,
          usedBoosts: boostCredits.usedBoosts + 1,
          remainingBoosts: response.data.remainingBoosts
        };
        
        updateBoostCredits(updatedCredits);
        
        // Update the rental listings to move boosted rental to top
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
      // Hide animation and reset state
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
      console.log('Saving edit for listing:', listingId, editForm);
      
      // Validate service radius
      const serviceRadius = parseInt(editForm.serviceRadius);
      if (isNaN(serviceRadius) || serviceRadius < 1 || serviceRadius > 50) {
        alert('Service radius must be a number between 1 and 50 km');
        return;
      }
      
      // Call the API to update the listing
      const response = await apiService.updateRentalRequest(listingId, {
        description: editForm.description,
        priceAmount: editForm.amount,
        serviceRadius: serviceRadius
      });
      
      if (response.success) {
        // Update the local state with the response data
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
        
        // Show success message (you can add a toast notification here)
        console.log('Rental request updated successfully');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      // Show error message to user (you can add a toast notification here)
      alert('Failed to update rental request. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingListing(null);
    setEditForm({ description: '', amount: '', serviceRadius: '' });
  };

  // Save profile information
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      console.log('Saving profile with data:', {
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
        console.log('Profile updated successfully:', response);
        alert('Profile updated successfully!');
        
        // Refresh user data to get updated information
        try {
          const refreshResponse = await apiService.getMe();
          if (refreshResponse.success && refreshResponse.data && refreshResponse.data.user) {
            console.log('User data refreshed after profile update');
            // Update AuthContext user and local form with the latest data
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
        console.error('Profile update failed:', response);
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file, type) => {
    if (!file) return;
    
    setUploadingImage(true);
    
    // Immediately show the selected image locally
    if (type === 'profile') {
      const imageUrl = URL.createObjectURL(file);
      setLocalProfileImage(imageUrl);
    }
    
    try {
      console.log('Uploading image:', { type, file: file.name });
      
      let response;
      
      if (type === 'profile') {
        // Upload profile image
        response = await apiService.uploadProfileImage(file);
      } else if (type === 'aadhar-front' || type === 'aadhar-back') {
        // For Aadhar cards, we need to handle both front and back
        // For now, let's upload them separately
        if (type === 'aadhar-front') {
          // Create a dummy back image or use existing one
          const dummyFile = new File([''], 'dummy.txt', { type: 'text/plain' });
          response = await apiService.uploadAadharCard(null, file, dummyFile);
        } else {
          // For back image, we might need to handle this differently
          // Let's use the profile upload for now
          response = await apiService.uploadProfileImage(file);
        }
      } else {
        // Default to profile image upload
        response = await apiService.uploadProfileImage(file);
      }
      
      if (response.success) {
        console.log('Image uploaded successfully:', response);
        alert('Image uploaded successfully!');
        
        // Refresh user data to get updated image URLs
        try {
          const refreshResponse = await apiService.getMe();
          if (refreshResponse.success && refreshResponse.data && refreshResponse.data.user) {
            console.log('User data refreshed after image upload');
            console.log('Updated user object:', refreshResponse.data.user);
            console.log('Profile image URL:', refreshResponse.data.user.profileImage);

            // Update auth context with new user data
            updateUser(refreshResponse.data.user);

            // Update local image with the server URL
            if (type === 'profile' && refreshResponse.data.user.profileImage) {
              setLocalProfileImage(refreshResponse.data.user.profileImage);
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing user data:', refreshError);
        }
      } else {
        console.error('Image upload failed:', response);
        alert('Failed to upload image. Please try again.');
        // Reset local image on failure
        if (type === 'profile') {
          setLocalProfileImage(null);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      // Reset local image on error
      if (type === 'profile') {
        setLocalProfileImage(null);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMenuClick = (tabId) => {
    if (tabId === 'logout') {
      handleLogout();
      return;
    }
    if (tabId === 'buy-subscription') {
      // Clear refresh flag to ensure page refreshes when navigating to subscription page
      sessionStorage.removeItem('subscriptionPageRefreshed');
      navigate('/subscription');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'buy-boost') {
      navigate('/buy-boost');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'subscription') {
      navigate('/my-subscription');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'my-boost') {
      navigate('/my-boost');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'faqs') {
      navigate('/faqs');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'contact-us') {
      navigate('/support-ticket');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'privacy') {
      navigate('/privacy-policy');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'terms') {
      navigate('/terms-and-conditions');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'about-us') {
      navigate('/about-us');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'featured-ads') {
      navigate('/my-featured-ads');
      setSidebarOpen(false);
      return;
    }
    if (tabId === 'profile') {
      navigate('/dashboard/profile');
      setSidebarOpen(false);
      return;
    }
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50',
      yellow: isActive ? 'bg-yellow-600 text-white' : 'text-yellow-600 hover:bg-yellow-50',
      green: isActive ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50',
      red: isActive ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50',
      purple: isActive ? 'bg-purple-600 text-white' : 'text-purple-600 hover:bg-purple-50',
      indigo: isActive ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50',
      teal: isActive ? 'bg-teal-600 text-white' : 'text-teal-600 hover:bg-teal-50',
      pink: isActive ? 'bg-pink-600 text-white' : 'text-pink-600 hover:bg-pink-50',
      orange: isActive ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50',
      cyan: isActive ? 'bg-cyan-600 text-white' : 'text-cyan-600 hover:bg-cyan-50',
      amber: isActive ? 'bg-amber-600 text-white' : 'text-amber-600 hover:bg-amber-50',
      lime: isActive ? 'bg-lime-600 text-white' : 'text-lime-600 hover:bg-lime-50',
      emerald: isActive ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-emerald-50',
      slate: isActive ? 'bg-slate-600 text-white' : 'text-slate-600 hover:bg-slate-50',
      gray: isActive ? 'bg-gray-600 text-white' : 'text-gray-600 hover:bg-gray-50',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Main Content */}
      <main className="w-full">
        {/* My Rentals Tab - Sticky Header */}
        {activeTab === 'my-ads' && (
          <div className="sticky top-0 z-30 bg-gradient-to-br from-slate-50 to-blue-50 px-4 md:px-6 pt-4 pb-4 border-b border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Rentals</h2>
                <p className="text-sm text-gray-600">Manage your rental listings</p>
              </div>
              <Button onClick={() => navigate('/post-ad')} className="text-sm md:text-base py-2 md:py-3">
                <Package size={18} className="mr-2" />
                Add New
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6">
          {/* My Rentals Tab */}
          {activeTab === 'my-ads' && (
            <div>

              {/* Content */}
              <div>
              {loadingRentals ? (
                <Card className="p-8 md:p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your rentals...</p>
                </Card>
              ) : rentalListings.length === 0 ? (
                <Card className="p-8 md:p-12 text-center">
                  <Package size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg md:text-xl font-bold mb-2">No rentals yet</h3>
                  <p className="text-sm text-gray-600 mb-6">Start listing your items for rent</p>
                  <Button onClick={() => navigate('/post-ad')}>Create Your First Rental</Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rentalListings.map((listing) => {
                    return (
                      <Card key={listing._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Status Badge */}
                        <div className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 ${
                          listing.status === 'approved' ? 'bg-green-500 text-white' :
                          listing.status === 'pending' ? 'bg-yellow-500 text-white' :
                          listing.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {listing.status === 'approved' && <BadgeCheck size={14} />}
                          {listing.status === 'pending' && <Clock size={14} />}
                          {listing.status === 'rejected' && <X size={14} />}
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
                          {editingListing === listing._id ? (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                  value={editForm.description}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                  className="w-full p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows="2"
                                  placeholder="Enter description"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                  type="number"
                                  value={editForm.amount}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                  className="w-full p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter amount"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Service Radius (km)</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  step="1"
                                  value={editForm.serviceRadius}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Only allow numbers between 1-50
                                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 50)) {
                                      setEditForm(prev => ({ ...prev, serviceRadius: value }));
                                    }
                                  }}
                                  className="w-full p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter service radius (1-50 km)"
                                />
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleSaveEdit(listing._id)}
                                  className="flex-1 text-xs py-1.5 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Save size={12} className="mr-1" />
                                  Save
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outline"
                                  className="flex-1 text-xs py-1.5"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-sm md:text-base">{listing.title}</h3>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg md:text-xl font-bold text-blue-600">
                                  ₹{listing.price?.amount || 0}/{listing.price?.period || 'day'}
                                </span>
                                <div className="flex items-center gap-1 text-gray-600">
                                  <MapPin size={14} />
                                  <span className="text-xs">
                                    {listing.location?.address || 
                                     (listing.location?.city && 
                                      listing.location.city !== 'Unknown' && 
                                      listing.location.city !== 'Not specified' && 
                                      listing.location.city.trim() !== '' &&
                                      listing.location.city.length > 2 ? 
                                      listing.location.city : 'Location not specified')}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                          {editingListing !== listing._id && (
                            <div className="flex gap-1">
                              {/* View Button - Only show for APPROVED listings */}
                              {listing.status === 'approved' && (
                                <Button 
                                  variant="outline" 
                                  className="flex-1 text-xs py-1.5"
                                  onClick={() => {
                                    console.log('Navigating to rental with ID:', listing._id);
                                    console.log('Full listing object:', listing);
                                    navigate(`/rental/${listing._id}`);
                                  }}
                                >
                                  <Eye size={12} className="mr-1" />
                                  View
                                </Button>
                              )}
                              
                              {/* Boost Button - Only show for APPROVED listings */}
                              {listing.status === 'approved' && (
                                <Button 
                                  variant="outline" 
                                  className={`flex-1 text-xs py-1.5 ${
                                    hasBoostCredits() 
                                      ? 'text-orange-600 hover:bg-orange-50 border-orange-200' 
                                      : 'text-gray-400 border-gray-300 cursor-not-allowed'
                                  }`}
                                  onClick={() => handleBoostRental(listing)}
                                  disabled={!hasBoostCredits()}
                                >
                                  <Zap size={12} className="mr-1" />
                                  {hasBoostCredits() ? 'Boost' : 'Buy Boost'}
                                </Button>
                              )}
                              
                              {/* Edit Button - Always show */}
                              <Button 
                                variant="outline" 
                                className="flex-1 text-xs py-1.5"
                                onClick={() => handleEditListing(listing)}
                              >
                                <Edit size={12} className="mr-1" />
                                Edit
                              </Button>
                              
                              {/* Delete Button - Always show */}
                              <Button 
                                variant="outline" 
                                className="text-red-600 hover:bg-red-50 text-xs py-1.5 px-2"
                                onClick={() => handleDeleteAd(listing._id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          )}


          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex-1">
                  <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 text-center">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Profile</h2>
                </div>
                <div className="flex-1"></div>
              </div>


              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {(localProfileImage || user.profileImage || user.profile?.image || user.image) ? (
                      <img 
                        src={localProfileImage || user.profileImage || user.profile?.image || user.image} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover cursor-pointer"
                        onClick={() => {
                          if (!uploadingImage && profileFileInputRef.current) {
                            profileFileInputRef.current.click();
                          }
                        }}
                        onError={(e) => {
                          console.log('Profile image failed to load, showing initial');
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold cursor-pointer"
                      onClick={() => {
                        if (!uploadingImage && profileFileInputRef.current) {
                          profileFileInputRef.current.click();
                        }
                      }}
                      style={{ display: (localProfileImage || user.profileImage || user.profile?.image || user.image) ? 'none' : 'flex' }}
                    >
                      {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <BadgeCheck size={14} className="text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <input
                      type="file"
                      accept="image/*"
                      ref={profileFileInputRef}
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageUpload(file, 'profile');
                        }
                      }}
                      disabled={uploadingImage}
                    />
                    {!uploadingImage && (
                      <button
                        type="button"
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={() => profileFileInputRef.current && profileFileInputRef.current.click()}
                      >
                        Change profile photo
                      </button>
                    )}
                    {uploadingImage && <p className="text-xs text-gray-500">Uploading...</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={user.name || ''}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={user.phone || ''}
                      placeholder="Add your phone number"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <textarea
                      value={profileForm.street}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Add your street address"
                      rows="2"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Add your city"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Add your state"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, pincode: e.target.value }))}
                        placeholder="Add your pincode"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                      <input
                        type="text"
                        value={profileForm.landmark}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, landmark: e.target.value }))}
                        placeholder="Add nearby landmark"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Aadhar Card Images */}
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Aadhar Card Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Card Front</label>
                        {user.rentalProfile?.documents?.aadhar?.frontImage?.url ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <img 
                              src={user.rentalProfile.documents.aadhar.frontImage.url} 
                              alt="Aadhar Card Front" 
                              className="w-full h-40 object-contain rounded-lg bg-gray-50"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div className="hidden text-center p-4">
                              <p className="text-gray-500">Failed to load Aadhar Front image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                              <FileText size={24} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500">No Aadhar Front image uploaded</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Card Back</label>
                        {user.rentalProfile?.documents?.aadhar?.backImage?.url ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <img 
                              src={user.rentalProfile.documents.aadhar.backImage.url} 
                              alt="Aadhar Card Back" 
                              className="w-full h-40 object-contain rounded-lg bg-gray-50"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                            <div className="hidden text-center p-4">
                              <p className="text-gray-500">Failed to load Aadhar Back image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                              <FileText size={24} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500">No Aadhar Back image uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      // Reset form to original values
                      setProfileForm({
                        street: user.address?.street || '',
                        city: user.address?.city || '',
                        state: user.address?.state || '',
                        pincode: user.address?.pincode || '',
                        landmark: user.address?.landmark || ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Profile Menu - Mobile View */}
          {activeTab === 'profile-menu' && (
            <div className="md:hidden">
              {/* User Profile Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 mb-4 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    {(localProfileImage || user.profileImage || user.profile?.image || user.image) ? (
                      <img 
                        src={localProfileImage || user.profileImage || user.profile?.image || user.image} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                        onError={(e) => {
                          console.log('Profile image failed to load, showing initial');
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30"
                      style={{ display: (localProfileImage || user.profileImage || user.profile?.image || user.image) ? 'none' : 'flex' }}
                    >
                      {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {/* Verified badge option */}
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <BadgeCheck size={14} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate text-base">{user.name}</h3>
                    <p className="text-xs text-white/80 truncate">{user.phone || user.email}</p>
                    <p className="text-xs text-white/60 truncate">USR{String(user._id || user.id || '00000').slice(-4).padStart(4, '0')}</p>
                  </div>
                </div>
              </div>

              {/* Menu Sections */}
              <div className="space-y-4">
                {menuSections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    {section.title && (
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">
                        {section.title}
                      </h4>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {section.items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleMenuClick(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-all hover:bg-gray-50 ${
                              index !== section.items.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                item.color === 'red' ? 'bg-red-50 text-red-600' :
                                item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                item.color === 'green' ? 'bg-green-50 text-green-600' :
                                item.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' :
                                item.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                                item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                item.color === 'pink' ? 'bg-pink-50 text-pink-600' :
                                item.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                item.color === 'teal' ? 'bg-teal-50 text-teal-600' :
                                item.color === 'cyan' ? 'bg-cyan-50 text-cyan-600' :
                                item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                item.color === 'lime' ? 'bg-lime-50 text-lime-600' :
                                item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                item.color === 'slate' ? 'bg-slate-50 text-slate-600' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                <Icon size={18} />
                              </div>
                              <span className="font-semibold text-gray-900 text-sm">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.count !== undefined && item.count > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                                  {item.count}
                                </span>
                              )}
                              <ChevronRight size={16} className="text-gray-400" />
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
            <Card className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                {menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.icon && 
                  (() => {
                    const Icon = menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.icon;
                    return <Icon size={32} className="text-gray-400" />;
                  })()
                }
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2">
                {menuSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label}
              </h3>
              <p className="text-sm text-gray-600">This feature is coming soon!</p>
            </Card>
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
