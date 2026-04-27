import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, ArrowLeft, Search, Filter, Grid, List, ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ImageCarousel from '../../components/common/ImageCarousel';
import StarRating from '../../components/common/StarRating';
import apiService from '../../services/api';

const Favorites = () => {
  const { favorites, toggleFavorite, getAverageRating, getReviewsCount } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch favorite items from API
  const fetchFavoriteItems = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      // Fallback: Get all rental requests and filter by local favorites
      const response = await apiService.getFeaturedRentalRequests(100);
      if (response.success) {
        const allItems = response.data.requests;
        const favoriteItems = allItems.filter(item => favorites.includes(item._id));

        // Transform to match expected format
        const transformedItems = favoriteItems.map(item => {
          let location = 'Location not specified';
          if (item.location?.address) {
            location = item.location.address;
          } else if (item.location?.city && item.location?.state &&
            item.location.city !== 'Unknown' && item.location.city !== 'Not specified' &&
            item.location.city.trim() !== '' &&
            item.location.state !== 'Unknown' && item.location.state !== 'Not specified' &&
            item.location.state.trim() !== '') {
            location = `${item.location.city}, ${item.location.state}`;
          }

          return {
            id: item._id,
            title: item.title,
            description: item.description,
            price: item.price?.amount || 0,
            pricePerDay: item.price?.amount || 0,
            location: location,
            images: item.images ? (() => {
              const sortedImages = [...item.images].sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                return 0;
              });
              return sortedImages.map(img => img.url);
            })() : [],
            video: item.video?.url || null,
            postedDate: item.createdAt,
            category: item.category?.name || 'General',
            product: item.product?.name || 'General',
            condition: 'Good',
            owner: item.user,
            averageRating: 0,
            totalReviews: 0,
            isBoosted: false,
            isFeatured: true
          };
        });

        setFavoriteItems(transformedItems);
      }
    } catch (error) {
      console.error('Error fetching favorite items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteItems();
  }, [favorites, isAuthenticated]);

  const handleItemClick = (item) => {
    navigate(`/rental/${item.id}`);
  };

  const handleFavoriteClick = (e, itemId) => {
    e.stopPropagation();
    toggleFavorite(itemId);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality handled by filter below
  };

  // Filter and sort items
  const filteredItems = favoriteItems.filter(item => {
    const matchesSearch = searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center px-4 font-sans">
        <Card className="p-8 md:p-10 text-center max-w-md w-full rounded-3xl shadow-sm border border-gray-100 bg-white">
          <div className="w-16 h-16 mx-auto mb-5 bg-orange-50 rounded-full flex items-center justify-center">
            <Heart size={32} className="text-[#fc8019]" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">Login Required</h2>
          <p className="text-gray-500 mb-8 font-medium">Please login to view and manage your favorites</p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold py-3 text-base shadow-sm transition-colors"
          >
            Login to Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Favourites</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Items you've saved</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-orange-50 text-gray-600 hover:text-[#fc8019] transition-colors"
                title={viewMode === 'grid' ? 'List View' : 'Grid View'}
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-5 flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your favorites..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                />
              </div>
            </form>

            <div className="flex gap-2 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all cursor-pointer appearance-none outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${showFilters
                    ? 'bg-orange-50 border-[#fc8019] text-[#fc8019]'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Filter size={16} />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
            <p className="text-gray-500 font-bold tracking-tight">Loading your favorites...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full flex items-center justify-center shadow-sm">
              <Heart size={36} className="text-white fill-white/20" />
            </div>
            <h3 className="text-2xl font-extrabold mb-2 tracking-tight text-gray-900">No favorites yet</h3>
            <p className="text-gray-500 mb-8 font-medium">Start exploring and save items you love!</p>
            <Button
              onClick={() => navigate('/listings')}
              className="bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold py-3 px-8 shadow-sm transition-colors"
            >
              Browse Items
            </Button>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              Saved Items <span className="text-gray-400 font-medium ml-1">({sortedItems.length})</span>
            </h2>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && sortedItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="relative bg-white rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {/* Hover bottom accent line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#fc8019] to-[#ffc107] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-20"></div>

                {/* Favorite Button */}
                <button
                  onClick={(e) => handleFavoriteClick(e, item.id)}
                  className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
                >
                  <Heart
                    size={16}
                    className="fill-red-500 text-red-500"
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
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-extrabold text-gray-900 mb-1.5 line-clamp-1 text-base tracking-tight group-hover:text-[#fc8019] transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                      ₹{item.pricePerDay || item.price}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      / {item.price?.period || 'day'}
                    </span>
                  </div>

                  <div className="w-full h-px bg-gray-100 mb-3 mt-auto"></div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span className="line-clamp-1">{item.location}</span>
                    </div>

                    {getReviewsCount(item.id) > 0 && (
                      <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-xs">
                        <StarRating rating={getAverageRating(item.id)} size={12} showNumber={false} />
                        <span className="text-gray-600 font-bold ml-0.5">
                          {getAverageRating(item.id).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && sortedItems.length > 0 && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex gap-4 group relative overflow-hidden"
              >
                {/* Left accent line */}
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#fc8019] to-[#ffc107] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top z-20"></div>

                {/* Image */}
                <div className="w-28 h-28 md:w-36 md:h-36 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col py-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-900 mb-1 line-clamp-1 text-base md:text-lg tracking-tight group-hover:text-[#fc8019] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 font-medium mb-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        onClick={(e) => handleFavoriteClick(e, item.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <Heart size={16} className="fill-red-500 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-end justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-400 shrink-0" />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                      <span className="hidden sm:inline-block text-gray-300">•</span>
                      <span>{new Date(item.postedDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
                        ₹{item.pricePerDay || item.price}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        / {item.price?.period || 'day'}
                      </span>
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
};

export default Favorites;