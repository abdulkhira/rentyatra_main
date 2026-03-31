import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useCategories } from '../../contexts/CategoryContext';
import { ChevronRight } from 'lucide-react';
import { useState, useEffect, memo, useRef } from 'react';
import AdBanner from './AdBanner';
import { ProductGridSkeleton } from '../common/SkeletonLoader';
import { useHeroData } from '../../hooks/useHeroData';

const CategoryGrid = memo(() => {
  const { setSelectedCategory } = useApp();
  const { categories, fetchCategoriesByProduct, loading: categoriesLoading } = useCategories();
  const navigate = useNavigate();

  // Use optimized hero data hook
  const { data, loading, errors } = useHeroData();
  const { featuredProducts: products = [] } = data || {};
  const { featuredProducts: productsLoading = false } = loading || {};
  const { featuredProducts: productsError } = errors || {};

  // Scroll tracking for mobile carousel dots
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef(null);

  const handleProductClick = async (product) => {
    try {
      // Navigate to category page with product ID as query parameter
      // This will allow the category page to automatically select this product and show its categories
      navigate(`/category?productId=${product._id}`);
    } catch (error) {
      console.error('Error navigating to product:', error);
      // Fallback to product detail page
      navigate(`/item/${product._id}`);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category.id);
    // Use category slug for navigation
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/category/${categorySlug}`);
  };

  const handleSeeAll = () => {
    // Navigate to the first available category or a general products page
    if (categories && categories.length > 0) {
      const firstCategory = categories[0];
      setSelectedCategory(firstCategory.id);
      navigate(`/category/${firstCategory.slug}`);
    } else {
      // Fallback to listings if no categories available
      setSelectedCategory(null);
      navigate('/listings');
    }
  };

  // Track scroll position for carousel dots
  useEffect(() => {
    if (!products || products.length === 0) return;

    let scrollContainer = null;
    let handleScroll = null;
    let handleResize = null;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      handleScroll = () => {
        const scrollLeft = scrollContainer.scrollLeft;
        const scrollWidth = scrollContainer.scrollWidth;
        const clientWidth = scrollContainer.clientWidth;

        // Calculate which slide is currently visible
        // Assuming 2 slides: first slide (0) and second slide (1)
        const totalScrollable = scrollWidth - clientWidth;
        if (totalScrollable <= 0) {
          setCurrentSlide(0);
          return;
        }

        // Determine slide based on scroll position
        // If scrolled less than 50% of scrollable distance, show first slide, else second
        const scrollPercentage = scrollLeft / totalScrollable;
        setCurrentSlide(scrollPercentage < 0.5 ? 0 : 1);
      };

      scrollContainer.addEventListener('scroll', handleScroll);
      // Check initial position
      handleScroll();

      // Also check on resize
      handleResize = () => {
        if (handleScroll) handleScroll();
      };
      window.addEventListener('resize', handleResize);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scrollContainer && handleScroll) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [products]); // Re-run when products change

  return (
    <div className="py-4 md:py-6 px-3 md:px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Mobile - Ad Banner on Top */}
        <div className="md:hidden mb-4">
          <AdBanner />
        </div>

        {/* Desktop - Ad Banner on Top */}
        <div className="hidden md:block mb-6 lg:mb-8">
          <AdBanner />
        </div>

        {/* Desktop Products - 6x2 Grid */}
        <div className="hidden md:block">
          {/* Header with View All Button */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Featured Categories</h2>
            <button
              onClick={handleSeeAll}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="text-sm font-semibold">View All</span>
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>

          {productsLoading ? (
            <ProductGridSkeleton count={12} isMobile={false} />
          ) : productsError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading categories: {productsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-2 lg:gap-3">
              {products.slice(0, 12).map((product) => {
                const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                return (
                  <button
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className="group relative flex flex-col items-center transition-all duration-200 hover:-translate-y-1 max-w-[90px] mx-auto"
                  >
                    {/* Hover gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                    <div className="relative w-full">
                      {/* Image Container - Larger for 6x2 grid */}
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-white mb-1 flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all duration-200 border border-gray-100 group-hover:border-blue-200 p-0.5">
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={product.name}
                            className="object-contain group-hover:scale-105 transition-transform duration-200 w-full h-full rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <div className="text-center px-1">
                        <h3 className="font-medium text-xs text-gray-800 group-hover:text-blue-600 line-clamp-2 tracking-tight transition-colors duration-200">
                          {product.name}
                        </h3>
                      </div>

                      {/* Subtle indicator badge */}
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Grid - 6x2 Grid with horizontal scroll */}
        <div className="md:hidden">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto hide-scrollbar"
          >
            {productsLoading ? (
              <ProductGridSkeleton count={12} isMobile={true} />
            ) : productsError ? (
              <div className="text-center py-4">
                <p className="text-red-500 text-sm mb-2">Error loading categories</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div
                className="grid grid-rows-2 auto-cols-max gap-x-2 gap-y-2 pb-2"
                style={{
                  gridAutoFlow: 'column',
                  width: 'max-content'
                }}
              >
                {products.slice(0, 12).map((product) => {
                  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                  return (
                    <button
                      key={product._id}
                      onClick={() => handleProductClick(product)}
                      className="flex flex-col items-center active:scale-95 transition-all"
                      style={{ width: '70px' }}
                    >
                      {/* Image Container with Shadow and Background */}
                      <div
                        className="w-full rounded-lg overflow-hidden bg-gray-100 mb-1 flex items-center justify-center p-0.5"
                        style={{
                          height: '65px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                        }}
                      >
                        {primaryImage ? (
                          <img
                            src={primaryImage.url}
                            alt={product.name}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-[8px]">No Image</span>
                          </div>
                        )}
                      </div>
                      {/* Text Container */}
                      <div className="w-full px-0.5 text-center">
                        <span className="text-[8px] font-bold text-gray-800 leading-snug line-clamp-2 block tracking-tight">
                          {product.name}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* See All Card - slides with the grid */}
                <button
                  onClick={handleSeeAll}
                  className="flex flex-col items-center justify-center active:scale-95 transition-all"
                  style={{ width: '70px', gridRow: 'span 2' }}
                >
                  <div
                    className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center gap-1.5"
                    style={{
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <ChevronRight size={20} className="text-blue-600" strokeWidth={2.5} />
                    <span className="text-[8px] font-bold text-blue-600">
                      See All
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Carousel Dots Indicator - Always show if there are products */}
          {!productsLoading && products && products.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-3 mb-2 relative z-10">
              {[0, 1].map((dotIndex) => (
                <button
                  key={dotIndex}
                  type="button"
                  onClick={() => {
                    const scrollContainer = scrollContainerRef.current;
                    if (scrollContainer) {
                      const scrollWidth = scrollContainer.scrollWidth;
                      const clientWidth = scrollContainer.clientWidth;
                      const scrollableWidth = scrollWidth - clientWidth;

                      if (scrollableWidth > 0) {
                        const targetScroll = (dotIndex / 1) * scrollableWidth;
                        scrollContainer.scrollTo({
                          left: targetScroll,
                          behavior: 'smooth'
                        });
                      }
                    }
                  }}
                  className={`transition-all duration-300 rounded-full flex-shrink-0 ${currentSlide === dotIndex
                    ? 'w-8 h-2 bg-black'
                    : 'w-2 h-2 bg-gray-300'
                    }`}
                  style={{ minWidth: currentSlide === dotIndex ? '32px' : '8px' }}
                  aria-label={`Go to slide ${dotIndex + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CategoryGrid.displayName = 'CategoryGrid';

export default CategoryGrid;
