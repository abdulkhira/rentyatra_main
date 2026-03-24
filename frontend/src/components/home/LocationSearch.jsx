import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import googleMapsService from '../../services/googleMapsService';

// Popular cities in India (expanded list for better suggestions)
const popularCities = [
  { id: 1, name: 'Mumbai', state: 'Maharashtra' },
  { id: 2, name: 'Delhi', state: 'Delhi' },
  { id: 3, name: 'Bangalore', state: 'Karnataka' },
  { id: 4, name: 'Hyderabad', state: 'Telangana' },
  { id: 5, name: 'Chennai', state: 'Tamil Nadu' },
  { id: 6, name: 'Kolkata', state: 'West Bengal' },
  { id: 7, name: 'Pune', state: 'Maharashtra' },
  { id: 8, name: 'Ahmedabad', state: 'Gujarat' },
  { id: 9, name: 'Jaipur', state: 'Rajasthan' },
  { id: 10, name: 'Surat', state: 'Gujarat' },
  { id: 11, name: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 12, name: 'Kanpur', state: 'Uttar Pradesh' },
  { id: 13, name: 'Nagpur', state: 'Maharashtra' },
  { id: 14, name: 'Indore', state: 'Madhya Pradesh' },
  { id: 15, name: 'Thane', state: 'Maharashtra' },
  { id: 16, name: 'Bhopal', state: 'Madhya Pradesh' },
  { id: 17, name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { id: 18, name: 'Patna', state: 'Bihar' },
  { id: 19, name: 'Vadodara', state: 'Gujarat' },
  { id: 20, name: 'Ghaziabad', state: 'Uttar Pradesh' },
  { id: 21, name: 'Ludhiana', state: 'Punjab' },
  { id: 22, name: 'Agra', state: 'Uttar Pradesh' },
  { id: 23, name: 'Nashik', state: 'Maharashtra' },
  { id: 24, name: 'Faridabad', state: 'Haryana' },
  { id: 25, name: 'Meerut', state: 'Uttar Pradesh' },
  { id: 26, name: 'Rajkot', state: 'Gujarat' },
  { id: 27, name: 'Kalyan-Dombivali', state: 'Maharashtra' },
  { id: 28, name: 'Vasai-Virar', state: 'Maharashtra' },
  { id: 29, name: 'Varanasi', state: 'Uttar Pradesh' },
  { id: 30, name: 'Srinagar', state: 'Jammu and Kashmir' },
  { id: 31, name: 'Aurangabad', state: 'Maharashtra' },
  { id: 32, name: 'Dhanbad', state: 'Jharkhand' },
  { id: 33, name: 'Amritsar', state: 'Punjab' },
  { id: 34, name: 'Navi Mumbai', state: 'Maharashtra' },
  { id: 35, name: 'Allahabad', state: 'Uttar Pradesh' },
  { id: 36, name: 'Ranchi', state: 'Jharkhand' },
  { id: 37, name: 'Howrah', state: 'West Bengal' },
  { id: 38, name: 'Coimbatore', state: 'Tamil Nadu' },
  { id: 39, name: 'Jabalpur', state: 'Madhya Pradesh' },
  { id: 40, name: 'Gwalior', state: 'Madhya Pradesh' },
  { id: 41, name: 'Dewas', state: 'Madhya Pradesh' },
  { id: 42, name: 'Ujjain', state: 'Madhya Pradesh' },
  { id: 43, name: 'Gurgaon', state: 'Haryana' },
  { id: 44, name: 'Noida', state: 'Uttar Pradesh' },
  { id: 45, name: 'Chandigarh', state: 'Chandigarh' },
  { id: 46, name: 'Kochi', state: 'Kerala' },
  { id: 47, name: 'Mysore', state: 'Karnataka' },
  { id: 48, name: 'Tirupur', state: 'Tamil Nadu' },
  { id: 49, name: 'Salem', state: 'Tamil Nadu' },
  { id: 50, name: 'Madurai', state: 'Tamil Nadu' },
  { id: 51, name: 'Tirunelveli', state: 'Tamil Nadu' },
  { id: 52, name: 'Erode', state: 'Tamil Nadu' },
  { id: 53, name: 'Thiruvananthapuram', state: 'Kerala' },
  { id: 54, name: 'Kozhikode', state: 'Kerala' },
  { id: 55, name: 'Thrissur', state: 'Kerala' },
  { id: 56, name: 'Kannur', state: 'Kerala' },
  { id: 57, name: 'Kollam', state: 'Kerala' },
  { id: 58, name: 'Palakkad', state: 'Kerala' },
  { id: 59, name: 'Malappuram', state: 'Kerala' },
  { id: 60, name: 'Alappuzha', state: 'Kerala' },
];

const LocationSearch = ({ onClose }) => {
  const { location, setLocation, userCoordinates, setUserCoordinates } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState(popularCities.slice(0, 8));
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load nearby suggestions when modal opens
  useEffect(() => {
    if (isOpen && userCoordinates) {
      console.log('Modal opened with user coordinates:', userCoordinates);
      loadNearbySuggestions();
    } else if (isOpen && !userCoordinates) {
      console.log('Modal opened but no user coordinates available');
    }
  }, [isOpen, userCoordinates]);

  // Load nearby suggestions
  const loadNearbySuggestions = async () => {
    if (!userCoordinates) {
      console.log('No user coordinates available for nearby suggestions');
      return;
    }

    console.log('Loading nearby suggestions for coordinates:', userCoordinates);
    setIsLoadingNearby(true);
    try {
      const suggestions = await googleMapsService.getNearbyLocationSuggestions(
        userCoordinates.lat,
        userCoordinates.lng,
        15 // 15km radius
      );
      console.log('Nearby suggestions loaded:', suggestions);
      setNearbySuggestions(suggestions);
    } catch (error) {
      console.error('Error loading nearby suggestions:', error);
      setNearbySuggestions([]);
    } finally {
      setIsLoadingNearby(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Filter cities based on search term with real-time suggestions
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities(popularCities.slice(0, 8));
      setShowSuggestions(false);
    } else {
      // First try static cities filter
      const staticFiltered = popularCities.filter(
        (city) =>
          city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.state.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // If no static results, try Google Maps API
      if (staticFiltered.length === 0 && searchTerm.trim().length > 2) {
        loadGoogleMapsSuggestions(searchTerm);
      } else {
        setFilteredCities(staticFiltered.slice(0, 10));
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    }
  }, [searchTerm]);

  // Load Google Maps suggestions
  const loadGoogleMapsSuggestions = async (searchTerm) => {
    try {
      console.log('Loading Google Maps suggestions for:', searchTerm);
      const suggestions = await googleMapsService.getLocationSuggestions(searchTerm);
      console.log('Google Maps suggestions received:', suggestions);

      if (suggestions.length > 0) {
        // Convert Google Maps suggestions to city format
        const citySuggestions = suggestions.map(suggestion => ({
          id: suggestion.placeId || suggestion.id,
          name: suggestion.mainText || suggestion.city,
          state: suggestion.secondaryText || suggestion.city,
          address: suggestion.address,
          coordinates: suggestion.location
        }));

        setFilteredCities(citySuggestions.slice(0, 10));
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } else {
        setFilteredCities([]);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error loading Google Maps suggestions:', error);
      setFilteredCities([]);
      setShowSuggestions(true);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredCities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredCities.length) {
          handleCitySelect(filteredCities[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleCitySelect = (city) => {
    console.log('City selected:', city);

    // If it's a Google Maps suggestion with coordinates
    if (city.coordinates) {
      setLocation(city.address || city.name);
      setUserCoordinates({ lat: city.coordinates.lat, lng: city.coordinates.lng });
    } else {
      setLocation(city.name);
    }

    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsOpen(false);
    onClose?.();
  };

  const handleNearbySelect = (suggestion) => {
    console.log('Nearby suggestion selected:', suggestion);
    setLocation(suggestion.address);
    setUserCoordinates({ lat: suggestion.lat, lng: suggestion.lng });
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setIsOpen(false);
    onClose?.();
  };

  const handleClearLocation = () => {
    setLocation('');
    setSearchTerm('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const detectCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);

    try {
      // Use Google Maps service to get coordinates
      const locationData = await googleMapsService.getCurrentLocation();

      console.log('Current location data:', locationData);

      // Extract coordinates
      const { lat, lng } = locationData;

      // Get address from coordinates using reverse geocoding
      let address = '';
      try {
        address = await googleMapsService.reverseGeocode(lat, lng);
        console.log('Reverse geocoded address:', address);
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
        address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      // Parse the address to extract area, city, state, pincode
      const addressParts = address.split(',').map(part => part.trim());

      // Try to extract different components
      let area = '';
      let city = '';
      let state = '';
      let pincode = '';

      // Look for pincode (6-digit number)
      const pincodeMatch = address.match(/\b\d{6}\b/);
      if (pincodeMatch) {
        pincode = pincodeMatch[0];
      }

      // Extract area (usually first part)
      if (addressParts.length > 0) {
        area = addressParts[0];
      }

      // Extract city and state from remaining parts
      for (let i = 1; i < addressParts.length; i++) {
        const part = addressParts[i];

        // Skip pincode if found
        if (part === pincode) continue;

        // Check if it's a state (common Indian states)
        const indianStates = [
          'Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal',
          'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Andhra Pradesh',
          'Bihar', 'Haryana', 'Punjab', 'Jammu and Kashmir', 'Jharkhand', 'Assam',
          'Kerala', 'Odisha', 'Chhattisgarh', 'Himachal Pradesh', 'Uttarakhand',
          'Goa', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim',
          'Tripura', 'Arunachal Pradesh', 'Ladakh', 'Puducherry', 'Chandigarh',
          'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep', 'Andaman and Nicobar Islands'
        ];

        if (indianStates.includes(part)) {
          state = part;
        } else if (!city) {
          city = part;
        }
      }

      // Format the location display with full address and coordinates as requested
      // User request: Show live location with latitude longitude and full live address
      const formattedLat = lat.toFixed(6);
      const formattedLng = lng.toFixed(6);

      // Use the full address from Google Maps directly combined with coordinates
      let locationDisplay = `${address} (Lat: ${formattedLat}, Lng: ${formattedLng})`;

      console.log('Final location display with coordinates:', locationDisplay);

      // Set the detailed location
      setLocation(locationDisplay);

      // Also set user coordinates for service radius filtering
      setUserCoordinates({ lat, lng });

      setIsDetecting(false);
      setIsOpen(false);
      onClose?.();

    } catch (error) {
      console.error('Error getting current location:', error);

      // Show user-friendly error message
      const errorMessage = error.message || 'Unable to detect your location';

      // Don't show alert for timeout - just silently fail and let user select manually
      if (!errorMessage.includes('timed out')) {
        // Only show alert for permission denied or unavailable
        setTimeout(() => {
          alert(errorMessage + '. Please select a location manually from the list below.');
        }, 100);
      }

      setIsDetecting(false);
      // Keep dropdown open so user can select manually
    }
  };

  // If onClose is provided, render as inline dropdown (for Navbar)
  if (onClose) {
    return (
      <>
        {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for your city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(searchTerm.trim() !== '')}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />

            {/* Search Suggestions Dropdown */}
            {showSuggestions && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {filteredCities.map((city, index) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition text-left group ${index === selectedSuggestionIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                      <MapPin size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{city.name}</div>
                      <div className="text-xs text-gray-500">{city.state}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detect Current Location */}
        <button
          onClick={detectCurrentLocation}
          disabled={isDetecting}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition text-left border-b border-gray-100"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Navigation size={18} className={`text-blue-600 ${isDetecting ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {isDetecting ? 'Detecting...' : 'Use Current Location'}
            </div>
            <div className="text-xs text-gray-500">Auto-detect your location</div>
          </div>
        </button>

        {/* Popular Cities */}
        <div className="p-2 max-h-80 overflow-y-auto">
          {filteredCities.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {searchTerm ? 'Search Results' : 'Popular Cities'}
              </div>
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition text-left group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                    <MapPin size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{city.name}</div>
                    <div className="text-xs text-gray-500">{city.state}</div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-8 text-center">
              <MapPin size={32} className="mx-auto mb-2 text-gray-300" />
              <div className="text-sm text-gray-500">No cities found</div>
              <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
            </div>
          )}
        </div>

        {/* Quick Cities */}
        {!searchTerm && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Quick Select
            </div>
            <div className="flex flex-wrap gap-2">
              {popularCities.slice(0, 6).map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  // Default standalone mode (for Hero section)
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Location Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl transition-all text-white text-sm font-medium shadow-lg hover:shadow-xl"
      >
        <MapPin size={18} />
        <span className="hidden sm:inline">
          {location || 'Select Location'}
        </span>
        <span className="sm:hidden">
          {location ? location.split(',')[0] : 'Location'}
        </span>
        {location && (
          <X
            size={16}
            onClick={(e) => {
              e.stopPropagation();
              handleClearLocation();
            }}
            className="hover:text-red-300 transition"
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up z-50">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for your city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(searchTerm.trim() !== '')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />

              {/* Search Suggestions Dropdown */}
              {showSuggestions && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredCities.map((city, index) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition text-left group ${index === selectedSuggestionIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                        <MapPin size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{city.name}</div>
                        <div className="text-xs text-gray-500">{city.state}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detect Current Location */}
          <button
            onClick={detectCurrentLocation}
            disabled={isDetecting}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition text-left border-b border-gray-100"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Navigation size={18} className={`text-blue-600 ${isDetecting ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {isDetecting ? 'Detecting...' : 'Use Current Location'}
              </div>
              <div className="text-xs text-gray-500">Auto-detect your location</div>
            </div>
          </button>

          {/* Nearby Locations */}
          {nearbySuggestions.length > 0 && !searchTerm && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nearby Locations
              </div>
              <div className="max-h-40 overflow-y-auto">
                {nearbySuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleNearbySelect(suggestion)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-green-50 transition text-left group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                      <MapPin size={14} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{suggestion.mainText}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{suggestion.secondaryText}</span>
                        {suggestion.distance && (
                          <span className="text-green-600 font-medium">
                            • {suggestion.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Nearby Suggestions */}
          {isLoadingNearby && !searchTerm && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Navigation size={14} className="text-gray-400 animate-spin" />
                </div>
                <div className="text-sm text-gray-500">Loading nearby locations...</div>
              </div>
            </div>
          )}

          {/* Popular Cities */}
          <div className="p-2 max-h-80 overflow-y-auto">
            {filteredCities.length > 0 ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {searchTerm ? 'Search Results' : 'Popular Cities'}
                </div>
                {filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition text-left group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                      <MapPin size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{city.name}</div>
                      <div className="text-xs text-gray-500">{city.state}</div>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="px-4 py-8 text-center">
                <MapPin size={32} className="mx-auto mb-2 text-gray-300" />
                <div className="text-sm text-gray-500">No cities found</div>
                <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
              </div>
            )}
          </div>

          {/* Quick Cities */}
          {!searchTerm && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Quick Select
              </div>
              <div className="flex flex-wrap gap-2">
                {popularCities.slice(0, 6).map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;


