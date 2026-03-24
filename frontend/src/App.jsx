import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AppProvider } from './contexts/AppContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { SocketProvider } from './contexts/SocketContext';
import { BoostProvider } from './contexts/BoostContext';
import ScrollToTop from './components/common/ScrollToTop';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import BottomNav from './components/layout/BottomNav';
import SubscriptionNotifications from './components/subscription/SubscriptionNotifications';
import GlobalChatNotifications from './components/chat/GlobalChatNotifications';
// LocationCaptureModal removed - location is now captured automatically in background
import { setupForegroundNotificationHandler } from './services/pushNotificationService';
import apiService from './services/api';
import googleMapsService from './services/googleMapsService';
import Home from './user/pages/Home';
import Listings from './user/pages/Listings';
import ItemDetail from './user/pages/ItemDetail';
import CategoryDetail from './user/pages/CategoryDetail';
import Login from './user/pages/Login';
import Signup from './user/pages/Signup';
import PostAd from './user/pages/PostAd';
import Dashboard from './user/pages/Dashboard';
import Profile from './user/pages/Profile';
import Messages from './user/pages/Messages';
import Chat from './user/pages/Chat';
import Favorites from './user/pages/Favorites';
import SubscriptionPage from './user/pages/subscription/SubscriptionPage';
import MySubscription from './user/pages/subscription/MySubscription';
import MyFeaturedAds from './user/pages/MyFeaturedAds';
import PaymentFailed from './user/pages/subscription/PaymentFailed';
import PaymentCallback from './user/pages/subscription/PaymentCallback';
import BuyBoost from './user/pages/boost/BuyBoost';
import MyBoost from './user/pages/boost/MyBoost';
import FAQs from './user/pages/FAQs';
import SupportTicket from './user/pages/SupportTicket';
import PrivacyPolicy from './user/pages/PrivacyPolicy';
import TermsAndConditions from './user/pages/TermsAndConditions';
import AboutUs from './user/pages/AboutUs';
import LocationDebug from './user/pages/LocationDebug';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminLogin from './admin/pages/AdminLogin';
import AdminSignup from './admin/pages/AdminSignup';
import ProtectedAdminRoute from './admin/components/ProtectedAdminRoute';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [locationSaving, setLocationSaving] = useState(false);
  const locationSavedRef = useRef(false);
  const watchIdRef = useRef(null);
  const lastSavedLocationRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const hideNavbar = location.pathname.startsWith('/category');
  const hideFooter = location.pathname === '/' || location.pathname.startsWith('/category') || location.pathname === '/terms-and-conditions' || location.pathname === '/privacy-policy' || location.pathname === '/faqs' || location.pathname === '/contact' || location.pathname === '/support-ticket' || location.pathname === '/about-us' || location.pathname === '/my-boost';
  
  // Hide navbars on auth pages, dashboard, and chat pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isDashboardPage = location.pathname.startsWith('/dashboard') || location.pathname === '/favorites' || location.pathname === '/bookings' || location.pathname === '/messages';
  const isChatPage = location.pathname.startsWith('/chat');
  const isPaymentCallback = location.pathname === '/payment-callback';
  
  // Hide navbar and footer completely on auth pages, chat pages, and payment callback
  const shouldHideNavbar = hideNavbar || isAuthPage || isChatPage || isPaymentCallback;
  const shouldHideFooter = true; // Footer hidden everywhere
  
  // Bottom navigation should be visible on all user pages except auth pages, chat pages, and payment callback
  const shouldShowBottomNav = !isAuthPage && !isChatPage && !isPaymentCallback;

  // Setup global foreground notification handler
  useEffect(() => {
    if (isAuthenticated && 'Notification' in window && Notification.permission === 'granted') {
      console.log('🔔 Setting up global foreground notification handler...');
      const unsubscribe = setupForegroundNotificationHandler((payload) => {
        console.log('🔔 Foreground notification received globally:', payload);
        // Additional global notification handling can be added here
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [isAuthenticated]);

  // CRITICAL: Prevent redirect to login page if user is logged in
  // This prevents logout on back button press
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('user');
    
    // If user is logged in but on login/signup page, redirect to home
    if (isLoggedIn && storedUser && (location.pathname === '/login' || location.pathname === '/signup')) {
      console.log('✅ User is logged in but on login page - redirecting to home');
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Live location tracking - automatically updates location as user moves
  useEffect(() => {
    const MIN_DISTANCE_CHANGE_KM = 0.5; // Update if user moves more than 500 meters
    const UPDATE_INTERVAL_MS = 5 * 60 * 1000; // Update every 5 minutes even if not moved

    // Only start live tracking for authenticated users, not on admin/auth pages
    if (!isAuthenticated || !user || isAdminPage || 
        location.pathname === '/login' || location.pathname === '/signup') {
      // Cleanup if tracking was active
      if (watchIdRef.current !== null) {
        console.log('📍 Stopping live location tracking (user not authenticated or on auth page)');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        isTrackingRef.current = false;
      }
      return;
    }

    // Prevent multiple tracking instances
    if (isTrackingRef.current) {
      return;
    }

    const saveLocationToBackend = async (lat, lng, address) => {
      if (locationSaving) {
        return;
      }

      try {
        setLocationSaving(true);
        console.log('📍 Saving live location update:', { lat, lng, address });

        // Get detailed address components
        const detailedAddress = await googleMapsService.getDetailedAddressComponents(lat, lng);
        const addr = detailedAddress.detailedAddress;
        
        // Prepare address data
        const addressData = {
          address: {
            street: (addr.street_number + ' ' + addr.route).trim() || addr.sublocality || '',
            city: addr.locality || addr.administrative_area_level_2 || '',
            state: addr.administrative_area_level_1 || '',
            pincode: addr.postal_code || '',
            landmark: '',
            latitude: lat,
            longitude: lng,
          },
        };

        // Save location to backend
        const response = await apiService.updateUserProfile(addressData);

        if (response.success) {
          console.log('✅ Live location updated successfully');
          lastSavedLocationRef.current = { lat, lng };
          lastUpdateTimeRef.current = Date.now();
          
          // Refresh user data to reflect new location
          try {
            const userResponse = await apiService.getUserProfile();
            if (userResponse.success && userResponse.data?.user) {
              updateUser(userResponse.data.user);
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        } else {
          throw new Error(response.message || 'Failed to save location');
        }
      } catch (error) {
        console.error('❌ Error saving live location:', error);
        // Silently fail - don't show error to user
      } finally {
        setLocationSaving(false);
      }
    };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    };

    const handleLocationUpdate = async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // Validate coordinates
        if (latitude === 0 && longitude === 0) {
          return;
        }

        // Check if user moved significantly or enough time has passed
        const lastSaved = lastSavedLocationRef.current;
        const lastUpdate = lastUpdateTimeRef.current;
        
        const shouldUpdate = 
          !lastSaved || 
          calculateDistance(latitude, longitude, lastSaved.lat, lastSaved.lng) >= MIN_DISTANCE_CHANGE_KM ||
          (Date.now() - lastUpdate) >= UPDATE_INTERVAL_MS;

        if (!shouldUpdate) {
          return;
        }

        // Initialize Google Maps service
        await googleMapsService.initialize();

        // Get address from coordinates
        let address = '';
        try {
          address = await googleMapsService.reverseGeocode(latitude, longitude);
        } catch (error) {
          console.warn('Could not get address:', error);
          address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        // Save location to backend
        await saveLocationToBackend(latitude, longitude, address);
      } catch (error) {
        console.error('Error processing live location update:', error);
      }
    };

    // Set initial location from user data if available
    if (user?.address?.latitude && user?.address?.longitude) {
      lastSavedLocationRef.current = {
        lat: user.address.latitude,
        lng: user.address.longitude
      };
      lastUpdateTimeRef.current = Date.now();
    }

    // Initialize Google Maps service and start tracking
    googleMapsService.initialize().then(() => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return;
      }

      if (isTrackingRef.current) {
        return; // Already tracking
      }

      console.log('📍 Starting live location tracking...');
      isTrackingRef.current = true;
      
      // Watch position with optimized options
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (error) => {
          console.error('Live location tracking error:', error);
          // Don't show errors to user - silently handle
        },
        {
          enableHighAccuracy: false, // Use less battery
          timeout: 10000,
          maximumAge: 60000 // Accept location up to 1 minute old
        }
      );

      // Also do an immediate update if user doesn't have location
      if (!user?.address?.latitude || !user?.address?.longitude) {
        setTimeout(() => {
          if (!isTrackingRef.current) return; // Check if still tracking
          navigator.geolocation.getCurrentPosition(
            handleLocationUpdate,
            (error) => console.error('Initial location capture error:', error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0 // Get fresh location
            }
          );
        }, 2000);
      }
    });

    // Cleanup: stop watching when component unmounts or conditions change
    return () => {
      if (watchIdRef.current !== null) {
        console.log('📍 Stopping live location tracking');
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        isTrackingRef.current = false;
      }
    };
  }, [isAuthenticated, isAdminPage, location.pathname]); // Removed user, locationSaving, updateUser from dependencies

  // REMOVED: Automatic redirect to login
  // User should only logout via explicit logout button
  // Don't automatically redirect - let user stay on current page
  // Only redirect when they explicitly try to access protected routes
  // useEffect(() => {
  //   const isMobileDevice = () => {
  //     if (typeof window === 'undefined') return false;
  //     const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  //     const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  //     const isSmallViewport = window.matchMedia('(max-width: 768px)').matches;
  //     return isMobileUA || isSmallViewport;
  //   };

  //   if (
  //     !isAuthenticated &&
  //     isMobileDevice() &&
  //     !isAdminPage &&
  //     location.pathname !== '/login' &&
  //     location.pathname !== '/signup'
  //   ) {
  //     navigate('/login', { replace: true });
  //   }
  // }, [isAuthenticated, isAdminPage, location.pathname, navigate]);
  // Admin pages - no navbar/footer but still need context
  if (isAdminPage) {
    return (
      <main>
        <Routes>
          {/* Admin Authentication Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
        </Routes>
      </main>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        {!shouldHideNavbar && <div className={isDashboardPage ? 'hidden md:block' : ''}><Navbar /></div>}
        <SubscriptionNotifications />
        {isAuthenticated && <GlobalChatNotifications />}
        <main className={`${shouldShowBottomNav ? 'pb-20 md:pb-0' : 'pb-0'} ${!shouldHideNavbar ? 'md:pt-20' : 'pt-0'}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/category" element={<CategoryDetail />} />
          <Route path="/category/:categorySlug" element={<CategoryDetail />} />
          <Route path="/category/:categorySlug/rentals" element={<CategoryDetail />} />
          <Route path="/rental/:id" element={<ItemDetail />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* User Dashboard Routes */}
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:tab" element={<Dashboard />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/bookings" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="/post-ad" element={<PostAd />} />
          
          {/* Subscription Routes */}
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/my-subscription" element={<MySubscription />} />
          <Route path="/my-featured-ads" element={<MyFeaturedAds />} />
          <Route path="/subscription/failed" element={<PaymentFailed />} />
          <Route path="/payment-callback" element={<PaymentCallback />} />
          
          {/* Boost Routes */}
          <Route path="/buy-boost" element={<BuyBoost />} />
                <Route path="/my-boost" element={<MyBoost />} />
          
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/support-ticket" element={<SupportTicket />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/about-us" element={<AboutUs />} />
          
          {/* Debug Routes */}
          <Route path="/location-debug" element={<LocationDebug />} />
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><h1 className="text-2xl font-bold">Page Not Found</h1></div>} />
        </Routes>
      </main>
      {!shouldHideFooter && <Footer />}
      {shouldShowBottomNav && <BottomNav />}
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AdminAuthProvider>
          <CategoryProvider>
            <AppProvider>
              <SubscriptionProvider>
                <BoostProvider>
                  <SocketProvider>
                    <AppContent />
                  </SocketProvider>
                </BoostProvider>
              </SubscriptionProvider>
            </AppProvider>
          </CategoryProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
