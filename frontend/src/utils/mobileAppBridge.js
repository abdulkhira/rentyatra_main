/**
 * Mobile App Bridge - Handles communication between RentYatra web app and Flutter WebView app
 * 
 * This utility detects if the app is running inside a Flutter WebView app and
 * sends login events with phone number to enable push notifications.
 */

/**
 * Check if running inside Flutter WebView app
 * @returns {boolean}
 */
export const isRunningInFlutterWebView = () => {
  // Check for Flutter WebView identifiers
  if (typeof window === 'undefined') return false;
  
  // Check for flutter_inappwebview object
  if (window.flutter_inappwebview) {
    return true;
  }
  
  // Check user agent for Flutter WebView
  const userAgent = navigator.userAgent || '';
  if (userAgent.includes('Flutter')) {
    return true;
  }
  
  // Check for custom headers that Flutter WebView might set
  // Some WebView implementations set custom headers
  return false;
};

/**
 * Send login event to Flutter WebView app
 * This should be called after successful login to notify the mobile app
 * 
 * @param {string} phone - User's phone number (10 digits without +91)
 * @param {object} userData - Optional user data
 */
export const sendLoginEventToMobileApp = (phone, userData = null, token = null) => {
  try {
    // Check if running in Flutter WebView
    if (!isRunningInFlutterWebView()) {
      console.log('ℹ️ Not running in Flutter WebView, skipping login event');
      return false;
    }
    
    // Clean phone number (remove +91, spaces, dashes, etc.)
    let cleanPhone = phone.replace(/\D/g, '');
    
    // If phone starts with 91 and is 12 digits, remove the 91 prefix
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Validate phone number (should be 10 digits)
    if (cleanPhone.length !== 10 || !/^\d{10}$/.test(cleanPhone)) {
      console.error('❌ Invalid phone number format for mobile app:', phone);
      return false;
    }
    
    console.log('📱 Sending login event to Flutter WebView app...');
    console.log('📱 Phone number:', cleanPhone);
    
    // Prepare event data
    const eventData = {
      phone: cleanPhone,
      timestamp: new Date().toISOString(),
      ...(userData && { user: userData }),
      ...(token && { token })
    };
    
    // Try to send via Flutter WebView JavaScript handler
    if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
      console.log('✅ Flutter WebView bridge found, calling onLogin handler...');
      
      window.flutter_inappwebview.callHandler('onLogin', eventData)
        .then((result) => {
          console.log('✅ Login event sent successfully to mobile app:', result);
        })
        .catch((error) => {
          console.error('❌ Error sending login event to mobile app:', error);
        });
      
      return true;
    } else {
      console.warn('⚠️ Flutter WebView bridge not available yet, will retry...');
      
      // Retry after a delay if bridge is not ready
      setTimeout(() => {
        if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
          window.flutter_inappwebview.callHandler('onLogin', eventData)
            .then((result) => {
              console.log('✅ Login event sent successfully (retry):', result);
            })
            .catch((error) => {
              console.error('❌ Error sending login event (retry):', error);
            });
        } else {
          console.warn('⚠️ Flutter WebView bridge still not available after retry');
        }
      }, 2000);
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error in sendLoginEventToMobileApp:', error);
    return false;
  }
};

/**
 * Navigate to a route in the mobile app
 * This tells the Flutter app to navigate internally instead of using browser navigation
 * 
 * @param {string} route - The route to navigate to (e.g., '/my-subscription')
 * @returns {boolean} - Returns true if navigation event was sent
 */
