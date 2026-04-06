import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import googleMapsService from '../../services/googleMapsService';
import ErrorBoundary from './ErrorBoundary';

const SellerLocationPicker = ({
  onLocationSelect,
  initialLocation = null,
  radiusKm = 7,
  serviceRadius = 7,
  onRadiusChange,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [error, setError] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [customRadius, setCustomRadius] = useState(serviceRadius);
  const [locationSuccess, setLocationSuccess] = useState('');

  // Sync customRadius with serviceRadius prop
  useEffect(() => {
    console.log('SellerLocationPicker: Syncing customRadius with serviceRadius:', serviceRadius);
    setCustomRadius(serviceRadius);

    // Update map circle if map is already initialized
    if (mapInitialized && mapInstanceRef.current && mapInstanceRef.current.mapInstance && selectedLocation) {
      console.log('SellerLocationPicker: Updating existing map with new radius:', serviceRadius);
      const mapInstance = mapInstanceRef.current.mapInstance;
      if (mapInstance && mapInstance.circle) {
        mapInstance.circle.setRadius(serviceRadius * 1000);
        console.log('Circle radius synced to:', serviceRadius * 1000, 'meters');
      }
    }
  }, [serviceRadius, mapInitialized, selectedLocation]);

  // Handle location input change
  const handleLocationInputChange = async (value) => {
    setLocationInput(value);

    if (value.trim().length > 2) {
      try {
        setIsLoadingSuggestions(true);
        setShowSuggestions(true);

        console.log('Getting suggestions for:', value);
        const results = await googleMapsService.getLocationSuggestions(value);
        console.log('Suggestions received:', results);

        // Fallback test suggestions if no results
        if (results.length === 0 && value.toLowerCase().includes('kalani')) {
          const testSuggestions = [
            {
              id: 'test_1',
              address: 'Kalani Bagh, Dewas, Madhya Pradesh',
              lat: 22.9676,
              lng: 76.0508,
              city: 'Dewas'
            }
          ];
          console.log('Using test suggestions:', testSuggestions);
          setSuggestions(testSuggestions);
        } else {
          setSuggestions(results);
        }

        // Don't automatically select first result - let user choose
      } catch (error) {
        console.warn('Error getting location suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle radius change
  const handleRadiusChange = (newRadius) => {
    const radius = parseInt(newRadius) || 7;
    console.log('Debug - handleRadiusChange called with:', newRadius);
    console.log('Debug - parsed radius:', radius);
    setCustomRadius(radius);

    // Notify parent component
    if (onRadiusChange) {
      onRadiusChange(radius);
    }

    // Update map circle if initialized
    if (mapInitialized && mapInstanceRef.current && mapInstanceRef.current.mapInstance && selectedLocation) {
      console.log('Updating radius to:', radius, 'km');
      const mapInstance = mapInstanceRef.current.mapInstance;
      if (mapInstance && mapInstance.circle) {
        mapInstance.circle.setRadius(radius * 1000);
        console.log('Circle radius updated to:', radius * 1000, 'meters');
      }
    }
  };

  // Debounced map update for better performance
  const debouncedMapUpdate = (coordinates) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (mapInitialized && mapInstanceRef.current) {
        console.log('Debounced map update to:', coordinates);
        googleMapsService.updateMapLocation(coordinates, customRadius);
      }
    }, 100); // 100ms delay for smooth performance
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    console.log('Suggestion selected:', suggestion);

    const coordinates = { lat: suggestion.lat, lng: suggestion.lng };

    // Validate coordinates
    if (!isValidCoordinates(coordinates)) {
      console.warn('Invalid coordinates from suggestion:', coordinates);
      return;
    }

    console.log('Valid coordinates, updating location:', coordinates);

    // Update input field with selected address
    setLocationInput(googleMapsService.formatAddress(suggestion.address));

    // Update selected location state
    setSelectedLocation(coordinates);

    // Close suggestions dropdown
    setSuggestions([]);
    setShowSuggestions(false);

    // Update map if initialized - this should move the map to the new location
    if (mapInitialized && mapInstanceRef.current && mapInstanceRef.current.mapInstance) {
      console.log('Updating map location to:', coordinates);
      const mapInstance = mapInstanceRef.current.mapInstance;
      if (mapInstance && mapInstance.map) {
        // Update map center
        mapInstance.map.setCenter(coordinates);

        // Update marker position
        if (mapInstance.marker) {
          mapInstance.marker.setPosition(coordinates);
        }

        // Update circle center and radius
        if (mapInstance.circle) {
          mapInstance.circle.setCenter(coordinates);
          mapInstance.circle.setRadius(customRadius * 1000);
        }

        console.log('Map updated successfully to:', coordinates);
      }
    } else {
      console.log('Map not initialized yet, coordinates will be used when map loads');
    }

    // Notify parent component
    if (onLocationSelect) {
      console.log('=== SELLER LOCATION PICKER - SUGGESTION SELECTED ===');
      console.log('Notifying parent component of location change');
      console.log('Debug - Passing coordinates:', coordinates);
      console.log('Debug - Passing radius:', customRadius);
      console.log('Debug - Passing address:', suggestion.address);
      console.log('Debug - Passing city:', suggestion.city);
      console.log('Debug - Current customRadius state:', customRadius);
      onLocationSelect({
        ...coordinates,
        radius: customRadius,
        address: suggestion.address,
        city: suggestion.city
      });
      console.log('=== END SELLER LOCATION PICKER - SUGGESTION SELECTED ===');
    }
  };

  // Validate coordinates
  const isValidCoordinates = (coords) => {
    return coords &&
      typeof coords.lat === 'number' &&
      typeof coords.lng === 'number' &&
      !isNaN(coords.lat) &&
      !isNaN(coords.lng) &&
      isFinite(coords.lat) &&
      isFinite(coords.lng);
  };

  const mapInstanceRef = useRef(null);
  const mapWrapperRef = useRef(null);
  const suggestionsRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize Google Maps service
  useEffect(() => {
    const initMaps = async () => {
      try {
        console.log('Initializing Google Maps service...');
        await googleMapsService.initialize();

        // Wait a bit more to ensure Google Maps is fully loaded
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Google Maps service initialized successfully');
        console.log('Google Maps available:', !!window.google?.maps);
        setGoogleMapsReady(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setError(`Failed to initialize maps service: ${error.message}`);
      }
    };

    initMaps();
  }, []);

  // Get current location
  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      setError('');

      console.log('=== GETTING CURRENT LOCATION ===');
      console.log('Starting current location detection...');

      const location = await googleMapsService.getCurrentLocation();
      console.log('Raw location data received:', location);

      // Validate coordinates
      if (!isValidCoordinates(location)) {
        throw new Error('Invalid coordinates received');
      }

      console.log('Valid coordinates:', { lat: location.lat, lng: location.lng });
      setSelectedLocation({ lat: location.lat, lng: location.lng });

      // Get address from coordinates
      let address = '';
      try {
        console.log('Starting reverse geocoding...');
        const rawAddress = await googleMapsService.reverseGeocode(location.lat, location.lng);
        console.log('Raw address from reverse geocoding:', rawAddress);

        // address = googleMapsService.formatAddress(rawAddress);
        // address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        // ✅ directly extract address (no dependency on formatAddress)
        if (rawAddress && rawAddress.formatted_address) {
          address = rawAddress.formatted_address;
        } else {
          throw new Error('No formatted address found');
        }
        console.log('Formatted address:', address);

        setLocationInput(address);
        console.log('Location input set to:', address);
        setLocationSuccess(`Location detected: ${address}`);
        // Clear success message after 3 seconds
        setTimeout(() => setLocationSuccess(''), 3000);
      } catch (addressError) {
        console.error('Reverse geocoding failed:', addressError);
        address = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        setLocationInput(address);
        console.log('Using coordinates as fallback address:', address);
      }

      // Update map if initialized
      if (mapInitialized && mapInstanceRef.current && mapInstanceRef.current.mapInstance) {
        console.log('Updating map with new location...');
        const mapInstance = mapInstanceRef.current.mapInstance;
        if (mapInstance && mapInstance.map) {
          // Update map center
          mapInstance.map.setCenter({ lat: location.lat, lng: location.lng });

          // Update marker position
          if (mapInstance.marker) {
            mapInstance.marker.setPosition({ lat: location.lat, lng: location.lng });
          }

          // Update circle center and radius
          if (mapInstance.circle) {
            mapInstance.circle.setCenter({ lat: location.lat, lng: location.lng });
            mapInstance.circle.setRadius(customRadius * 1000);
          }

          console.log('Map updated successfully to:', { lat: location.lat, lng: location.lng });
        }
      }

      // Notify parent component
      if (onLocationSelect) {
        console.log('=== SELLER LOCATION PICKER - CURRENT LOCATION ===');
        console.log('Debug - Current location address:', address);
        console.log('Debug - Current customRadius state:', customRadius);
        console.log('Debug - Coordinates:', { lat: location.lat, lng: location.lng });

        const locationData = {
          lat: location.lat,
          lng: location.lng,
          radius: customRadius,
          address: address
        };

        console.log('Calling onLocationSelect with:', locationData);
        onLocationSelect(locationData);
        console.log('=== END SELLER LOCATION PICKER - CURRENT LOCATION ===');
      }

    } catch (error) {
      console.error('Error getting current location:', error);
      setError(error.message);
      setLocationSuccess(''); // Clear success message on error
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Initialize draggable map
  useEffect(() => {
    if (!mapInitialized && mapWrapperRef.current && googleMapsReady) {
      const initMap = async () => {
        try {
          setIsLoading(true);
          console.log('Starting map initialization...');

          // Wait for Google Maps API to be fully loaded
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait

          while ((!window.google || !window.google.maps) && attempts < maxAttempts) {
            console.log(`Waiting for Google Maps API... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded after waiting');
          }

          console.log('Google Maps API is ready!');

          // Default location (Dewas, India) if no initial location
          const defaultLocation = initialLocation || { lat: 22.9676, lng: 76.0508 };

          // Validate default location
          if (!isValidCoordinates(defaultLocation)) {
            throw new Error('Invalid default location coordinates');
          }

          console.log('Using default location:', defaultLocation);

          // Wait for wrapper element to be available
          const wrapperElement = mapWrapperRef.current;
          if (!wrapperElement) {
            throw new Error('Map wrapper element not found');
          }

          // Clear any existing content
          wrapperElement.innerHTML = '';

          // Create container element directly in the wrapper
          const container = document.createElement('div');
          container.id = `map-container-${Date.now()}`;
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.position = 'relative';

          // Insert container into wrapper
          wrapperElement.appendChild(container);

          // Store reference
          mapInstanceRef.current = { container, wrapperElement };

          console.log('Creating draggable map...');
          console.log('Container element:', container);
          console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);

          const mapInstance = googleMapsService.createDraggableMap(
            container,
            defaultLocation,
            serviceRadius, // Use serviceRadius prop instead of customRadius state
            (newLocation) => {
              console.log('=== MAP INITIALIZATION CALLBACK ===');
              console.log('Location changed:', newLocation);
              console.log('Debug - Current serviceRadius prop:', serviceRadius);
              setSelectedLocation(newLocation);
              if (onLocationSelect) {
                console.log('Debug - Passing radius from map callback:', serviceRadius);
                onLocationSelect({
                  ...newLocation,
                  radius: serviceRadius
                });
              }
              console.log('=== END MAP INITIALIZATION CALLBACK ===');
            }
          );

          console.log('Map instance created:', mapInstance);
          mapInstanceRef.current.mapInstance = mapInstance;
          setMapInitialized(true);
          setSelectedLocation(defaultLocation);
          console.log('Map initialized successfully');

        } catch (error) {
          console.error('Error initializing draggable map:', error);
          setError(`Failed to initialize map: ${error.message}`);
          setMapInitialized(false);
        } finally {
          setIsLoading(false);
        }
      };

      // Add delay to ensure DOM is ready
      setTimeout(() => initMap(), 100);
    }
  }, [mapInitialized, initialLocation, serviceRadius, onLocationSelect, googleMapsReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending map updates
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      if (mapInstanceRef.current) {
        try {
          if (mapInstanceRef.current.mapInstance) {
            googleMapsService.destroyMapInstance(mapInstanceRef.current.mapInstance);
          }
          if (mapInstanceRef.current.wrapperElement) {
            mapInstanceRef.current.wrapperElement.innerHTML = '';
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
      <div className={`space-y-4 ${className}`}>
        {/* Location Input */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location Type *
          </label>
          <div className="relative">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              placeholder="Enter your location or click the icon to use current location"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation || isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Use Current Location"
            >
              {isGettingLocation ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Navigation size={18} />
              )}
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isGettingLocation && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 flex items-center">
                <Loader2 className="animate-spin mr-2" size={16} />
                Getting your current location...
              </p>
            </div>
          )}

          {locationSuccess && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{locationSuccess}</p>
            </div>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {console.log('Rendering suggestions dropdown:', { showSuggestions, isLoadingSuggestions, suggestionsCount: suggestions.length })}
              {isLoadingSuggestions ? (
                <div className="p-3 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm">Loading suggestions...</p>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{suggestion.address}</p>
                        {suggestion.city && (
                          <p className="text-xs text-gray-500">{suggestion.city}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : locationInput.trim().length > 2 ? (
                <div className="p-3 text-center text-gray-500">
                  <p className="text-sm">No suggestions found</p>
                </div>
              ) : null}
            </div>
          )}
        </div>


        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="w-full h-80 rounded-lg border-2 border-gray-200 overflow-hidden relative">
          {(!mapInitialized || !googleMapsReady) && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 absolute inset-0 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {!googleMapsReady ? 'Loading Google Maps...' : 'Loading map...'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Drag the marker to select your area</p>
              </div>
            </div>
          )}

          {/* Map container - will be populated by useEffect */}
          <div
            ref={mapWrapperRef}
            className="w-full h-full"
          />
        </div>

      </div>
    </ErrorBoundary>
  );
};

export default SellerLocationPicker;
