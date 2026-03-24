import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, TrendingUp, Shield, Zap, MapPin } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import LocationSearch from './LocationSearch';
import LocationAutocomplete from '../common/LocationAutocomplete';
import { memo, useMemo, useCallback, useState } from 'react';

const HeroSection = memo(() => {
  const { searchQuery, setSearchQuery, location, setLocation, userCoordinates, setUserCoordinates } = useApp();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('');

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    navigate('/listings');
  }, [navigate]);

  const handleLocationSelect = useCallback((locationData) => {
    console.log('Location selected:', locationData);
    setSelectedLocation(locationData.description);
    setLocation(locationData.description);
    
    // Don't set coordinates for location-based filtering on home page
    // This avoids too strict filtering that hides listings
    // If coordinates are available, store them
    // if (locationData.lat && locationData.lng) {
    //   setUserCoordinates({
    //     lat: locationData.lat,
    //     lng: locationData.lng
    //   });
    // }
  }, [setLocation, setUserCoordinates]);

  const stats = useMemo(() => [
    { label: 'Active Rentals', value: '50K+', icon: TrendingUp },
    { label: 'Verified Users', value: '100K+', icon: Shield },
    { label: 'Categories', value: '12+', icon: Sparkles },
  ], []);

  const popularSearches = useMemo(() => 
    ['Cars', 'Bikes', 'Laptops', 'Furniture', 'Cameras', 'Electronics'], []
  );

  const handlePopularSearch = useCallback((term) => {
    setSearchQuery(term);
    navigate('/listings');
  }, [setSearchQuery, navigate]);

  return (
    <div id="hero-section" className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-white/30 rounded-full animate-float"></div>
        <div className="absolute top-1/3 right-20 w-3 h-3 bg-white/20 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/30 rounded-full animate-float animation-delay-3000"></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <Zap size={16} className="text-yellow-300" />
            <span className="text-xs md:text-sm font-semibold">India's #1 Rental Marketplace</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 md:mb-6 tracking-tight leading-tight animate-slide-up">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
              Rent Anything,
            </span>
            <br />
            <span className="relative">
              Anytime, Anywhere
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-lg lg:text-xl mb-8 md:mb-10 text-blue-100 font-medium max-w-2xl mx-auto leading-relaxed animate-fade-in animation-delay-500">
            Discover thousands of items to rent from trusted people in your community. 
            <span className="hidden md:inline"> Save money, reduce waste, live sustainably.</span>
          </p>

          {/* Enhanced Search Box with Location */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-6 md:mb-8 animate-slide-up animation-delay-700">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-500"></div>
              
              <div className="relative flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search for cars, bikes, furniture, electronics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-xl focus:outline-none text-sm md:text-base font-medium placeholder:text-gray-400"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="sm:w-auto md:px-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Search size={18} className="mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </form>

          {/* Location Search with Current Location Feature */}
          <div className="flex justify-center mb-8 md:mb-10 animate-fade-in animation-delay-900">
            <div className="w-full max-w-md">
              <LocationAutocomplete
                value={selectedLocation || location}
                onChange={setSelectedLocation}
                onLocationSelect={handleLocationSelect}
                placeholder="Enter your location or use GPS"
                icon={<MapPin className="w-4 h-4" />}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                showGetLocation={true}
              />
            </div>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 md:mb-12 animate-fade-in animation-delay-1000">
            <span className="text-blue-200 text-xs md:text-sm font-semibold flex items-center gap-1">
              <Sparkles size={14} />
              Popular:
            </span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => handlePopularSearch(term)}
                className="text-xs md:text-sm bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full transition-all hover:scale-105 hover:-translate-y-0.5 font-medium shadow-lg"
              >
                {term}
              </button>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto animate-fade-in animation-delay-1200">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6 hover:bg-white/15 transition-all hover:scale-105 hover:-translate-y-1"
                >
                  <Icon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 md:mb-3 text-blue-200" />
                  <div className="text-xl md:text-3xl font-black mb-1">{stat.value}</div>
                  <div className="text-[10px] md:text-sm text-blue-200 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;