export const navigateInMobileApp = (route) => {
  try {
    // Check if running in Flutter WebView
    if (!isRunningInFlutterWebView()) {
      console.log('ℹ️ Not running in Flutter WebView, skipping navigation event');
      return false;
    }
    
    // Validate route
    if (!route || typeof route !== 'string') {
      console.error('❌ Invalid route for mobile app navigation:', route);
      return false;
    }
    
    // Ensure route starts with /
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
    
    console.log('📱 Sending navigation event to Flutter WebView app...');
    console.log('📱 Route:', normalizedRoute);
    
    // Prepare event data
    const eventData = {
      route: normalizedRoute,
      timestamp: new Date().toISOString()
    };
    
    // Try to send via Flutter WebView JavaScript handler
    if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
      console.log('✅ Flutter WebView bridge found, calling navigation handler...');
      
      // Try multiple handler names (Flutter app may use different handler names)
      const handlerNames = ['onNavigate', 'onPaymentSuccess', 'navigateTo', 'onPaymentComplete'];
      
      // Try the first handler (most common)
      window.flutter_inappwebview.callHandler('onNavigate', eventData)
        .then((result) => {
          console.log('✅ Navigation event sent successfully via onNavigate:', result);
        })
        .catch((error) => {
          // Handler doesn't exist, try alternative handlers
          console.log('⚠️ onNavigate handler not available, trying alternatives...');
          
          // Try onPaymentSuccess as fallback
          window.flutter_inappwebview.callHandler('onPaymentSuccess', eventData)
            .then((result) => {
              console.log('✅ Navigation event sent via onPaymentSuccess:', result);
            })
            .catch((err) => {
              console.log('⚠️ onPaymentSuccess also not available, trying navigateTo...');
              
              // Try navigateTo
              window.flutter_inappwebview.callHandler('navigateTo', eventData)
                .then((result) => {
                  console.log('✅ Navigation event sent via navigateTo:', result);
                })
                .catch((e) => {
                  console.warn('⚠️ All navigation handlers failed. Flutter app may need to implement onNavigate handler.');
                  console.warn('Event data that should be handled:', eventData);
                });
            });
        });
      
      return true;
    } else {
      console.warn('⚠️ Flutter WebView bridge not available yet, will retry...');
      
      // Retry after a delay if bridge is not ready
      setTimeout(() => {
        if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
          window.flutter_inappwebview.callHandler('onNavigate', eventData)
            .then((result) => {
              console.log('✅ Navigation event sent successfully (retry):', result);
            })
            .catch((error) => {
              console.error('❌ Error sending navigation event (retry):', error);
            });
        } else {
          console.warn('⚠️ Flutter WebView bridge still not available after retry');
        }
      }, 1000);
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error in navigateInMobileApp:', error);
    return false;
  }
};

/**
 * Send auth session details to Flutter WebView for persistent storage
 * @param {string} token
 * @param {object} userData
 */
export const sendAuthSessionToMobileApp = (token, refreshToken = null, userData = null) => {
  try {
    console.log('📱 sendAuthSessionToMobileApp called:', {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      hasUserData: !!userData,
      tokenLength: token?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
      isFlutterWebView: isRunningInFlutterWebView()
    });

    if (!isRunningInFlutterWebView()) {
      console.warn('⚠️ Not running in Flutter WebView - skipping mobile app storage');
      return false;
    }

    if (!token) {
      console.error('❌ ERROR: sendAuthSessionToMobileApp called without token!');
      return false;
    }

    const payload = {
      token,
      user: userData || null,
      refreshToken: refreshToken || null,
      timestamp: new Date().toISOString(),
    };

    console.log('📤 Sending to mobile app:', {
      tokenPreview: token.substring(0, 20) + '...',
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : 'null',
      userPhone: userData?.phone || userData?.formattedPhone || 'N/A'
    });

    if (window.flutter_inappwebview?.callHandler) {
      window.flutter_inappwebview
        .callHandler('saveAuthSession', payload)
        .then((result) => {
          console.log('✅ Auth session stored in mobile app:', result);
        })
        .catch((error) => {
          console.error('❌ Error sending auth session to mobile app:', error);
        });
      return true;
    }

    console.warn('⚠️ Flutter WebView bridge not ready for saveAuthSession');
    return false;
  } catch (error) {
    console.error('❌ Error in sendAuthSessionToMobileApp:', error);
    return false;
  }
};

/**
 * Tell Flutter WebView to clear stored auth session
 */
export const sendLogoutEventToMobileApp = () => {
  try {
    if (!isRunningInFlutterWebView()) {
      return false;
    }

    if (window.flutter_inappwebview?.callHandler) {
      const payload = { timestamp: new Date().toISOString() };
      window.flutter_inappwebview
        .callHandler('onLogout', payload)
        .then((result) => {
          console.log('Logout event sent to mobile app:', result);
        })
        .catch((error) => {
          console.error('Error sending logout event to mobile app:', error);
        });
      return true;
    }

    console.warn('Flutter WebView bridge not ready for onLogout handler');
    return false;
  } catch (error) {
    console.error('Error in sendLogoutEventToMobileApp:', error);
    return false;
  }
};

