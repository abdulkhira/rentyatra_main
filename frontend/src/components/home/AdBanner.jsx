import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '../../services/api';

const AdBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const bannerRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getPublicBanners('', 5);
      if (response.success && response.data.banners?.length > 0) {
        setBanners(response.data.banners);
      } else {
        setBanners(FALLBACK_BANNERS);
      }
    } catch (error) {
      setBanners(FALLBACK_BANNERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Auto-slide logic
  useEffect(() => {
    if (banners.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [banners.length, isPaused]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  if (loading) return (
    <div className="w-full h-48 md:h-64 bg-gray-100 animate-pulse rounded-3xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Zap className="text-orange-400 animate-bounce" size={32} />
        <span className="text-gray-400 font-bold tracking-widest text-xs">PREPARING DEALS</span>
      </div>
    </div>
  );

  return (
    <div
      className="group relative w-full h-48 md:h-72 overflow-hidden rounded-3xl bg-gray-900 shadow-2xl transition-all duration-500 hover:shadow-orange-500/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner._id}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
        >
          {/* Gradient Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-10" />

          <img
            src={banner.banner}
            alt={banner.title}
            className="w-full h-full object-cover transform transition-transform duration-[10000ms] ease-linear group-hover:scale-110"
          />

          {/* Content Overlay */}
          {/* <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16">
            <span className="inline-block w-fit px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full mb-3 tracking-[0.2em] animate-pulse">
              {banner.tag || 'FEATURED'}
            </span>
            <h2 className="text-2xl md:text-5xl font-black text-white max-w-md leading-tight mb-4 drop-shadow-lg">
              {banner.title}
            </h2>
            <button className="flex items-center gap-2 w-fit px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-[#fc8019] hover:text-white transition-all transform active:scale-95 shadow-lg">
              Shop Now <Sparkles size={16} />
            </button>
          </div> */}
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
      >
        <ChevronRight size={24} />
      </button>

      {/* Modern Progress Dots */}
      <div className="absolute bottom-6 right-8 z-30 flex items-center gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`transition-all duration-500 rounded-full ${currentIndex === i
              ? 'w-8 h-1.5 bg-orange-500'
              : 'w-2 h-1.5 bg-white/40 hover:bg-white/60'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default AdBanner;