import { useState, useEffect, useRef } from 'react';
import googleMapsService from '../../services/googleMapsService';

const ListingsMapView = ({ listings = [], onListingClick }) => {
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  const mapWrapperRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Google Maps API
  useEffect(() => {
    const initGoogleMaps = async () => {
      try {
        console.log('ListingsMapView: Initializing Google Maps API...');
        await googleMapsService.loadGoogleMapsAPI();
        setGoogleMapsReady(true);
        console.log('ListingsMapView: Google Maps API loaded successfully');
      } catch (error) {
        console.error('ListingsMapView: Error loading Google Maps API:', error);
        setError('Failed to load Google Maps API');
      }
    };

    if (!window.google || !window.google.maps) {
      initGoogleMaps();
    } else {
      setGoogleMapsReady(true);
    }
  }, []);

  // Validate coordinates
  const isValidCoordinates = (coords) => {
    return coords && 
           typeof coords.lat === 'number' && 
           typeof coords.lng === 'number' &&
           coords.lat >= -90 && coords.lat <= 90 &&
           coords.lng >= -180 && coords.lng <= 180;
  };

  // Initialize map with multiple markers
  useEffect(() => {
    if (!mapInitialized && mapWrapperRef.current && googleMapsReady && listings.length > 0) {
      const initMap = async () => {
        try {
          setIsLoading(true);
          console.log('ListingsMapView: Starting map initialization...');
          console.log('ListingsMapView: Listings count:', listings.length);
          
          let attempts = 0;
          const maxAttempts = 50;
          
          while ((!window.google || !window.google.maps) && attempts < maxAttempts) {
            console.log(`ListingsMapView: Waiting for Google Maps API... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded after waiting');
          }
          
          console.log('ListingsMapView: Google Maps API is ready!');
          
          // Calculate map center based on listings
          let mapCenter = { lat: 22.9676, lng: 76.0508 }; // Default to Dewas
          let validListings = [];
          
          // Filter listings with valid coordinates
          listings.forEach(listing => {
            if (listing.location?.coordinates) {
              let coords = null;
              
              // Handle different coordinate formats
              if (typeof listing.location.coordinates === 'object') {
                coords = {
                  lat: listing.location.coordinates.latitude || listing.location.coordinates.lat,
                  lng: listing.location.coordinates.longitude || listing.location.coordinates.lng
                };
              } else if (typeof listing.location.coordinates === 'string') {
                try {
                  const parsed = JSON.parse(listing.location.coordinates);
                  coords = {
                    lat: parsed.latitude || parsed.lat,
                    lng: parsed.longitude || parsed.lng
                  };
                } catch (e) {
                  console.warn('ListingsMapView: Could not parse coordinates string:', listing.location.coordinates);
                }
              }
              
              if (isValidCoordinates(coords)) {
                validListings.push({
                  ...listing,
                  coordinates: coords,
                  serviceRadius: listing.location?.serviceRadius || 7
                });
              }
            }
          });
          
          console.log('ListingsMapView: Valid listings with coordinates:', validListings.length);
          
          // Calculate center from valid listings
          if (validListings.length > 0) {
            const avgLat = validListings.reduce((sum, listing) => sum + listing.coordinates.lat, 0) / validListings.length;
            const avgLng = validListings.reduce((sum, listing) => sum + listing.coordinates.lng, 0) / validListings.length;
            mapCenter = { lat: avgLat, lng: avgLng };
          }
          
          console.log('ListingsMapView: Map center:', mapCenter);
          
          // Wait for wrapper element to be available
          const wrapperElement = mapWrapperRef.current;
          if (!wrapperElement) {
            throw new Error('Map wrapper element not found');
          }
          
          wrapperElement.innerHTML = '';
          const container = document.createElement('div');
          container.id = `listings-map-container-${Date.now()}`;
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.position = 'relative';
          wrapperElement.appendChild(container);
          
          // Create map
          const map = new window.google.maps.Map(container, {
            zoom: 12,
            center: mapCenter,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });
          
          mapInstanceRef.current = map;
          
          // Add markers and service radius circles
          validListings.forEach((listing, index) => {
            console.log(`ListingsMapView: Adding marker for listing ${index + 1}:`, listing.title);
            console.log(`ListingsMapView: Coordinates:`, listing.coordinates);
            console.log(`ListingsMapView: Service radius:`, listing.serviceRadius, 'km');
            
            // Create marker
            const marker = new window.google.maps.Marker({
              position: listing.coordinates,
              map: map,
              title: listing.title,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">₹</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16)
              }
            });
            
            // Create service radius circle
            const circle = new window.google.maps.Circle({
              strokeColor: '#3B82F6',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              map: map,
              center: listing.coordinates,
              radius: listing.serviceRadius * 1000 // Convert km to meters
            });
            
            // Create info window
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; max-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1F2937;">${listing.title}</h3>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">${listing.description?.substring(0, 100)}${listing.description?.length > 100 ? '...' : ''}</p>
                  <div style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #3B82F6;">₹${(listing.pricePerDay || listing.price || 0).toLocaleString()}/day</div>
                  <div style="margin: 0 0 8px 0; font-size: 11px; color: #6B7280;">📍 ${listing.location}</div>
                  <div style="margin: 0; font-size: 11px; color: #6B7280;">🔵 Service Radius: ${listing.serviceRadius} km</div>
                </div>
              `
            });
            
            // Add click listener to marker
            marker.addListener('click', () => {
              // Close all other info windows
              markersRef.current.forEach(m => {
                if (m.infoWindow) {
                  m.infoWindow.close();
                }
              });
              
              infoWindow.open(map, marker);
              
              // Call onListingClick if provided
              if (onListingClick) {
                onListingClick(listing);
              }
            });
            
            markersRef.current.push({
              marker,
              circle,
              infoWindow,
              listing
            });
          });
          
          setMapInitialized(true);
          console.log('ListingsMapView: Map initialized successfully with', validListings.length, 'markers');
          
        } catch (error) {
          console.error('ListingsMapView: Error initializing map:', error);
          setError(`Failed to initialize map: ${error.message}`);
          setMapInitialized(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      setTimeout(() => initMap(), 100);
    }
  }, [mapInitialized, googleMapsReady, listings, onListingClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(markerData => {
          if (markerData.marker) {
            markerData.marker.setMap(null);
          }
          if (markerData.circle) {
            markerData.circle.setMap(null);
          }
        });
        markersRef.current = [];
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Map Error</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      <div ref={mapWrapperRef} className="w-full h-full"></div>
    </div>
  );
};

export default ListingsMapView;