/**
 * Request stored auth session from Flutter WebView.
 * Returns { token, refreshToken, user } or null
 */
export const requestStoredAuthSession = async (retries = 5, retryDelay = 1500) => {
  if (!isRunningInFlutterWebView()) {
    return null;
  }

  const attempt = async (remaining) => {
    // Wait a bit before checking if bridge is ready (gives time for bridge to initialize)
    if (remaining < retries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    if (!window.flutter_inappwebview?.callHandler) {
      if (remaining <= 0) {
        console.warn('Flutter WebView bridge not available after all retries');
        return null;
      }
      console.log(`Waiting for Flutter WebView bridge... (${remaining} retries left)`);
      return attempt(remaining - 1);
    }

    try {
      const response = await window.flutter_inappwebview.callHandler('getStoredAuthSession');
      if (response && typeof response === 'object') {
        // Check if we have at least a token or refreshToken
        if (response.token || response.refreshToken) {
          console.log('✅ Received stored auth session from mobile app');
          return {
            token: response.token || null,
            refreshToken: response.refreshToken || null,
            user: response.user || null,
          };
        }
      }
      console.log('No stored auth session found in mobile app');
      return null;
    } catch (error) {
      console.error('Error fetching stored auth session:', error);
      if (remaining > 0) {
        console.log(`Retrying... (${remaining - 1} retries left)`);
        return attempt(remaining - 1);
      }
      return null;
    }
  };

  return attempt(retries);
};

/**
 * Initialize mobile app bridge
 * This should be called once when the app loads
 * CRITICAL: Multiple initialization attempts to ensure bridge is ready
 */
export const initializeMobileAppBridge = () => {
  try {
    if (isRunningInFlutterWebView()) {
      console.log('📱 Mobile app bridge initialization started - Running in Flutter WebView');
      
      // Try to initialize multiple times with delays
      const initAttempts = [0, 500, 1000, 2000, 3000];
      initAttempts.forEach((delay, index) => {
        setTimeout(() => {
          if (window.flutter_inappwebview?.callHandler) {
            console.log(`✅ Mobile app bridge ready after ${delay}ms (attempt ${index + 1})`);
            
            // Try to restore session immediately when bridge is ready
            if (index === 0 || index === initAttempts.length - 1) {
              // First and last attempt - try to restore session
              const token = localStorage.getItem('token');
              const refreshToken = localStorage.getItem('refreshToken');
              const user = localStorage.getItem('user');
              
              if (token && refreshToken && user) {
                try {
                  const userData = JSON.parse(user);
                  sendAuthSessionToMobileApp(token, refreshToken, userData);
                  console.log('💾 Session synced to mobile app during bridge initialization');
                } catch (e) {
                  console.error('Failed to sync session during bridge init:', e);
                }
              }
            }
          } else if (index === initAttempts.length - 1) {
            console.warn('⚠️ Mobile app bridge not ready after all attempts');
          }
        }, delay);
      });
      
      // Listen for page visibility changes to re-check bridge availability
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isRunningInFlutterWebView()) {
          console.log('📱 Page visible, checking Flutter WebView bridge...');
          // Try to restore session when page becomes visible
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          const user = localStorage.getItem('user');
          
          if (token && refreshToken && user && window.flutter_inappwebview?.callHandler) {
            try {
              const userData = JSON.parse(user);
              sendAuthSessionToMobileApp(token, refreshToken, userData);
              console.log('💾 Session synced on visibility change');
            } catch (e) {
              console.error('Failed to sync session on visibility change:', e);
            }
          }
        }
      });
    } else {
      console.log('ℹ️ Not running in mobile app, bridge not needed');
    }
  } catch (error) {
    console.error('❌ Error initializing mobile app bridge:', error);
  }
};

// Auto-initialize on load with multiple attempts
if (typeof window !== 'undefined') {
  // Immediate initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileAppBridge);
  } else {
    initializeMobileAppBridge();
  }
  
  // Also try after window load
  window.addEventListener('load', () => {
    setTimeout(initializeMobileAppBridge, 100);
  });
  
  // And after a delay to ensure everything is ready
  setTimeout(initializeMobileAppBridge, 1000);
  setTimeout(initializeMobileAppBridge, 3000);
}

