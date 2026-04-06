// Google Maps Service for RentYatra
// Handles current location, radius zones, and location suggestions

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCJzZXm0iak3Gis3faivPPADIPEqD-fgKQ';

// Global flag to prevent multiple API loads
let isGoogleMapsLoading = false;
let googleMapsLoadPromise = null;

class GoogleMapsService {
  constructor() {
    this.map = null;
    this.marker = null;
    this.circle = null;
    this.autocompleteService = null;
    this.placesService = null;
    this.geocoder = null;
    this.isInitialized = false;
  }

  // Initialize Google Maps services
  async initialize() {
    if (this.isInitialized) {
      console.log('Google Maps services already initialized');
      return;
    }

    try {
      console.log('Initializing Google Maps services...');

      // Load Google Maps JavaScript API only once
      if (!window.google || !window.google.maps) {
        console.log('Google Maps API not loaded, loading now...');
        await this.loadGoogleMapsAPI();
      } else {
        console.log('Google Maps API already loaded');
      }

      // Initialize services (using new APIs)
      console.log('Creating Geocoder service...');
      this.geocoder = new window.google.maps.Geocoder();

      // Note: AutocompleteService and PlacesService are deprecated
      // We'll use alternative approaches for suggestions

      this.isInitialized = true;
      console.log('Google Maps services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Maps services:', error);
      throw error;
    }
  }

