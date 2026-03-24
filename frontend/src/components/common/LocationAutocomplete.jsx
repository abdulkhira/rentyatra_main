import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import googleMapsService from '../../services/googleMapsService';

const LocationAutocomplete = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Search for your location...",
  icon = <Search className="w-4 h-4" />,
  className = "",
  disabled = false,
  showGetLocation = false
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [error, setError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef();

  // Check if Google Maps service is ready
  useEffect(() => {
    const checkService = async () => {
      try {
        if (googleMapsService.isInitialized) {
          setIsServiceReady(true);
          setError(null);
        } else {
          await googleMapsService.initialize();
          setIsServiceReady(true);
          setError(null);
        }
      } catch (err) {
        console.error('LocationAutocomplete: Service initialization failed:', err);
        setError('Location service temporarily unavailable. You can still type your location manually.');
      }
    };
    
    checkService();
  }, []);

  // Debounced search function
  const searchLocations = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!isServiceReady) {
      setError('Google Maps service not ready');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await googleMapsService.getLocationSuggestions(searchTerm);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('LocationAutocomplete: Error searching locations:', error);
      setError('Failed to search locations');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [isServiceReady]);

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle location selection
  const handleLocationSelect = async (location) => {
    try {
      // Get detailed place information
      const placeDetails = await googleMapsService.getPlaceDetails(location.placeId);
      
      if (placeDetails && placeDetails.address) {
        const enhancedLocation = {
          ...location,
          description: placeDetails.address,
          mainText: location.mainText || placeDetails.address.split(',')[0],
          secondaryText: placeDetails.address.split(',').slice(1).join(',').trim(),
          lat: placeDetails.lat,
          lng: placeDetails.lng
        };
        
        onChange(placeDetails.address);
        onLocationSelect(enhancedLocation);
      } else {
        onChange(location.description || location.address);
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      onChange(location.description || location.address);
      onLocationSelect(location);
    }
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current location function
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    try {
      // Get precise coordinates first
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('GPS Coordinates:', { latitude, longitude });
      
      // Validate coordinates are reasonable
      if (latitude === 0 && longitude === 0) {
        throw new Error('Invalid coordinates received (0,0)');
      }
      
      // Check if coordinates are within reasonable bounds (not in middle of ocean)
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        throw new Error('Invalid coordinate range');
      }
      
      // Now get address from coordinates using reverse geocoding
      let address = '';
      try {
        address = await googleMapsService.reverseGeocode(latitude, longitude);
        console.log('Reverse geocoded address:', address);
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
        address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      
      // Update the input field
      onChange(address);
      
      // Create location object with actual coordinates
      const currentLocation = {
        place_id: 'current_location',
        description: address,
        mainText: 'Current Location',
        secondaryText: address,
        lat: latitude,
        lng: longitude
      };
      
      console.log('Current location object:', currentLocation);
      onLocationSelect(currentLocation);
      
    } catch (error) {
      console.error('Error getting current location:', error);
      if (error.code === 1) {
        setError('Location access denied. Please allow location access.');
      } else if (error.code === 2) {
        setError('Location unavailable. Please try again.');
      } else if (error.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Failed to get current location. Please try again.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center z-10 transition-all duration-300 group-hover:bg-blue-200 group-hover:scale-110">
          {icon}
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`pl-12 h-14 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base hover:border-blue-300 hover:shadow-md ${
            showGetLocation ? "pr-20" : "pr-4"
          } ${className}`}
          disabled={disabled}
        />
        
        {/* GPS Button for getting current location */}
        {showGetLocation && (
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation || disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:scale-100 disabled:cursor-not-allowed"
            title="Get current location"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-green-600" />
            )}
          </button>
        )}
        
        {/* Loading spinner */}
        {isLoading && !isGettingLocation && (
          <div className={`absolute top-1/2 transform -translate-y-1/2 ${
            showGetLocation ? "right-24" : "right-4"
          }`}>
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto shadow-2xl border-0 bg-white rounded-xl scrollbar-hide"
        >
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                  selectedIndex === index && "bg-blue-100 border-l-4 border-blue-500"
                }`}
                onClick={() => handleLocationSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-shrink-0 mt-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.mainText || suggestion.description}
                  </div>
                  {suggestion.secondaryText && (
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.secondaryText}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;