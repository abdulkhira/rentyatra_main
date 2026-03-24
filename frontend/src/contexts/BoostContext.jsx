import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const BoostContext = createContext();

export const useBoost = () => {
  const context = useContext(BoostContext);
  if (!context) {
    console.error('useBoost must be used within a BoostProvider');
    // Return default values instead of throwing error to prevent crashes
    return {
      boostCredits: {
        freeBoosts: 2,
        purchasedBoosts: 0,
        usedBoosts: 0,
        remainingBoosts: 2
      },
      loading: false,
      useBoostCredit: () => Promise.resolve({ success: false, message: 'Boost context not available' }),
      addBoostCredits: () => {},
      updateBoostCredits: () => {},
      getRemainingBoosts: () => 2,
      hasBoostCredits: () => true,
      getBoostStatus: () => ({ hasCredits: true, remainingBoosts: 2 }),
      resetBoostCredits: () => {},
      loadBoostCredits: () => {}
    };
  }
  return context;
};

export const BoostProvider = ({ children }) => {
  // Safely get user from auth context
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (error) {
    console.warn('Auth context not available in BoostProvider:', error);
  }

  const [boostCredits, setBoostCredits] = useState({
    freeBoosts: 2, // Free boosts given to new users
    purchasedBoosts: 0, // Boosts from purchased packages
    usedBoosts: 0, // Total boosts used
    remainingBoosts: 2 // Calculated remaining boosts
  });
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false); // Prevent multiple simultaneous calls

  // Load boost credits from localStorage or API
  useEffect(() => {
    if (user?.id || user?._id) {
      loadBoostCredits();
    } else {
      // Reset to defaults if no user
      const defaultCredits = {
        freeBoosts: 2,
        purchasedBoosts: 0,
        usedBoosts: 0,
        remainingBoosts: 2
      };
      setBoostCredits(defaultCredits);
    }
  }, [user]);

  const loadBoostCredits = async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) {
      console.log('⏸️ Boost credits already loading, skipping duplicate call');
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      // CRITICAL: Always fetch from API first to get latest data from database
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found, using default credits');
          const defaultCredits = {
            freeBoosts: 2,
            purchasedBoosts: 0,
            usedBoosts: 0,
            remainingBoosts: 2
          };
          setBoostCredits(defaultCredits);
          return;
        }
        
        const response = await fetch(`${apiUrl}/boost/credits`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.boostCredits) {
            // CRITICAL: Use API data and update localStorage
            console.log('✅ Boost credits loaded from API:', data.boostCredits);
            setBoostCredits(data.boostCredits);
            localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(data.boostCredits));
            return;
          } else {
            console.warn('⚠️ API response success but no boostCredits data');
          }
        } else {
          console.warn('⚠️ API response not OK, status:', response.status);
        }
      } catch (apiError) {
        console.error('❌ Error fetching boost credits from API:', apiError);
        // Continue to localStorage fallback
      }
      
      // Fallback to localStorage ONLY if API fails
      const savedCredits = localStorage.getItem(`boostCredits_${user?.id || user?._id}`);
      if (savedCredits) {
        try {
          const credits = JSON.parse(savedCredits);
          // CRITICAL: Validate credits data - ensure it's not corrupted
          if (credits && typeof credits.remainingBoosts === 'number' && credits.remainingBoosts >= 0) {
            // Recalculate remainingBoosts to ensure it's correct
            const calculatedRemaining = (credits.freeBoosts || 0) + (credits.purchasedBoosts || 0) - (credits.usedBoosts || 0);
            
            // If calculated value differs significantly, reset to defaults
            if (Math.abs(calculatedRemaining - credits.remainingBoosts) > 10) {
              console.warn('⚠️ Boost credits mismatch detected, resetting to defaults');
              const defaultCredits = {
                freeBoosts: 2,
                purchasedBoosts: 0,
                usedBoosts: 0,
                remainingBoosts: 2
              };
              setBoostCredits(defaultCredits);
              localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(defaultCredits));
            } else {
              // Update remainingBoosts to calculated value
              credits.remainingBoosts = calculatedRemaining;
              setBoostCredits(credits);
            }
          } else {
            // Invalid data, reset to defaults
            console.warn('⚠️ Invalid boost credits in localStorage, resetting to defaults');
            const defaultCredits = {
              freeBoosts: 2,
              purchasedBoosts: 0,
              usedBoosts: 0,
              remainingBoosts: 2
            };
            setBoostCredits(defaultCredits);
            localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(defaultCredits));
          }
        } catch (parseError) {
          console.error('❌ Error parsing saved credits:', parseError);
          // Reset to defaults
          const defaultCredits = {
            freeBoosts: 2,
            purchasedBoosts: 0,
            usedBoosts: 0,
            remainingBoosts: 2
          };
          setBoostCredits(defaultCredits);
          localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(defaultCredits));
        }
      } else {
        // No saved credits - initialize with default free boosts for new users
        const defaultCredits = {
          freeBoosts: 2,
          purchasedBoosts: 0,
          usedBoosts: 0,
          remainingBoosts: 2
        };
        setBoostCredits(defaultCredits);
        localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(defaultCredits));
      }
    } catch (error) {
      console.error('❌ Error loading boost credits:', error);
      // Set defaults on error
      const defaultCredits = {
        freeBoosts: 2,
        purchasedBoosts: 0,
        usedBoosts: 0,
        remainingBoosts: 2
      };
      setBoostCredits(defaultCredits);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const useBoostCredit = async (rentalId) => {
    try {
      if (boostCredits.remainingBoosts <= 0) {
        throw new Error('No boost credits remaining');
      }

      // Update credits
      const updatedCredits = {
        ...boostCredits,
        usedBoosts: boostCredits.usedBoosts + 1,
        remainingBoosts: boostCredits.remainingBoosts - 1
      };

      setBoostCredits(updatedCredits);
      
      // Save to localStorage
      if (user?.id || user?._id) {
        localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(updatedCredits));
      }

      // Here you would typically call an API to actually boost the rental
      // For now, we'll just simulate the boost
      console.log(`Boosted rental ${rentalId} using free credit`);
      
      return { success: true, message: 'Rental boosted successfully!' };
    } catch (error) {
      console.error('Error using boost credit:', error);
      throw error;
    }
  };

  const addBoostCredits = (amount, type = 'purchased') => {
    const updatedCredits = {
      ...boostCredits,
      [type === 'purchased' ? 'purchasedBoosts' : 'freeBoosts']: 
        boostCredits[type === 'purchased' ? 'purchasedBoosts' : 'freeBoosts'] + amount
    };
    
    // Recalculate remaining boosts correctly: freeBoosts + purchasedBoosts - usedBoosts
    updatedCredits.remainingBoosts = updatedCredits.freeBoosts + updatedCredits.purchasedBoosts - updatedCredits.usedBoosts;

    setBoostCredits(updatedCredits);
    if (user?.id || user?._id) {
      localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(updatedCredits));
    }
  };

  const updateBoostCredits = (newCredits) => {
    setBoostCredits(newCredits);
    if (user?.id || user?._id) {
      localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(newCredits));
    }
  };

  const getRemainingBoosts = () => {
    return boostCredits.remainingBoosts;
  };

  const hasBoostCredits = () => {
    return boostCredits.remainingBoosts > 0;
  };

  const getBoostStatus = () => {
    return {
      hasCredits: boostCredits.remainingBoosts > 0,
      remainingBoosts: boostCredits.remainingBoosts,
      usedBoosts: boostCredits.usedBoosts,
      totalBoosts: boostCredits.freeBoosts + boostCredits.purchasedBoosts,
      freeBoosts: boostCredits.freeBoosts,
      purchasedBoosts: boostCredits.purchasedBoosts
    };
  };

  const resetBoostCredits = () => {
    const defaultCredits = {
      freeBoosts: 2,
      purchasedBoosts: 0,
      usedBoosts: 0,
      remainingBoosts: 2
    };
    setBoostCredits(defaultCredits);
    if (user?.id || user?._id) {
      localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(defaultCredits));
    }
    // Also reload from API to sync with backend
    if (user?.id || user?._id) {
      loadBoostCredits();
    }
  };
  
  // Force reload boost credits from API (clears localStorage cache)
  const forceReloadBoostCredits = async () => {
    if (!user?.id && !user?._id) return;
    
    try {
      setLoading(true);
      // Clear localStorage first
      localStorage.removeItem(`boostCredits_${user?.id || user?._id}`);
      
      // Fetch fresh from API
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const token = localStorage.getItem('token');
      
      if (token) {
        const response = await fetch(`${apiUrl}/boost/credits`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.boostCredits) {
            console.log('✅ Boost credits force reloaded from API:', data.boostCredits);
            setBoostCredits(data.boostCredits);
            localStorage.setItem(`boostCredits_${user?.id || user?._id}`, JSON.stringify(data.boostCredits));
          }
        }
      }
    } catch (error) {
      console.error('❌ Error force reloading boost credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    boostCredits,
    loading,
    useBoostCredit,
    addBoostCredits,
    updateBoostCredits,
    getRemainingBoosts,
    hasBoostCredits,
    getBoostStatus,
    resetBoostCredits,
    loadBoostCredits,
    forceReloadBoostCredits
  };

  return (
    <BoostContext.Provider value={value}>
      {children}
    </BoostContext.Provider>
  );
};

export default BoostContext;
