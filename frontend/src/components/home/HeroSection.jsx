import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, TrendingUp, Shield, Zap, MapPin, Navigation } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import LocationAutocomplete from '../common/LocationAutocomplete';
import { memo, useMemo, useCallback, useState } from 'react';

const HeroSection = memo(() => {
  const { searchQuery, setSearchQuery, location, setLocation, setUserCoordinates } = useApp();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    navigate('/listings');
  }, [navigate]);

  const handleLocationSelect = useCallback((locationData) => {
    setSelectedLocation(locationData.description);
    setLocation(locationData.description);
  }, [setLocation]);

  const stats = useMemo(() => [
    { label: 'Active Rentals', value: '50K+', icon: TrendingUp },
    { label: 'Verified Users', value: '100K+', icon: Shield },
    { label: 'Locations', value: '500+', icon: MapPin },
  ], []);

  const popularSearches = useMemo(() =>
    ['Cars', 'Bikes', 'Laptops', 'Furniture', 'Cameras', 'Electronics'], []
  );

  const handlePopularSearch = useCallback((term) => {
    setSearchQuery(term);
    navigate('/listings');
  }, [setSearchQuery, navigate]);

  return (
    <div id="hero-section" className="relative bg-[#fc8019] text-white overflow-hidden font-sans">
      {/* Subtle Background Pattern - Swiggy style clean dots/waves */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge - Clean & Bold */}
          <div className="inline-flex items-center gap-2 bg-black/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-1.5 mb-8 animate-fade-in shadow-sm">
            <Zap size={14} className="text-[#ffc107] fill-[#ffc107]" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">India's Trusted Rental Hub</span>
          </div>

          {/* Main Heading - Swiggy Extra Bold Style */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1] animate-slide-up">
            Rent Anything, <br />
            <span className="text-black/20">Anytime, Anywhere.</span>
          </h1>

          {/* Subtitle - Medium weight for better readability */}
          <p className="text-sm md:text-xl mb-10 text-white/90 font-bold max-w-2xl mx-auto leading-relaxed animate-fade-in animation-delay-500">
            Find everything from cameras to cars. <span className="hidden md:inline">Experience the freedom of renting from your community.</span>
          </p>

          {/* Search Box - Pure white, sharp corners/soft rounding, large shadow */}
          <div className="max-w-3xl mx-auto mb-10 animate-slide-up animation-delay-700">
            <div className="relative group">
              {/* Outer shadow/glow */}
              <div className="absolute -inset-2 bg-black/5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

              <div className="relative flex flex-col md:flex-row items-stretch gap-0 bg-white rounded-2xl md:rounded-[2rem] p-1.5 shadow-2xl">

                {/* Location Part */}
                <div className="flex-[0.8] relative border-b md:border-b-0 md:border-r border-gray-100">
                  <div className="h-full flex items-center">
                    <LocationAutocomplete
                      value={selectedLocation || location}
                      onChange={setSelectedLocation}
                      onLocationSelect={handleLocationSelect}
                      placeholder="Select Location"
                      icon={<Navigation size={18} className="text-[#fc8019]" />}
                      className="w-full bg-transparent border-none text-gray-900 placeholder:text-gray-400 font-bold focus:ring-0"
                      showGetLocation={true}
                    />
                  </div>
                </div>

                {/* Search Part */}
                <form onSubmit={handleSearch} className="flex-1 flex items-center">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input
                      type="text"
                      placeholder="Search for items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-5 text-gray-900 rounded-xl focus:outline-none text-base font-bold placeholder:text-gray-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="hidden md:flex bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-sm transition-all shrink-0 mr-1"
                  >
                    Search
                  </Button>
                </form>

                {/* Mobile Search Button */}
                <button
                  onClick={handleSearch}
                  className="md:hidden w-full bg-gray-900 text-white py-4 rounded-xl font-black uppercase tracking-wider mb-1"
                >
                  Find Items
                </button>
              </div>
            </div>
          </div>

          {/* Popular Searches - Pill style with glass effect */}
          <div className="flex flex-wrap justify-center items-center gap-3 mb-14 animate-fade-in animation-delay-1000">
            <span className="text-white/60 text-[10px] uppercase font-black tracking-widest mr-2">
              Popular
            </span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => handlePopularSearch(term)}
                className="text-xs md:text-sm bg-white/10 hover:bg-white text-white hover:text-[#fc8019] border border-white/20 px-5 py-2 rounded-xl transition-all font-extrabold shadow-sm active:scale-95"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Stats Section - Modular Swiggy cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto animate-fade-in animation-delay-1200">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-4 md:p-6 transition-all hover:bg-white/20 group"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#ffc107]" />
                  </div>
                  <div className="text-xl md:text-3xl font-black mb-1 text-white tracking-tighter">{stat.value}</div>
                  <div className="text-[9px] md:text-[11px] text-white/70 font-black uppercase tracking-widest">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Swiggy Style Bottom Curve (Optional SVG) */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f0f0f5] rounded-t-[3rem]"></div>
    </div>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;