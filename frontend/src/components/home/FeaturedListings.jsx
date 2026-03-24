import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Heart, Loader2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import StarRating from '../common/StarRating';
import ImageCarousel from '../common/ImageCarousel';
import { FeaturedListingsSkeleton } from '../common/SkeletonLoader';
import { useHeroData } from '../../hooks/useHeroData';
import { format } from 'date-fns';

const FeaturedListings = memo(() => {
  const { toggleFavorite, isFavorite, getAverageRating, getReviewsCount, setSelectedCategory, addToRecentlyViewed, setFeaturedItemsData, location, userCoordinates } = useApp();
  const navigate = useNavigate();
  const [animatingHeart, setAnimatingHeart] = useState(null);
  
  // Use optimized hero data hook with current location and coordinates
  const { data, loading: heroLoading, errors } = useHeroData(location, userCoordinates);
  const { featuredListings: featuredItems } = data;
  const { featuredListings: listingsLoading } = heroLoading;
  const { featuredListings: error } = errors;

  // Debug: Log featured items count
  useEffect(() => {
    console.log('FeaturedListings - Total items:', featuredItems?.length || 0);
    console.log('FeaturedListings - Items:', featuredItems);
  }, [featuredItems]);

  // Update AppContext with featured items when they load
  useEffect(() => {
    if (featuredItems && featuredItems.length > 0) {
      console.log('FeaturedListings: Setting featured items in AppContext:', featuredItems);
      setFeaturedItemsData(featuredItems);
    }
  }, [featuredItems, setFeaturedItemsData]);

  const handleItemClick = (itemId) => {
    console.log('FeaturedListings: Item clicked, adding to recently viewed:', itemId);
    addToRecentlyViewed(itemId); // Add to recently viewed
    navigate(`/item/${itemId}`);
  };

  const handleFavoriteClick = (e, itemId) => {
    e.stopPropagation();
    toggleFavorite(itemId);
    
    // Trigger animation
    setAnimatingHeart(itemId);
    setTimeout(() => setAnimatingHeart(null), 600);
  };

  const handleViewAll = () => {
    setSelectedCategory(null); // Clear category filter to show all products
    navigate('/listings');
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Listings</h2>
          <button 
            onClick={handleViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-1"
          >
            View All
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {listingsLoading ? (
          <FeaturedListingsSkeleton count={8} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : featuredItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No data found in your location
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {location ? (
                  <>We couldn't find any listings near <span className="font-medium">{location}</span>. Try exploring other areas or check back later.</>
                ) : (
                  <>We couldn't find any listings in your area. Make sure your location is set correctly.</>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => navigate('/listings')}
                  variant="primary"
                >
                  Browse All Listings
                </Button>
                {location && (
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {featuredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="relative bg-white rounded-2xl overflow-hidden cursor-pointer premium-card animate-slide-up border border-gray-100"
                  >
                    {/* Favorite Button */}
                      <button
                        onClick={(e) => handleFavoriteClick(e, item.id)}
                        className={`absolute top-0.5 right-0.5 z-10 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all hover:bg-white ${
                          animatingHeart === item.id ? 'heart-pulse' : ''
                        }`}
                      >
                        <Heart
                          size={18}
                          className={`sm:w-6 sm:h-6 transition-all ${
                            isFavorite(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                          } ${animatingHeart === item.id ? 'heart-animate' : ''}`}
                        />
                      </button>

                    {/* Image Carousel */}
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <ImageCarousel 
                        images={item.images} 
                        video={item.video}
                        className="w-full h-full"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 md:p-5">
                      <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2 leading-relaxed hidden sm:block">
                        {item.description}
                      </p>
                      
                      {/* Rating */}
                      {item.totalReviews > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating 
                            rating={item.averageRating} 
                            size={14}
                            showNumber={false}
                            className="sm:hidden"
                          />
                          <StarRating 
                            rating={item.averageRating} 
                            size={16}
                            showNumber={true}
                            className="hidden sm:flex"
                          />
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            ({item.totalReviews})
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-base sm:text-xl md:text-2xl font-bold text-blue-600">
                          ₹{item.price.toLocaleString()}/day
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-500 truncate">
                          <MapPin size={12} className="mr-1 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400">
                          {format(new Date(item.postedDate), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

FeaturedListings.displayName = 'FeaturedListings';

export default FeaturedListings;

