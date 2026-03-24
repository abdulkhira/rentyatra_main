import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { registerServiceWorker } from './services/pushNotificationService.js';
import { initializeMobileAppBridge } from './utils/mobileAppBridge.js';

// Create root and render app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// CRITICAL: Initialize mobile app bridge immediately
// This ensures session can be saved/restored even before React loads
console.log('🚀 Initializing mobile app bridge on app start...');
initializeMobileAppBridge();

// Initialize service worker early (after React renders)
// FCM token registration will happen in AuthContext after user is authenticated
(async () => {
  try {
    console.log('🚀 Initializing service worker on app start...');
    // Wait for page to load
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
    }
    
    // Register service worker
    await registerServiceWorker(3);
    console.log('✅ Service worker initialized on app start');
    
    // Also initialize mobile app bridge after page load
    initializeMobileAppBridge();
  } catch (error) {
    console.error('❌ Service worker initialization failed on app start:', error);
  }
})();