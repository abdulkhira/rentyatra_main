import React, { useState } from 'react';
import BuyerLocationView from '../../components/common/BuyerLocationView';
import Card from './Card';
import { MapPin, Eye, ShieldCheck, HelpCircle, Navigation } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f0f0f5] py-8 font-sans pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="text-center mb-10 pt-4">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full flex items-center justify-center shadow-sm">
            <MapPin size={36} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Location System Demo
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto">
            Experience our privacy-first location system. See how sellers precisely define their service area while buyers view secure, approximate locations.
          </p>
        </div>

        {/* View Comparisons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-10">
          {/* Seller View */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                <Navigation size={24} className="text-blue-500 fill-blue-500/20" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  Seller View <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1">(Posting Ad)</span>
                </h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  When posting an ad, sellers can drag the marker to select their exact service area. The highlighted circle shows their active radius.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">Key Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Draggable marker for precise selection
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Highlighted circle indicates service area
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  "Use Current Location" quick action
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Real-time coordinate tracking
                </li>
              </ul>
            </div>
          </div>

          {/* Buyer View */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 border border-green-100 shadow-sm">
                <Eye size={24} className="text-green-500 fill-green-500/20" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  Buyer View <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold ml-1">(Viewing Ads)</span>
                </h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  When viewing ads, buyers see an approximate location to protect seller privacy. The exact street address remains hidden.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">Privacy Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <ShieldCheck size={16} className="text-green-500" />
                  Approximate location display only
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <ShieldCheck size={16} className="text-green-500" />
                  General service area visible
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <ShieldCheck size={16} className="text-green-500" />
                  No precise markers rendered
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <ShieldCheck size={16} className="text-green-500" />
                  Secure "Open in Maps" routing
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Sample Locations */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Interactive Preview</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Select a location below to test the buyer's view</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleLocations.map((location) => (
              <div key={location.id} className={`bg-white rounded-3xl p-5 shadow-sm border transition-all duration-300 ${selectedLocation?.id === location.id ? 'border-[#fc8019] shadow-md ring-4 ring-[#fc8019]/10' : 'border-gray-100 hover:border-gray-300'
                }`}>
                <div className="mb-5 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors ${selectedLocation?.id === location.id ? 'bg-orange-50 text-[#fc8019]' : 'bg-gray-50 text-gray-400'
                    }`}>
                    <MapPin size={20} />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-lg mb-1 tracking-tight">
                    {location.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Radius: {location.radius} KM
                  </p>

                  <button
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-sm ${selectedLocation?.id === location.id
                        ? 'bg-[#fc8019] text-white border-none'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {selectedLocation?.id === location.id ? 'Viewing Location' : 'Simulate Buyer View'}
                  </button>
                </div>

                {/* The Map Component */}
                <div className={`transition-all duration-500 overflow-hidden ${selectedLocation?.id === location.id ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                  <div className="pt-4 border-t border-gray-100">
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50 h-[250px]">
                      <BuyerLocationView
                        sellerLocation={location.coordinates}
                        radiusKm={location.radius}
                      />
                    </div>
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100 flex items-start gap-2">
                      <ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-green-800 font-bold leading-relaxed">
                        Notice how the map defaults to a zoomed-out view and lacks a precise pinpoint, ensuring the seller's exact address remains private.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-2">
              <HelpCircle size={24} className="text-[#fc8019]" />
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200 group-hover:bg-[#fc8019] transition-colors duration-300"></div>
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100 shadow-sm">
                <span className="text-2xl font-extrabold text-gray-400 group-hover:text-[#fc8019] transition-colors">1</span>
              </div>
              <h3 className="font-extrabold text-gray-900 mb-3 text-lg">Seller Posts Ad</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                The seller drags a marker to select their exact service area. A defined circle visually confirms their active radius.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200 group-hover:bg-[#fc8019] transition-colors duration-300"></div>
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100 shadow-sm">
                <span className="text-2xl font-extrabold text-gray-400 group-hover:text-[#fc8019] transition-colors">2</span>
              </div>
              <h3 className="font-extrabold text-gray-900 mb-3 text-lg">Privacy Masking</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Our system applies a geographic offset to obscure the exact address. Only generalized coordinates are stored for public viewing.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200 group-hover:bg-[#fc8019] transition-colors duration-300"></div>
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100 shadow-sm">
                <span className="text-2xl font-extrabold text-gray-400 group-hover:text-[#fc8019] transition-colors">3</span>
              </div>
              <h3 className="font-extrabold text-gray-900 mb-3 text-lg">Secure Viewing</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Buyers see only the broad service area. Safe routing is provided via "Open in Maps" without revealing the private starting point.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LocationDemo;