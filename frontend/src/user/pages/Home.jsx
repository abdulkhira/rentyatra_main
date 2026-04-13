import { memo, Suspense, lazy, useState, useEffect, useRef } from 'react';
import { CategoryGridSkeleton, FeaturedListingsSkeleton, RecentlyViewedSkeleton } from '../../components/common/SkeletonLoader';

// Lazy load components for better performance and code splitting
// This reduces initial bundle size and improves load time
const CategoryGrid = lazy(() => import('../../components/home/CategoryGrid'));
const RecentlyViewed = lazy(() => import('../../components/home/RecentlyViewed'));
const FeaturedListings = lazy(() => import('../../components/home/FeaturedListings'));

// Lazy load component that loads when in viewport
const LazyLoadSection = ({ children, fallback, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before element is visible
        threshold: 0.01
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div ref={sectionRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
};

const Home = memo(() => {
  return (
    <div className="min-h-screen bg-white">
      {/* CategoryGrid - Load immediately (above fold, critical content) */}
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid />
      </Suspense>

      {/* FeaturedListings - Load last when scrolled to (below fold, heaviest) */}
      <LazyLoadSection
        fallback={
          <div className="py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <FeaturedListingsSkeleton count={8} />
            </div>
          </div>
        }
      >
        <Suspense fallback={
          <div className="py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <FeaturedListingsSkeleton count={8} />
            </div>
          </div>
        }>
          <FeaturedListings />
        </Suspense>
      </LazyLoadSection>

       {/* RecentlyViewed - Load when near viewport */}
      <LazyLoadSection
        fallback={
          <div className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <RecentlyViewedSkeleton count={4} />
            </div>
          </div>
        }
      >
        <Suspense fallback={
          <div className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <RecentlyViewedSkeleton count={4} />
            </div>
          </div>
        }>
          <RecentlyViewed />
        </Suspense>
      </LazyLoadSection>
    </div>
  );
});

Home.displayName = 'Home';

export default Home;