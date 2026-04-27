import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Heart, MessageCircle, Share2, Star, ChevronLeft, Package, Calendar, Shield, Truck, BadgeCheck, Clock, X, Info } from 'lucide-react';
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

const tokens = {
  primary: '#FF5A1F',
  primaryDark: '#E04A10',
  primaryLight: '#FFF1EC',
  secondary: '#3D5AF1',
  secondaryLight: '#EEF1FF',
  success: '#16a34a',
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F9FB',
  text: '#1A1A2E',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  radius: '14px',
  radiusSm: '10px',
  radiusLg: '20px',
  shadow: '0 2px 12px rgba(0,0,0,0.07)',
  shadowMd: '0 4px 24px rgba(0,0,0,0.10)',
  shadowLg: '0 8px 40px rgba(0,0,0,0.13)',
};

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
  // 1. Add this hook at the top of your component (after state declarations)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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
        setLoading(true);
        setError(null);
        try {
          const response = await apiService.getPublicRentalRequest(id, user?.id);
          if (response.success) {
            setRentalRequest(response.data.request);
            setIsRentalRequest(true);
          }
        } catch (error) {
          console.error('Error fetching rental request:', error);
          if (error.message.includes('not found') && id) {
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
  }, [item, id, user?.id]);

  // Track recently viewed items
  useEffect(() => {
    if (currentItem) {
      addToRecentlyViewed(currentItem.id);
    }
  }, [currentItem, addToRecentlyViewed]);

  // Show loading while fetching rental request
  if (!item && loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center font-sans">
        <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
          <p className="text-gray-500 font-bold tracking-tight">Loading details...</p>
        </div>
      </div>
    );
  }

  // Show not found if neither item nor rental request found
  if (!item && !rentalRequest && !loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center font-sans px-4">
        <div className="p-8 md:p-12 text-center bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={36} className="text-gray-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 text-gray-900 tracking-tight">
            {error ? 'Item Unavailable' : 'Item Not Found'}
          </h2>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">
            {error || 'The item you are looking for does not exist or has been removed from our platform.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/listings')} className="bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold py-3">
              Browse Listings
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="rounded-xl font-bold py-3 text-gray-700 hover:bg-gray-50 border-gray-200">
              Go Home
            </Button>
          </div>
        </div>
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

    if (!currentItem.owner) {
      alert('Owner information not available');
      return;
    }

    const ownerId = currentItem.owner._id || currentItem.owner.id;

    if (!ownerId) {
      alert('Owner ID not found');
      return;
    }

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

  // Get related products
  const relatedProducts = items
    .filter((i) => i.category === currentItem.category && i.id !== currentItem.id)
    .slice(0, 4);

  // Replace the entire return statement's JSX structure in ItemDetail.jsx
  // All inline styles now use the tokens object consistently

  return (
    <div style={{ minHeight: '100vh', background: tokens.bg, padding: '24px 16px 80px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: tokens.surface, border: `1px solid ${tokens.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: tokens.textMuted, marginBottom: 20,
            boxShadow: tokens.shadow, transition: 'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = tokens.primary; e.currentTarget.style.color = tokens.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = tokens.border; e.currentTarget.style.color = tokens.textMuted; }}
        >
          <ChevronLeft size={22} />
        </button>

        {/* Two-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? "1fr" : 'minmax(0,1fr) 320px',
          gap: 20,
        }}>
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Image Gallery Card */}
            <div style={{ background: tokens.surface, borderRadius: tokens.radiusLg, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow, overflow: 'hidden' }}>
              {/* Main image */}
              <div style={{ aspectRatio: '16/9', background: tokens.borderLight, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getMediaArray(currentItem)[selectedImage]?.type === 'video' ? (
                  <video src={getMediaArray(currentItem)[selectedImage].src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls />
                ) : (
                  <img src={getMediaArray(currentItem)[selectedImage]?.src || currentItem.images[0]} alt={currentItem.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>

              {/* Thumbnails */}
              {getMediaArray(currentItem).length > 1 && (
                <div style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto' }}>
                  {getMediaArray(currentItem).map((media, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      style={{
                        width: 64, height: 48, borderRadius: tokens.radiusSm,
                        border: `2px solid ${selectedImage === index ? tokens.primary : 'transparent'}`,
                        overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                        background: tokens.borderLight, padding: 0,
                        opacity: selectedImage === index ? 1 : 0.65,
                        transition: 'all .15s',
                      }}
                    >
                      {media.type === 'video' ? (
                        <video src={media.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={media.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item Details Card */}
            <div style={{ background: tokens.surface, borderRadius: tokens.radiusLg, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow }}>
              <div style={{ padding: '20px 20px 4px' }}>

                {/* Status badge */}
                {isRentalRequest && rentalRequest?.status && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: rentalRequest.status === 'approved' ? '#f0fdf4' : rentalRequest.status === 'pending' ? '#fefce8' : '#fef2f2',
                      color: rentalRequest.status === 'approved' ? '#16a34a' : rentalRequest.status === 'pending' ? '#854d0e' : '#dc2626',
                      border: `1px solid ${rentalRequest.status === 'approved' ? '#bbf7d0' : rentalRequest.status === 'pending' ? '#fde047' : '#fecaca'}`,
                    }}>
                      {rentalRequest.status === 'pending' && <Clock size={11} />}
                      {rentalRequest.status === 'approved' && <BadgeCheck size={11} />}
                      {rentalRequest.status === 'rejected' && <X size={11} />}
                      {rentalRequest.status.charAt(0).toUpperCase() + rentalRequest.status.slice(1)}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 style={{ fontSize: 24, fontWeight: 700, color: tokens.text, lineHeight: 1.25, marginBottom: 10 }}>
                  {currentItem.title}
                </h1>

                {/* Meta chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: tokens.textMuted, background: tokens.surfaceAlt, padding: '4px 10px', borderRadius: 20, border: `1px solid ${tokens.borderLight}` }}>
                    <MapPin size={14} style={{ color: tokens.textFaint }} />
                    {currentItem.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: tokens.textMuted, background: tokens.surfaceAlt, padding: '4px 10px', borderRadius: 20, border: `1px solid ${tokens.borderLight}` }}>
                    <Calendar size={14} style={{ color: tokens.textFaint }} />
                    Listed {format(new Date(currentItem.postedDate), 'dd MMM yyyy')}
                  </div>
                </div>

                {/* Price + Rating */}
                <div style={{
                  background: tokens.surfaceAlt, borderRadius: tokens.radius,
                  border: `1px solid ${tokens.borderLight}`, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 16, flexWrap: 'wrap', gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Rental Price</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <span style={{ fontSize: 30, fontWeight: 800, color: tokens.primary }}>₹{currentItem.price.toLocaleString()}</span>
                      <span style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>/ {currentItem.pricePeriod || 'day'}</span>
                    </div>
                  </div>
                  {getReviewsCount(currentItem.id) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: tokens.surface, padding: '6px 12px', borderRadius: 20, border: `1px solid ${tokens.borderLight}` }}>
                      <StarRating rating={getAverageRating(currentItem.id)} size={16} showNumber={false} />
                      <span style={{ fontWeight: 800, fontSize: 14, color: tokens.text }}>{getAverageRating(currentItem.id).toFixed(1)}</span>
                      <span style={{ fontSize: 12, color: tokens.textFaint }}>({getReviewsCount(currentItem.id)})</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 8, letterSpacing: '-.01em' }}>Description</h2>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: tokens.textMuted, whiteSpace: 'pre-line' }}>
                    {currentItem.description}
                  </p>
                </div>

                {/* Details grid */}
                <h2 style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 10 }}>Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                  {[
                    { label: 'Category', value: currentItem.category },
                    { label: 'Condition', value: 'Excellent' },
                    { label: 'Listed On', value: format(new Date(currentItem.postedDate), 'dd MMM yyyy') },
                    { label: 'Time', value: format(new Date(currentItem.postedDate), 'hh:mm a') },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: tokens.surfaceAlt, borderRadius: tokens.radiusSm, padding: '10px 12px', border: `1px solid ${tokens.borderLight}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textFaint, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text, textTransform: 'capitalize' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider + actions */}
              <div style={{ height: 1, background: tokens.borderLight, margin: '14px 0' }} />
              <div style={{ display: 'flex', gap: 8, padding: '0 20px 18px' }}>
                <button
                  onClick={() => toggleFavorite(currentItem.id)}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${tokens.border}`, background: tokens.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}
                >
                  <Heart size={17} style={{ fill: isFavorite(currentItem.id) ? '#ef4444' : 'none', color: isFavorite(currentItem.id) ? '#ef4444' : tokens.textFaint }} />
                </button>
                <button
                  onClick={handleShare}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${tokens.border}`, background: tokens.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}
                >
                  <Share2 size={17} style={{ color: tokens.textFaint }} />
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Owner Card */}
            {(() => {
              const myId = user?.id || user?._id;
              const ownerId = currentItem.owner?._id || currentItem.owner?.id;
              if (myId === ownerId) return null;
              const ownerName = currentItem.owner?.name || 'User';
              return (
                <div style={{ background: tokens.surface, borderRadius: tokens.radiusLg, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow, padding: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: tokens.text, marginBottom: 14 }}>Owner Details</h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg, ${tokens.primary}, #ffc107)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                      {ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: tokens.text, marginBottom: 3 }}>{ownerName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: tokens.success }}>
                        <Shield size={11} /> Verified User
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleContactOwner}
                    style={{ width: '100%', padding: '12px', borderRadius: tokens.radius, background: tokens.primary, color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14, transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = tokens.primaryDark}
                    onMouseLeave={e => e.currentTarget.style.background = tokens.primary}
                  >
                    <MessageCircle size={18} /> Chat with Owner
                  </button>

                  <div style={{ background: tokens.primaryLight, borderRadius: tokens.radiusSm, border: `1px solid #fed7aa`, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: tokens.primary, marginBottom: 8 }}>
                      <Info size={14} /> Safety Tips
                    </div>
                    {['Meet in a safe, public place', 'Inspect item before renting', 'Pay only after collecting item', 'Verify owner identity'].map(tip => (
                      <div key={tip} style={{ fontSize: 11, color: '#92400e', padding: '2px 0', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ color: tokens.primary, fontWeight: 900, lineHeight: '1.2' }}>•</span> {tip}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Location Card */}
            <div style={{ background: tokens.surface, borderRadius: tokens.radiusLg, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow, padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: tokens.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={17} style={{ color: tokens.primary }} /> Location
              </h2>
              <p style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 10 }}>{currentItem.location}</p>

              <div style={{ width: '100%', height: 180, borderRadius: tokens.radius, overflow: 'hidden', border: `1px solid ${tokens.borderLight}`, marginBottom: 10 }}>
                <ServiceRadiusMap
                  location={currentItem.location}
                  coordinates={(() => {
                    if (isRentalRequest && rentalRequest?.location?.coordinates) {
                      if (typeof rentalRequest.location.coordinates === 'object') {
                        return { lat: rentalRequest.location.coordinates.latitude, lng: rentalRequest.location.coordinates.longitude };
                      }
                      try { return JSON.parse(rentalRequest.location.coordinates); } catch { return undefined; }
                    }
                    return undefined;
                  })()}
                  serviceRadius={isRentalRequest ? (rentalRequest?.location?.serviceRadius || 7) : 7}
                  title={currentItem.title}
                />
              </div>

              <div style={{ background: tokens.surfaceAlt, borderRadius: tokens.radiusSm, border: `1px solid ${tokens.borderLight}`, padding: '8px 12px' }}>
                <p style={{ fontSize: 11, color: tokens.textMuted, lineHeight: 1.6 }}>
                  <strong style={{ color: tokens.text }}>Note:</strong> Approximate location shown. Exact address shared after booking confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {currentItem?.id && (
          <div style={{ marginTop: 32 }}>
            <ReviewsSection itemId={currentItem.id} isRentalRequest={currentItem.isRentalRequest || false} />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: tokens.text, marginBottom: 20, letterSpacing: '-.01em' }}>Related Items</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {relatedProducts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/item/${rel.id}`)}
                  style={{ background: tokens.surface, borderRadius: tokens.radius, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow, overflow: 'hidden', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = tokens.shadowLg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = tokens.shadow; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ aspectRatio: '4/3', background: tokens.borderLight, overflow: 'hidden' }}>
                    <img src={rel.images?.[0]} alt={rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: tokens.text, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{rel.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: tokens.text }}>₹{rel.price.toLocaleString()}</span>
                      <span style={{ fontSize: 10, color: tokens.textFaint, fontWeight: 700, textTransform: 'uppercase' }}>/day</span>
                    </div>
                    <div style={{ height: 1, background: tokens.borderLight, marginBottom: 8 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: tokens.textFaint }}>
                      <MapPin size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rel.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SafetyTipsModal isOpen={showSafetyModal} onClose={() => setShowSafetyModal(false)} onContinue={handleContinueToChat} />
    </div>
  );
};

export default ItemDetail;