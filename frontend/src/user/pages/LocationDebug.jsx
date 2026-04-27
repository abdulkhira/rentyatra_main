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
    <div className="min-h-screen bg-[#f0f0f5] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto pb-20">

        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Location Debug Tool
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Diagnostic Dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Input */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">Location Autocomplete</h2>
            <p className="text-sm font-medium text-gray-500 mb-6">
              Click the GPS button to fetch your coordinates and reverse-geocode:
            </p>

            <div className="relative">
              <LocationAutocomplete
                value={selectedLocation}
                onChange={setSelectedLocation}
                onLocationSelect={handleLocationSelect}
                placeholder="Search or use GPS"
                icon={<MapPin className="w-5 h-5 text-gray-400" />}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
                showGetLocation={true}
              />
            </div>
          </div>

          {/* GPS Test */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">Direct GPS Test</h2>
            <p className="text-sm font-medium text-gray-500 mb-6">
              Bypass autocomplete and test the browser's Geolocation API directly:
            </p>

            <button
              onClick={testCurrentLocation}
              className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-3 shadow-sm active:scale-95"
            >
              <Navigation className="w-5 h-5 text-[#fc8019]" />
              Test GPS Location
            </button>
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-6 bg-gray-900 rounded-3xl shadow-lg p-6 md:p-8 border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">Console Output</h3>
          </div>
          <pre className="bg-black/50 p-5 rounded-2xl text-xs md:text-sm font-mono text-green-400 overflow-auto whitespace-pre-wrap border border-gray-800 leading-relaxed">
            {debugInfo || '> Waiting for input...'}
          </pre>
        </div>

        {/* Location Data Success */}
        {locationData && (
          <div className="mt-6 bg-green-50 border border-green-100 rounded-3xl p-6 md:p-8">
            <h3 className="text-lg font-extrabold text-green-800 mb-5 flex items-center gap-2 tracking-tight">
              {locationData.place_id === 'current_location' ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Current Location Detected
                </>
              ) : (
                <>
                  <MapPin className="w-6 h-6 text-green-500" />
                  Searched Location
                </>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-green-100/50">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block mb-1">Description</span>
                <p className="text-sm font-bold text-gray-800">{locationData.description}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-green-100/50">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block mb-1">Main Text</span>
                <p className="text-sm font-bold text-gray-800">{locationData.mainText}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-green-100/50">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block mb-1">Secondary Text</span>
                <p className="text-sm font-bold text-gray-800">{locationData.secondaryText}</p>
              </div>
              {locationData.lat && locationData.lng && (
                <div className="bg-white rounded-2xl p-4 border border-green-100/50">
                  <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block mb-1">Coordinates (Lat, Lng)</span>
                  <p className="text-sm font-mono font-bold text-blue-600">
                    {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
                  </p>
                </div>
              )}
              <div className="bg-white rounded-2xl p-4 border border-green-100/50 md:col-span-2">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block mb-1">Place ID</span>
                <p className="text-xs font-mono font-bold text-gray-600 break-all">{locationData.place_id}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h3 className="text-lg font-extrabold text-gray-900 mb-5 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <span className="text-[#fc8019] font-bold">?</span>
            </div>
            Testing Guide
          </h3>
          <ol className="space-y-4 text-sm font-medium text-gray-600">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-900">1</span>
              <span>Click the GPS button (<Navigation className="w-4 h-4 inline text-gray-400" />) in the location input field.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-900">2</span>
              <span>Allow location access if your browser prompts you.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-900">3</span>
              <span>Review the console output to verify coordinate accuracy.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-900">4</span>
              <span>Verify that the reverse-geocoded address matches your approximate area.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-900">5</span>
              <span>Use the "Direct GPS Test" button to isolate browser geolocation issues from Maps API issues.</span>
            </li>
          </ol>
        </div>

      </div>
    </div>
  );
};

export default LocationDebug;