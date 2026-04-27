import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Heart, SlidersHorizontal, ArrowUpDown, X, Grid, Map, SearchX } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StarRating from '../../components/common/StarRating';
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
      const response = await apiService.getFeaturedRentalRequests(50, location);
      if (response.success) {
        const transformedListings = response.data.requests.map(request => {
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
            isFeatured: true
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

  useEffect(() => {
    if (locationState.state?.budget) {
      setBudgetFilter(locationState.state.budget);
    }
  }, [locationState.state]);

  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  let allItems = [...getFilteredItems(), ...featuredListings];

  if (minRating > 0) {
    allItems = allItems.filter(item =>
      getAverageRating(item.id) >= minRating
    );
  }

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

  const hasActiveFilters = budgetFilter || location || priceRange.min > 0 || priceRange.max < 50000 || minRating > 0;

  return (
    <div className="min-h-screen bg-[#f0f0f5] py-4 px-3 md:px-6 pb-24 md:pb-12 font-sans">
      <div className="max-w-[1280px] mx-auto">

        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-[#f0f0f5] pt-2 pb-4 -mx-3 px-3 md:-mx-6 md:px-6 backdrop-blur-md bg-opacity-90">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                All Options
                <span className="text-sm font-bold text-gray-400 ml-2">
                  ({sortedItems.length})
                </span>
              </h1>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all text-gray-700"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Active Filters Display - Swiggy Style Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {budgetFilter && (
                <span
                  onClick={() => setBudgetFilter(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#fc8019] border border-orange-100 rounded-full text-[10px] uppercase tracking-wider font-extrabold hover:bg-orange-100 transition cursor-pointer"
                >
                  Budget: {budgetFilter}
                  <X size={12} className="ml-0.5" />
                </span>
              )}

              {location && (
                <span
                  onClick={() => setLocation('')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#fc8019] border border-orange-100 rounded-full text-[10px] uppercase tracking-wider font-extrabold hover:bg-orange-100 transition cursor-pointer"
                >
                  {location}
                  <X size={12} className="ml-0.5" />
                </span>
              )}

              {minRating > 0 && (
                <span
                  onClick={() => setMinRating(0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#fc8019] border border-orange-100 rounded-full text-[10px] uppercase tracking-wider font-extrabold hover:bg-orange-100 transition cursor-pointer"
                >
                  {minRating}★ & Up
                  <X size={12} className="ml-0.5" />
                </span>
              )}

              <button
                onClick={clearFilters}
                className="ml-auto px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-full text-[10px] uppercase tracking-wider font-extrabold hover:bg-gray-50 transition"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-2">

          {/* Mobile Filter Drawer */}
          {showFilters && (
            <div className="md:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)}></div>
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
                <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="font-extrabold text-xl tracking-tight text-gray-900">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-extrabold text-sm mb-3 uppercase tracking-wider text-gray-500">Price Range</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min (₹)</label>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                          className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max (₹)</label>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                          className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-extrabold text-sm mb-3 uppercase tracking-wider text-gray-500">Location</h3>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Enter city name"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h3 className="font-extrabold text-sm mb-3 uppercase tracking-wider text-gray-500">Rating</h3>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm border ${minRating === rating
                            ? 'bg-orange-50 border-orange-200 text-[#fc8019]'
                            : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <StarRating rating={rating} size={14} />
                            <span>& up</span>
                          </div>
                          {minRating === rating && <div className="w-2 h-2 rounded-full bg-[#fc8019]"></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Buttons */}
                  <div className="pt-4 flex gap-3 pb-6">
                    <Button onClick={clearFilters} variant="outline" className="flex-1 py-3.5 rounded-xl font-bold border-gray-200 text-gray-700 hover:bg-gray-50">
                      Reset
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1 py-3.5 rounded-xl font-bold bg-[#fc8019] hover:bg-orange-600 border-none shadow-sm text-white">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar Filters */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-28">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="font-extrabold text-lg tracking-tight text-gray-900">Filters</h2>
                <button onClick={clearFilters} className="text-[10px] text-[#fc8019] uppercase tracking-wider font-extrabold hover:text-orange-600 transition-colors">
                  Clear All
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-extrabold text-xs mb-3 uppercase tracking-wider text-gray-500">Price Range</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400">MIN</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
                    />
                  </div>
                  <div className="text-gray-300 mt-5">-</div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400">MAX</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="font-extrabold text-xs mb-3 uppercase tracking-wider text-gray-500">Location</h3>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="City name"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="font-extrabold text-xs mb-3 uppercase tracking-wider text-gray-500">Rating</h3>
                <div className="space-y-1.5">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs font-bold border ${minRating === rating
                        ? 'bg-orange-50 border-orange-200 text-[#fc8019]'
                        : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-100'
                        }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={rating} size={12} />
                        <span>& Up</span>
                      </div>
                      {minRating === rating && <div className="w-1.5 h-1.5 rounded-full bg-[#fc8019]"></div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 min-w-0">

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 mb-5">
              <div className="flex items-center gap-3 w-full sm:w-auto bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 pl-3 pr-2 border-r border-gray-100">
                  <ArrowUpDown size={14} className="text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="py-2 pr-6 border-none bg-transparent focus:ring-0 outline-none text-xs font-extrabold text-gray-700 cursor-pointer appearance-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="reviews">Most Reviews</option>
                  </select>
                </div>

                {/* View Mode Toggles */}
                <div className="flex items-center gap-1 pr-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'grid'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Grid size={14} />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'map'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Map size={14} />
                    <span className="hidden sm:inline">Map</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Area */}
            {sortedItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <SearchX size={36} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">No matches found</h2>
                <p className="text-gray-500 font-medium mb-6">We couldn't find any items matching your current filters.</p>
                <Button onClick={clearFilters} className="bg-gray-900 hover:bg-black text-white font-bold rounded-xl py-3 px-8 border-none">
                  Clear All Filters
                </Button>
              </div>
            ) : viewMode === 'map' ? (
              /* Map View */
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 overflow-hidden h-[60vh] min-h-[400px]">
                  <div className="w-full h-full rounded-2xl overflow-hidden">
                    <ListingsMapView
                      listings={sortedItems}
                      onListingClick={(listing) => {
                        handleItemClick(listing);
                      }}
                    />
                  </div>
                </div>

                {/* Map View Listings Summary */}
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-4 tracking-tight px-1">Top Results in Area</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedItems.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="bg-white rounded-2xl border border-gray-100 p-3 cursor-pointer hover:shadow-md hover:border-[#fc8019]/30 transition-all group flex items-center gap-4"
                      >
                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-300 text-[8px] uppercase font-bold tracking-wider">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 py-1">
                          <h3 className="font-extrabold text-sm text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-[#fc8019] transition-colors">
                            {item.title}
                          </h3>
                          <div className="text-sm font-extrabold text-gray-900 mb-1.5">
                            ₹{(item.pricePerDay || item.price || 0).toLocaleString()}
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">/ day</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 font-medium">
                            <MapPin size={12} className="mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {sortedItems.length > 6 && (
                    <div className="text-center mt-6">
                      <Button
                        onClick={() => setViewMode('grid')}
                        className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 rounded-xl font-bold py-3 px-8"
                      >
                        View All {sortedItems.length} Listings
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {sortedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="relative bg-white rounded-3xl overflow-hidden cursor-pointer border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                  >
                    {/* Bottom orange accent line on hover */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#fc8019] to-[#ffc107] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-20"></div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleFavoriteClick(e, item.id)}
                      className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 md:p-2.5 rounded-full shadow-sm hover:scale-110 transition-transform"
                    >
                      <Heart
                        size={16}
                        className={isFavorite(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}
                      />
                    </button>

                    {/* Image */}
                    <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                      {item.images && item.images.length > 0 ? (
                        <ImageCarousel
                          images={item.images}
                          video={item.video}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-300 text-[10px] uppercase font-bold tracking-wider">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-5 flex flex-col flex-1">
                      <div className="mb-auto">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h3 className="font-extrabold text-sm md:text-base text-gray-900 line-clamp-2 leading-snug group-hover:text-[#fc8019] transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm line-clamp-1 mb-3 font-medium hidden sm:block">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-2 space-y-3">
                        {/* Rating */}
                        {getReviewsCount(item.id) > 0 && (
                          <div className="flex items-center gap-1.5">
                            <StarRating
                              rating={getAverageRating(item.id)}
                              size={12}
                              showNumber={false}
                              className="sm:hidden"
                            />
                            <StarRating
                              rating={getAverageRating(item.id)}
                              size={14}
                              showNumber={true}
                              className="hidden sm:flex"
                            />
                            <span className="text-[10px] text-gray-400 font-bold">
                              ({getReviewsCount(item.id)})
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-1">
                          <span className="text-lg md:text-2xl font-extrabold text-gray-900 tracking-tight">
                            ₹{(item.pricePerDay || item.price || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            / day
                          </span>
                        </div>

                        <div className="w-full h-px bg-gray-100"></div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-500 text-[10px] md:text-xs font-medium">
                            <MapPin size={12} className="mr-1 flex-shrink-0 text-gray-400" />
                            <span className="truncate max-w-[100px] sm:max-w-[120px]">{item.location}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {format(new Date(item.postedDate), 'dd MMM')}
                          </div>
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