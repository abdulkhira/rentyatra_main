import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import googleMapsService from '../../services/googleMapsService';
import ErrorBoundary from './ErrorBoundary';

const BuyerLocationView = ({ 
  sellerLocation,
  radiusKm = 7,
  className = "",
  showOpenInMaps = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const mapInstanceRef = useRef(null);
  const mapWrapperRef = useRef(null);

  // Initialize Google Maps service
  useEffect(() => {
    const initMaps = async () => {
      try {
        await googleMapsService.initialize();
        console.log('Google Maps service initialized for buyer view');
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setError('Failed to initialize maps service');
      }
    };
    
    if (!googleMapsService.isInitialized) {
      initMaps();
    }
  }, []);

  // Initialize buyer view map with privacy offset
  useEffect(() => {
    if (sellerLocation && !mapInitialized && mapWrapperRef.current) {
      const initMap = async () => {
        try {
          setIsLoading(true);
          
          // Create container element
          const container = document.createElement('div');
          container.style.width = '100%';
          container.style.height = '100%';
          
          // Store reference
          mapInstanceRef.current = { container };

          await googleMapsService.initialize();
          const mapInstance = googleMapsService.createBuyerViewMap(
            container, 
            sellerLocation, 
            radiusKm,
            true // Enable privacy offset
          );
          
          mapInstanceRef.current.mapInstance = mapInstance;
          setMapInitialized(true);
          
        } catch (error) {
          console.error('Error initializing buyer view map:', error);
          setError(`Failed to initialize map: ${error.message}`);
          setMapInitialized(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      setTimeout(() => initMap(), 50);
    }
  }, [sellerLocation, mapInitialized, radiusKm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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

  // Handle opening in Google Maps
  const handleOpenInMaps = () => {
    if (sellerLocation) {
      const googleMapsUrl = `https://www.google.com/maps?q=${sellerLocation.lat},${sellerLocation.lng}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  if (!sellerLocation) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg p-4 text-center ${className}`}>
        <MapPin className="mx-auto text-gray-400 mb-2" size={24} />
        <p className="text-sm text-gray-600">Location not available</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-3 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="text-blue-600" size={18} />
            <h4 className="text-sm font-medium text-gray-800">Seller Location</h4>
          </div>
          
          {showOpenInMaps && (
            <button
              type="button"
              onClick={handleOpenInMaps}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={12} />
              Open in Maps
            </button>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
            <div className="text-xs text-blue-800">
              <p className="font-medium">Approximate Location</p>
              <p>Exact address is hidden for privacy. Blue circle shows service area.</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-red-800">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              <span className="text-xs">{error}</span>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="w-full h-48 rounded-lg border border-gray-200 overflow-hidden relative">
          {!mapInitialized && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 absolute inset-0 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-600">Loading map...</p>
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

        {/* Location Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Service Area</span>
            </div>
            <span className="font-medium text-blue-600">{radiusKm}km radius</span>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BuyerLocationView;
