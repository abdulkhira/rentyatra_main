import { memo, Suspense, lazy, useState, useEffect, useRef } from 'react';
import { CategoryGridSkeleton, FeaturedListingsSkeleton, RecentlyViewedSkeleton } from '../../components/common/SkeletonLoader';

// Lazy load components for better performance and code splitting
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
        rootMargin: '100px',
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
    // Swiggy often uses a very subtle off-white/gray background (#f0f0f5) for the main canvas 
    // to make the white restaurant cards pop.
    <div className="min-h-screen bg-[#fff] font-sans pb-0">

      {/* CategoryGrid - "What's on your mind?" Section
        Swiggy uses a crisp white background for this top carousel section.
      */}
      <div className="bg-white pt-0 pb-5 px-4 sm:px-6 lg:px-8 mb-4">
        <div className="max-w-[1280px] mx-auto">
          <Suspense fallback={
            <div>
              {/* Swiggy bold header style skeleton */}
              <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-6"></div>
              <CategoryGridSkeleton />
            </div>
          }>
            <CategoryGrid />
          </Suspense>
        </div>
      </div>

      {/* FeaturedListings - "Restaurants with online food delivery" Section
        Uses the slightly gray background to let the individual white cards stand out.
      */}
      <LazyLoadSection
        className="py-10 px-4 sm:px-6 lg:px-8"
        fallback={
          <div className="max-w-[1280px] mx-auto">
            {/* Swiggy's distinct header structure: Bold title, often accompanied by a filter row below it */}
            <div className="mb-8 border-b border-gray-200 pb-4">
              <div className="h-9 w-80 bg-gray-300 rounded-md animate-pulse mb-4"></div>
              {/* Fake filter pills skeleton typical of Swiggy */}
              <div className="flex gap-3">
                <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
            <FeaturedListingsSkeleton count={8} />
          </div>
        }
      >
        <Suspense fallback={
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-8 border-b border-gray-200 pb-4">
              <div className="h-9 w-80 bg-gray-300 rounded-md animate-pulse mb-4"></div>
              <div className="flex gap-3">
                <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
            <FeaturedListingsSkeleton count={8} />
          </div>
        }>
          <div className="max-w-[1280px] mx-auto">
            <FeaturedListings />
          </div>
        </Suspense>
      </LazyLoadSection>

      {/* RecentlyViewed - "Your Everyday Favourites" Section
        Swiggy typically places quick-reorder or favorites higher up.
      */}
      <LazyLoadSection
        className="bg-white py-5 px-4 sm:px-6 lg:px-8 mb-4"
        fallback={
          <div className="max-w-[1280px] mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="h-7 w-56 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <RecentlyViewedSkeleton count={4} />
          </div>
        }
      >
        <Suspense fallback={
          <div className="max-w-[1280px] mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="h-7 w-56 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <RecentlyViewedSkeleton count={4} />
          </div>
        }>
          <div className="max-w-[1280px] mx-auto">
            <RecentlyViewed />
          </div>
        </Suspense>
      </LazyLoadSection>

    </div>
  );
});

Home.displayName = 'Home';

export default Home;