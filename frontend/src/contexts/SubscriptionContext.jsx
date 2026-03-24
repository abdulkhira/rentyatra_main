import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import planService from '../services/planService';
import apiService from '../services/api';

const SubscriptionContext = createContext(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    // Only warn in development - don't show errors in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ useSubscription must be used within SubscriptionProvider');
    }
    // Return fallback context instead of throwing error
    return {
      subscriptionPlans: [],
      userSubscription: null,
      loading: false,
      hasActiveSubscription: () => false,
      canAddProduct: () => false,
      getRemainingListings: () => 0,
      loadUserSubscription: () => Promise.resolve(),
      refreshUserSubscription: () => Promise.resolve(),
      getSubscriptionPlanById: () => null,
      getSubscriptionPlanByName: () => null,
      getSubscriptionStats: () => ({ totalListings: 0, remainingListings: 0, usedListings: 0 }),
      isSubscriptionExpiring: () => false,
      getDaysUntilExpiry: () => 0
    };
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  // Subscription Plans - loaded from service (same as admin)
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  // User Subscription State - declared before useEffects that use it
  const [userSubscription, setUserSubscription] = useState(null);

  // Loading States
  const [loading, setLoading] = useState(false);

  // Load plans on component mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await planService.getAllPlans();
        setSubscriptionPlans(plans);
      } catch (error) {
        // Only log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Error loading plans:', error);
        }
        // Fallback to default plans if service fails
        setSubscriptionPlans([
          {
            id: 'basic',
            name: 'Basic Plan',
            price: 100,
            duration: 30,
            features: [
              '3 Post Ads',
              'Basic Support',
              'Valid for 30 Days',
              'Email notifications'
            ],
            maxListings: 3,
            maxPhotos: 3,
            gradient: 'from-gray-400 to-gray-500',
            popular: false
          },
          {
            id: 'premium',
            name: 'Premium Plan',
            price: 200,
            duration: 30,
            features: [
              '5 Post Ads',
              'Priority Support',
              'Valid for 30 Days',
              'Email notifications',
              'Featured Badge'
            ],
            maxListings: 5,
            maxPhotos: 5,
            gradient: 'from-blue-500 to-indigo-600',
            popular: true
          },
          {
            id: 'pro',
            name: 'Pro Plan',
            price: 300,
            duration: 30,
            features: [
              '15 Post Ads',
              'Priority Support 24/7',
              'Valid for 30 Days',
              'Email notifications',
              'Featured Badge'
            ],
            maxListings: 15,
            maxPhotos: 10,
            gradient: 'from-purple-500 to-pink-600',
            popular: false
          }
        ]);
      }
    };
    loadPlans();
  }, []);

  // Load user subscription from API with retry mechanism
  const loadUserSubscription = useCallback(async (userId, retryCount = 0) => {
    if (!userId) {
      return;
    }
    
    setLoading(true);
    
    // Use relative path to leverage Vite proxy
    const apiUrl = `/api/subscription/active/${userId}`;
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Loading subscription for user:', userId, 'from:', apiUrl, `(attempt ${retryCount + 1})`);
    }
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Request timeout - aborting request');
        }
        controller.abort();
      }, 15000); // Increased to 15 seconds
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Response status:', response.status);
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        // Only log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Non-JSON Response received:', {
            status: response.status,
            statusText: response.statusText,
            contentType: contentType,
            url: apiUrl
          });
        }
        
        // Check if it's an HTML error page
        if (responseText.includes('<!doctype html>') || responseText.includes('<html>')) {
          // Silently handle HTML responses (likely 404 or server error)
          if (response.status === 404) {
            // Create fallback for 404
            const fallbackSubscription = {
              _id: 'fallback-default-sub',
              userId: { _id: userId },
              planId: 'new_user_default',
              planName: 'New User Default',
              status: 'active',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              price: 0,
              paymentStatus: 'paid',
              currentListings: 0,
              maxListings: 2,
              maxPhotos: 10
            };
            setUserSubscription(fallbackSubscription);
            return;
          }
          throw new Error(`Server returned HTML instead of JSON`);
        }
        
        // For other non-JSON responses, handle gracefully
        if (response.status === 404) {
          const fallbackSubscription = {
            _id: 'fallback-default-sub',
            userId: { _id: userId },
            planId: 'new_user_default',
            planName: 'New User Default',
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            price: 0,
            paymentStatus: 'paid',
            currentListings: 0,
            maxListings: 2,
            maxPhotos: 10
          };
          setUserSubscription(fallbackSubscription);
          return;
        }
        
        throw new Error(`Server returned non-JSON response`);
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('No active subscription found for user:', userId);
          }
          // Create a fallback subscription object for new users
          const fallbackSubscription = {
            _id: 'fallback-default-sub',
            userId: { _id: userId },
            planId: 'new_user_default',
            planName: 'New User Default',
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            price: 0,
            paymentStatus: 'paid',
            currentListings: 0,
            maxListings: 2, // 2 free post ads
            maxPhotos: 10
          };
          setUserSubscription(fallbackSubscription);
          return;
        }
        
        // Retry on 500 errors up to 2 times
        if (response.status === 500 && retryCount < 2) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`Server error (500) - retrying in ${(retryCount + 1) * 2} seconds...`);
          }
          setTimeout(() => {
            loadUserSubscription(userId, retryCount + 1);
          }, (retryCount + 1) * 2000); // 2s, 4s delays
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Subscription data received:', data);
      }
      
      if (data.success && data.data) {
        setUserSubscription(data.data);
      } else {
        // If no subscription data, create fallback for new users
        const fallbackSubscription = {
          _id: 'fallback-default-sub',
          userId: { _id: userId },
          planId: 'new_user_default',
          planName: 'New User Default',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          price: 0,
          paymentStatus: 'paid',
          currentListings: 0,
          maxListings: 2, // 2 free post ads
          maxPhotos: 10
        };
        console.log('No subscription data in response, setting fallback subscription');
        setUserSubscription(fallbackSubscription);
      }
    } catch (error) {
      // Only log errors in development to avoid console spam
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Error loading user subscription:', error.message || error);
      }
      
      if (error.name === 'AbortError') {
        // Don't set subscription to null on timeout, keep existing state
        // Show fallback data for better UX
        if (process.env.NODE_ENV === 'development') {
          console.log('Using fallback subscription data due to timeout');
        }
        const fallbackSubscription = {
          _id: 'fallback-subscription-id',
          userId: { _id: userId, name: 'User', email: 'user@example.com' },
          planId: 'new_user_default',
          planName: 'New User Default',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          price: 0,
          paymentStatus: 'paid',
          currentListings: 0,
          maxListings: 2,
          maxPhotos: 10
        };
        setUserSubscription(fallbackSubscription);
        return;
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // Network error - server may be down or CORS issue
        // Use fallback subscription for better UX
        const fallbackSubscription = {
          _id: 'fallback-subscription-id',
          userId: { _id: userId },
          planId: 'new_user_default',
          planName: 'New User Default',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          price: 0,
          paymentStatus: 'paid',
          currentListings: 0,
          maxListings: 2,
          maxPhotos: 10
        };
        setUserSubscription(fallbackSubscription);
        return;
      }
      
      // Check if it's a 500 error specifically
      if (error.message && error.message.includes('500')) {
        // Don't clear subscription on 500 errors, keep existing state
        // This prevents UI from breaking when server has temporary issues
        return;
      }
      
      // For other errors, keep existing subscription state
      // Don't set userSubscription to null on errors to preserve existing state
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any external values

  // Refresh user subscription data
  const refreshUserSubscription = useCallback(async (userId) => {
    if (!userId) return;
    await loadUserSubscription(userId);
  }, [loadUserSubscription]);

  // Listen for plan updates (when admin updates plans) - Multiple methods for instant updates
  useEffect(() => {
    let broadcastChannel = null;
    let pollingInterval = null;
    let lastUpdateTime = 0;

    const handlePlansUpdate = async (source = 'unknown') => {
      try {
        // Only update if enough time has passed (prevent rapid updates)
        const now = Date.now();
        if (now - lastUpdateTime < 500) {
          return; // Skip if updated less than 500ms ago
        }
        lastUpdateTime = now;

        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Refreshing plans from:', source);
        }

        // Reload plans from backend when admin updates them
        const plans = await planService.getAllPlans();
        setSubscriptionPlans(plans);

        // Visual feedback (optional - can be removed if not needed)
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Plans updated successfully');
        }
      } catch (error) {
        // Silently handle plan reload errors
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Error reloading plans:', error);
        }
      }
    };

    // Listen for subscription updates from admin
    const handleSubscriptionUpdate = (event) => {
      if (event.detail && event.detail.userId && userSubscription && userSubscription.userId === event.detail.userId) {
        // Reload user subscription if it matches the updated user
        loadUserSubscription(event.detail.userId);
      }
    };

    // Method 1: Custom event for same-tab updates
    window.addEventListener('plansUpdated', (e) => handlePlansUpdate('custom-event'));
    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);

    // Method 2: BroadcastChannel for cross-tab communication
    try {
      broadcastChannel = new BroadcastChannel('subscription-plans-updates');
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'plansUpdated') {
          handlePlansUpdate('broadcast-channel');
        }
      };
    } catch (broadcastError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('BroadcastChannel not supported, using fallback methods');
      }
    }

    // Method 3: Storage event for cross-tab communication (fallback)
    const handleStorageChange = (e) => {
      if (e.key === 'subscriptionPlansUpdated' || e.key === 'plansUpdated') {
        handlePlansUpdate('storage-event');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Method 4: Polling as additional fallback (check every 3 seconds)
    pollingInterval = setInterval(() => {
      // Check localStorage for updates
      const updateFlag = localStorage.getItem('subscriptionPlansUpdated');
      if (updateFlag) {
        try {
          const updateData = JSON.parse(updateFlag);
          const updateTime = updateData.timestamp || 0;
          // Only update if update is recent (within last 10 seconds)
          if (Date.now() - updateTime < 10000) {
            handlePlansUpdate('polling');
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }, 3000); // Check every 3 seconds

    return () => {
      window.removeEventListener('plansUpdated', handlePlansUpdate);
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
      window.removeEventListener('storage', handleStorageChange);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [userSubscription, loadUserSubscription]);

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    if (!userSubscription) return false;
    if (userSubscription.status !== 'active') return false;
    
    const endDate = new Date(userSubscription.endDate);
    const now = new Date();
    return endDate > now;
  };

  // Check if user can add more products
  const canAddProduct = () => {
    if (!hasActiveSubscription()) return false;
    
    const plan = subscriptionPlans.find(p => p.id === userSubscription.planId);
    
    let maxListings;
    if (plan) {
      // Use plan maxListings if plan exists
      maxListings = plan.maxListings;
    } else if (userSubscription.maxListings) {
      // Fallback to subscription maxListings (for custom plans like new_user_default)
      maxListings = userSubscription.maxListings;
    } else {
      return false;
    }
    
    // Unlimited listings
    if (maxListings === -1) return true;
    
    // Check current listing count
    const currentListings = userSubscription.currentListings || 0;
    return currentListings < maxListings;
  };

  // Get remaining listings
  const getRemainingListings = () => {
    if (!hasActiveSubscription()) return 0;
    
    const plan = subscriptionPlans.find(p => p.id === userSubscription.planId);
    
    let maxListings;
    if (plan) {
      // Use plan maxListings if plan exists
      maxListings = plan.maxListings;
    } else if (userSubscription.maxListings) {
      // Fallback to subscription maxListings (for custom plans like new_user_default)
      maxListings = userSubscription.maxListings;
    } else {
      return 0;
    }
    
    if (maxListings === -1) return Infinity;
    
    const currentListings = userSubscription.currentListings || 0;
    return Math.max(0, maxListings - currentListings);
  };

  // Subscribe to a plan - this is now handled by payment flow
  const subscribeToPlan = async (planId) => {
    // This method is now handled by the payment flow
    // The subscription is created during payment process
    return { success: true };
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!userSubscription) {
      return { success: false, error: 'No active subscription found' };
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${apiUrl}/subscription/cancel/${userSubscription._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUserSubscription(null);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Cancel subscription error:', error);
      }
      return { success: false, error: error.message || 'Failed to cancel subscription' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Plans
    subscriptionPlans,
    
    // User State
    userSubscription,
    loading,
    
    // Subscription Methods
    hasActiveSubscription,
    canAddProduct,
    getRemainingListings,
    subscribeToPlan,
    cancelSubscription,
    loadUserSubscription,
    refreshUserSubscription,
    
    // Setters (for testing/demo)
    setUserSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;

