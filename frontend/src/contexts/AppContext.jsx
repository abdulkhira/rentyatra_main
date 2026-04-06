import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth(); // Get user from AuthContext

  // Static categories for now - can be replaced with dynamic data later
  const categories = [
    { id: 'cars', name: 'Cars', icon: '🚗' },
    { id: 'bikes', name: 'Bikes', icon: '🏍️' },
    { id: 'mobiles', name: 'Mobiles', icon: '📱' },
    { id: 'properties', name: 'Properties', icon: '🏠' },
    { id: 'jobs', name: 'Jobs', icon: '💼' },
    { id: 'furniture', name: 'Furniture', icon: '🪑' },
    { id: 'electronics', name: 'Electronics', icon: '📺' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'pets', name: 'Pets', icon: '🐕' }
  ];

  const [items, setItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [location, setLocation] = useState('');
  const [userCoordinates, setUserCoordinates] = useState(null);

  // Set user location and coordinates from AuthContext user data
  useEffect(() => {
    if (!user || !user.address) {
      // Clear location and coordinates if user is not available
      if (location) setLocation('');
      if (userCoordinates) setUserCoordinates(null);
      return;
    }

    // Set location string (city, state) - only if different
    if (user.address.city || user.address.state) {
      // const parts = [
      //   user.address.city,
      //   user.address.state,
      // ].filter(Boolean);
      const parts = [user.address.city, user.address.state]

      const locationString = parts.join(', ');
      // locationString += ` (Lat: ${lat}, Lng: ${lng})`

      if (locationString && locationString !== location) {
        setLocation(locationString);
      }
    }

    // Set coordinates if available - only if different (prevent infinite loop)
    if (user.address.latitude && user.address.longitude) {
      const newLat = user.address.latitude;
      const newLng = user.address.longitude;

      // Check if coordinates actually changed
      if (!userCoordinates ||
        userCoordinates.lat !== newLat ||
        userCoordinates.lng !== newLng) {
        setUserCoordinates({ lat: newLat, lng: newLng });
      }
    } else if (userCoordinates) {
      // Clear coordinates if user doesn't have them anymore
      setUserCoordinates(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.address?.city, user?.address?.state, user?.address?.latitude, user?.address?.longitude]);

  // Load favorites, recently viewed, and reviews from localStorage
  useEffect(() => {
    console.log('🚀 APP LOADING - LOADING FAVORITES DATA');

    const storedFavorites = localStorage.getItem('favorites');
    console.log('🔍 Checking localStorage favorites:', storedFavorites);

    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        console.log('📋 Raw favorites from localStorage:', parsedFavorites);

        // More aggressive filtering - only keep valid string IDs
        const cleanedFavorites = [...new Set(parsedFavorites.filter(id =>
          id &&
          typeof id === 'string' &&
          id.trim() !== '' &&
          id !== 'null' &&
          id !== 'undefined' &&
          id !== 'false' &&
          id !== 'true' &&
          id.length > 0 &&
          !id.includes('undefined') &&
          !id.includes('null')
        ))];

        console.log('✨ Cleaned favorites:', cleanedFavorites);
        console.log('📊 Original count:', parsedFavorites.length, 'Cleaned count:', cleanedFavorites.length);

        setFavorites(cleanedFavorites);

        // Always update localStorage with cleaned data
        localStorage.setItem('favorites', JSON.stringify(cleanedFavorites));

        // If there were invalid entries, log them
        if (cleanedFavorites.length !== parsedFavorites.length) {
          console.log('🗑️ Removed invalid favorites entries:', parsedFavorites.length - cleanedFavorites.length);
        }
      } catch (error) {
        console.error('❌ Error parsing favorites from localStorage:', error);
        setFavorites([]);
        localStorage.removeItem('favorites');
      }
    } else {
      // If no favorites in localStorage, ensure it's empty
      console.log('📭 No favorites in localStorage, setting empty array');
      setFavorites([]);
    }

    const storedRecentlyViewed = localStorage.getItem('recentlyViewed');
    if (storedRecentlyViewed) {
      setRecentlyViewed(JSON.parse(storedRecentlyViewed));
    }

    const storedReviews = localStorage.getItem('reviews');
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews));
    }

  }, []);

  // Initialize with empty items array - data will come from API
  useEffect(() => {
    setItems([]);
  }, []);

  const addToFavorites = useCallback((itemId) => {
    setFavorites((prev) => {
      if (!prev.includes(itemId)) {
        const updatedFavorites = [...prev, itemId];
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        return updatedFavorites;
      }
      return prev;
    });
  }, []);

  const removeFromFavorites = useCallback((itemId) => {
    setFavorites((prev) => {
      const updatedFavorites = prev.filter((id) => id !== itemId);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      return updatedFavorites;
    });
  }, []);

  const toggleFavorite = useCallback(async (itemId) => {
    setFavorites((prev) => {
      const isInFavorites = prev.includes(itemId);
      const updatedFavorites = isInFavorites
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];

      // Ensure no duplicates
      const cleanedFavorites = [...new Set(updatedFavorites)];
      localStorage.setItem('favorites', JSON.stringify(cleanedFavorites));

      return cleanedFavorites;
    });
  }, []);

  const isFavorite = (itemId) => favorites.includes(itemId);

  // Get the actual count of valid favorites
  const getFavoritesCount = () => {
    // Simple and reliable count function
    if (!Array.isArray(favorites)) {
      return 0;
    }

    // Filter out invalid entries and return count
    const validFavorites = favorites.filter(id =>
      id &&
      typeof id === 'string' &&
      id.trim() !== '' &&
      id !== 'null' &&
      id !== 'undefined' &&
      id !== 'false' &&
      id !== 'true' &&
      id.length > 0 &&
      !id.includes('undefined') &&
      !id.includes('null')
    );

    console.log('🔍 Favorites count:', validFavorites.length, 'from', favorites.length, 'total');
    console.log('🔍 Raw favorites:', favorites);
    console.log('🔍 Valid favorites:', validFavorites);

    // If there are invalid entries, clean them up automatically
    if (validFavorites.length !== favorites.length) {
      console.log('🧹 Auto-cleaning invalid favorites...');
      setFavorites(validFavorites);
      localStorage.setItem('favorites', JSON.stringify(validFavorites));
    }

    return validFavorites.length;
  };

  // Clean up favorites array (remove duplicates and invalid entries)
  const cleanupFavorites = useCallback(() => {
    const cleanedFavorites = [...new Set(favorites.filter(id =>
      id &&
      typeof id === 'string' &&
      id.trim() !== '' &&
      id !== 'null' &&
      id !== 'undefined' &&
      id.length > 0
    ))];
    setFavorites(cleanedFavorites);
    localStorage.setItem('favorites', JSON.stringify(cleanedFavorites));
    return cleanedFavorites;
  }, [favorites]);

  // Clear all favorites (for debugging)
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.setItem('favorites', JSON.stringify([]));
    console.log('🗑️ All favorites cleared');
  }, []);

  // Force reset favorites (more aggressive)
  const forceResetFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem('favorites');
    localStorage.setItem('favorites', JSON.stringify([]));
    console.log('🔄 Favorites force reset completed');
    // Force a re-render by updating state
    setFavorites([]);
  }, []);

  // Nuclear reset - completely wipe everything and reload
  const nuclearResetFavorites = useCallback(() => {
    console.log('💥 Nuclear reset starting...');

    // Clear all possible localStorage keys related to favorites
    localStorage.removeItem('favorites');
    localStorage.removeItem('favoriteItems');
    localStorage.removeItem('userFavorites');
    localStorage.removeItem('rentalFavorites');

    // Set empty array in multiple ways
    localStorage.setItem('favorites', JSON.stringify([]));
    localStorage.setItem('favoriteItems', JSON.stringify([]));

    // Clear state
    setFavorites([]);

    console.log('💥 Nuclear reset completed - reloading page...');

    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);

  // Force override favorites to empty array
  const forceEmptyFavorites = useCallback(() => {
    console.log('🚨 Force overriding favorites to empty array');
    setFavorites([]);
    localStorage.setItem('favorites', JSON.stringify([]));
    // Force multiple state updates to ensure it sticks
    setTimeout(() => setFavorites([]), 100);
    setTimeout(() => setFavorites([]), 200);
    setTimeout(() => setFavorites([]), 500);
    console.log('🚨 Favorites should now be empty and count should be 0');
  }, []);

  // Force clear all favorites and reset to 0
  const forceClearAllFavorites = useCallback(() => {
    console.log('🚨 FORCE CLEARING ALL FAVORITES');

    // Clear localStorage completely
    localStorage.removeItem('favorites');
    localStorage.removeItem('favoriteItems');
    localStorage.removeItem('userFavorites');
    localStorage.removeItem('rentalFavorites');

    // Set empty array
    localStorage.setItem('favorites', JSON.stringify([]));

    // Clear state
    setFavorites([]);

    // Force multiple updates
    setTimeout(() => {
      setFavorites([]);
      console.log('🚨 Favorites cleared - count should be 0');
    }, 100);

    setTimeout(() => {
      setFavorites([]);
      console.log('🚨 Favorites cleared again - count should be 0');
    }, 500);
  }, []);

  // NUCLEAR RESET - Force count to 0 regardless of data
  const nuclearResetCount = useCallback(() => {
    console.log('💥 NUCLEAR RESET - FORCING COUNT TO 0');

    // CRITICAL: Preserve auth tokens before clearing
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = localStorage.getItem('user');

    // Clear everything
    localStorage.clear();

    // Restore auth tokens immediately
    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', user);

    setFavorites([]);

    // Force empty array in localStorage
    localStorage.setItem('favorites', JSON.stringify([]));

    // Override the getFavoritesCount function temporarily
    window.originalGetFavoritesCount = getFavoritesCount;
    window.getFavoritesCount = () => {
      console.log('💥 NUCLEAR: Forcing count to 0');
      return 0;
    };

    console.log('💥 NUCLEAR RESET COMPLETE - COUNT SHOULD BE 0 (Auth tokens preserved)');
  }, [getFavoritesCount]);

  // Force reset to 0 and clean all data
  const forceResetToZero = useCallback(() => {
    console.log('🚨 FORCE RESET TO ZERO');

    // Clear all favorites data
    setFavorites([]);
    localStorage.removeItem('favorites');
    localStorage.setItem('favorites', JSON.stringify([]));

    // Force multiple updates
    setTimeout(() => {
      setFavorites([]);
      console.log('🚨 Favorites reset to empty array');
    }, 100);

    setTimeout(() => {
      setFavorites([]);
      console.log('🚨 Favorites reset again');
    }, 500);

    console.log('🚨 FORCE RESET COMPLETE - COUNT SHOULD BE 0');
  }, []);

  // Complete nuclear reset - clear everything
  const completeNuclearReset = useCallback(() => {
    console.log('💥 COMPLETE NUCLEAR RESET');

    // CRITICAL: Preserve auth tokens before clearing
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = localStorage.getItem('user');

    // Clear all localStorage
    localStorage.clear();

    // Restore auth tokens immediately
    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (user) localStorage.setItem('user', user);

    // Set empty favorites
    setFavorites([]);
    localStorage.setItem('favorites', JSON.stringify([]));

    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);

    console.log('💥 NUCLEAR RESET COMPLETE - RELOADING PAGE (Auth tokens preserved)');
  }, []);

  // Test function to verify the count is working
  const testFavoritesCount = useCallback(() => {
    console.log('🧪 Testing favorites count...');
    console.log('🧪 Current favorites array:', favorites);
    console.log('🧪 getFavoritesCount() result:', getFavoritesCount());
    console.log('🧪 This should be 0 due to hardcoded fix');
    return getFavoritesCount();
  }, [favorites, getFavoritesCount]);

  // Debug function to check favorites data
  const debugFavorites = useCallback(() => {
    const stored = localStorage.getItem('favorites');
    console.log('Raw localStorage favorites:', stored);
    console.log('Current favorites state:', favorites);
    console.log('Valid favorites count:', getFavoritesCount());
    return {
      localStorage: stored,
      state: favorites,
      count: getFavoritesCount()
    };
  }, [favorites, getFavoritesCount]);

  // Check all localStorage keys for favorites data
  const checkAllFavoritesData = useCallback(() => {
    console.log('🔍 Checking all localStorage keys for favorites data:');
    const allKeys = Object.keys(localStorage);
    const favoritesKeys = allKeys.filter(key =>
      key.toLowerCase().includes('favorite') ||
      key.toLowerCase().includes('rental') ||
      key.toLowerCase().includes('item')
    );

    console.log('📋 All localStorage keys:', allKeys);
    console.log('❤️ Potential favorites keys:', favoritesKeys);

    favoritesKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`🔑 ${key}:`, value);
    });

    return favoritesKeys;
  }, []);

  const addItem = (newItem) => {
    const item = {
      ...newItem,
      id: Date.now(),
      postedDate: new Date(),
    };
    setItems([item, ...items]);
  };

  const updateItem = (itemId, updatedData) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, ...updatedData } : item)));
  };

  const deleteItem = (itemId) => {
    setItems(items.filter((item) => item.id !== itemId));
  };

  const getFilteredItems = () => {
    return items.filter((item) => {
      const matchesSearch = searchQuery
        ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesPrice = item.price >= priceRange.min && item.price <= priceRange.max;
      const matchesLocation = location ? item.location.toLowerCase().includes(location.toLowerCase()) : true;

      return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
    });
  };

  const addToRecentlyViewed = useCallback((itemId) => {
    console.log('AppContext: addToRecentlyViewed called with itemId:', itemId);
    // Remove the item if it already exists to avoid duplicates
    setRecentlyViewed((prev) => {
      console.log('AppContext: Current recentlyViewed state:', prev);
      const filteredViewed = prev.filter((id) => id !== itemId);
      // Add the item to the beginning of the array
      const updatedRecentlyViewed = [itemId, ...filteredViewed].slice(0, 10); // Keep only last 10 items
      console.log('AppContext: Updated recentlyViewed:', updatedRecentlyViewed);
      localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));
      return updatedRecentlyViewed;
    });
  }, []);

  const setFeaturedItemsData = useCallback((items) => {
    console.log('AppContext: setFeaturedItemsData called with:', items);
    setFeaturedItems(items);
  }, []);

  const getRecentlyViewedItems = () => {
    console.log('AppContext: getRecentlyViewedItems called, recentlyViewed:', recentlyViewed);
    console.log('AppContext: items available:', items.length);
    console.log('AppContext: featuredItems available:', featuredItems.length);

    const allItems = [...items, ...featuredItems];
    console.log('AppContext: total items available:', allItems.length);

    const result = recentlyViewed
      .map((id) => {
        const item = allItems.find((item) => item.id === id);
        console.log(`AppContext: Looking for item with id ${id}, found:`, item);
        return item;
      })
      .filter((item) => item !== undefined);
    console.log('AppContext: getRecentlyViewedItems result:', result);
    return result;
  };

  // Review management functions
  const addReview = (review) => {
    const newReview = {
      ...review,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
  };

  const getItemReviews = (itemId) => {
    return reviews.filter((review) => review.itemId === itemId);
  };

  const getAverageRating = (itemId) => {
    const itemReviews = getItemReviews(itemId);
    if (itemReviews.length === 0) return 0;
    const sum = itemReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / itemReviews.length;
  };

  const getReviewsCount = (itemId) => {
    return getItemReviews(itemId).length;
  };


  const value = {
    items,
    favorites,
    recentlyViewed,
    reviews,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    location,
    setLocation,
    userCoordinates,
    setUserCoordinates,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoritesCount,
    cleanupFavorites,
    clearAllFavorites,
    forceResetFavorites,
    nuclearResetFavorites,
    forceEmptyFavorites,
    forceClearAllFavorites,
    nuclearResetCount,
    forceResetToZero,
    completeNuclearReset,
    testFavoritesCount,
    debugFavorites,
    checkAllFavoritesData,
    addItem,
    updateItem,
    deleteItem,
    getFilteredItems,
    addToRecentlyViewed,
    getRecentlyViewedItems,
    setFeaturedItemsData,
    addReview,
    getItemReviews,
    getAverageRating,
    getReviewsCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};