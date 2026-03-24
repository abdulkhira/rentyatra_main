import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Heart, MessageCircle, Share2, Phone, Mail, Star, ChevronLeft, Package, Calendar, Shield, Truck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ReviewsSection from '../../components/product/ReviewsSection';
import StarRating from '../../components/common/StarRating';
import LocationMap from '../../components/product/LocationMap';
import ServiceRadiusMap from '../../components/common/ServiceRadiusMap';
import SafetyTipsModal from '../../components/common/SafetyTipsModal';
import { format } from 'date-fns';
import apiService from '../../services/api';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, toggleFavorite, isFavorite, addToRecentlyViewed, getAverageRating, getReviewsCount } = useApp();
  const { isAuthenticated, user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [rentalRequest, setRentalRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRentalRequest, setIsRentalRequest] = useState(false);
  const [error, setError] = useState(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  
  // Create media array (video + images)
  const getMediaArray = (currentItem) => {
    const media = [];
    // Put images first, then video
    currentItem.images.forEach(img => {
      media.push({ type: 'image', src: img });
    });
    if (currentItem.video) {
      media.push({ type: 'video', src: currentItem.video });
    }
    return media;
  };

  const item = items.find((item) => item.id === Number(id));

  // Get current item (either regular item or rental request) - memoized to prevent infinite re-renders
  const currentItem = useMemo(() => {
    if (isRentalRequest && rentalRequest) {
      console.log('Rental request data:', rentalRequest);
      console.log('Rental request user:', rentalRequest.user);
      
      // Transform rental request to match item structure
      return {
        id: rentalRequest._id,
        title: rentalRequest.title,
        description: rentalRequest.description,
        price: rentalRequest.price?.amount || 0,
        pricePeriod: rentalRequest.price?.period || 'day',
        // Add pricing properties for BookingCard component - calculate based on period
        pricePerDay: (() => {
          const basePrice = rentalRequest.price?.amount || 0;
          const period = rentalRequest.price?.period || 'day';
          if (period === 'day') return basePrice;
          if (period === 'week') return basePrice / 7;
          if (period === 'month') return basePrice / 30;
          return basePrice;
        })(),
        pricePerWeek: (() => {
          const basePrice = rentalRequest.price?.amount || 0;
          const period = rentalRequest.price?.period || 'day';
          if (period === 'day') return basePrice * 7;
          if (period === 'week') return basePrice;
          if (period === 'month') return (basePrice / 30) * 7;
          return basePrice;
        })(),
        pricePerMonth: (() => {
          const basePrice = rentalRequest.price?.amount || 0;
          const period = rentalRequest.price?.period || 'day';
          if (period === 'day') return basePrice * 30;
          if (period === 'week') return (basePrice / 7) * 30;
          if (period === 'month') return basePrice;
          return basePrice;
        })(),
        location: rentalRequest.location?.address || rentalRequest.location?.city || 'Location not specified',
        images: rentalRequest.images ? (() => {
          // Sort images to put primary image first
          const sortedImages = [...rentalRequest.images].sort((a, b) => {
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            return 0;
          });
          return sortedImages.map(img => img.url);
        })() : [],
        video: rentalRequest.video?.url || null,
        category: rentalRequest.category?.name || 'General',
        product: rentalRequest.product?.name || 'General',
        owner: rentalRequest.user,
        postedDate: rentalRequest.createdAt,
        condition: 'Good',
        averageRating: 0,
        totalReviews: 0,
        isBoosted: false,
        isRentalRequest: true
      };
    }
    return item;
  }, [isRentalRequest, rentalRequest, item]);

  // Fetch rental request if regular item not found
  useEffect(() => {
    const fetchRentalRequest = async () => {
      if (!item && id) {
        console.log('No regular item found, trying to fetch rental request with ID:', id);
        setLoading(true);
        setError(null);
        try {
          console.log('Debug - User info:', { user, userId: user?.id, isAuthenticated });
          console.log('Debug - Requesting rental request with ID:', id);
          const response = await apiService.getPublicRentalRequest(id, user?.id);
          console.log('Debug - API response:', response);
          if (response.success) {
            setRentalRequest(response.data.request);
            setIsRentalRequest(true);
          }
        } catch (error) {
          console.error('Error fetching rental request:', error);
          console.error('ID that failed:', id);
          
          // Check if this might be a product ID instead of rental request ID
          if (error.message.includes('not found') && id) {
            console.log('This might be a product ID. Attempting to find rental request by product ID...');
            // TODO: Implement search by product ID if needed
            setError('Item not found. The rental request may be pending approval or has been removed.');
          } else {
            setError('Item not found. The rental request may be pending approval or has been removed.');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRentalRequest();
  }, [item, id]);

  // Track recently viewed items
  useEffect(() => {
    if (currentItem) {
      addToRecentlyViewed(currentItem.id);
    }
  }, [currentItem, addToRecentlyViewed]);

  // Show loading while fetching rental request
  if (!item && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
        </Card>
      </div>
    );
  }

  // Show not found if neither item nor rental request found
  if (!item && !rentalRequest && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error ? 'Item not available' : 'Item not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'The item you are looking for does not exist or has been removed.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/listings')}>Browse Listings</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleContactOwner = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Show safety tips modal first
    setShowSafetyModal(true);
  };

  const handleContinueToChat = () => {
    setShowSafetyModal(false);
    
    // Check if owner exists and has an ID
    if (!currentItem.owner) {
      console.error('Owner information not available');
      alert('Owner information not available');
      return;
    }
    
    // Get the owner ID (try both _id and id fields)
    const ownerId = currentItem.owner._id || currentItem.owner.id;
    
    if (!ownerId) {
      console.error('Owner ID not found');
      console.log('Owner object:', currentItem.owner);
      alert('Owner ID not found');
      return;
    }
    
    console.log('Chat with owner:', currentItem.owner);
    console.log('Owner ID:', ownerId);
    console.log('Owner name:', currentItem.owner.name);
    console.log('Owner email:', currentItem.owner.email);
    
    // Navigate to chat with the owner
    navigate(`/chat/${ownerId}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentItem.title,
        text: currentItem.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Get related products (same category, excluding current item)
  const relatedProducts = items
    .filter((i) => i.category === currentItem.category && i.id !== currentItem.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-3 md:px-4 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => {
            const currentPath = window.location.pathname;
            
            // If already on home page, just scroll to top
            if (currentPath === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            
            // Navigate to home page
            navigate('/', { replace: false });
            
            // Scroll to hero section after navigation
            // Use multiple timeouts to ensure DOM is ready
            setTimeout(() => {
              const heroSection = document.getElementById('hero-section');
              if (heroSection) {
                heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                // If hero section not found, scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 150);
            
            // Fallback scroll after longer delay
            setTimeout(() => {
              const heroSection = document.getElementById('hero-section');
              if (heroSection) {
                const rect = heroSection.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                window.scrollTo({ 
                  top: scrollTop + rect.top - 80, // 80px offset for navbar
                  behavior: 'smooth' 
                });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 300);
          }}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-3 md:mb-4 text-sm md:text-base"
        >
          <ChevronLeft size={18} className="md:w-5 md:h-5" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-3 md:space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              {/* Main Media Display */}
              <div className="bg-gray-200 relative">
                {getMediaArray(currentItem)[selectedImage]?.type === 'video' ? (
                  <video
                    src={getMediaArray(currentItem)[selectedImage].src}
                    className="w-full h-auto max-h-64 object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={getMediaArray(currentItem)[selectedImage]?.src || currentItem.images[0]}
                    alt={currentItem.title}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                )}
              </div>

              {/* Thumbnail Images + Video */}
              {getMediaArray(currentItem).length > 1 && (
                <div className="flex gap-1.5 md:gap-2 p-2 md:p-4 overflow-x-auto hide-scrollbar">
                  {getMediaArray(currentItem).map((media, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-14 h-14 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <>
                          <video src={media.src} className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-white/90 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={media.src} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Item Details */}
            <Card className="p-3 md:p-6">
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2 line-clamp-2">
                    {currentItem.title}
                  </h1>
                  
                  {/* Status Indicator for Rental Requests */}
                  {isRentalRequest && rentalRequest?.status && (
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rentalRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                        rentalRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        rentalRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rentalRequest.status === 'pending' && '⏳ Pending Approval'}
                        {rentalRequest.status === 'approved' && '✅ Approved'}
                        {rentalRequest.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600 text-xs md:text-sm">
                    <MapPin size={14} className="mr-1 flex-shrink-0 md:w-4 md:h-4" />
                    <span className="truncate">{currentItem.location}</span>
                    <span className="mx-1 md:mx-2">•</span>
                    <span className="whitespace-nowrap">{format(new Date(currentItem.postedDate), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
                <div className="flex gap-1 md:gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleFavorite(currentItem.id)}
                    className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <Heart
                      size={18}
                      className={`md:w-6 md:h-6 ${isFavorite(currentItem.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <Share2 size={18} className="text-gray-600 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              <div className="mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                  <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600">
                    ₹{currentItem.price.toLocaleString()}<span className="text-xs md:text-sm text-gray-600 "> / day</span>
                  </span>
                  
                </div>
                {/* Rating Display */}
                {getReviewsCount(currentItem.id) > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating 
                      rating={getAverageRating(currentItem.id)} 
                      size={18}
                      showNumber={true}
                    />
                    <span className="text-sm text-gray-600">
                      ({getReviewsCount(currentItem.id)} {getReviewsCount(currentItem.id) === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Info Cards
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 md:mb-6">
                <div className="bg-blue-50 rounded-lg p-2 md:p-3 text-center">
                  <Package size={16} className="mx-auto mb-1 text-blue-600 md:w-5 md:h-5" />
                  <p className="text-[10px] md:text-xs text-gray-600">Good Condition</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 md:p-3 text-center">
                  <Calendar size={16} className="mx-auto mb-1 text-green-600 md:w-5 md:h-5" />
                  <p className="text-[10px] md:text-xs text-gray-600">Available Now</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 md:p-3 text-center">
                  <Shield size={16} className="mx-auto mb-1 text-purple-600 md:w-5 md:h-5" />
                  <p className="text-[10px] md:text-xs text-gray-600">Verified Owner</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2 md:p-3 text-center">
                  <Truck size={16} className="mx-auto mb-1 text-orange-600 md:w-5 md:h-5" />
                  <p className="text-[10px] md:text-xs text-gray-600">Pickup Available</p>
                </div>
              </div> */}

              <div className="border-t pt-3 md:pt-6">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold mb-2 md:mb-3">Description</h2>
                <p className="text-xs md:text-sm lg:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                  {currentItem.description}
                </p>
              </div>

              <div className="border-t pt-3 md:pt-6 mt-3 md:mt-6">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">Product Details</h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                    <span className="text-[10px] md:text-xs text-gray-600 block mb-1">Category</span>
                    <p className="text-xs md:text-sm font-semibold capitalize">{currentItem.category}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                    <span className="text-[10px] md:text-xs text-gray-600 block mb-1">Condition</span>
                    <p className="text-xs md:text-sm font-semibold">Excellent</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                    <span className="text-[10px] md:text-xs text-gray-600 block mb-1">Listed On</span>
                    <p className="text-xs md:text-sm font-semibold">
                      {format(new Date(currentItem.postedDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                    <span className="text-[10px] md:text-xs text-gray-600 block mb-1">Posted Time</span>
                    <p className="text-xs md:text-sm font-semibold">
                      {format(new Date(currentItem.postedDate), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Owner Info */}
          <div className="space-y-3 md:space-y-6">
            
            {/* Owner Card - Only show if current user is not the owner */}
            {(() => {
              // For rental requests, check if current user is the poster
              if (isRentalRequest) {
                const currentUserId = user?.id || user?._id;
                const posterId = rentalRequest?.user?._id || rentalRequest?.user?.id;
                const isOwnRentalRequest = currentUserId === posterId;
                return !isOwnRentalRequest;
              }
              
              // For regular items, check if current user is the owner
              const currentUserId = user?.id || user?._id;
              const ownerId = currentItem.owner?._id || currentItem.owner?.id;
              const isOwnItem = currentUserId === ownerId;
              return !isOwnItem;
            })() && (
              <Card className="p-3 md:p-6">
                <h2 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4">Owner Information for Booking</h2>
                
                <div className="flex items-center mb-3 md:mb-4">
                  {(() => {
                    const ownerName = (currentItem.owner && currentItem.owner.name) ? currentItem.owner.name : 'User';
                    const initial = ownerName.charAt(0).toUpperCase();
                    return (
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg md:text-2xl font-bold flex-shrink-0">
                        {initial}
                      </div>
                    );
                  })()}
                  <div className="ml-3 md:ml-4 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base lg:text-lg truncate">{currentItem.owner?.name || 'User'}</h3>
                  </div>
                </div>

                <Button
                  icon={MessageCircle}
                  className="w-full mb-4 md:mb-6 text-sm md:text-base"
                  onClick={handleContactOwner}
                >
                  Chat with Owner
                </Button>

                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-xs md:text-sm mb-2">Safety Tips</h4>
                  <ul className="text-[10px] md:text-xs text-gray-600 space-y-1">
                    <li>• Meet in a safe, public place</li>
                    <li>• Check the item before renting</li>
                    <li>• Pay only after collecting item</li>
                    <li>• Verify owner identity</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Location Map Card */}
            <Card className="p-3 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <MapPin size={20} className="text-indigo-600 md:w-6 md:h-6" />
                <h2 className="text-base md:text-lg lg:text-xl font-semibold">Location</h2>
              </div>
              
              <div className="mb-3 md:mb-4">
                <div className="flex items-center gap-2 text-sm md:text-base text-gray-700">
                  <MapPin size={16} className="text-gray-500 flex-shrink-0 md:w-5 md:h-5" />
                  <span className="font-medium">{currentItem.location}</span>
                </div>
              </div>
              
              {/* Map Container */}
              <div className="w-full h-48 md:h-80 lg:h-96 xl:h-[28rem]">
                <ServiceRadiusMap 
                  location={currentItem.location} 
                  coordinates={(() => {
                    if (isRentalRequest && rentalRequest?.location?.coordinates) {
                      console.log('ItemDetail: Raw coordinates from rental request:', rentalRequest.location.coordinates);
                      // If coordinates is already an object, use it directly
                      if (typeof rentalRequest.location.coordinates === 'object') {
                        const coords = {
                          lat: rentalRequest.location.coordinates.latitude,
                          lng: rentalRequest.location.coordinates.longitude
                        };
                        console.log('ItemDetail: Using object coordinates:', coords);
                        return coords;
                      }
                      // If coordinates is a string, try to parse it
                      try {
                        const parsed = JSON.parse(rentalRequest.location.coordinates);
                        console.log('ItemDetail: Parsed string coordinates:', parsed);
                        return parsed;
                      } catch (e) {
                        console.warn('Could not parse coordinates:', rentalRequest.location.coordinates);
                        return undefined;
                      }
                    }
                    console.log('ItemDetail: No coordinates found');
                    return undefined;
                  })()}
                  serviceRadius={(() => {
                    const radius = isRentalRequest ? (rentalRequest?.location?.serviceRadius || 7) : 7;
                    console.log('ItemDetail: Service radius:', radius);
                    return radius;
                  })()}
                  title={currentItem.title}
                />
              </div>
              
              <div className="mt-3 md:mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-[10px] md:text-xs text-yellow-800">
                  <span className="font-semibold">Note:</span> This is an approximate location. Exact address will be shared after booking confirmation.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        {currentItem && currentItem.id && (
          <div className="mt-8 md:mt-12">
            <ReviewsSection 
              itemId={currentItem.id} 
              isRentalRequest={currentItem.isRentalRequest || false}
            />
          </div>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-6 md:mt-8">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
              Related Items
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {relatedProducts.map((relatedItem) => (
                <div
                  key={relatedItem.id}
                  onClick={() => navigate(`/item/${relatedItem.id}`)}
                  className="bg-white rounded-xl overflow-hidden cursor-pointer premium-card border border-gray-100"
                >
                  {/* Image Carousel */}
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <ImageCarousel 
                      images={relatedItem.images} 
                      video={relatedItem.video}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-2 md:p-3">
                    <h3 className="font-semibold text-xs md:text-sm text-gray-900 mb-1 line-clamp-2">
                      {relatedItem.title}
                    </h3>
                    <p className="text-blue-600 font-bold text-sm md:text-base mb-1">
                      ₹{relatedItem.price.toLocaleString()}
                    </p>
                    <div className="flex items-center text-gray-500 text-[10px] md:text-xs">
                      <MapPin size={10} className="mr-1 flex-shrink-0 md:w-3 md:h-3" />
                      <span className="truncate">{relatedItem.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Safety Tips Modal */}
      <SafetyTipsModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        onContinue={handleContinueToChat}
      />
    </div>
  );
};

export default ItemDetail;

