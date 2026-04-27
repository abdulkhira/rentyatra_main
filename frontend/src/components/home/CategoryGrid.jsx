import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useCategories } from '../../contexts/CategoryContext';
import { ChevronRight, ArrowRight, LayoutGrid } from 'lucide-react';
import { useState, useEffect, memo, useRef } from 'react';
import HeroBanner from './HeroBanner';
import AdBanner from './AdBanner';
import { ProductGridSkeleton } from '../common/SkeletonLoader';
import { useHeroData } from '../../hooks/useHeroData';

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

// Map category slugs/names to icons + pastel colors
const CATEGORY_STYLE_MAP = {
  vehicles: { icon: '🚗', bg: '#fff0eb', accent: '#fc8019' },
  cars: { icon: '🚗', bg: '#fff0eb', accent: '#fc8019' },
  properties: { icon: '🏠', bg: '#eaf0ff', accent: '#4c6ef5' },
  electronics: { icon: '💻', bg: '#eaffef', accent: '#2eb85c' },
  furniture: { icon: '🛋️', bg: '#fefbe8', accent: '#e6a817' },
  'events': { icon: '🎪', bg: '#f3eaff', accent: '#9b59b6' },
  'kids': { icon: '👶', bg: '#eafbff', accent: '#17a2b8' },
  'home': { icon: '🏡', bg: '#eaf0ff', accent: '#4c6ef5' },
  bikes: { icon: '🚲', bg: '#eafbff', accent: '#17a2b8' },
  laptops: { icon: '💻', bg: '#eaffef', accent: '#2eb85c' },
  cameras: { icon: '📷', bg: '#f3eaff', accent: '#9b59b6' },
  tools: { icon: '🔧', bg: '#fff8ee', accent: '#e67e22' },
  fashion: { icon: '👗', bg: '#ffeaf5', accent: '#e91e8c' },
  sports: { icon: '⚽', bg: '#eaffef', accent: '#2eb85c' },
  books: { icon: '📚', bg: '#fefbe8', accent: '#e6a817' },
  default: { icon: '🏷️', bg: '#f5f5f5', accent: '#888' },
};

const getCategoryStyle = (name = '', slug = '') => {
  const key = slug.toLowerCase() || name.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_STYLE_MAP)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_STYLE_MAP.default;
};

const CategoryGrid = memo(() => {
  const { setSelectedCategory } = useApp();
  const { categories } = useCategories();
  const navigate = useNavigate();

  const [viewAllHovered, setViewAllHovered] = useState(false);

  const { data, loading, errors } = useHeroData();
  const { featuredProducts: products = [] } = data || {};
  const { featuredProducts: productsLoading = false } = loading || {};
  const { featuredProducts: productsError } = errors || {};

  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef(null);

  const handleProductClick = (product) => {
    navigate(`/category?productId=${product._id}`);
  };

  const handleSeeAll = () => {
    if (categories?.length > 0) {
      setSelectedCategory(categories[0].id);
      navigate(`/category/${categories[0].slug}`);
    } else {
      setSelectedCategory(null);
      navigate('/listings');
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !products.length) return;
    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCurrentSlide(scrollLeft / (scrollWidth - clientWidth) > 0.5 ? 1 : 0);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [products]);

  return (
    <div className="w-full bg-white font-sans py-8">
      <div className="max-w-[1280px] mx-auto px-0">

        <div className="mb-8">
          <HeroBanner />
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Categories
            </h2>
          </div>
          <button
            onClick={handleSeeAll}
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

        {productsLoading ? (
          <ProductGridSkeleton count={12} />
        ) : productsError ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 mb-4">Unable to load items.</p>
            <button onClick={() => window.location.reload()} className="text-[#fc8019] font-bold">Retry</button>
          </div>
        ) : (
          <>
            {/* Icon Card Grid */}
            <div
              ref={scrollContainerRef}
              className="flex md:grid md:grid-cols-5 lg:grid-cols-8 gap-4 overflow-x-auto lg:overflow-visible hide-scrollbar snap-x snap-mandatory"
            >
              {products.slice(0, 12).map((product) => {
                const style = getCategoryStyle(product.name, product.slug || '');
                return (
                  <button
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className="flex-shrink-0 w-[130px] md:w-auto snap-start group"
                  >
                    <div
                      className="rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-md"
                      style={{ backgroundColor: style.bg }}
                    >
                      {/* Icon box */}
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                        {style.icon}
                      </div>

                      {/* Name */}
                      <span className="text-[13px] font-bold text-gray-800 text-center line-clamp-1">
                        {product.name}
                      </span>

                      {/* Count (optional — use product.listingCount if available) */}
                      {product.listingCount != null && (
                        <span className="text-xs font-bold" style={{ color: style.accent }}>
                          {product.listingCount >= 1000
                            ? `${(product.listingCount / 1000).toFixed(1)}k`
                            : product.listingCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Mobile "See All" card */}
              <button
                onClick={handleSeeAll}
                className="md:hidden flex-shrink-0 w-[130px] snap-start group"
              >
                <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 bg-[#fc8019] text-white shadow-lg shadow-orange-200 h-full min-h-[120px]">
                  <ArrowRight size={24} />
                  <span className="text-[11px] font-black uppercase">See All</span>
                </div>
              </button>
            </div>

            {/* Pagination Dots (mobile) */}
            <div className="flex md:hidden justify-center items-center gap-1 mt-6">
              {[0, 1].map((i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-6 bg-[#fc8019]' : 'w-2 bg-gray-300'}`} />
              ))}
            </div>
          </>
        )}

        <div className="mt-10">
          <AdBanner />
        </div>

      </div>
    </div>
  );
});

CategoryGrid.displayName = 'CategoryGrid';
export default CategoryGrid;