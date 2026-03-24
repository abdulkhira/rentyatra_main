import React, { useState, useEffect } from 'react';
import googleMapsService from '../../services/googleMapsService';

const MapDebugTest = () => {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const testGoogleMaps = async () => {
      try {
        setStatus('Checking API key...');
        
        // Check if API key is available
        const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const fallbackKey = 'AIzaSyDv1KQNT7JM2YxhD0aV4YENv6s-WE9et30';
        const key = envKey || fallbackKey;
        
        if (!key) {
          throw new Error('No API key available (neither env nor fallback)');
        }
        
        if (envKey) {
          setApiKey(`ENV: ${envKey.substring(0, 10)}...`);
        } else {
          setApiKey(`FALLBACK: ${fallbackKey.substring(0, 10)}...`);
        }
        
        setStatus('Initializing Google Maps...');
        await googleMapsService.initialize();
        
        setStatus('Google Maps initialized successfully!');
        
        // Test if Google Maps is available
        if (window.google && window.google.maps) {
          setStatus('Google Maps API is loaded and ready!');
        } else {
          throw new Error('Google Maps API not available on window object');
        }
        
      } catch (err) {
        console.error('Map debug error:', err);
        setError(err.message);
        setStatus('Failed to initialize Google Maps');
      }
    };

    testGoogleMaps();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Google Maps Debug Test</h2>
      
      <div className="space-y-3">
        <div>
          <strong>Status:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            error ? 'bg-red-100 text-red-800' : 
            status.includes('successfully') ? 'bg-green-100 text-green-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </span>
        </div>
        
        {apiKey && (
          <div>
            <strong>API Key:</strong> 
            <span className="ml-2 text-sm text-gray-600">{apiKey}</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <strong className="text-red-800">Error:</strong>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}
        
        <div>
          <strong>Window Google:</strong> 
          <span className="ml-2 text-sm">
            {window.google ? '✅ Available' : '❌ Not Available'}
          </span>
        </div>
        
        <div>
          <strong>Window Google Maps:</strong> 
          <span className="ml-2 text-sm">
            {window.google?.maps ? '✅ Available' : '❌ Not Available'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-medium text-blue-800 mb-2">Troubleshooting Steps:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. <strong>Restart Dev Server:</strong> Stop and run `npm run dev` again</li>
          <li>2. Check if .env file exists with VITE_GOOGLE_MAPS_API_KEY</li>
          <li>3. Verify API key is valid and has Maps JavaScript API enabled</li>
          <li>4. Check browser console for detailed error messages</li>
          <li>5. Ensure internet connection is working</li>
        </ul>
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-700">
            <strong>Note:</strong> If ENV key fails, fallback key will be used automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapDebugTest;
