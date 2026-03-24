import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Zap, Star } from 'lucide-react';
import apiService from '../../services/api';

const AdBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Touch/swipe functionality
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const bannerRef = useRef(null);
  
  // Auto-slide functionality
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Fetch banners from API with caching
  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cacheKey = 'banners_cache';
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheKey + '_time');
      const now = Date.now();
      
      // Use cache if it's less than 5 minutes old
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 5 * 60 * 1000) {
        const cachedBanners = JSON.parse(cachedData);
        setBanners(cachedBanners);
        setLoading(false);
        return;
      }
      
      // Fetch banners from the public API
      const response = await apiService.getPublicBanners('', 5); // Reduced to 5 banners for faster loading
      
      if (response.success && response.data.banners) {
        setBanners(response.data.banners);
        // Cache the banners
        localStorage.setItem(cacheKey, JSON.stringify(response.data.banners));
        localStorage.setItem(cacheKey + '_time', now.toString());
        
        // Preload images for faster display with proper error handling
        response.data.banners.forEach((banner, index) => {
          if (banner.banner) {
            const img = new Image();
            // Ensure Cloudinary URLs are properly formatted
            let imageUrl = banner.banner;
            // Convert http to https for Cloudinary URLs
            if (imageUrl.includes('cloudinary.com') && imageUrl.startsWith('http://')) {
              imageUrl = imageUrl.replace('http://', 'https://');
            }
            img.src = imageUrl;
            img.onload = () => {
              if (process.env.NODE_ENV === 'development') {
                console.log(`Banner ${index + 1} preloaded successfully`);
              }
            };
            img.onerror = () => {
              console.warn(`Banner ${index + 1} failed to preload:`, imageUrl);
            };
          }
        });
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError('Failed to load banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    
    // Refresh banners every 2 minutes to get updates from admin (less frequent for better performance)
    const refreshInterval = setInterval(() => {
      fetchBanners();
    }, 120000); // 2 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh banners when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBanners();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-slide function
  const startAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (banners.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
  }, [banners.length, isPaused]);

  // Auto-rotate banner every 5 seconds (only if we have banners and not paused)
  useEffect(() => {
    startAutoSlide();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startAutoSlide]);

  // Reset auto-slide timer when user manually navigates
  const resetAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Restart auto-slide after a short delay
    setTimeout(() => {
      startAutoSlide();
    }, 1000);
  }, [startAutoSlide]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    resetAutoSlide(); // Reset auto-slide timer when user manually navigates
  };

  // Touch/swipe handlers
  const minSwipeDistance = 50; // Minimum distance for a swipe

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && banners.length > 1) {
      // Swipe left - go to next banner
      setCurrentIndex((prev) => (prev + 1) % banners.length);
      resetAutoSlide(); // Reset auto-slide timer
    }
    if (isRightSwipe && banners.length > 1) {
      // Swipe right - go to previous banner
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
      resetAutoSlide(); // Reset auto-slide timer
    }
    
    setIsDragging(false);
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setTouchStart(e.clientX);
    setTouchEnd(null);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTouchEnd(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && banners.length > 1) {
      // Swipe left - go to next banner
      setCurrentIndex((prev) => (prev + 1) % banners.length);
      resetAutoSlide(); // Reset auto-slide timer
    }
    if (isRightSwipe && banners.length > 1) {
      // Swipe right - go to previous banner
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
      resetAutoSlide(); // Reset auto-slide timer
    }
    
    setIsDragging(false);
  };


  

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20 animate-pulse" />
      <div className="relative rounded-3xl overflow-hidden">
        {loading ? (
          <div className="w-full h-44 sm:h-56 md:h-64 lg:h-72 xl:h-80 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-3xl animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-3 animate-bounce"></div>
                <p className="text-sm text-gray-500 font-medium">Loading banners...</p>
              </div>
            </div>
          </div>
        ) : (
          <div 
            ref={bannerRef}
            className={`relative w-full h-44 sm:h-56 md:h-64 lg:h-72 xl:h-96 bg-gray-100 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseEnter={() => setIsPaused(true)} // Pause auto-slide on hover
            onMouseLeave={(e) => {
              handleMouseUp(); // Handle mouse up
              setIsPaused(false); // Resume auto-slide when mouse leaves
            }}
            style={{ userSelect: 'none' }}
          >
            {banners.map((banner, index) => {
              // Normalize Cloudinary URL - ensure https and proper format
              let imageUrl = banner.banner || '';
              if (imageUrl && imageUrl.includes('cloudinary.com')) {
                // Convert http to https for Cloudinary URLs
                if (imageUrl.startsWith('http://')) {
                  imageUrl = imageUrl.replace('http://', 'https://');
                }
                // Ensure secure_url format if it's a Cloudinary URL
                if (!imageUrl.includes('secure_url') && imageUrl.includes('res.cloudinary.com')) {
                  // URL is already in correct format
                }
              }

              return (
                <div
                  key={banner._id || index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img 
                    src={imageUrl} 
                    alt={banner.title || `RentYatra Banner ${index + 1}`} 
                    className="w-full h-full rounded-3xl shadow-2xl"
                    style={{ objectFit: 'fill' }}
                    loading={index === 0 ? 'eager' : 'lazy'} // First image loads immediately, others lazy load
                    decoding="async" // Non-blocking image decoding
                    referrerPolicy="no-referrer-when-downgrade" // Prevent CORS issues
                    onLoad={(e) => {
                      const img = e.target;
                      // Ensure image fills container properly
                      img.style.minHeight = '100%';
                      img.style.minWidth = '100%';
                      // Add fade-in effect
                      img.style.opacity = '0';
                      img.style.transition = 'opacity 0.3s ease-in-out';
                      setTimeout(() => {
                        img.style.opacity = '1';
                      }, 50);
                    }}
                    onError={(e) => {
                      console.error('Banner image failed to load:', imageUrl);
                      // Retry with https if it was http
                      if (imageUrl && imageUrl.includes('http://')) {
                        const retryUrl = imageUrl.replace('http://', 'https://');
                        e.currentTarget.src = retryUrl;
                        return;
                      }
                      // Show fallback instead of hiding
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkJhbm5lciBJbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        
        {/* Banner Indicators */}
        {!loading && banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdBanner;