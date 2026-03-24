import React, { useState, useEffect } from 'react';

const EnvTest = () => {
  const [envStatus, setEnvStatus] = useState('Checking...');

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (apiKey) {
      setEnvStatus(`✅ API Key loaded: ${apiKey.substring(0, 10)}...`);
    } else {
      setEnvStatus('❌ API Key not found');
    }
  }, []);

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="font-medium text-green-800 mb-2">Environment Variable Test</h3>
      <p className="text-sm text-green-700">{envStatus}</p>
      <p className="text-xs text-green-600 mt-2">
        If you see "API Key not found", restart the dev server with: npm run dev
      </p>
    </div>
  );
};

export default EnvTest;
