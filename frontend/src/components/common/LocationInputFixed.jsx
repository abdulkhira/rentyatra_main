import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, X, Search } from 'lucide-react';
import googleMapsService from '../../services/googleMapsService';
import ErrorBoundary from './ErrorBoundary';

const LocationInput = ({ 
  value, 
  onChange, 
  placeholder = "e.g., Mumbai, Maharashtra",
  className = "",
  showMap = true,
  radiusKm = 7
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState('');
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize Google Maps service (only once)
  useEffect(() => {
    const initMaps = async () => {
      try {
        await googleMapsService.initialize();
        console.log('Google Maps service initialized');
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setError('Failed to initialize maps service');
      }
    };
    
    // Only initialize if not already initialized
    if (!googleMapsService.isInitialized) {
      initMaps();
    }
  }, []);

  // Handle input change with debounced suggestions
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setError('');
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce suggestions
    debounceRef.current = setTimeout(async () => {
      if (inputValue.trim().length > 2) {
        await fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  // Fetch location suggestions
  const fetchSuggestions = async (query) => {
    try {
      setIsLoading(true);
      const suggestions = await googleMapsService.getLocationSuggestions(query);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    try {
      setIsLoading(true);
      setShowSuggestions(false);
      
      // Get place details
      const placeDetails = await googleMapsService.getPlaceDetails(suggestion.placeId);
      
      // Update form value
      onChange(placeDetails.address);
      setCoordinates({ lat: placeDetails.lat, lng: placeDetails.lng });
      
      // Update map if shown
      if (showMap && mapInitialized) {
        googleMapsService.updateMapLocation({ lat: placeDetails.lat, lng: placeDetails.lng }, radiusKm);
      }
      
      setError('');
    } catch (error) {
      console.error('Error selecting suggestion:', error);
      setError('Failed to get location details');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      setError('');
      
      const location = await googleMapsService.getCurrentLocation();
      
      // Update form value
      onChange(location.address);
      setCoordinates({ lat: location.lat, lng: location.lng });
      
      // Update map if shown
      if (showMap && mapInitialized) {
        googleMapsService.updateMapLocation({ lat: location.lat, lng: location.lng }, radiusKm);
      }
      
    } catch (error) {
      console.error('Error getting current location:', error);
      setError(error.message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Initialize map when coordinates are available
  useEffect(() => {
    if (showMap && coordinates && !mapInitialized) {
      const initMap = async () => {
        try {
          // Create a unique container ID
          const containerId = `map-container-${Date.now()}`;
          
          // Create container element
          const container = document.createElement('div');
          container.id = containerId;
          container.style.width = '100%';
          container.style.height = '100%';
          
          // Store reference
          mapInstanceRef.current = { container, containerId };

          await googleMapsService.initialize();
          const mapInstance = googleMapsService.createMapWithRadius(container, coordinates, radiusKm);
          mapInstanceRef.current.mapInstance = mapInstance;
          setMapInitialized(true);
        } catch (error) {
          console.error('Error initializing map:', error);
          setError(`Failed to initialize map: ${error.message}`);
          setMapInitialized(false);
        }
      };
      
      setTimeout(() => initMap(), 50);
    }
  }, [coordinates, showMap, radiusKm, mapInitialized]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get coordinates when value changes (for manual input)
  useEffect(() => {
    if (value && value.trim() && !coordinates) {
      const getCoordsFromValue = async () => {
        try {
          const location = await googleMapsService.forwardGeocode(value);
          setCoordinates({ lat: location.lat, lng: location.lng });
        } catch (error) {
          console.error('Error getting coordinates from value:', error);
        }
      };
      
      getCoordsFromValue();
    }
  }, [value, coordinates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear debounce timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Clean up map resources
      if (mapInstanceRef.current) {
        try {
          if (mapInstanceRef.current.mapInstance) {
            googleMapsService.destroyMapInstance(mapInstanceRef.current.mapInstance);
          }
          if (mapInstanceRef.current.container && mapInstanceRef.current.container.parentNode) {
            mapInstanceRef.current.container.parentNode.removeChild(mapInstanceRef.current.container);
          }
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="relative">
        {/* Input Field */}
        <div className="relative">
          <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`w-full pl-10 md:pl-12 pr-12 md:pr-14 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:ring-2 md:focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all ${className}`}
            required
            autoComplete="off"
          />
          
          {/* Current Location Button */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation || isLoading}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Get current location"
          >
            {isGettingLocation ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Navigation size={16} />
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <X size={12} />
            {error}
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="text-gray-400 flex-shrink-0" size={16} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.mainText}
                    </div>
                    {suggestion.secondaryText && (
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.secondaryText}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading Indicator for Suggestions */}
        {isLoading && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-blue-600" size={16} />
              <span className="text-sm text-gray-600">Searching locations...</span>
            </div>
          </div>
        )}

        {/* Map Display */}
        {showMap && coordinates && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>7km radius zone</span>
              </div>
              <button
                onClick={() => {
                  const googleMapsUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                  window.open(googleMapsUrl, '_blank');
                }}
                className="text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors"
              >
                Open in Google Maps →
              </button>
            </div>
            
            <div className="w-full h-48 md:h-64 rounded-lg border-2 border-gray-200 overflow-hidden relative">
              {!mapInitialized && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 absolute inset-0 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                    <p className="text-xs text-gray-500 mt-1">If map fails to load, coordinates will still be saved</p>
                  </div>
                </div>
              )}
              
              {/* Map container will be dynamically inserted here */}
              {mapInstanceRef.current && mapInstanceRef.current.container && (
                <div 
                  ref={(el) => {
                    if (el && mapInstanceRef.current && mapInstanceRef.current.container) {
                      el.appendChild(mapInstanceRef.current.container);
                    }
                  }}
                  className="w-full h-full"
                />
              )}
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>📍 {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
              <span>Radius: {radiusKm}km</span>
            </div>
            
            {/* Fallback message if map failed to load */}
            {error && error.includes('map') && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                ⚠️ Map display failed, but location coordinates are saved and will work correctly.
              </div>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default LocationInput;