  // Load Google Maps API dynamically (only once)
  loadGoogleMapsAPI() {
    console.log('loadGoogleMapsAPI called');

    // If already loading, return the existing promise
    if (isGoogleMapsLoading && googleMapsLoadPromise) {
      console.log('Google Maps already loading, returning existing promise');
      return googleMapsLoadPromise;
    }

    // If already loaded, return resolved promise
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      return Promise.resolve();
    }

    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      const error = new Error('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file');
      console.error(error.message);
      return Promise.reject(error);
    }

    console.log('Google Maps API key found:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
    isGoogleMapsLoading = true;

    googleMapsLoadPromise = new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        console.log('Removing existing Google Maps script');
        existingScript.remove();
      }

      // Create unique callback function
      const callbackName = `initGoogleMapsCallback_${Date.now()}`;
      console.log('Creating callback:', callbackName);

      window[callbackName] = () => {
        console.log('Google Maps API loaded successfully');
        isGoogleMapsLoading = false;
        delete window[callbackName];
        resolve();
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places&loading=async&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        isGoogleMapsLoading = false;
        delete window[callbackName];
        reject(new Error('Failed to load Google Maps API. Check your API key and internet connection.'));
      };

      console.log('Adding Google Maps script to document head');
      document.head.appendChild(script);
    });

    return googleMapsLoadPromise;
  }

  // Get current location using browser geolocation with enhanced error handling
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('Requesting current location from browser...');

      // Try high accuracy first, then fallback to low accuracy if timeout
      const tryGeolocation = (options, attemptNumber = 1) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              console.log(`Browser geolocation successful (attempt ${attemptNumber}):`, { latitude, longitude });

              // Validate coordinates are reasonable (not 0,0 or invalid)
              if (latitude === 0 && longitude === 0) {
                if (attemptNumber === 1 && options.enableHighAccuracy) {
                  // Retry with low accuracy
                  console.log('Invalid coordinates, retrying with low accuracy...');
                  tryGeolocation({
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000
                  }, 2);
                  return;
                }
                reject(new Error('Invalid coordinates received'));
                return;
              }

              // Try to get address from coordinates
              let address = '';
              try {
                address = await this.reverseGeocode(latitude, longitude);
                console.log('Reverse geocoded address:', address);
              } catch (addressError) {
                console.warn('Could not get address:', addressError);
                address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              }

              const location = {
                lat: latitude,
                lng: longitude,
                address: address
              };
              resolve(location);
            } catch (error) {
              console.error('Error processing geolocation result:', error);
              // If reverse geocoding fails, still return coordinates
              const location = {
                lat: latitude,
                lng: longitude,
                address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              };
              resolve(location);
            }
          },
          (error) => {
            console.error(`Geolocation error (attempt ${attemptNumber}):`, error);

            // If timeout and high accuracy, retry with low accuracy
            if (error.code === error.TIMEOUT && attemptNumber === 1 && options.enableHighAccuracy) {
              console.log('High accuracy timeout, retrying with low accuracy (faster, less precise)...');
              tryGeolocation({
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
              }, 2);
              return;
            }

            let errorMessage = 'Failed to get current location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied by user. Please enable location permissions or select manually.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please try again or select manually.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again or select manually.';
                break;
            }
            reject(new Error(errorMessage));
          },
          options
        );
      };

      // Start with high accuracy, will fallback to low accuracy on timeout
      tryGeolocation({
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds for high accuracy
        maximumAge: 300000 // 5 minutes - accept cached location
      });
    });
  }

  // Reverse geocoding to get address from coordinates
  async reverseGeocode(lat, lng) {
    try {
      console.log('Starting reverse geocoding for coordinates:', { lat, lng });
      await this.initialize();

      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }

      return new Promise((resolve, reject) => {
        console.log('Calling Google Geocoder API...');
        this.geocoder.geocode({
          location: { lat, lng }
        }, (results, status) => {
          console.log('Geocoder response status:', status);
          console.log('Geocoder results count:', results ? results.length : 0);

          if (status === 'OK' && results && results.length > 0) {
            console.log('Reverse geocoding results:', results);

            // Find the best result that doesn't contain plus codes and has proper locality
            let bestResult = null;

            for (let result of results) {
              const address = result.formatted_address;
              console.log('Checking address:', address);

              // Skip results that contain plus codes (like X2WJ+6X)
              if (address.match(/[A-Z0-9]{2,}\+[A-Z0-9]{2,}/)) {
                console.log('Skipping address with plus code:', address);
                continue;
              }

              // Check address components to find locality/village
              const components = result.address_components || [];
              console.log('Address components:', components);

              // Look for specific locality information (prioritize more specific)
              const hasSpecificLocality = components.some(comp =>
                comp.types.includes('sublocality_level_2') ||
                comp.types.includes('sublocality_level_1') ||
                comp.types.includes('sublocality') ||
                comp.types.includes('locality') ||
                comp.types.includes('administrative_area_level_3')
              );

              if (hasSpecificLocality) {
                console.log('Found address with specific locality:', address);
                bestResult = result;
                break;
              }
            }

            // If no good result found, try to find one with administrative_area_level_2 (city/district)
            if (!bestResult) {
              for (let result of results) {
                const address = result.formatted_address;
                if (!address.match(/[A-Z0-9]{2,}\+[A-Z0-9]{2,}/)) {
                  const components = result.address_components || [];
                  const hasCity = components.some(comp =>
                    comp.types.includes('administrative_area_level_2')
                  );

                  if (hasCity) {
                    console.log('Found address with city:', address);
                    bestResult = result;
                    break;
                  }
                }
              }
            }

            if (bestResult) {
              const formattedAddress = this.formatAddressWithComponents(bestResult);
              console.log('Final formatted address:', formattedAddress);
              resolve(formattedAddress);
            } else {
              // Use first result if no good result found
              const formattedAddress = this.formatAddress(results[0].formatted_address);
              console.log('Using first result:', formattedAddress);
              resolve(formattedAddress);
            }
          } else {
            console.warn('Geocoding failed with status:', status);
            // Fallback to coordinates if geocoding fails
            const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            console.log('Using coordinates as fallback:', fallbackAddress);
            resolve(fallbackAddress);
          }
        });
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinates if geocoding fails
      const fallbackAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      console.log('Using coordinates as fallback due to error:', fallbackAddress);
      return fallbackAddress;
    }
  }

  // Format address using address components for better locality extraction
  formatAddressWithComponents(result) {
    if (!result || !result.address_components) {
      return this.formatAddress(result?.formatted_address || '');
    }

    const components = result.address_components;
    console.log('Formatting address with components:', components);

    // Extract different parts with more specific locality detection
    let sublocality = '';
    let sublocalityLevel1 = '';
    let sublocalityLevel2 = '';
    let locality = '';
    let city = '';
    let state = '';
    let country = '';
    let postalCode = '';

    components.forEach(comp => {
      const types = comp.types;
      const longName = comp.long_name;

      // Prioritize more specific locality information
      if (types.includes('sublocality_level_2')) {
        sublocalityLevel2 = longName;
      } else if (types.includes('sublocality_level_1')) {
        sublocalityLevel1 = longName;
      } else if (types.includes('sublocality')) {
        sublocality = longName;
      } else if (types.includes('locality') || types.includes('administrative_area_level_3')) {
        locality = longName;
      } else if (types.includes('administrative_area_level_2')) {
        city = longName;
      } else if (types.includes('administrative_area_level_1')) {
        state = longName;
      } else if (types.includes('country')) {
        country = longName;
      } else if (types.includes('postal_code')) {
        postalCode = longName;
      }
    });

    // Build address prioritizing most specific locality first
    const addressParts = [];

    // Use the most specific locality available
    const specificLocality = sublocalityLevel2 || sublocalityLevel1 || sublocality || locality;

    if (specificLocality) {
      addressParts.push(specificLocality);
    }

    if (city && city !== specificLocality) {
      addressParts.push(city);
    }

    if (state) {
      addressParts.push(state);
    }

    // Add pincode if available
    if (postalCode) {
      addressParts.push(postalCode);
    }

    // Don't add country for Indian addresses to keep it clean

    const formattedAddress = addressParts.join(', ');
    console.log('Formatted address from components:', formattedAddress);
    console.log('Address parts:', { sublocalityLevel2, sublocalityLevel1, sublocality, locality, city, state });

    return formattedAddress || this.formatAddress(result.formatted_address);
  }

  // Get detailed address components for better location parsing
  async getDetailedAddressComponents(lat, lng) {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        this.geocoder.geocode({
          location: { lat, lng }
        }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const addressComponents = result.address_components || [];

            // Extract detailed address components
            const detailedAddress = {
              street_number: '',
              route: '',
              sublocality: '', // Village/Neighborhood
              locality: '', // City
              administrative_area_level_2: '', // District
              administrative_area_level_1: '', // State
              country: '',
              postal_code: '',
              formatted_address: result.formatted_address
            };

            // Map address components to our structure
            addressComponents.forEach((component) => {
              const types = component.types;
              if (types.includes('street_number')) {
                detailedAddress.street_number = component.long_name;
              } else if (types.includes('route')) {
                detailedAddress.route = component.long_name;
              } else if (types.includes('sublocality') || types.includes('neighborhood')) {
                detailedAddress.sublocality = component.long_name;
              } else if (types.includes('locality')) {
                detailedAddress.locality = component.long_name;
              } else if (types.includes('administrative_area_level_2')) {
                detailedAddress.administrative_area_level_2 = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                detailedAddress.administrative_area_level_1 = component.long_name;
              } else if (types.includes('country')) {
                detailedAddress.country = component.long_name;
              } else if (types.includes('postal_code')) {
                detailedAddress.postal_code = component.long_name;
              }
            });

            resolve({
              formattedAddress: result.formatted_address,
              detailedAddress: detailedAddress
            });
          } else {
            reject(new Error('Address components not found'));
          }
        });
      });
    } catch (error) {
      console.error('Error getting detailed address components:', error);
      throw error;
    }
  }

  // Format address to remove plus codes and get proper location names
  formatAddress(address) {
    if (!address) return '';

    // Remove plus codes (like X2WJ+6X)
    let formattedAddress = address.replace(/[A-Z0-9]{2,}\+[A-Z0-9]{2,}/g, '').trim();

    // Remove unnecessary words like "Division", "India" for cleaner addresses
    formattedAddress = formattedAddress
      .replace(/\bDivision\b/gi, '') // Remove "Division"
      .replace(/\bIndia\b/gi, '') // Remove "India" 
      .replace(/\bState\b/gi, '') // Remove "State"
      .replace(/\bDistrict\b/gi, '') // Remove "District"
      .trim();

    // Clean up extra commas and spaces
    formattedAddress = formattedAddress.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();

    // If address becomes empty after cleaning, return original
    if (!formattedAddress) {
      return address;
    }

    // Try to extract meaningful parts
    const parts = formattedAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);

    // If we have good parts, join them properly
    if (parts.length > 0) {
      return parts.join(', ');
    }

    return formattedAddress;
  }

  // Forward geocoding to get coordinates from address
  async forwardGeocode(address) {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        this.geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              address: results[0].formatted_address
            });
          } else {
            reject(new Error('Address not found'));
          }
        });
      });
    } catch (error) {
      console.error('Forward geocoding error:', error);
      throw error;
    }
  }

  // Get nearby location suggestions based on current location
  async getNearbyLocationSuggestions(userLat, userLng, radiusKm = 10) {
    try {
      await this.initialize();

      console.log('Getting nearby locations for:', { userLat, userLng, radiusKm });

      // Check if Places API is available
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.warn('Google Places API not available');
        return [];
      }

      // Use Places API to find nearby places
      return new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(document.createElement('div'));

        const request = {
          location: new google.maps.LatLng(userLat, userLng),
          radius: radiusKm * 1000, // Convert km to meters
          type: ['locality', 'sublocality', 'neighborhood']
        };

        service.nearbySearch(request, (results, status) => {
          console.log('Nearby search response:', { status, resultsCount: results?.length });

          if (status === 'OK' && results) {
            const nearbySuggestions = results.slice(0, 8).map((place, index) => ({
              id: `nearby_${place.place_id}`,
              address: place.name,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              city: place.name,
              description: place.vicinity || place.name,
              mainText: place.name,
              secondaryText: place.vicinity || '',
              placeId: place.place_id,
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              isNearby: true,
              distance: this.calculateDistance(userLat, userLng, place.geometry.location.lat(), place.geometry.location.lng())
            }));

            console.log('Nearby suggestions generated:', nearbySuggestions);
            resolve(nearbySuggestions);
          } else {
            console.log('No nearby places found or error:', status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error getting nearby locations:', error);
      return [];
    }
  }

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get location suggestions using Geocoding API (alternative to deprecated AutocompleteService)
  async getLocationSuggestions(input, options = {}) {
    try {
      await this.initialize();

      console.log('getLocationSuggestions called with:', input);

      if (!input || input.trim().length < 3) {
        console.log('Input too short, returning empty array');
        return [];
      }

      // Use Geocoding API for suggestions instead of deprecated AutocompleteService
      return new Promise((resolve, reject) => {
        console.log('Calling geocoder.geocode with:', { address: input, componentRestrictions: { country: 'IN' } });

        this.geocoder.geocode({
          address: input,
          componentRestrictions: { country: 'IN' } // Restrict to India
        }, (results, status) => {
          console.log('Geocoder response:', { status, resultsCount: results?.length });

          if (status === 'OK' && results) {
            // Filter out results with plus codes and prioritize proper addresses
            const filteredResults = results.filter(result => {
              const address = result.formatted_address;
              // Skip results that contain plus codes (like X2WJ+6X)
              return !address.match(/[A-Z0-9]{2,}\+[A-Z0-9]{2,}/);
            });

            // If no good results after filtering, use original results
            const finalResults = filteredResults.length > 0 ? filteredResults : results;

            const suggestions = finalResults.slice(0, 5).map((result, index) => ({
              id: `geocode_${index}`,
              address: result.formatted_address,
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              city: result.formatted_address.split(',').slice(-2, -1)[0]?.trim() || '',
              description: result.formatted_address,
              mainText: result.formatted_address.split(',')[0] || result.formatted_address,
              secondaryText: result.formatted_address.split(',').slice(1).join(',').trim(),
              placeId: result.place_id || `geocode_${index}`,
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng()
              }
            }));
            console.log('Formatted suggestions:', suggestions);
            resolve(suggestions);
          } else {
            console.log('Geocoder failed with status:', status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Location suggestions error:', error);
      return [];
    }
  }

  // Get place details by place ID (using Geocoding API instead of deprecated PlacesService)
  async getPlaceDetails(placeId) {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        this.geocoder.geocode({ placeId }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const place = results[0];
            const location = place.geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              address: place.formatted_address,
              name: place.formatted_address.split(',')[0],
              placeId: placeId
            });
          } else {
            reject(new Error('Place details not found'));
          }
        });
      });
    } catch (error) {
      console.error('Place details error:', error);
      throw error;
    }
  }

  // Create map with 7km radius circle
  createMapWithRadius(containerIdOrElement, center, radiusKm = 7) {
    try {
      // Handle both string ID and DOM element
      let mapElement;
      if (typeof containerIdOrElement === 'string') {
        mapElement = document.getElementById(containerIdOrElement);
      } else {
        mapElement = containerIdOrElement;
      }

      // Check if container element exists
      if (!mapElement) {
        throw new Error(`Map container not found`);
      }

      const mapOptions = {
        center: center,
        zoom: 12,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      this.map = new window.google.maps.Map(mapElement, mapOptions);

      // Add marker at center (with fallback to regular Marker)
      try {
        // Try to use AdvancedMarkerElement if available
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          const markerElement = document.createElement('div');
          markerElement.innerHTML = `
            <div style="
              width: 24px; 
              height: 24px; 
              background-color: #ef4444; 
              border-radius: 50%; 
              border: 3px solid white; 
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
            </div>
          `;

          this.marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: center,
            map: this.map,
            title: 'Your Location',
            content: markerElement
          });
        } else {
          // Fallback to regular Marker
          this.marker = new window.google.maps.Marker({
            position: center,
            map: this.map,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 24)
            }
          });
        }
      } catch (error) {
        console.warn('AdvancedMarkerElement not available, using regular Marker:', error);
        // Final fallback to regular Marker
        this.marker = new window.google.maps.Marker({
          position: center,
          map: this.map,
          title: 'Your Location'
        });
      }

      // Add radius circle with blue color (OLX style)
      this.circle = new window.google.maps.Circle({
        strokeColor: '#4285F4', // Google Blue color
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.3, // More visible like OLX
        map: this.map,
        center: center,
        radius: radiusKm * 1000 // Convert km to meters
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">Your Location</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">7km radius zone</p>
          </div>
        `
      });

      this.marker.addListener('click', () => {
        infoWindow.open(this.map, this.marker);
      });

      return {
        map: this.map,
        marker: this.marker,
        circle: this.circle
      };
    } catch (error) {
      console.error('Error creating map:', error);
      throw error;
    }
  }

  // Update map center and radius
  updateMapLocation(center, radiusKm = 7) {
    console.log('updateMapLocation called with:', { center, radiusKm });

    // Validate coordinates
    if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number' ||
      isNaN(center.lat) || isNaN(center.lng) || !isFinite(center.lat) || !isFinite(center.lng)) {
      console.error('Invalid coordinates provided to updateMapLocation:', center);
      return;
    }

    console.log('Coordinates validated, checking map components...');
    console.log('Map exists:', !!this.map);
    console.log('Marker exists:', !!this.marker);
    console.log('Circle exists:', !!this.circle);

    if (this.map && this.marker && this.circle) {
      console.log('Updating map components...');

      // Update map center
      this.map.setCenter(center);
      console.log('Map center updated to:', center);

      // Update marker position
      this.marker.setPosition(center);
      console.log('Marker position updated to:', center);

      // Update circle center and radius
      this.circle.setCenter(center);
      this.circle.setRadius(radiusKm * 1000);
      console.log('Circle updated - center:', center, 'radius:', radiusKm * 1000, 'meters');

      console.log('Map update completed successfully');
    } else {
      console.warn('Map components not available:', {
        map: !!this.map,
        marker: !!this.marker,
        circle: !!this.circle
      });
    }
  }

  // Create draggable map for seller location selection
  createDraggableMap(containerIdOrElement, initialCenter, radiusKm = 7, onLocationChange) {
    try {
      console.log('createDraggableMap called with:', { containerIdOrElement, initialCenter, radiusKm });

      // Validate initial center coordinates
      if (!initialCenter || typeof initialCenter.lat !== 'number' || typeof initialCenter.lng !== 'number' ||
        isNaN(initialCenter.lat) || isNaN(initialCenter.lng) || !isFinite(initialCenter.lat) || !isFinite(initialCenter.lng)) {
        throw new Error('Invalid initial center coordinates provided to createDraggableMap');
      }

      // Handle both string ID and DOM element
      let mapElement;
      if (typeof containerIdOrElement === 'string') {
        mapElement = document.getElementById(containerIdOrElement);
        console.log('Looking for element by ID:', containerIdOrElement, 'Found:', mapElement);
      } else {
        mapElement = containerIdOrElement;
        console.log('Using provided DOM element:', mapElement);
      }

      if (!mapElement) {
        throw new Error(`Map container not found`);
      }

      console.log('Map element found:', mapElement);
      console.log('Map element dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

      const mapOptions = {
        center: initialCenter,
        zoom: 13,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      console.log('Creating Google Maps with options:', mapOptions);
      this.map = new window.google.maps.Map(mapElement, mapOptions);
      console.log('Google Maps created successfully:', this.map);

      // Create draggable marker
      this.marker = new window.google.maps.Marker({
        position: initialCenter,
        map: this.map,
        draggable: true,
        title: 'Drag to select your area',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#4285F4" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      // Create blue circle
      this.circle = new window.google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.3,
        map: this.map,
        center: initialCenter,
        radius: radiusKm * 1000
      });

      // Add drag event listener
      this.marker.addListener('dragend', (event) => {
        const newPosition = event.latLng;
        this.circle.setCenter(newPosition);

        if (onLocationChange) {
          onLocationChange({
            lat: newPosition.lat(),
            lng: newPosition.lng()
          });
        }
      });

      return {
        map: this.map,
        marker: this.marker,
        circle: this.circle
      };
    } catch (error) {
      console.error('Error creating draggable map:', error);
      throw error;
    }
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    try {
      const R = 6371; // Earth's radius in kilometers
      const dLat = this.toRadians(point2.lat - point1.lat);
      const dLon = this.toRadians(point2.lng - point1.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in kilometers
    } catch (error) {
      console.error('Distance calculation error:', error);
      return 0;
    }
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Check if a location is within radius
  isWithinRadius(center, location, radiusKm = 7) {
    const distance = this.calculateDistance(center, location);
    return distance <= radiusKm;
  }

  // Add privacy offset for buyer view (OLX style)
  addPrivacyOffset(lat, lng, offsetRange = 0.005) {
    try {
      // Generate random offset within range (~500m)
      const latOffset = (Math.random() - 0.5) * offsetRange;
      const lngOffset = (Math.random() - 0.5) * offsetRange;

      return {
        lat: lat + latOffset,
        lng: lng + lngOffset,
        originalLat: lat,
        originalLng: lng
      };
    } catch (error) {
      console.error('Privacy offset error:', error);
      return { lat, lng, originalLat: lat, originalLng: lng };
    }
  }

  // Create buyer view map with privacy offset
  createBuyerViewMap(containerIdOrElement, sellerLocation, radiusKm = 7, privacyOffset = true) {
    try {
      // Handle both string ID and DOM element
      let mapElement;
      if (typeof containerIdOrElement === 'string') {
        mapElement = document.getElementById(containerIdOrElement);
      } else {
        mapElement = containerIdOrElement;
      }

      if (!mapElement) {
        throw new Error(`Map container not found`);
      }

      // Apply privacy offset for buyer view
      const displayLocation = privacyOffset
        ? this.addPrivacyOffset(sellerLocation.lat, sellerLocation.lng)
        : sellerLocation;

      const mapOptions = {
        center: { lat: displayLocation.lat, lng: displayLocation.lng },
        zoom: 13,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      this.map = new window.google.maps.Map(mapElement, mapOptions);

      // Create blue circle (no marker for buyer view)
      this.circle = new window.google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.3,
        map: this.map,
        center: { lat: displayLocation.lat, lng: displayLocation.lng },
        radius: radiusKm * 1000
      });

      // Add info window for area
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; text-align: center;">
            <div style="font-weight: bold; color: #4285F4; margin-bottom: 4px;">Seller Area</div>
            <div style="font-size: 12px; color: #666;">Approximate location</div>
          </div>
        `
      });

      // Show info window on circle click
      this.circle.addListener('click', () => {
        infoWindow.open(this.map);
      });

      return {
        map: this.map,
        circle: this.circle,
        displayLocation: displayLocation
      };
    } catch (error) {
      console.error('Error creating buyer view map:', error);
      throw error;
    }
  }

  // Get nearby places within radius
  async getNearbyPlaces(center, radiusKm = 7, type = 'establishment') {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        const request = {
          location: center,
          radius: radiusKm * 1000,
          type: type
        };

        this.placesService.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const places = results.map(place => ({
              id: place.place_id,
              name: place.name,
              rating: place.rating,
              vicinity: place.vicinity,
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            }));
            resolve(places);
          } else {
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Nearby places error:', error);
      return [];
    }
  }

  // Clean up map resources
  destroy() {
    try {
      if (this.marker) {
        this.marker.setMap(null);
        this.marker = null;
      }
      if (this.circle) {
        this.circle.setMap(null);
        this.circle = null;
      }
      if (this.map) {
        this.map = null;
      }
    } catch (error) {
      console.warn('Error during map cleanup:', error);
    }
  }

  // Clean up specific map instance
  destroyMapInstance(mapInstance) {
    try {
      if (mapInstance) {
        if (mapInstance.marker) {
          mapInstance.marker.setMap(null);
        }
        if (mapInstance.circle) {
          mapInstance.circle.setMap(null);
        }
        if (mapInstance.map) {
          mapInstance.map = null;
        }
      }
    } catch (error) {
      console.warn('Error destroying map instance:', error);
    }
  }
}

// Create singleton instance
const googleMapsService = new GoogleMapsService();

export default googleMapsService;
