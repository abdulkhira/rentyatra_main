import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import LocationSearch from '../home/LocationSearch';
import rentyatralogo from '../../assets/rentyatralogo.jpg.png';


const Navbar = () => {
  const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const { isAuthenticated, user, logout } = useAuth();
  const { location, favorites, items, toggleFavorite, getFavoritesCount } = useApp();
  const navigate = useNavigate();

  const categoryNames = ['Cars', 'Bikes', 'Mobiles', 'Properties', 'Jobs', 'Furniture', 'Electronics', 'Fashion'];

  // Animate placeholder categories
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCategoryIndex((prev) => (prev + 1) % 8); // Fixed length
    }, 2000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array

  return (
    <nav className="sticky-header bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-2 md:px-3">
        {/* Mobile Layout - Two Rows */}
        <div className="md:hidden">
          {/* Top Row - Logo and Location */}
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img src={rentyatralogo} alt="RentYatra Logo" className="h-28 w-auto relative top-2 left-2" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowLocationMenu(!showLocationMenu)}
                className="flex items-center gap-1.5 px-1.5 py-1 hover:bg-gray-100 rounded transition"
                title={location || 'New Palasia, Indore'}
              >
                <MapPin size={18} className="text-gray-700 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                  {location || 'New Palasia, Indore'}
                </span>
                <ChevronDown size={16} className="text-gray-700 flex-shrink-0" />
              </button>
              {showLocationMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 py-3 animate-fade-in z-50">
                  <LocationSearch onClose={() => setShowLocationMenu(false)} />
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Row - Search Bar with Icons */}
          <div className="pb-3 px-0.5">
            <div className="flex items-center gap-2">
              <SearchBar 
                placeholder={`Search "${categoryNames[currentCategoryIndex]}"`}
                className="flex-1"
                showSuggestions={true}
              />
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => navigate('/favorites')}
                  className="p-2 hover:bg-gray-100 rounded-full transition relative"
                  title="Favorites"
                >
                  <Heart className="text-gray-700" size={22} />
                  {getFavoritesCount() >= 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {getFavoritesCount()}
                    </span>
                  )}
                </button>

                {/* Favorites Dropdown */}
                {showFavoritesDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowFavoritesDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden border border-gray-200">
                      <div className="bg-gradient-to-r from-red-500 to-pink-600 px-4 py-3 text-white">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Heart size={20} fill="currentColor" />
                          My Favorites ({getFavoritesCount()})
                        </h3>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        {getFavoritesCount() === 0 ? (
                          <div className="p-8 text-center">
                            <Heart size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 mb-2">No favorites yet</p>
                            <p className="text-sm text-gray-400">Start adding items you love!</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {items.filter(item => favorites.includes(item.id)).map((item) => (
                              <div
                                key={item.id}
                                className="p-3 hover:bg-gray-50 transition cursor-pointer flex gap-3"
                                onClick={() => {
                                  navigate(`/item/${item.id}`);
                                  setShowFavoritesDropdown(false);
                                }}
                              >
                                <img
                                  src={item.images[0]}
                                  alt={item.title}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                                    {item.title}
                                  </h4>
                                  <p className="text-blue-600 font-bold text-sm">
                                    ₹{item.price.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} />
                                    {item.location}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item.id);
                                  }}
                                  className="flex-shrink-0 p-1.5 hover:bg-red-50 rounded-full transition"
                                >
                                  <Heart size={16} className="fill-red-500 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {getFavoritesCount() > 0 && (
                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                          <button
                            onClick={() => {
                              navigate('/dashboard/favorites');
                              setShowFavoritesDropdown(false);
                            }}
                            className="w-full py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
                          >
                            View All Favorites
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Single Row */}
        <div className="hidden md:flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src={rentyatralogo} alt="RentYatra Logo" className="h-42 w-48 relative top-3" />
          </Link>

          {/* Location Selector */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowLocationMenu(!showLocationMenu)}
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 rounded transition"
            >
              <MapPin size={18} className="text-gray-700 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={location || 'New Palasia, Indore'}>
                {location || 'New Palasia, Indore'}
              </span>
              <ChevronDown size={16} className="text-gray-700 flex-shrink-0" />
            </button>
            {showLocationMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 py-3 animate-fade-in z-50">
                <LocationSearch onClose={() => setShowLocationMenu(false)} />
              </div>
            )}
          </div>

          {/* Search Bar */}
          <SearchBar 
            placeholder={`Search "${categoryNames[currentCategoryIndex]}"`}
            className="flex-1 max-w-2xl"
            showSuggestions={true}
          />

          {/* Right Side - Login/User and Icons */}
          <div className="flex items-center gap-3">
            {/* Pricing Link */}
            {/* <Link 
              to="/subscription" 
              className="px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition flex-shrink-0"
            >
              Plans
            </Link> */}
            
            {/* Heart Icon */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => navigate('/favorites')}
                className="p-2 hover:bg-gray-100 rounded-full transition relative"
                title="Favorites"
              >
                <Heart className="text-gray-700" size={22} />
                {getFavoritesCount() >= 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getFavoritesCount()}
                  </span>
                )}
              </button>

              {/* Favorites Dropdown - Desktop */}
              {showFavoritesDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowFavoritesDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 px-4 py-3 text-white">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Heart size={20} fill="currentColor" />
                        My Favorites ({getFavoritesCount()})
                      </h3>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {getFavoritesCount() === 0 ? (
                        <div className="p-8 text-center">
                          <Heart size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500 mb-2">No favorites yet</p>
                          <p className="text-sm text-gray-400">Start adding items you love!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {items.filter(item => favorites.includes(item.id)).map((item) => (
                            <div
                              key={item.id}
                              className="p-3 hover:bg-gray-50 transition cursor-pointer flex gap-3"
                              onClick={() => {
                                navigate(`/item/${item.id}`);
                                setShowFavoritesDropdown(false);
                              }}
                            >
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                                  {item.title}
                                </h4>
                                <p className="text-blue-600 font-bold text-sm">
                                  ₹{item.price.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <MapPin size={10} />
                                  {item.location}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className="flex-shrink-0 p-1.5 hover:bg-red-50 rounded-full transition"
                              >
                                <Heart size={16} className="fill-red-500 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {getFavoritesCount() > 0 && (
                      <div className="border-t border-gray-200 p-3 bg-gray-50">
                        <button
                          onClick={() => {
                            navigate('/dashboard/favorites');
                            setShowFavoritesDropdown(false);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all"
                        >
                          View All Favorites
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Login/User Button */}
            {isAuthenticated ? (
              <>
                <Button 
                  icon={Plus} 
                  onClick={() => navigate('/post-ad')} 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold shadow-md px-4 py-1.5 text-sm"
                >
                  RENT OUT
                </Button>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-full transition">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {user?.name?.charAt(0)}
                    </div>
                    <ChevronDown size={16} className="text-gray-700" />
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                    </div>
                    <Link to="/dashboard" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      My Dashboard
                    </Link>
                    <Link to="/my-featured-ads" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      My Featured Ads
                    </Link>
                    <Link to="/messages" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      Messages
                    </Link>
                    <Link to="/dashboard/profile" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      Profile
                    </Link>
                    {/* <Link to="/subscription" className="block px-4 py-2.5 hover:bg-blue-50 text-blue-600 text-sm font-semibold">
                      ⭐ Buy Subscription
                    </Link>
                    <Link to="/my-subscription" className="block px-4 py-2.5 hover:bg-blue-50 text-blue-600 text-sm">
                      ⭐ My Subscription
                    </Link> */}
                    <Link to="/buy-boost" className="block px-4 py-2.5 hover:bg-orange-50 text-orange-600 text-sm font-semibold">
                      🚀 Buy Boost
                    </Link>
                    <Link to="/my-boost" className="block px-4 py-2.5 hover:bg-orange-50 text-orange-600 text-sm">
                      🚀 My Boost
                    </Link>
                    <Link to="/terms-and-conditions" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      Terms & Conditions
                    </Link>
                    <Link to="/privacy-policy" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      Privacy Policy
                    </Link>
                    <Link to="/faqs" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      FAQs
                    </Link>
                    <Link to="/support-ticket" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      Contact Us
                    </Link>
                    <Link to="/about-us" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 text-sm">
                      About Us
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Button 
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold shadow-md px-4 py-1.5 text-sm"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

