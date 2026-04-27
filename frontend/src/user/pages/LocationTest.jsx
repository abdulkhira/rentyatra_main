import React, { useState } from 'react';
import LocationAutocomplete from '../../components/common/LocationAutocomplete';
import { MapPin, CheckCircle, Info, Navigation, ShieldCheck } from 'lucide-react';

const LocationTest = () => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationData, setLocationData] = useState(null);

  const handleLocationSelect = (data) => {
    console.log('Location selected:', data);
    setLocationData(data);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f5] p-4 md:p-8 font-sans pb-20">
      <div className="max-w-[800px] mx-auto">

        {/* Header */}
        <div className="text-center mb-10 pt-4">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full flex items-center justify-center shadow-sm">
            <Navigation size={36} className="text-white fill-white/20" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Current Location Test
          </h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Diagnostic Dashboard
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight flex items-center gap-2">
            <MapPin size={20} className="text-[#fc8019]" />
            Test Location Autocomplete
          </h2>
          <p className="text-sm font-medium text-gray-500 mb-6">
            Search for an address or click the GPS button to fetch your precise coordinates and detailed location breakdown.
          </p>

          <div className="relative">
            <LocationAutocomplete
              value={selectedLocation}
              onChange={setSelectedLocation}
              onLocationSelect={handleLocationSelect}
              placeholder="Search or tap GPS icon..."
              icon={<MapPin className="w-5 h-5 text-gray-400" />}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] outline-none transition-all"
              showGetLocation={true}
            />
          </div>
        </div>

        {/* Results Section */}
        {locationData && (
          <div className="bg-green-50 border border-green-100 rounded-3xl p-6 md:p-8 mb-6 animate-slide-up">
            <h3 className="text-lg font-extrabold text-green-800 mb-6 flex items-center gap-2 tracking-tight">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Location Data Captured
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-green-100/50 md:col-span-2">
                <span className="text-[10px] uppercase font-extrabold text-green-600/70 tracking-wider block mb-1">Full Description</span>
                <p className="text-sm font-bold text-gray-800">{locationData.description}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-green-100/50">
                <span className="text-[10px] uppercase font-extrabold text-green-600/70 tracking-wider block mb-1">Main Text</span>
                <p className="text-sm font-bold text-gray-800">{locationData.mainText || '—'}</p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-green-100/50">
                <span className="text-[10px] uppercase font-extrabold text-green-600/70 tracking-wider block mb-1">Secondary Text</span>
                <p className="text-sm font-bold text-gray-800 truncate">{locationData.secondaryText || '—'}</p>
              </div>

              {locationData.lat && locationData.lng && (
                <div className="bg-white rounded-2xl p-4 border border-green-100/50 md:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-green-600/70 tracking-wider block mb-1">Coordinates (Lat, Lng)</span>
                    <p className="text-sm font-mono font-bold text-blue-600 tracking-tight">
                      {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-green-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Address Breakdown */}
            {locationData.detailedAddress && (
              <div className="mt-4 bg-white rounded-2xl p-5 border border-green-100/50">
                <span className="text-[10px] uppercase font-extrabold text-green-600/70 tracking-wider block mb-4">Detailed Address Breakdown</span>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  {locationData.detailedAddress.sublocality && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Village / Area</span>
                      <p className="text-sm font-extrabold text-gray-800">{locationData.detailedAddress.sublocality}</p>
                    </div>
                  )}
                  {locationData.detailedAddress.locality && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-0.5">City</span>
                      <p className="text-sm font-extrabold text-gray-800">{locationData.detailedAddress.locality}</p>
                    </div>
                  )}
                  {locationData.detailedAddress.administrative_area_level_2 && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-0.5">District</span>
                      <p className="text-sm font-extrabold text-gray-800">{locationData.detailedAddress.administrative_area_level_2}</p>
                    </div>
                  )}
                  {locationData.detailedAddress.administrative_area_level_1 && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-0.5">State</span>
                      <p className="text-sm font-extrabold text-gray-800">{locationData.detailedAddress.administrative_area_level_1}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2 tracking-tight">
            <Info size={20} className="text-[#fc8019]" />
            Features Implemented
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700 leading-snug">GPS button for current location detection</span>
            </li>
            <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700 leading-snug">Enhanced reverse geocoding with detailed components</span>
            </li>
            <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700 leading-snug">Village & area prioritization in display</span>
            </li>
            <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700 leading-snug">Robust error handling for geolocation permissions</span>
            </li>
            <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700 leading-snug">Fallback to raw coordinates if parsing fails</span>
            </li>
            <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700 leading-snug">Deep integration with RentYatra's Google Maps API</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default LocationTest;