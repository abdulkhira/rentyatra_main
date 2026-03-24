import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Check, Loader2, AlertCircle } from 'lucide-react';
import googleMapsService from '../../services/googleMapsService';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const LocationCaptureModal = ({ isOpen, onLocationSaved, onClose }) => {
  const { updateUser } = useAuth();
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Auto-fetch current location when modal opens
  useEffect(() => {
    if (isOpen && !location) {
      handleGetCurrentLocation();
    }
  }, [isOpen]);

  // Handle getting current location
  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      setError('');
      
      const locationData = await googleMapsService.getCurrentLocation();
      
      setLocation(locationData.address);
      setCoordinates({ lat: locationData.lat, lng: locationData.lng });
    } catch (error) {
      console.error('Error getting current location:', error);
      setError(error.message || 'Failed to get current location. Please allow location access or enter manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle location input change with debounced suggestions
  const handleLocationChange = async (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    setError('');
    setShowSuggestions(false);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce suggestions
    debounceRef.current = setTimeout(async () => {
      if (newLocation && newLocation.trim().length > 2) {
        try {
          setIsLoading(true);
          const suggestionsData = await googleMapsService.getLocationSuggestions(newLocation);
          setSuggestions(suggestionsData);
          setShowSuggestions(suggestionsData.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  // Handle location selection from suggestions
  const handleSuggestionSelect = async (suggestion) => {
    setLocation(suggestion.address);
    setCoordinates({ lat: suggestion.lat, lng: suggestion.lng });
    setShowSuggestions(false);
    setError('');
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Save location to backend
  const handleSaveLocation = async () => {
    // Validate location
    if (!location || !location.trim()) {
      setError('Please enter or select your location');
      return;
    }

    if (!coordinates) {
      setError('Please wait for location to be detected, or select from suggestions');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Parse location to extract address components
      const addressParts = location.split(',').map(part => part.trim());
      
      // Extract city, state, pincode from address string
      let city = '';
      let state = '';
      let pincode = '';
      let street = '';

      // Try to get detailed address components from Google Maps
      try {
        const detailedAddress = await googleMapsService.getDetailedAddressComponents(
          coordinates.lat,
          coordinates.lng
        );
        
        const addr = detailedAddress.detailedAddress;
        street = (addr.route || '') + (addr.street_number ? ' ' + addr.street_number : '');
        city = addr.locality || addr.administrative_area_level_2 || addr.sublocality || '';
        state = addr.administrative_area_level_1 || '';
        pincode = addr.postal_code || '';
      } catch (detailError) {
        console.warn('Could not get detailed address components:', detailError);
        // Fallback to parsing the address string
        if (addressParts.length > 0) {
          street = addressParts[0] || '';
        }
        if (addressParts.length > 1) {
          city = addressParts[addressParts.length - 2] || '';
        }
        if (addressParts.length > 2) {
          state = addressParts[addressParts.length - 1] || '';
        }
      }

      // Prepare address data
      const addressData = {
        address: {
          street: street || location.split(',')[0] || '',
          city: city || addressParts[addressParts.length - 2] || '',
          state: state || addressParts[addressParts.length - 1] || '',
          pincode: pincode || '',
          landmark: ''
        },
        // Store coordinates for location-based features
        location: {
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: location
        }
      };

      // Update user profile with location
      const response = await apiService.updateUserProfile(addressData);

      if (response.success) {
        // Update user context with new location data
        if (response.data && response.data.user) {
          updateUser(response.data.user);
        }
        
        // Call success callback
        if (onLocationSaved) {
          onLocationSaved({
            address: location,
            coordinates: coordinates,
            addressData: addressData,
            user: response.data?.user
          });
        }
      } else {
        throw new Error(response.message || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      setError(error.message || 'Failed to save location. Please try again.');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Set Your Location</h2>
              <p className="text-xs text-gray-500">Required to continue</p>
            </div>
          </div>
          {/* Remove close button - location is mandatory */}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-800">
              We need your location to show you nearby rentals and enable location-based features.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          {/* Location Input */}
          <div className="space-y-2 relative">
            <label className="block text-sm font-semibold text-gray-700">
              Your Location <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={inputRef}
                type="text"
                value={location}
                onChange={handleLocationChange}
                placeholder="Enter your location or click button to detect"
                className="w-full pl-10 pr-12 py-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
                required
              />
              
              {/* Current Location Button */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Detect current location"
              >
                {isGettingLocation ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Navigation size={16} />
                )}
              </button>
            </div>

            {/* Location Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-full top-full"
                style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id || index}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="text-gray-400 flex-shrink-0" size={14} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.mainText || suggestion.address}
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
            {isLoading && !showSuggestions && (
              <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full top-full"
                style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-blue-600" size={14} />
                  <span className="text-xs text-gray-600">Searching locations...</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Check size={12} className="text-green-600" />
              Your location helps us show you the most relevant rentals nearby
            </p>
          </div>

          {/* Coordinates Display */}
          {coordinates && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={12} className="text-blue-600" />
                <span className="font-semibold">Location Detected:</span>
              </div>
              <div className="pl-4">
                <div>📍 {location}</div>
                <div className="text-gray-500 mt-1">
                  Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <Button
            onClick={handleSaveLocation}
            disabled={!location || !coordinates || isSaving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span>Saving Location...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Check size={16} />
                <span>Save & Continue</span>
              </div>
            )}
          </Button>
        </div>
        
        {/* Note about location requirement */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 text-center">
            Location is required to show you nearby rentals and enable location-based features
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationCaptureModal;

