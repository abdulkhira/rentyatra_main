import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { MapPin, Heart, Clock, ChevronRight } from 'lucide-react';

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

// ─── Product Card ────────────────────────────────────────────────────────────

const ProductCard = memo(({ item, isFav, animating, onToggleFav, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tokens.surface,
        borderRadius: tokens.radius,
        border: `1px solid ${tokens.border}`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: hovered ? tokens.shadowLg : tokens.shadow,
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: tokens.borderLight }}>
        <img
          src={item.images?.[0]?.url || item.images?.[0]}
          alt={item.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.5s ease',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
        />

        {/* Heart button — over image */}
        <button
          onClick={(e) => onToggleFav(e, item.id)}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            background: 'rgba(255,255,255,0.90)',
            border: 'none',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}
        >
          <Heart
            size={15}
            style={{
              fill: isFav ? '#ef4444' : 'none',
              color: isFav ? '#ef4444' : tokens.textFaint,
              transform: animating ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.3s, color 0.2s, fill 0.2s',
            }}
          />
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>

        {/* Title — 2 lines */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: tokens.text,
            margin: 0,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </h3>

        {/* Description snippet */}
        {item.description && (
          <p
            style={{
              fontSize: 12,
              color: '#313131',
              margin: 0,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </p>
        )}

        {/* Price */}
        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: tokens.primary }}>
            ₹{item.price.toLocaleString()}
          </span>
          <span style={{ fontSize: 16, color: tokens.textMuted, marginLeft: 2 }}>/day</span>
        </div>

        {/* Location + Date row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'black', minWidth: 0 }}>
            <MapPin size={12} style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#212121'
              }}
            >
              {item.location}
            </span>
          </div>

          {/* Date posted */}
          {item.createdAt && (
            <span style={{ fontSize: 11, color: tokens.textFaint, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

// ─── RecentlyViewed ──────────────────────────────────────────────────────────

const RecentlyViewed = memo(() => {
  const { getRecentlyViewedItems, toggleFavorite, isFavorite, setSelectedCategory } = useApp();
  const navigate = useNavigate();
  const [animatingHeart, setAnimatingHeart] = useState(null);
  const [viewAllHovered, setViewAllHovered] = useState(false);

  const recentItems = getRecentlyViewedItems();

  const handleItemClick = useCallback((itemId) => {
    navigate(`/item/${itemId}`);
  }, [navigate]);

  const handleFavoriteClick = useCallback((e, itemId) => {
    e.stopPropagation();
    toggleFavorite(itemId);
    setAnimatingHeart(itemId);
    setTimeout(() => setAnimatingHeart(null), 600);
  }, [toggleFavorite]);

  const handleViewAll = useCallback(() => {
    setSelectedCategory(null);
    navigate('/listings');
  }, [setSelectedCategory, navigate]);

  if (recentItems.length === 0) return null;

  return (
    <section style={{ padding: '32px 16px 40px', background: '#fff' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tokens.text }}>
              Recently Viewed
            </h2>
            <Clock size={18} style={{ color: tokens.textFaint }} />
          </div>
          <button
            onClick={handleViewAll}
            onMouseEnter={() => setViewAllHovered(true)}
            onMouseLeave={() => setViewAllHovered(false)}
            style={{
              padding: '8px 20px',
              borderRadius: 100,
              border: `2px solid ${tokens.primary}`,
              color: viewAllHovered ? '#fff' : tokens.primary,
              background: viewAllHovered ? tokens.primary : 'transparent',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.18s ease',
            }}
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {recentItems.slice(0, 4).map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              isFav={isFavorite(item.id)}
              animating={animatingHeart === item.id}
              onToggleFav={handleFavoriteClick}
              onClick={handleItemClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

RecentlyViewed.displayName = 'RecentlyViewed';
export default RecentlyViewed;