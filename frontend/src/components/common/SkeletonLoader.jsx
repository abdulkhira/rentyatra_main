import React from 'react';

/**
 * Skeleton loader components for better perceived performance
 */

// Base skeleton component
export const Skeleton = ({ className = '', children, ...props }) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Category grid skeleton (for Home page)
export const CategoryGridSkeleton = () => (
  <div className="py-8 px-4">
    <div className="max-w-7xl mx-auto">
      {/* Banner skeleton */}
      <div className="mb-6 md:mb-8">
        <BannerSkeleton />
      </div>
      {/* Category grid skeleton */}
      <ProductGridSkeleton count={8} />
    </div>
  </div>
);

// Product grid skeleton
export const ProductGridSkeleton = ({ count = 12, isMobile = false }) => {
  if (isMobile) {
    return (
      <div 
        className="grid grid-rows-2 auto-cols-max gap-x-2 gap-y-2 pb-2" 
        style={{ 
          gridAutoFlow: 'column',
          width: 'max-content'
        }}
      >
        {[...Array(count)].map((_, index) => (
          <div key={index} style={{ width: '70px' }}>
            <Skeleton className="w-full h-[65px] rounded-lg mb-1" />
            <Skeleton className="h-2 w-3/4 mx-auto" />
          </div>
        ))}
        {/* See All Card Skeleton */}
        <div style={{ width: '70px', gridRow: 'span 2' }}>
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-8 gap-2 lg:gap-3">
      {[...Array(count)].map((_, index) => (
        <div key={index}>
          <Skeleton className="w-full aspect-square rounded-lg mb-2" />
          <Skeleton className="h-3 w-3/4 mx-auto" />
        </div>
      ))}
    </div>
  );
};

// Featured listings skeleton
export const FeaturedListingsSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <Skeleton className="aspect-video w-full" />
        <div className="p-3 sm:p-4 md:p-5">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-2/3 mb-4" />
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Recently viewed skeleton
export const RecentlyViewedSkeleton = ({ count = 4 }) => (
  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="flex-shrink-0 w-44 md:w-52 bg-white rounded-lg overflow-hidden border border-gray-200">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="p-3">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-5 w-20 mb-2" />
          <div className="flex items-center">
            <Skeleton className="h-3 w-3 mr-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Banner skeleton
export const BannerSkeleton = () => (
  <div className="w-full h-32 md:h-40 bg-gray-100 rounded-lg overflow-hidden">
    <Skeleton className="w-full h-full" />
  </div>
);

// Category skeleton
export const CategorySkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="text-center">
        <Skeleton className="w-16 h-16 mx-auto rounded-lg mb-2" />
        <Skeleton className="h-3 w-12 mx-auto" />
      </div>
    ))}
  </div>
);

// Hero section skeleton
export const HeroSkeleton = () => (
  <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
    <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge skeleton */}
        <Skeleton className="inline-block h-8 w-48 rounded-full mb-6" />
        
        {/* Main heading skeleton */}
        <div className="mb-4 md:mb-6">
          <Skeleton className="h-12 md:h-16 lg:h-20 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-12 md:h-16 lg:h-20 w-2/3 mx-auto" />
        </div>
        
        {/* Subtitle skeleton */}
        <Skeleton className="h-4 md:h-6 w-2/3 mx-auto mb-8 md:mb-10" />
        
        {/* Search box skeleton */}
        <div className="max-w-3xl mx-auto mb-6 md:mb-8">
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
        
        {/* Location search skeleton */}
        <div className="flex justify-center mb-8 md:mb-10">
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        
        {/* Popular searches skeleton */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 md:mb-12">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6">
              <Skeleton className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 md:mb-3 bg-white/20" />
              <Skeleton className="h-6 md:h-8 w-12 mx-auto mb-1 bg-white/20" />
              <Skeleton className="h-3 w-16 mx-auto bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;
