import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Heart, SlidersHorizontal, ArrowUpDown, X, Tag, ChevronRight, Map, Grid } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StarRating from '../../components/common/StarRating';
import LocationSearch from '../../components/home/LocationSearch';
import ImageCarousel from '../../components/common/ImageCarousel';
import ListingsMapView from '../../components/common/ListingsMapView';
import { format } from 'date-fns';
import apiService from '../../services/api';


const Listings = () => {
  const {
    priceRange,
    setPriceRange,
    location,
    setLocation,
    getFilteredItems,
    toggleFavorite,
    isFavorite,
    getAverageRating,
    getReviewsCount,
  } = useApp();

  const locationState = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [minRating, setMinRating] = useState(0);
  const [budgetFilter, setBudgetFilter] = useState(null);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const navigate = useNavigate();

  // Fetch featured listings
  const fetchFeaturedListings = async () => {
    setLoadingFeatured(true);
    try {
      const response = await apiService.getFeaturedRentalRequests(50, location); // Get more featured listings with location filter
      if (response.success) {
        // Transform rental requests to match the expected format
        const transformedListings = response.data.requests.map(request => {
          // Use address if available, otherwise fallback to city, state
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
            pricePerDay: request.price?.amount || 0,
            location: location,
            images: request.images ? (() => {
              // Sort images to put primary image first
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
            isBoosted: false,
            isFeatured: true // Mark as featured
          };
        });
        
        setFeaturedListings(transformedListings);
      }
    } catch (error) {
      console.error('Error fetching featured listings:', error);
    } finally {
      setLoadingFeatured(false);
    }
  };

  // Get budget from navigation state
  useEffect(() => {
    if (locationState.state?.budget) {
      setBudgetFilter(locationState.state.budget);
    }
  }, [locationState.state]);

  // Fetch featured listings on component mount
  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  
  // Combine regular items with featured listings
  let allItems = [...getFilteredItems(), ...featuredListings];
  
  
  // Apply additional filters
  if (minRating > 0) {
    allItems = allItems.filter(item => 
      getAverageRating(item.id) >= minRating
    );
  }
  
  // Apply sorting
  const sortedItems = [...allItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.pricePerDay || a.price) - (b.pricePerDay || b.price);
      case 'price-high':
        return (b.pricePerDay || b.price) - (a.pricePerDay || a.price);
      case 'rating':
        return getAverageRating(b.id) - getAverageRating(a.id);
      case 'reviews':
        return getReviewsCount(b.id) - getReviewsCount(a.id);
      case 'newest':
      default:
        return new Date(b.postedDate) - new Date(a.postedDate);
    }
  });

  const handleItemClick = (item) => {
    // Check if it's a featured listing (rental request)
    if (item.isFeatured) {
      navigate(`/rental/${item.id}`);
    } else {
      navigate(`/item/${item.id}`);
    }
  };

  const handleFavoriteClick = (e, itemId) => {
    e.stopPropagation();
    toggleFavorite(itemId);
  };

  const clearFilters = () => {
    setBudgetFilter(null);
    setPriceRange({ min: 0, max: 50000 });
    setLocation('');
    setMinRating(0);
    setSortBy('newest');
  };

  // Check if any filters are active
  const hasActiveFilters = budgetFilter || location || priceRange.min > 0 || priceRange.max < 50000 || minRating > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-3 px-3 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-gray-50 py-3 -mx-3 px-3">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-base md:text-xl font-bold text-gray-900">
              All Listings
              <span className="text-xs font-normal text-gray-500 ml-1.5">
                ({sortedItems.length})
              </span>
            </h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {/* Active Filters Display - Compact & Improved */}
          {hasActiveFilters && (
            <div className="mb-3 bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
                  <SlidersHorizontal size={12} className="text-blue-600" />
                  <span className="hidden md:inline">Active:</span>
                </div>
                
                

                {budgetFilter && (
                  <span
                    onClick={() => setBudgetFilter(null)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[10px] font-bold hover:bg-green-200 transition cursor-pointer"
                  >
                    {budgetFilter}
                    <X size={10} />
                  </span>
                )}
                
                {location && (
                  <span
                    onClick={() => setLocation('')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold hover:bg-orange-200 transition cursor-pointer"
                  >
                    {location}
                    <X size={10} />
                  </span>
                )}
                
                {minRating > 0 && (
                  <span
                    onClick={() => setMinRating(0)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-pink-100 text-pink-700 rounded-md text-[10px] font-bold hover:bg-pink-200 transition cursor-pointer"
                  >
                    {minRating}★+
                    <X size={10} />
                  </span>
                )}
                
                <button
                  onClick={clearFilters}
                  className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold hover:bg-red-200 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile Filter Drawer */}
          {showFilters && (
            <div className="md:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)}></div>
              {/* White background strip to match navigation bar */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-white"></div>
              <div className="absolute bottom-24 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[75vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between z-10">
                  <h2 className="font-bold text-base">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-3 space-y-2.5">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-bold text-xs mb-1.5 text-gray-800">Price Range</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-600">Min</label>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                          className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600">Max</label>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                          className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-bold text-xs mb-1.5 text-gray-800">Location</h3>
                    <div className="relative">
                      <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                      <input
                        type="text"
                        placeholder="City name"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-2 flex gap-2">
                    <Button onClick={clearFilters} variant="outline" className="flex-1 text-xs py-1.5">
                      Clear
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1 bg-blue-600 text-xs py-1.5">
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar Filters */}
          <div className="hidden md:block w-56 flex-shrink-0">
            <Card className="p-3 sticky top-20">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-sm">Filters</h2>
                <button onClick={clearFilters} className="text-[10px] text-blue-600 hover:underline font-bold">
                  Clear
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-3">
                <h3 className="font-bold text-xs mb-1.5 text-gray-800">Price Range</h3>
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] text-gray-600">Min</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600">Max</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                      className="w-full mt-0.5 px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="mb-3">
                <h3 className="font-bold text-xs mb-1.5 text-gray-800">Location</h3>
                <div className="relative">
                  <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                  <input
                    type="text"
                    placeholder="City name"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>


              {/* Rating */}
              <div>
                <h3 className="font-bold text-xs mb-1.5 text-gray-800">Rating</h3>
                <div className="space-y-1">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition text-[10px] font-bold ${
                        minRating === rating
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <StarRating rating={rating} size={10} />
                      <span>& up</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Items Grid */}
          <div className="flex-1">
            {/* Sort and Count Header - Compact */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <div className="text-xs text-gray-600 font-medium">
                {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
              </div>
              
              {/* View Mode Toggle and Sort Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid size={14} />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      viewMode === 'map' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Map size={14} />
                    Map
                  </button>
                </div>
                
                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown size={14} className="text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-semibold bg-white"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low-High</option>
                    <option value="price-high">Price: High-Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="reviews">Most Reviews</option>
                  </select>
                </div>
              </div>
            </div>


            {sortedItems.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No items found matching your criteria</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </Card>
            ) : viewMode === 'map' ? (
              /* Map View */
              <div className="space-y-4">
                <ListingsMapView 
                  listings={sortedItems}
                  onListingClick={(listing) => {
                    console.log('Map listing clicked:', listing);
                    handleItemClick(listing);
                  }}
                />
                
                {/* Map View Listings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedItems.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0].url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="text-sm font-bold text-blue-600 mb-1">
                            ₹{(item.pricePerDay || item.price || 0).toLocaleString()}/day
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin size={12} className="mr-1 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {sortedItems.length > 6 && (
                  <div className="text-center">
                    <Button 
                      onClick={() => setViewMode('grid')}
                      variant="outline"
                      className="text-sm"
                    >
                      View All {sortedItems.length} Listings
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {sortedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="relative bg-white rounded-2xl overflow-hidden cursor-pointer premium-card animate-slide-up border border-gray-100"
                  >
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleFavoriteClick(e, item.id)}
                      className="absolute top-0.5 right-0.5 z-10 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all hover:bg-white"
                    >
                      <Heart
                        size={18}
                        className={`sm:w-6 sm:h-6 ${
                          isFavorite(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                        }`}
                      />
                    </button>

                    {/* Image */}
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <ImageCarousel 
                          images={item.images} 
                          video={item.video}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 md:p-5">
                      <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2 leading-relaxed hidden sm:block">{item.description}</p>

                      {/* Rating */}
                      {getReviewsCount(item.id) > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating 
                            rating={getAverageRating(item.id)} 
                            size={14}
                            showNumber={false}
                            className="sm:hidden"
                          />
                          <StarRating 
                            rating={getAverageRating(item.id)} 
                            size={16}
                            showNumber={true}
                            className="hidden sm:flex"
                          />
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            ({getReviewsCount(item.id)})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-base sm:text-xl md:text-2xl font-bold text-blue-600">
                          ₹{(item.pricePerDay || item.price || 0).toLocaleString()}
                          {item.isFeatured && <span className="text-xs text-orange-500 ml-1">/day</span>}
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
      </div>
    </div>
  );
};

export default Listings;

