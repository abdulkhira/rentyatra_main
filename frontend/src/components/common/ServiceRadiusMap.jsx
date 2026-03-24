import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import googleMapsService from '../../services/googleMapsService';
import ErrorBoundary from './ErrorBoundary';

const ServiceRadiusMap = ({ 
  location,
  coordinates,
  serviceRadius = 7,
  title = "Service Area",
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);
  
  const mapInstanceRef = useRef(null);
  const mapWrapperRef = useRef(null);

  // Initialize Google Maps service
  useEffect(() => {
    const initMaps = async () => {
      try {
        console.log('ServiceRadiusMap: Initializing Google Maps service...');
        await googleMapsService.initialize();
        
        // Wait a bit more to ensure Google Maps is fully loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('ServiceRadiusMap: Google Maps service initialized successfully');
        setGoogleMapsReady(true);
      } catch (error) {
        console.error('ServiceRadiusMap: Failed to initialize Google Maps:', error);
        setError(`Failed to initialize maps service: ${error.message}`);
      }
    };
    
    initMaps();
  }, []);

  // Initialize map with service radius
  useEffect(() => {
    if (!mapInitialized && mapWrapperRef.current && googleMapsReady) {
      const initMap = async () => {
        try {
          setIsLoading(true);
          console.log('ServiceRadiusMap: Starting map initialization...');
          
          // Wait for Google Maps API to be fully loaded
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait
          
          while ((!window.google || !window.google.maps) && attempts < maxAttempts) {
            console.log(`ServiceRadiusMap: Waiting for Google Maps API... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          if (!window.google || !window.google.maps) {
            throw new Error('Google Maps API not loaded after waiting');
          }
          
          console.log('ServiceRadiusMap: Google Maps API is ready!');
          
          // Use provided coordinates or fallback to default
          let mapCenter = coordinates || { lat: 22.9676, lng: 76.0508 };
          
          // If coordinates is a string, try to parse it
          if (typeof coordinates === 'string') {
            try {
              const coords = JSON.parse(coordinates);
              if (coords && coords.lat && coords.lng) {
                mapCenter = coords;
              }
            } catch (e) {
              console.warn('ServiceRadiusMap: Could not parse coordinates string:', coordinates);
            }
          }
          
          // Validate coordinates
          if (!isValidCoordinates(mapCenter)) {
            console.warn('ServiceRadiusMap: Invalid coordinates, using default:', mapCenter);
            mapCenter = { lat: 22.9676, lng: 76.0508 };
          }
          
          console.log('ServiceRadiusMap: Using coordinates:', mapCenter);
          console.log('ServiceRadiusMap: Service radius:', serviceRadius, 'km');
          console.log('ServiceRadiusMap: Location:', location);
          
          // Wait for wrapper element to be available
          const wrapperElement = mapWrapperRef.current;
          if (!wrapperElement) {
            throw new Error('Map wrapper element not found');
          }
          
          // Clear any existing content
          wrapperElement.innerHTML = '';
          
          // Create container element directly in the wrapper
          const container = document.createElement('div');
          container.id = `service-radius-map-${Date.now()}`;
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.position = 'relative';
          
          // Insert container into wrapper
          wrapperElement.appendChild(container);
          
          // Store reference
          mapInstanceRef.current = { container, wrapperElement };

          console.log('ServiceRadiusMap: Creating service radius map...');
          
          // Create map with service radius circle
          const mapInstance = googleMapsService.createMapWithRadius(
            container, 
            mapCenter, 
            serviceRadius
          );
          
          console.log('ServiceRadiusMap: Map instance created:', mapInstance);
          mapInstanceRef.current.mapInstance = mapInstance;
          setMapInitialized(true);
          console.log('ServiceRadiusMap: Map initialized successfully');
          
        } catch (error) {
          console.error('ServiceRadiusMap: Error initializing map:', error);
          setError(`Failed to initialize map: ${error.message}`);
          setMapInitialized(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      // Add delay to ensure DOM is ready
      setTimeout(() => initMap(), 100);
    }
  }, [mapInitialized, googleMapsReady, coordinates, serviceRadius]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          if (mapInstanceRef.current.mapInstance) {
            googleMapsService.destroyMapInstance(mapInstanceRef.current.mapInstance);
          }
          if (mapInstanceRef.current.wrapperElement) {
            mapInstanceRef.current.wrapperElement.innerHTML = '';
          }
        } catch (error) {
          console.warn('ServiceRadiusMap: Error cleaning up map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className={`space-y-4 ${className}`}>
        {/* Location Info */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin size={16} className="text-gray-500 flex-shrink-0" />
          <span className="font-medium">{location || 'Location not specified'}</span>
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
                <p className="text-xs text-gray-500 mt-1">Service radius: {serviceRadius}km</p>
              </div>
            </div>
          )}
          
          {/* Map container - will be populated by useEffect */}
          <div 
            ref={mapWrapperRef}
            className="w-full h-full"
          />
        </div>

        {/* Service Radius Info */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-sm font-medium">Service Area: {serviceRadius}km radius</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            This shows the approximate service area. Exact pickup location will be shared after booking confirmation.
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ServiceRadiusMap;
