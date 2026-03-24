import React, { useState } from 'react';
import BuyerLocationView from '../../components/common/BuyerLocationView';
import Card from './Card';

const LocationDemo = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Sample seller locations for demo
  const sampleLocations = [
    {
      id: 1,
      name: "Dewas, Madhya Pradesh",
      coordinates: { lat: 22.9676, lng: 76.0508 },
      radius: 7
    },
    {
      id: 2,
      name: "Indore, Madhya Pradesh", 
      coordinates: { lat: 22.7196, lng: 75.8577 },
      radius: 5
    },
    {
      id: 3,
      name: "Bhopal, Madhya Pradesh",
      coordinates: { lat: 23.2599, lng: 77.4126 },
      radius: 10
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Location System Demo
          </h1>
          <p className="text-gray-600">
            See how sellers select their area and how buyers view approximate locations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seller View */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                🏠 Seller View (Posting Ad)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                When posting an ad, sellers can drag the marker to select their exact service area.
                The blue circle shows their service radius.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-blue-800 mb-2">Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Draggable marker for precise location selection</li>
                <li>• Blue circle shows service area (7km radius)</li>
                <li>• "Use Current Location" button for convenience</li>
                <li>• Real-time coordinates display</li>
              </ul>
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>📍 Seller selects exact location</p>
              <p>🔵 Blue circle shows service area</p>
            </div>
          </Card>

          {/* Buyer View */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                👀 Buyer View (Viewing Ads)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                When viewing ads, buyers see an approximate location with privacy protection.
                The exact address is hidden for seller privacy.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-green-800 mb-2">Privacy Features:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Approximate location (not exact address)</li>
                <li>• Blue circle shows service area</li>
                <li>• No precise marker for privacy</li>
                <li>• "Open in Maps" for navigation</li>
              </ul>
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>📍 Approximate location only</p>
              <p>🔵 Service area visible</p>
            </div>
          </Card>
        </div>

        {/* Sample Locations */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Sample Seller Locations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleLocations.map((location) => (
              <Card key={location.id} className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {location.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Service radius: {location.radius}km
                  </p>
                  
                  <button
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      selectedLocation?.id === location.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedLocation?.id === location.id ? 'Selected' : 'View Location'}
                  </button>
                </div>

                {selectedLocation?.id === location.id && (
                  <BuyerLocationView
                    sellerLocation={location.coordinates}
                    radiusKm={location.radius}
                    className="mt-4"
                  />
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">1️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Seller Posts Ad</h3>
                <p className="text-sm text-gray-600">
                  Seller drags marker to select their exact service area. 
                  Blue circle shows 7km radius.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">2️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Privacy Protection</h3>
                <p className="text-sm text-gray-600">
                  System adds random offset (~500m) to hide exact address. 
                  Only approximate location is stored for buyers.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">3️⃣</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Buyer Views</h3>
                <p className="text-sm text-gray-600">
                  Buyer sees approximate location with blue service area. 
                  Can click "Open in Maps" for navigation.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LocationDemo;
