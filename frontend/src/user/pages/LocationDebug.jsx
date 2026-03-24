import React, { useState } from 'react';
import LocationAutocomplete from '../../components/common/LocationAutocomplete';
import { MapPin, Navigation, CheckCircle, XCircle } from 'lucide-react';

const LocationDebug = () => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationData, setLocationData] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  const handleLocationSelect = (data) => {
    console.log('Location selected:', data);
    setLocationData(data);
    
    // Debug information
    const debug = `
Location Type: ${data.place_id === 'current_location' ? 'CURRENT LOCATION (GPS)' : 'SEARCHED LOCATION'}
Coordinates: ${data.lat ? data.lat.toFixed(6) : 'N/A'}, ${data.lng ? data.lng.toFixed(6) : 'N/A'}
Address: ${data.description}
Main Text: ${data.mainText}
Secondary Text: ${data.secondaryText}
Place ID: ${data.place_id}
    `;
    setDebugInfo(debug);
  };

  const testCurrentLocation = async () => {
    setDebugInfo('Testing current location...');
    
    if (!navigator.geolocation) {
      setDebugInfo('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      setDebugInfo(`
✅ GPS SUCCESS!
Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
Accuracy: ${position.coords.accuracy} meters
Timestamp: ${new Date(position.timestamp).toLocaleString()}
      `);
    } catch (error) {
      setDebugInfo(`❌ GPS ERROR: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Location Debug Tool
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Input */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Location Autocomplete</h2>
            <p className="text-gray-600 mb-4">
              Click the GPS button to get your current location:
            </p>
            
            <LocationAutocomplete
              value={selectedLocation}
              onChange={setSelectedLocation}
              onLocationSelect={handleLocationSelect}
              placeholder="Click GPS button for current location"
              icon={<MapPin className="w-4 h-4" />}
              className="w-full"
              showGetLocation={true}
            />
          </div>

          {/* GPS Test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Direct GPS Test</h2>
            <p className="text-gray-600 mb-4">
              Test GPS directly without autocomplete:
            </p>
            
            <button
              onClick={testCurrentLocation}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Test GPS Location
            </button>
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Debug Information</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
            {debugInfo || 'No location data yet. Click GPS button to test.'}
          </pre>
        </div>

        {/* Location Data */}
        {locationData && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
              {locationData.place_id === 'current_location' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Current Location Detected
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  Searched Location
                </>
              )}
            </h3>
            <div className="space-y-2">
              <p><strong>Description:</strong> {locationData.description}</p>
              <p><strong>Main Text:</strong> {locationData.mainText}</p>
              <p><strong>Secondary Text:</strong> {locationData.secondaryText}</p>
              {locationData.lat && locationData.lng && (
                <p><strong>Coordinates:</strong> {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}</p>
              )}
              <p><strong>Place ID:</strong> {locationData.place_id}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Test:</h3>
          <ol className="space-y-2 text-blue-800">
            <li>1. Click the GPS button in the location input</li>
            <li>2. Allow location access when prompted</li>
            <li>3. Check if coordinates are accurate (should be your actual location)</li>
            <li>4. Verify the address matches your current area</li>
            <li>5. Use "Direct GPS Test" to test GPS without autocomplete</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LocationDebug;