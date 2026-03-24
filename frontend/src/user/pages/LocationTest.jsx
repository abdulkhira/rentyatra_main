import React, { useState } from 'react';
import LocationAutocomplete from '../../components/common/LocationAutocomplete';
import { MapPin } from 'lucide-react';

const LocationTest = () => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationData, setLocationData] = useState(null);

  const handleLocationSelect = (data) => {
    console.log('Location selected:', data);
    setLocationData(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Current Location Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Location Autocomplete</h2>
          <p className="text-gray-600 mb-4">
            Click the GPS button to get your current location with detailed address:
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

        {locationData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Location Data:</h3>
            <div className="space-y-2">
              <p><strong>Description:</strong> {locationData.description}</p>
              <p><strong>Main Text:</strong> {locationData.mainText}</p>
              <p><strong>Secondary Text:</strong> {locationData.secondaryText}</p>
              {locationData.lat && locationData.lng && (
                <p><strong>Coordinates:</strong> {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}</p>
              )}
              {locationData.detailedAddress && (
                <div>
                  <p><strong>Detailed Address:</strong></p>
                  <ul className="ml-4 space-y-1">
                    {locationData.detailedAddress.sublocality && (
                      <li><strong>Village/Area:</strong> {locationData.detailedAddress.sublocality}</li>
                    )}
                    {locationData.detailedAddress.locality && (
                      <li><strong>City:</strong> {locationData.detailedAddress.locality}</li>
                    )}
                    {locationData.detailedAddress.administrative_area_level_2 && (
                      <li><strong>District:</strong> {locationData.detailedAddress.administrative_area_level_2}</li>
                    )}
                    {locationData.detailedAddress.administrative_area_level_1 && (
                      <li><strong>State:</strong> {locationData.detailedAddress.administrative_area_level_1}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Features Implemented:</h3>
          <ul className="space-y-2 text-blue-800">
            <li>✅ GPS button for current location detection</li>
            <li>✅ Enhanced reverse geocoding with detailed address components</li>
            <li>✅ Village/area prioritization in address display</li>
            <li>✅ Error handling for geolocation permissions</li>
            <li>✅ Fallback to coordinates if address parsing fails</li>
            <li>✅ Integration with RentYatra's Google Maps service</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationTest;