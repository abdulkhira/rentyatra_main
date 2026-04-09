import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, ArrowLeft, Search, Filter, Grid, List } from 'lucide-react';
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
      // DISABLED: API call for favorites (route doesn't exist)
      // try {
      //   const response = await apiService.getFavoriteItems(1, 100, searchQuery);
      //   if (response.success) {
      //     const transformedItems = response.data.items.map(item => {
      //       let location = 'Location not specified';
      //       if (item.location?.address) {
      //         location = item.location.address;
      //       } else if (item.location?.city && item.location?.state && 
      //                 item.location.city !== 'Unknown' && item.location.city !== 'Not specified' &&
      //                 item.location.city.trim() !== '' &&
      //                 item.location.state !== 'Unknown' && item.location.state !== 'Not specified' &&
      //                 item.location.state.trim() !== '') {
      //         location = `${item.location.city}, ${item.location.state}`;
      //       }
      //       
      //       return {
      //         id: item._id,
      //         title: item.title,
      //         description: item.description,
      //         price: item.price?.amount || 0,
      //         pricePerDay: item.price?.amount || 0,
      //         location: location,
      //         images: item.images ? (() => {
      //           const sortedImages = [...item.images].sort((a, b) => {
      //             if (a.isPrimary && !b.isPrimary) return -1;
      //             if (!a.isPrimary && b.isPrimary) return 1;
      //             return 0;
      //           });
      //           return sortedImages.map(img => img.url);
      //         })() : [],
      //         video: item.video?.url || null,
      //         postedDate: item.createdAt,
      //         category: item.category?.name || 'General',
      //         product: item.product?.name || 'General',
      //         condition: 'Good',
      //         owner: item.user,
      //         averageRating: 0,
      //         totalReviews: 0,
      //         isBoosted: false,
      //         isFeatured: true
      //       };
      //     });
      //     
      //     setFavoriteItems(transformedItems);
      //     return;
      //   }
      // } catch (apiError) {
      //   // Silently handle API failures - fallback to local favorites
      // }

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
    // Search functionality can be implemented here
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your favorites</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Favourites</h1>
                <p className="text-sm text-gray-600">Items you've saved</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'grid' ? 'List View' : 'Grid View'}
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your favorites..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Filter size={16} />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your favorites...</p>
          </Card>
        ) : sortedItems.length === 0 ? (
          <Card className="p-8 md:p-12 text-center">
            <Heart size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg md:text-xl font-bold mb-2">No favorites yet</h3>
            <p className="text-sm text-gray-600 mb-6">Start adding items to your favorites</p>
            <Button onClick={() => navigate('/')}>Browse Items</Button>
          </Card>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'} in your favorites
            </p>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && sortedItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="relative bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all border border-gray-100"
              >
                {/* Favorite Button */}
                <button
                  onClick={(e) => handleFavoriteClick(e, item.id)}
                  className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:scale-110 transition-all hover:bg-white"
                >
                  <Heart
                    size={18}
                    className="fill-red-500 text-red-500"
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
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg md:text-xl font-bold text-blue-600">
                      ₹{item.pricePerDay || item.price}/{item.price?.period || 'day'}
                    </span>
                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <MapPin size={12} />
                      <span className="line-clamp-1">{item.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <StarRating rating={getAverageRating(item.id)} size={14} />
                      <span className="text-xs text-gray-500 ml-1">
                        ({getReviewsCount(item.id)})
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.postedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && sortedItems.length > 0 && (
          <div className="space-y-4">
            {sortedItems.map((item) => (
              <Card
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm md:text-base">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{item.location}</span>
                          </div>
                          <span>{new Date(item.postedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={(e) => handleFavoriteClick(e, item.id)}
                          className="p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Heart size={18} className="fill-red-500 text-red-500" />
                        </button>
                        <span className="text-lg md:text-xl font-bold text-blue-600">
                          ₹{item.pricePerDay || item.price}/{item.price?.period || 'day'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
