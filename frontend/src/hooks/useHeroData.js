import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';
import { useApiPerformanceMonitor } from './usePerformanceMonitor';

/**
 * Custom hook for optimized hero section data loading
 * Implements parallel fetching, caching, and error handling
 */
export const useHeroData = (currentLocation = '', userCoordinates = null) => {
  const { startApiCall, endApiCall } = useApiPerformanceMonitor();
  
  const [data, setData] = useState({
    featuredProducts: [],
    featuredListings: [],
    categories: [],
    banners: []
  });
  
  const [loading, setLoading] = useState({
    featuredProducts: true,
    featuredListings: true,
    categories: true,
    banners: true
  });
  
  const [errors, setErrors] = useState({
    featuredProducts: null,
    featuredListings: null,
    categories: null,
    banners: null
  });

  // Cache for storing fetched data
  const [cache, setCache] = useState({});
  const cacheRef = useRef({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Sync cache state with ref
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  // Get cached data if valid - use ref to prevent dependency on cache state
  const getCachedData = useCallback((key) => {
    const currentCache = cacheRef.current;
    const cached = currentCache[key];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []); // No dependencies - uses ref

  // Set cached data - check if data changed to prevent unnecessary updates
  const setCachedData = useCallback((key, data) => {
    setCache(prev => {
      const existing = prev[key];
      // Check if data is the same to prevent unnecessary state updates
      if (existing && JSON.stringify(existing.data) === JSON.stringify(data)) {
        return prev; // Don't update if same data
      }
      return {
        ...prev,
        [key]: {
          data,
          timestamp: Date.now()
        }
      };
    });
  }, []);

  // Fetch featured products with caching
  const fetchFeaturedProducts = useCallback(async () => {
    const cacheKey = 'featuredProducts';
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setData(prev => ({ ...prev, featuredProducts: cachedData }));
      setLoading(prev => ({ ...prev, featuredProducts: false }));
      return;
    }

    const callId = startApiCall('getFeaturedProducts');
    
    try {
      setLoading(prev => ({ ...prev, featuredProducts: true }));
      setErrors(prev => ({ ...prev, featuredProducts: null }));
      
      const response = await apiService.getFeaturedProducts(12);
      const products = response.data?.products || [];
      
      setData(prev => ({ ...prev, featuredProducts: products }));
      setCachedData(cacheKey, products);
      endApiCall(callId, true);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setErrors(prev => ({ ...prev, featuredProducts: error.message }));
      endApiCall(callId, false, error.message);
    } finally {
      setLoading(prev => ({ ...prev, featuredProducts: false }));
    }
  }, [getCachedData, setCachedData, startApiCall, endApiCall]);

  // Fetch featured listings with caching and location filtering
  // Note: This callback is stable and doesn't depend on changing values
  const fetchFeaturedListings = useCallback(async (location = '', userCoordinates = null) => {
    // Create location-specific cache key
    let cacheKey = 'featuredListings_all_v3';
    if (userCoordinates && userCoordinates.lat && userCoordinates.lng) {
      // Include coordinates in cache key for location-specific caching
      const lat = userCoordinates.lat.toFixed(2);
      const lng = userCoordinates.lng.toFixed(2);
      cacheKey = `featuredListings_location_${lat}_${lng}_v3`;
    } else if (location) {
      // Use city name in cache key if coordinates not available
      cacheKey = `featuredListings_city_${location}_v3`;
    }
    
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData !== null && cachedData !== undefined) {
      // Use cached data if available (even if empty array)
      // Only update if data is actually different to prevent infinite loops
      setData(prev => {
        // Check if data is already the same
        const currentListings = prev.featuredListings || [];
        const isSame = Array.isArray(currentListings) && 
                      Array.isArray(cachedData) &&
                      currentListings.length === cachedData.length &&
                      currentListings.every((item, idx) => item?.id === cachedData[idx]?.id);
        
        if (isSame) {
          return prev; // Don't update if same
        }
        return { ...prev, featuredListings: cachedData };
      });
      setLoading(prev => ({ ...prev, featuredListings: false }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, featuredListings: true }));
      setErrors(prev => ({ ...prev, featuredListings: null }));
      
      // Use location-based filtering if user coordinates are available
      // Default radius: 7km (can be adjusted based on requirements)
      const serviceRadius = 7; // 7km radius for nearby listings
      
      // Extract city from location string if available
      let city = '';
      if (location) {
        // Try to extract city name from location string (e.g., "Indore, MP" -> "Indore")
        const locationParts = location.split(',');
        city = locationParts[0]?.trim() || '';
      }
      
      console.log('📍 Fetching featured listings with location filter:', { 
        location, 
        city, 
        userCoordinates, 
        serviceRadius 
      });
      
      // Pass userCoordinates and city for location-based filtering
      const response = await apiService.getFeaturedRentalRequests(
        100, // Limit: Show top 100 nearby listings
        city, 
        userCoordinates, // Pass coordinates for proximity filtering
        serviceRadius // 7km radius
      );
      const listings = response.data?.requests || [];
      
      console.log('useHeroData - Received featured listings:', listings.length);
      console.log('useHeroData - Featured listings details:', listings);
      
      // Transform listings to match expected format
      const transformedListings = listings.map(request => {
        let location = 'Location not specified';
        if (request.location?.address) {
          location = request.location.address;
        } else if (request.location?.city && request.location?.state && 
                  request.location.city !== 'Unknown' && request.location.city !== 'Not specified' &&
                  request.location.city.trim() !== '' &&
                  request.location.state !== 'Unknown' && request.location.state !== 'Not specified' &&
                  request.location.state.trim() !== '') {
          location = `${request.location.city}, ${request.location.state}`;
        }
        
        return {
          id: request._id,
          title: request.title,
          description: request.description,
          price: request.price?.amount || 0,
          location: location,
          images: request.images ? (() => {
            const sortedImages = [...request.images].sort((a, b) => {
              if (a.isPrimary && !b.isPrimary) return -1;
              if (!a.isPrimary && b.isPrimary) return 1;
              return 0;
            });
            return sortedImages.map(img => img.url);
          })() : [],
          video: request.video?.url || null,
          postedDate: request.createdAt,
          category: request.category?.name || 'General',
          product: request.product?.name || 'General',
          condition: 'Good',
          owner: request.user,
          averageRating: 0,
          totalReviews: 0,
          isBoosted: false
        };
      });
      
      setData(prev => ({ ...prev, featuredListings: transformedListings }));
      setCachedData(cacheKey, transformedListings);
    } catch (error) {
      console.error('Error fetching featured listings:', error);
      setErrors(prev => ({ ...prev, featuredListings: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, featuredListings: false }));
    }
  }, [getCachedData, setCachedData, startApiCall, endApiCall]);

  // Fetch categories with caching
  const fetchCategories = useCallback(async () => {
    const cacheKey = 'categories';
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setData(prev => ({ ...prev, categories: cachedData }));
      setLoading(prev => ({ ...prev, categories: false }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, categories: true }));
      setErrors(prev => ({ ...prev, categories: null }));
      
      const response = await apiService.getPublicCategories(1, 50);
      const categories = response.data?.categories || [];
      
      setData(prev => ({ ...prev, categories: categories }));
      setCachedData(cacheKey, categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setErrors(prev => ({ ...prev, categories: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, [getCachedData, setCachedData]);

  // Fetch banners with caching
  const fetchBanners = useCallback(async () => {
    const cacheKey = 'banners';
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setData(prev => ({ ...prev, banners: cachedData }));
      setLoading(prev => ({ ...prev, banners: false }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, banners: true }));
      setErrors(prev => ({ ...prev, banners: null }));
      
      const response = await apiService.getPublicBanners('top', 5);
      const banners = response.data?.banners || [];
      
      setData(prev => ({ ...prev, banners: banners }));
      setCachedData(cacheKey, banners);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setErrors(prev => ({ ...prev, banners: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, banners: false }));
    }
  }, [getCachedData, setCachedData]);

  // Track if data has been loaded to prevent infinite loops
  const hasLoadedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Track previous location and coordinates to prevent unnecessary re-fetches
  const prevLocationRef = useRef('');
  const prevCoordinatesRef = useRef(null);

  // Initialize data loading only once on mount (without location)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    console.log('🚀 Initializing hero section data loading...');
    
    // Load non-location-dependent data first
    const promises = [
      fetchFeaturedProducts(),
      fetchCategories(),
      fetchBanners()
    ];

    Promise.allSettled(promises).then(() => {
      console.log('✅ Initial hero section data loading completed');
    }).catch((error) => {
      console.error('❌ Error in initial data loading:', error);
    });
  }, [fetchFeaturedProducts, fetchCategories, fetchBanners]); // Only run once on mount

  // Load featured listings with location on mount or when location becomes available
  useEffect(() => {
    // Create stable reference strings for comparison
    const currentLocStr = currentLocation || '';
    const currentCoordsStr = userCoordinates 
      ? `${userCoordinates.lat?.toFixed(4)}_${userCoordinates.lng?.toFixed(4)}`
      : '';
    const prevLocStr = prevLocationRef.current || '';
    const prevCoordsStr = prevCoordinatesRef.current
      ? `${prevCoordinatesRef.current.lat?.toFixed(4)}_${prevCoordinatesRef.current.lng?.toFixed(4)}`
      : '';
    
    // Check if location or coordinates actually changed
    const locationChanged = currentLocStr !== prevLocStr;
    const coordinatesChanged = currentCoordsStr !== prevCoordsStr;
    
    // Only fetch if location/coordinates actually changed OR if we haven't loaded yet
    const shouldFetch = !hasLoadedRef.current || locationChanged || coordinatesChanged;
    
    if (!shouldFetch) {
      return; // Early return to prevent unnecessary work
    }
    
    // Update refs before fetching to prevent re-triggering
    prevLocationRef.current = currentLocStr;
    prevCoordinatesRef.current = userCoordinates 
      ? { lat: userCoordinates.lat, lng: userCoordinates.lng }
      : null;
    hasLoadedRef.current = true;
    
    // Load featured listings
    if (currentLocStr || currentCoordsStr) {
      console.log('📍 Loading featured listings with location:', { currentLocation: currentLocStr, userCoordinates });
      fetchFeaturedListings(currentLocStr, userCoordinates);
    } else {
      // If no location available but haven't loaded yet, load without location filter
      console.log('📍 Loading featured listings without location filter');
      fetchFeaturedListings('', null);
    }
    // Don't include fetchFeaturedListings in deps - it's stable now
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, userCoordinates?.lat, userCoordinates?.lng]);

  // Refresh specific data
  const refreshData = useCallback((type) => {
    switch (type) {
      case 'products':
        fetchFeaturedProducts();
        break;
      case 'listings':
        hasLoadedRef.current = false; // Reset flag to allow re-fetch
        fetchFeaturedListings(currentLocation, userCoordinates);
        break;
      case 'categories':
        fetchCategories();
        break;
      case 'banners':
        fetchBanners();
        break;
      default:
        // Full refresh - reset flags and reload all data
        hasLoadedRef.current = false;
        hasInitializedRef.current = false;
        fetchFeaturedProducts();
        fetchFeaturedListings(currentLocation, userCoordinates);
        fetchCategories();
        fetchBanners();
    }
  }, [fetchFeaturedProducts, fetchFeaturedListings, fetchCategories, fetchBanners, currentLocation, userCoordinates]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
    hasLoadedRef.current = false; // Reset loaded flag
  }, []);

  // Check if any data is still loading
  const isLoading = Object.values(loading).some(loading => loading);
  
  // Check if any errors occurred
  const hasErrors = Object.values(errors).some(error => error !== null);

  return {
    data,
    loading,
    errors,
    isLoading,
    hasErrors,
    refreshData,
    clearCache
  };
};