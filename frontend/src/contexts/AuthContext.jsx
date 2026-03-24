import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { registerFCMToken } from '../services/pushNotificationService';
import {
  sendLoginEventToMobileApp,
  sendAuthSessionToMobileApp,
  sendLogoutEventToMobileApp,
  requestStoredAuthSession
} from '../utils/mobileAppBridge';
import { disableBackButton } from '../utils/historyUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider');
    // Return default values instead of throwing error
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      login: () => {},
      logout: () => {},
      updateUser: () => {}
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backButtonDisabled, setBackButtonDisabled] = useState(false);

  // CRITICAL: Helper function to ensure isLoggedIn flag is always set (CreateBharat style)
  const ensureLoggedInFlag = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn && user) {
      localStorage.setItem('isLoggedIn', 'true');
      console.log('✅ isLoggedIn flag set (CreateBharat style)');
    }
  };

  const schedulePostAuthSetup = () => {
    const registerFCMAfterAuth = async () => {
      try {
        console.log('🔄 Starting FCM token registration after auth event...');

        if (document.readyState !== 'complete') {
          await new Promise(resolve => {
            if (document.readyState === 'complete') {
              resolve();
            } else {
              window.addEventListener('load', resolve, { once: true });
            }
          });
        }

        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          navigator.userAgent?.toLowerCase() || ''
        );
        const waitTime = isMobile ? 5000 : 3000;
        console.log(`⏳ Waiting ${waitTime}ms for page and service worker infrastructure (${isMobile ? 'mobile' : 'desktop'})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        const retries = isMobile ? 7 : 5;
        const token = await registerFCMToken(true, retries);

        if (token) {
          console.log('✅ FCM token registered successfully after auth event');
        } else {
          console.warn('⚠️ FCM token registration returned null, will retry later');
          const retryDelay = isMobile ? 15000 : 10000;
          setTimeout(async () => {
            console.log('🔄 Retrying FCM token registration...');
            await registerFCMToken(true, retries);
          }, retryDelay);
        }
      } catch (error) {
        console.error('❌ FCM registration failed after auth event:', error);
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          navigator.userAgent?.toLowerCase() || ''
        );
        const retryDelay = isMobile ? 20000 : 15000;
        const retries = isMobile ? 7 : 5;
        setTimeout(async () => {
          console.log('🔄 Retrying FCM token registration after error...');
          try {
            await registerFCMToken(true, retries);
          } catch (retryError) {
            console.error('❌ FCM registration retry also failed:', retryError);
          }
        }, retryDelay);
      }
    };

    setTimeout(registerFCMAfterAuth, 500);
  };

  // Helper function to retrieve refresh token from mobile app storage
  const getRefreshTokenFromMobileApp = async () => {
    try {
      const storedSession = await requestStoredAuthSession(5, 1500);
      return storedSession?.refreshToken || null;
    } catch (error) {
      console.error('Failed to retrieve refresh token from mobile app:', error);
      return null;
    }
  };

  // Check for existing user session on mount
  // Following CreateBharat approach: Load from localStorage first, validate in background
  // But also check mobile app storage as primary source if localStorage is empty
  useEffect(() => {
    const checkAuth = async () => {
      // CRITICAL: FIRST - Check isLoggedIn flag and user data IMMEDIATELY
      // This ensures user stays logged in even if tokens are missing
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      let storedUser = localStorage.getItem('user');
      
      // If isLoggedIn flag is true and we have user data, set user IMMEDIATELY
      // This is CreateBharat style - immediate load, no waiting
      if (isLoggedIn && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('✅ User IMMEDIATELY loaded from localStorage (CreateBharat style - app start)');
          
          // Disable back button if user is already authenticated
          if (!backButtonDisabled) {
            console.log('🚫 Disabling back button for already authenticated user...');
            const cleanup = disableBackButton();
            setBackButtonDisabled(true);
            window._backButtonCleanup = cleanup;
          }
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
        }
      }
      
      // Now check for tokens and mobile app storage
      let token = localStorage.getItem('token');
      let refreshToken = localStorage.getItem('refreshToken');

      // If localStorage is empty or missing tokens, try mobile app storage FIRST
      // CRITICAL: This handles force close scenario where localStorage might be cleared
      if (!token || !refreshToken || !storedUser) {
        console.log('🔄 localStorage incomplete, checking mobile app storage...');
        console.log('📱 This might be after force close - attempting aggressive restore...');
        
        // Try multiple times with increasing delays to ensure mobile app bridge is ready
        let storedSession = null;
        const restoreAttempts = [
          { delay: 500, retries: 5 },
          { delay: 1000, retries: 7 },
          { delay: 2000, retries: 10 }
        ];
        
        for (const attempt of restoreAttempts) {
          try {
            console.log(`🔄 Attempting restore with ${attempt.delay}ms delay, ${attempt.retries} retries...`);
            storedSession = await requestStoredAuthSession(attempt.retries, attempt.delay);
            if (storedSession && (storedSession.token || storedSession.refreshToken || storedSession.user)) {
              console.log('✅ Session found in mobile app storage!');
              break;
            }
          } catch (bridgeError) {
            console.warn(`⚠️ Restore attempt failed, will retry with longer delay...`, bridgeError);
          }
          
          // Wait before next attempt
          if (attempt !== restoreAttempts[restoreAttempts.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, attempt.delay));
          }
        }
        
        if (storedSession) {
          // Mobile app storage has session - use it as primary source
          if (storedSession.token) {
            token = storedSession.token;
            localStorage.setItem('token', token);
            apiService.setToken(token);
            console.log('✅ Token restored from mobile app storage');
          }
          if (storedSession.refreshToken) {
            refreshToken = storedSession.refreshToken;
            localStorage.setItem('refreshToken', refreshToken);
            apiService.setRefreshToken(refreshToken);
            console.log('✅ Refresh token restored from mobile app storage');
          }
          if (storedSession.user) {
            storedUser = JSON.stringify(storedSession.user);
            localStorage.setItem('user', storedUser);
            localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            setIsAuthenticated(true);
              console.log('✅ User session restored from mobile app storage');
            } catch (parseError) {
              console.error('Failed to parse user data from mobile app:', parseError);
            }
          }
        } else {
          console.warn('⚠️ No session found in mobile app storage after all attempts');
        }
      }

      // CRITICAL: CreateBharat style - Ensure user is set if isLoggedIn flag is true
      // Double-check: If we have user data but user is not set in state, set it
      const currentIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const currentStoredUser = localStorage.getItem('user');
      
      if (currentIsLoggedIn && currentStoredUser && !user) {
        try {
          const parsedUser = JSON.parse(currentStoredUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
          console.log('✅ User restored from localStorage (double-check after mobile app restore)');
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
        }
      } else if (currentStoredUser && !currentIsLoggedIn) {
        // User data exists but isLoggedIn flag is missing - restore it
        console.log('⚠️ User data exists but isLoggedIn flag missing - restoring...');
        localStorage.setItem('isLoggedIn', 'true');
        try {
          const parsedUser = JSON.parse(currentStoredUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('✅ User session restored with isLoggedIn flag');
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
        }
      }

      // Set tokens in API service (if not already set)
      if (token && !apiService.token) {
        apiService.setToken(token);
      }
      if (refreshToken && !apiService.refreshTokenValue) {
          apiService.setRefreshToken(refreshToken);
        }

      // CRITICAL: Before setting loading to false, ensure user is authenticated if isLoggedIn flag is true
      // This prevents showing login screen when user should be logged in
      const finalIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const finalStoredUser = localStorage.getItem('user');
      
      if (finalIsLoggedIn && finalStoredUser && !isAuthenticated) {
        try {
          const parsedUser = JSON.parse(finalStoredUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('✅ User authenticated before setting loading to false (CreateBharat style)');
        } catch (parseError) {
          console.error('Failed to parse user before setting loading:', parseError);
        }
      }
      
      // Set loading to false immediately (like CreateBharat - don't wait for validation)
      // This ensures user sees the app immediately, not a loading screen
      setLoading(false);
      
      // CRITICAL: Ensure session is saved to mobile app storage immediately
      // This prevents logout when webview is closed/reopened
      // Try multiple times with delays to ensure mobile app bridge is ready
      if (token && refreshToken && storedUser) {
        const syncSession = () => {
          try {
            const parsedUser = JSON.parse(storedUser);
            sendAuthSessionToMobileApp(token, refreshToken, parsedUser);
            console.log('💾 Session synced to mobile app storage');
          } catch (e) {
            console.error('Failed to sync session to mobile app:', e);
          }
        };
        
        // Try immediately
        syncSession();
        
        // Try multiple times with increasing delays to ensure bridge is ready
        setTimeout(syncSession, 500);
        setTimeout(syncSession, 1000);
        setTimeout(syncSession, 2000);
        setTimeout(syncSession, 3000);
        setTimeout(syncSession, 5000);
        console.log('💾 Multiple session sync attempts scheduled on mount');
      }

      // If we have token, validate it in background (don't block UI)
      if (token) {
        // Validate token in background - don't block if it fails
        apiService.getMe().then((response) => {
          const authenticatedUser = response.data.user;
          setUser(authenticatedUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(authenticatedUser));
          localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag

          // Disable back button if not already disabled
          if (!backButtonDisabled) {
            console.log('🚫 Disabling back button after token validation...');
            const cleanup = disableBackButton();
            setBackButtonDisabled(true);
            window._backButtonCleanup = cleanup;
          }

          const refreshTokenToSync = refreshToken || localStorage.getItem('refreshToken');
          // CRITICAL: Save session to mobile app storage after validation
          sendAuthSessionToMobileApp(token, refreshTokenToSync, authenticatedUser);
          // Retry to ensure it's saved
          setTimeout(() => {
            sendAuthSessionToMobileApp(token, refreshTokenToSync, authenticatedUser);
          }, 500);
          schedulePostAuthSetup();
        }).catch(async (error) => {
          // Token validation failed - try to refresh in background
          // Don't logout immediately, try to refresh first
          console.log('⚠️ Token validation failed, attempting refresh in background...');
          const message = (error?.message || '').toLowerCase();
          const isAuthError =
            error?.status === 401 ||
            error?.code === 'AUTH_EXPIRED' ||
            message.includes('session expired') ||
            message.includes('not authorized') ||
            message.includes('unauthorized');

          if (isAuthError) {
            // Try to get refresh token from localStorage first
            let refreshTokenValue = refreshToken || localStorage.getItem('refreshToken');
            
            // If refresh token is missing, try to get from mobile app storage
            if (!refreshTokenValue) {
              console.log('🔄 Refresh token missing from localStorage, trying mobile app storage...');
              refreshTokenValue = await getRefreshTokenFromMobileApp();
              if (refreshTokenValue) {
                localStorage.setItem('refreshToken', refreshTokenValue);
                apiService.setRefreshToken(refreshTokenValue);
              }
            }

            if (refreshTokenValue) {
              try {
                const refreshResponse = await apiService.refreshAuthToken(refreshTokenValue);
                if (refreshResponse?.success) {
                  const newToken = refreshResponse.data.token;
                  const newRefreshToken = refreshResponse.data.refreshToken || refreshTokenValue;
                  const refreshedUser =
                    refreshResponse.data.user ||
                    (() => {
                      try {
                        return JSON.parse(localStorage.getItem('user'));
                      } catch {
                        return null;
                      }
                    })() ||
                    user;

                  if (newToken) {
                    apiService.setToken(newToken);
                    localStorage.setItem('token', newToken);
                    token = newToken;
                  }

                  if (newRefreshToken) {
                    apiService.setRefreshToken(newRefreshToken);
                    localStorage.setItem('refreshToken', newRefreshToken);
                    refreshToken = newRefreshToken;
                  }

                  if (refreshedUser) {
                    setUser(refreshedUser);
                    localStorage.setItem('user', JSON.stringify(refreshedUser));
                    localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                  }

                  setIsAuthenticated(true);
                  // CRITICAL: Save refreshed session to mobile app storage
                  sendAuthSessionToMobileApp(token, refreshToken, refreshedUser);
                  // Retry to ensure it's saved
                  setTimeout(() => {
                    sendAuthSessionToMobileApp(token, refreshToken, refreshedUser);
                  }, 500);
                  schedulePostAuthSetup();
                  return;
                }
              } catch (refreshError) {
                console.error('Failed to refresh auth token:', refreshError);
                // If refresh failed, try one more time with mobile app storage
                const mobileRefreshToken = await getRefreshTokenFromMobileApp();
                if (mobileRefreshToken && mobileRefreshToken !== refreshTokenValue) {
                  try {
                    const retryRefreshResponse = await apiService.refreshAuthToken(mobileRefreshToken);
                    if (retryRefreshResponse?.success) {
                      const newToken = retryRefreshResponse.data.token;
                      const newRefreshToken = retryRefreshResponse.data.refreshToken || mobileRefreshToken;
                      const refreshedUser = retryRefreshResponse.data.user || user;

                      if (newToken) {
                        apiService.setToken(newToken);
                        localStorage.setItem('token', newToken);
                      }
                      if (newRefreshToken) {
                        apiService.setRefreshToken(newRefreshToken);
                        localStorage.setItem('refreshToken', newRefreshToken);
                      }
                      if (refreshedUser) {
                        setUser(refreshedUser);
                        localStorage.setItem('user', JSON.stringify(refreshedUser));
                        localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                      }

                      setIsAuthenticated(true);
                      sendAuthSessionToMobileApp(newToken, newRefreshToken, refreshedUser);
                      schedulePostAuthSetup();
                      return;
                    }
                  } catch (retryError) {
                    console.error('Retry refresh also failed:', retryError);
                  }
                }
              }
            }

            // Only logout if we've exhausted all refresh token options
            // But don't clear localStorage immediately - let user stay logged in
            // Only clear if refresh really fails after multiple attempts
            console.warn('⚠️ All refresh attempts failed, but preserving session from localStorage');
            // Don't logout - keep user logged in based on localStorage
            // The API will handle 401 errors and refresh tokens automatically
          } else {
            console.warn('Preserving existing session due to non-auth error during validation.');
          }
        });
      } else {
        // No token found in localStorage, try to get from mobile app storage
        console.log('🔄 No token in localStorage, checking mobile app storage...');
        try {
          const storedSession = await requestStoredAuthSession(5, 1500);
          
          if (storedSession?.token) {
            // We have token from mobile app
            token = storedSession.token;
            localStorage.setItem('token', token);
            apiService.setToken(token);
            
            if (storedSession?.refreshToken) {
              refreshToken = storedSession.refreshToken;
              localStorage.setItem('refreshToken', refreshToken);
              apiService.setRefreshToken(refreshToken);
            }
            
            if (storedSession?.user) {
              localStorage.setItem('user', JSON.stringify(storedSession.user));
              localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
              setUser(storedSession.user);
              setIsAuthenticated(true);
            }
            
            // Verify the token
            try {
              const response = await apiService.getMe();
              const authenticatedUser = response.data.user;
              setUser(authenticatedUser);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(authenticatedUser));
              localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
              sendAuthSessionToMobileApp(token, refreshToken, authenticatedUser);
              schedulePostAuthSetup();
      setLoading(false);
              return;
            } catch (error) {
              // Token might be expired, try to refresh
              if (error?.status === 401 || error?.code === 'AUTH_EXPIRED') {
                let refreshTokenValue = refreshToken || storedSession?.refreshToken;
                if (!refreshTokenValue) {
                  refreshTokenValue = await getRefreshTokenFromMobileApp();
                }
                if (refreshTokenValue) {
                  try {
                    const refreshResponse = await apiService.refreshAuthToken(refreshTokenValue);
                    if (refreshResponse?.success) {
                      const newToken = refreshResponse.data.token;
                      const newRefreshToken = refreshResponse.data.refreshToken || refreshTokenValue;
                      const refreshedUser = refreshResponse.data.user;

                      if (newToken) {
                        apiService.setToken(newToken);
                        localStorage.setItem('token', newToken);
                      }
                      if (newRefreshToken) {
                        apiService.setRefreshToken(newRefreshToken);
                        localStorage.setItem('refreshToken', newRefreshToken);
                      }
                      if (refreshedUser) {
                        setUser(refreshedUser);
                        localStorage.setItem('user', JSON.stringify(refreshedUser));
                        setIsAuthenticated(true);
                      }

                      sendAuthSessionToMobileApp(newToken, newRefreshToken, refreshedUser);
                      schedulePostAuthSetup();
                      return;
                    }
                  } catch (refreshError) {
                    console.error('Failed to refresh auth token on mount:', refreshError);
                  }
                }
              }
            }
          } else if (storedSession?.refreshToken) {
            // We have refresh token but no access token
            refreshToken = storedSession.refreshToken;
            localStorage.setItem('refreshToken', refreshToken);
            apiService.setRefreshToken(refreshToken);
            
            try {
              const refreshResponse = await apiService.refreshAuthToken(refreshToken);
              if (refreshResponse?.success) {
                const newToken = refreshResponse.data.token;
                const newRefreshToken = refreshResponse.data.refreshToken || refreshToken;
                const refreshedUser = refreshResponse.data.user;

                if (newToken) {
                  apiService.setToken(newToken);
                  localStorage.setItem('token', newToken);
                }
                if (newRefreshToken) {
                  apiService.setRefreshToken(newRefreshToken);
                  localStorage.setItem('refreshToken', newRefreshToken);
                }
                if (refreshedUser) {
                  setUser(refreshedUser);
                  localStorage.setItem('user', JSON.stringify(refreshedUser));
                  setIsAuthenticated(true);
                }

                sendAuthSessionToMobileApp(newToken, newRefreshToken, refreshedUser);
                schedulePostAuthSetup();
                return;
              }
            } catch (refreshError) {
              console.error('Failed to refresh auth token on mount:', refreshError);
            }
          }
        } catch (bridgeError) {
          console.error('Failed to retrieve auth session from mobile app:', bridgeError);
        }

        // CRITICAL: CreateBharat style - NEVER automatically logout
        // User should only logout via explicit logout button
        // Even if we don't have tokens, keep user logged in if they have user data and isLoggedIn flag
        const hasStoredUser = localStorage.getItem('user');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (hasStoredUser && isLoggedIn) {
          try {
            const parsedUser = JSON.parse(hasStoredUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('✅ User kept logged in based on localStorage (CreateBharat style - isLoggedIn flag)');
          } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
            // Don't clear - keep user data for next time
          }
        } else if (hasStoredUser && !isLoggedIn) {
          // User data exists but isLoggedIn flag is missing - restore it
          console.log('⚠️ User data exists but isLoggedIn flag missing - restoring...');
          localStorage.setItem('isLoggedIn', 'true');
          try {
            const parsedUser = JSON.parse(hasStoredUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('✅ User session restored with isLoggedIn flag');
          } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
          }
        }
        // If no stored user, don't set anything - let user stay as they are
        // Only explicit logout should clear the session
      }
      // Loading already set to false above
    };

    checkAuth();
  }, []);

  // Handle page lifecycle events to persist session
  // This ensures session persists even when webview is closed/reopened
  useEffect(() => {
    // Save session to mobile app storage before page unloads
    // CRITICAL: Use synchronous storage if possible, or multiple attempts
    const handleBeforeUnload = () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const userData = localStorage.getItem('user');
      
      if (token && refreshToken && userData) {
        try {
          const user = JSON.parse(userData);
          
          // CRITICAL: Try to save multiple times immediately
          // beforeunload event has limited time, so we need to be fast
          sendAuthSessionToMobileApp(token, refreshToken, user);
          sendAuthSessionToMobileApp(token, refreshToken, user);
          sendAuthSessionToMobileApp(token, refreshToken, user);
          
          // Also try to use synchronous storage if available
          // Store in a way that persists even if async call fails
          if (window.flutter_inappwebview?.callHandler) {
            const payload = {
              token,
              user: user,
              refreshToken: refreshToken,
              timestamp: new Date().toISOString(),
            };
            
            // Try synchronous-like approach - fire and forget multiple times
            try {
              window.flutter_inappwebview.callHandler('saveAuthSession', payload);
              window.flutter_inappwebview.callHandler('saveAuthSession', payload);
              window.flutter_inappwebview.callHandler('saveAuthSession', payload);
            } catch (e) {
              console.error('Sync save attempt failed:', e);
            }
          }
          
          console.log('💾 Session saved to mobile app before page unload (multiple attempts)');
        } catch (e) {
          console.error('Failed to save session before unload:', e);
        }
      }
    };

    // Handle page visibility changes (when user comes back)
    const handlePageShow = (event) => {
      // Page is being shown (user came back from background)
      if (event.persisted) {
        // Page was loaded from cache
        console.log('🔄 Page loaded from cache, restoring session...');
        setTimeout(() => {
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          const userData = localStorage.getItem('user');
          
          if (userData) {
            try {
              const user = JSON.parse(userData);
              setUser(user);
              setIsAuthenticated(true);
              localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
              if (token) apiService.setToken(token);
              if (refreshToken) apiService.setRefreshToken(refreshToken);
              console.log('✅ Session restored from cache');
            } catch (e) {
              console.error('Failed to restore session from cache:', e);
            }
          }
        }, 100);
      }
    };

    // Handle page hide (when user goes to background or force close)
    const handlePageHide = (event) => {
      // Save session before page goes to background
      // CRITICAL: This is called when app is force closed
      console.log('📱 Page hiding - saving session aggressively...');
      handleBeforeUnload();
      
      // Also try to save multiple times in case first attempt fails
      if (isAuthenticated && user) {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (token && refreshToken) {
          // Try to save immediately
          sendAuthSessionToMobileApp(token, refreshToken, user);
          // Try again after short delay
          setTimeout(() => {
            sendAuthSessionToMobileApp(token, refreshToken, user);
          }, 100);
          setTimeout(() => {
            sendAuthSessionToMobileApp(token, refreshToken, user);
          }, 300);
          console.log('💾 Multiple session save attempts on page hide');
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    // Also save session periodically (every 5 seconds) to ensure it's always synced
    // CRITICAL: More frequent sync prevents data loss on force close
    const syncInterval = setInterval(() => {
      if (isAuthenticated && user) {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (token && refreshToken) {
          sendAuthSessionToMobileApp(token, refreshToken, user);
          // Try multiple times to ensure it's saved
          setTimeout(() => {
            sendAuthSessionToMobileApp(token, refreshToken, user);
          }, 100);
        }
      }
    }, 5000); // Every 5 seconds (very frequent for better persistence)
    
    // CRITICAL: Also save session on user interactions (scroll, click, etc.)
    // This ensures session is saved even if user force closes during interaction
    const saveSessionOnInteraction = () => {
      if (isAuthenticated && user) {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        if (token && refreshToken) {
          sendAuthSessionToMobileApp(token, refreshToken, user);
        }
      }
    };
    
    // Save session on scroll (throttled to avoid too many calls)
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(saveSessionOnInteraction, 2000); // Save 2 seconds after scroll stops
    };
    
    // Save session on click/touch
    const handleUserInteraction = () => {
      saveSessionOnInteraction();
    };
    
    // Add event listeners for user interactions
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      clearInterval(syncInterval);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [isAuthenticated, user]);

  // Periodically check and update FCM token (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndUpdateFCMToken = async () => {
      try {
        await registerFCMToken(false); // Don't force, only update if changed
      } catch (error) {
        console.error('Periodic FCM token check failed:', error);
      }
    };

    // Initial check after 30 seconds
    const initialTimeout = setTimeout(checkAndUpdateFCMToken, 30000);

    // Then check every 5 minutes
    const interval = setInterval(checkAndUpdateFCMToken, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Re-check auth when page becomes visible (user comes back from webview exit)
  // This runs ALWAYS, not just when authenticated, to restore session
  useEffect(() => {
    let visibilityTimeout;
    let focusTimeout;
    let isRestoring = false;

    const restoreSessionFromMobileApp = async () => {
      if (isRestoring) {
        console.log('⏳ Session restore already in progress, skipping...');
        return;
      }
      isRestoring = true;

      try {
        console.log('🔄 Attempting to restore session from mobile app...');
        
        // Check current state
        const currentToken = localStorage.getItem('token');
        const currentRefreshToken = localStorage.getItem('refreshToken');
        const currentUser = localStorage.getItem('user');
        
        // If we already have everything, skip
        if (currentToken && currentRefreshToken && currentUser && isAuthenticated) {
          console.log('✅ Session already restored, skipping...');
          isRestoring = false;
          return;
        }
        
        // CRITICAL: Try multiple times with increasing delays for force close scenario
        let storedSession = null;
        const restoreAttempts = [
          { delay: 500, retries: 5 },
          { delay: 1000, retries: 7 },
          { delay: 2000, retries: 10 }
        ];
        
        for (const attempt of restoreAttempts) {
          try {
            console.log(`🔄 Restore attempt: ${attempt.delay}ms delay, ${attempt.retries} retries...`);
            storedSession = await requestStoredAuthSession(attempt.retries, attempt.delay);
            if (storedSession && (storedSession.token || storedSession.refreshToken || storedSession.user)) {
              console.log('✅ Session found in mobile app storage!');
              break;
            }
          } catch (bridgeError) {
            console.warn(`⚠️ Restore attempt failed, will retry...`, bridgeError);
          }
          
          // Wait before next attempt
          if (attempt !== restoreAttempts[restoreAttempts.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, attempt.delay));
          }
        }
        
        if (storedSession) {
          let token = storedSession.token || currentToken;
          let refreshToken = storedSession.refreshToken || currentRefreshToken;
          let userData = storedSession.user || (currentUser ? JSON.parse(currentUser) : null);

          // If we got tokens from mobile app, use them and save to localStorage
          if (storedSession.token && storedSession.token !== currentToken) {
            token = storedSession.token;
            localStorage.setItem('token', token);
            apiService.setToken(token);
            console.log('✅ Token restored from mobile app');
          }
          if (storedSession.refreshToken && storedSession.refreshToken !== currentRefreshToken) {
            refreshToken = storedSession.refreshToken;
            localStorage.setItem('refreshToken', refreshToken);
            apiService.setRefreshToken(refreshToken);
            console.log('✅ Refresh token restored from mobile app');
          }
          if (storedSession.user) {
            userData = storedSession.user;
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
            setUser(userData);
            setIsAuthenticated(true);
            console.log('✅ User data restored from mobile app');
          } else if (currentUser && !user) {
            // We have user in localStorage but not in state
            try {
              const parsedUser = JSON.parse(currentUser);
              localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
              setUser(parsedUser);
              setIsAuthenticated(true);
              console.log('✅ User data restored from localStorage');
            } catch (e) {
              console.error('Failed to parse user from localStorage:', e);
            }
          }

          // If we have a token, verify it's still valid
            if (token) {
            try {
              const response = await apiService.getMe();
              const authenticatedUser = response.data.user;
              setUser(authenticatedUser);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(authenticatedUser));
              localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
              sendAuthSessionToMobileApp(token, refreshToken, authenticatedUser);
              console.log('✅ Session restored and verified successfully');
            } catch (error) {
              // Token might be expired, try to refresh
              // But keep user logged in if we have userData (CreateBharat style)
              if (userData && !user) {
                localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                setUser(userData);
                setIsAuthenticated(true);
                console.log('✅ User kept logged in based on stored data (token validation will happen in background)');
              }
              
              if (error?.status === 401 || error?.code === 'AUTH_EXPIRED') {
                let refreshTokenValue = refreshToken;
                if (!refreshTokenValue) {
                  refreshTokenValue = await getRefreshTokenFromMobileApp();
                }
                if (refreshTokenValue) {
                  try {
                    const refreshResponse = await apiService.refreshAuthToken(refreshTokenValue);
                    if (refreshResponse?.success) {
                      const newToken = refreshResponse.data.token;
                      const newRefreshToken = refreshResponse.data.refreshToken || refreshTokenValue;
                      const refreshedUser = refreshResponse.data.user || userData;

                      if (newToken) {
                        apiService.setToken(newToken);
                        localStorage.setItem('token', newToken);
                      }
                      if (newRefreshToken) {
                        apiService.setRefreshToken(newRefreshToken);
                        localStorage.setItem('refreshToken', newRefreshToken);
                      }
                      if (refreshedUser) {
                        setUser(refreshedUser);
                        localStorage.setItem('user', JSON.stringify(refreshedUser));
                        localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                        setIsAuthenticated(true);
                      }
                      sendAuthSessionToMobileApp(newToken, newRefreshToken, refreshedUser);
                      console.log('✅ Session refreshed successfully');
                    }
                  } catch (refreshError) {
                    console.error('Failed to refresh token:', refreshError);
                    // Even if refresh fails, keep user logged in if we have userData
                    if (userData && !user) {
                      localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                      setUser(userData);
                      setIsAuthenticated(true);
                    }
                  }
                } else {
                  // No refresh token, but keep user logged in if we have userData
                  if (userData && !user) {
                    localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                    setUser(userData);
                    setIsAuthenticated(true);
                  }
                }
              }
            }
          } else if (refreshToken) {
            // We have refresh token but no access token, try to refresh
            try {
              const refreshResponse = await apiService.refreshAuthToken(refreshToken);
              if (refreshResponse?.success) {
                const newToken = refreshResponse.data.token;
                const newRefreshToken = refreshResponse.data.refreshToken || refreshToken;
                const refreshedUser = refreshResponse.data.user;

                if (newToken) {
                  apiService.setToken(newToken);
                  localStorage.setItem('token', newToken);
                }
                if (newRefreshToken) {
                  apiService.setRefreshToken(newRefreshToken);
                  localStorage.setItem('refreshToken', newRefreshToken);
                }
                if (refreshedUser) {
                  setUser(refreshedUser);
                  localStorage.setItem('user', JSON.stringify(refreshedUser));
                  localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                  setIsAuthenticated(true);
                }
                sendAuthSessionToMobileApp(newToken, newRefreshToken, refreshedUser);
                console.log('✅ Session restored using refresh token');
              }
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
              // Even if refresh fails, try to restore user from localStorage
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                try {
                  const parsedUser = JSON.parse(storedUser);
                  localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                  setUser(parsedUser);
                  setIsAuthenticated(true);
                  console.log('✅ User restored from localStorage after refresh failure');
                } catch (e) {
                  console.error('Failed to parse user from localStorage:', e);
                }
              }
            }
          } else {
            // No token or refresh token, but check if we have user data
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                setUser(parsedUser);
                setIsAuthenticated(true);
                console.log('✅ User restored from localStorage (no tokens available)');
              } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
              }
            }
          }
        } else {
          // No stored session in mobile app, check localStorage
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          const storedUser = localStorage.getItem('user');
          
          // If we have user data in localStorage, set it immediately (CreateBharat style)
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
              console.log('✅ User restored from localStorage');
            } catch (e) {
              console.error('Failed to parse user from localStorage:', e);
            }
          }
          
          if (token) {
            // We have token in localStorage, verify it in background
            apiService.getMe().then((response) => {
              const authenticatedUser = response.data.user;
              setUser(authenticatedUser);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(authenticatedUser));
              sendAuthSessionToMobileApp(token, refreshToken, authenticatedUser);
            }).catch((error) => {
              if (error?.status === 401 || error?.code === 'AUTH_EXPIRED') {
                const refreshTokenValue = refreshToken || localStorage.getItem('refreshToken');
                if (refreshTokenValue) {
                  apiService.refreshAuthToken(refreshTokenValue).then((refreshResponse) => {
                    if (refreshResponse?.success) {
                      const newToken = refreshResponse.data.token;
                      const newRefreshToken = refreshResponse.data.refreshToken || refreshTokenValue;
                      const refreshedUser = refreshResponse.data.user;

                      if (newToken) {
                        apiService.setToken(newToken);
                        localStorage.setItem('token', newToken);
                      }
                      if (newRefreshToken) {
                        apiService.setRefreshToken(newRefreshToken);
                        localStorage.setItem('refreshToken', newRefreshToken);
                      }
                      if (refreshedUser) {
                        setUser(refreshedUser);
                        localStorage.setItem('user', JSON.stringify(refreshedUser));
                        localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                        setIsAuthenticated(true);
                      }
                      sendAuthSessionToMobileApp(newToken, newRefreshToken, refreshedUser);
                    }
                  }).catch((refreshError) => {
                    console.error('Failed to refresh token:', refreshError);
                    // Keep user logged in if we have stored user
                    if (storedUser && !user) {
                      try {
                        const parsedUser = JSON.parse(storedUser);
                        localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                        setUser(parsedUser);
                        setIsAuthenticated(true);
                      } catch (e) {
                        console.error('Failed to parse user:', e);
                      }
                    }
                  });
                } else {
                  // No refresh token, but keep user logged in if we have stored user
                  if (storedUser && !user) {
                    try {
                      const parsedUser = JSON.parse(storedUser);
                      localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
                      setUser(parsedUser);
                      setIsAuthenticated(true);
                    } catch (e) {
                      console.error('Failed to parse user:', e);
                    }
                  }
                }
              }
            });
          } else if (storedUser) {
            // No token but we have user data - keep logged in (CreateBharat style)
            try {
              const parsedUser = JSON.parse(storedUser);
              localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
              setUser(parsedUser);
              setIsAuthenticated(true);
              console.log('✅ User kept logged in based on localStorage (no token available)');
            } catch (e) {
              console.error('Failed to parse user:', e);
            }
          }
            }
          } catch (error) {
        console.error('❌ Error restoring session:', error);
      } finally {
        isRestoring = false;
      }
    };

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Clear any pending timeout
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        
        // Page became visible, restore session
        console.log('🔄 Page became visible, will restore session...');
        
        // Wait a bit for page to fully become visible and mobile app bridge to be ready
        // Increased delay to ensure mobile app bridge is fully initialized
        visibilityTimeout = setTimeout(() => {
          restoreSessionFromMobileApp();
        }, 2000);
      }
    };

    const handleFocus = async () => {
      // Clear any pending timeout
      if (focusTimeout) clearTimeout(focusTimeout);
      
      // Window focused, restore session
      console.log('🔄 Window focused, will restore session...');
      
      // Increased delay to ensure mobile app bridge is fully initialized
      focusTimeout = setTimeout(() => {
        restoreSessionFromMobileApp();
      }, 2000);
    };

    // Also restore on mount if page is already visible
    // Give more time for mobile app bridge to initialize
    // This is critical for when webview is reopened
    if (!document.hidden) {
      // Multiple attempts to ensure we catch the session
      setTimeout(() => {
        restoreSessionFromMobileApp();
      }, 1000);
      setTimeout(() => {
        restoreSessionFromMobileApp();
      }, 3000);
      setTimeout(() => {
        restoreSessionFromMobileApp();
      }, 5000);
    }

    // Also listen for page load event (in case webview reloads)
    const handlePageLoad = () => {
      console.log('🔄 Page loaded, will restore session...');
      setTimeout(() => {
        restoreSessionFromMobileApp();
      }, 2000);
    };

    // Listen for page load
    if (document.readyState === 'complete') {
      // Page already loaded
      setTimeout(() => {
        restoreSessionFromMobileApp();
      }, 2000);
    } else {
      window.addEventListener('load', handlePageLoad);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      if (focusTimeout) clearTimeout(focusTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('load', handlePageLoad);
    };
  }, []); // No dependencies - always run

  const login = async (userData, token, refreshTokenValue) => {
    console.log('🔐 LOGIN FUNCTION CALLED:', {
      hasUserData: !!userData,
      hasToken: !!token,
      hasRefreshToken: !!refreshTokenValue,
      tokenLength: token?.length || 0,
      refreshTokenLength: refreshTokenValue?.length || 0,
      userPhone: userData?.phone || userData?.formattedPhone
    });
    
    setUser(userData);
    setIsAuthenticated(true);
    
    // CRITICAL: CreateBharat style - Set isLoggedIn flag immediately
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
    
    if (token) {
      console.log('💾 Storing token in localStorage and apiService...');
      apiService.setToken(token); // This already sets localStorage
      // Verify token is stored
      const storedToken = localStorage.getItem('token');
      console.log('✅ Token storage verification:', {
        stored: !!storedToken,
        matches: storedToken === token,
        length: storedToken?.length || 0
      });
    } else {
      console.error('❌ ERROR: No token provided to login function!');
    }
    
    if (refreshTokenValue) {
      console.log('💾 Storing refreshToken in localStorage and apiService...');
      apiService.setRefreshToken(refreshTokenValue);
      // Verify refreshToken is stored
      const storedRefreshToken = localStorage.getItem('refreshToken');
      console.log('✅ RefreshToken storage verification:', {
        stored: !!storedRefreshToken,
        matches: storedRefreshToken === refreshTokenValue,
        length: storedRefreshToken?.length || 0
      });
    } else {
      console.error('❌ ERROR: No refreshToken provided to login function!');
    }

    const syncedToken = token || localStorage.getItem('token');
    const syncedRefreshToken = refreshTokenValue || localStorage.getItem('refreshToken');
    
    // CRITICAL: Disable back button after successful login
    if (!backButtonDisabled) {
      console.log('🚫 Disabling back button after login...');
      const cleanup = disableBackButton();
      setBackButtonDisabled(true);
      // Store cleanup function for logout
      window._backButtonCleanup = cleanup;
    }
    
    // CRITICAL: Save session to mobile app storage immediately after login
    // This ensures session persists even when webview is closed/reopened
    if (syncedToken) {
      // Try multiple times to ensure it's saved
      sendAuthSessionToMobileApp(syncedToken, syncedRefreshToken, userData);
      // Retry after a short delay to ensure mobile app bridge is ready
      setTimeout(() => {
        sendAuthSessionToMobileApp(syncedToken, syncedRefreshToken, userData);
      }, 500);
      setTimeout(() => {
        sendAuthSessionToMobileApp(syncedToken, syncedRefreshToken, userData);
      }, 2000);
      console.log('💾 Session saved to mobile app storage after login');
    }
    
    // Send login event to mobile app if running in Flutter WebView
    // This allows the mobile app to save FCM token with phone number
    try {
      const phone = userData?.phone || userData?.formattedPhone || '';
      if (phone) {
        console.log('📱 Sending login event to mobile app...');
        sendLoginEventToMobileApp(phone, userData, token);
      }
    } catch (error) {
      console.error('❌ Error sending login event to mobile app:', error);
      // Don't block login if this fails
    }
    
    schedulePostAuthSetup();
  };

  const signup = async (userData, token, refreshTokenValue) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // CRITICAL: CreateBharat style - Set isLoggedIn flag immediately
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
    
    if (token) {
      apiService.setToken(token); // This already sets localStorage
    }
    if (refreshTokenValue) {
      apiService.setRefreshToken(refreshTokenValue);
    }

    const syncedToken = token || localStorage.getItem('token');
    const syncedRefreshToken = refreshTokenValue || localStorage.getItem('refreshToken');
    
    // CRITICAL: Disable back button after successful signup
    if (!backButtonDisabled) {
      console.log('🚫 Disabling back button after signup...');
      const cleanup = disableBackButton();
      setBackButtonDisabled(true);
      // Store cleanup function for logout
      window._backButtonCleanup = cleanup;
    }
    
    // CRITICAL: Save session to mobile app storage immediately after signup
    // This ensures session persists even when webview is closed/reopened
    if (syncedToken) {
      // Try multiple times to ensure it's saved
      sendAuthSessionToMobileApp(syncedToken, syncedRefreshToken, userData);
      // Retry after a short delay to ensure mobile app bridge is ready
      setTimeout(() => {
        sendAuthSessionToMobileApp(syncedToken, syncedRefreshToken, userData);
      }, 500);
      setTimeout(() => {
        sendAuthSessionToMobileApp(syncedToken, syncedRefreshToken, userData);
      }, 2000);
      console.log('💾 Session saved to mobile app storage after signup');
    }

    schedulePostAuthSetup();
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Re-enable back button on logout
      if (backButtonDisabled && window._backButtonCleanup) {
        console.log('✅ Re-enabling back button on logout...');
        window._backButtonCleanup();
        setBackButtonDisabled(false);
        window._backButtonCleanup = null;
      }
      
      // CRITICAL: CreateBharat style - Clear isLoggedIn flag on logout
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn'); // CreateBharat style flag
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      apiService.setToken(null);
      apiService.setRefreshToken(null);
      sendLogoutEventToMobileApp();
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Ensure isLoggedIn flag is set when user is updated
    if (updatedUser) {
      localStorage.setItem('isLoggedIn', 'true'); // CreateBharat style flag
    }
  };
  
  // CRITICAL: CreateBharat style - Check authentication based on isLoggedIn flag
  // This ensures user stays logged in even if token validation fails
  // This runs continuously to ensure user never gets logged out automatically
  // This is ESPECIALLY important on app start and back button press to prevent login screen
  useEffect(() => {
    const checkAndRestore = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const storedUser = localStorage.getItem('user');
      
      // If isLoggedIn flag is true and we have user data, ensure user is authenticated
      // This is CRITICAL - it prevents logout on app start, exit, and back button press
      if (isLoggedIn && storedUser) {
        if (!isAuthenticated || !user) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('✅ User authenticated based on isLoggedIn flag (CreateBharat style - continuous check)');
          } catch (e) {
            console.error('Failed to parse user:', e);
          }
        }
      }
      
      // If isLoggedIn flag is false but we have user, DON'T clear it
      // Restore isLoggedIn flag if user data exists - this is CreateBharat style
      if (!isLoggedIn && storedUser) {
        // Restore isLoggedIn flag if user data exists
        console.log('⚠️ User data exists but isLoggedIn flag is false - restoring flag...');
        localStorage.setItem('isLoggedIn', 'true');
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('✅ User session restored with isLoggedIn flag (continuous check)');
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      }
    };
    
    // Check immediately
    checkAndRestore();
    
    // Also check after a short delay to catch any race conditions
    const timeoutId = setTimeout(checkAndRestore, 100);
    
    // CRITICAL: Also listen for popstate events (back button press)
    // This ensures user stays logged in even when back button is pressed
    const handlePopState = (event) => {
      console.log('🔄 popstate event detected in AuthContext - checking session...');
      checkAndRestore();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, user]);

  // API methods for authentication
  const sendOTP = async (phone, context = 'login') => {
    try {
      const response = await apiService.sendOTP(phone, context);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (phone, otp, name, email) => {
    try {
      const response = await apiService.verifyOTP(phone, otp, name, email);
      if (response.success) {
        await login(response.data.user, response.data.token, response.data.refreshToken);
        // Also send login event with phone number (in case user object doesn't have it)
        if (phone) {
          sendLoginEventToMobileApp(phone, response.data.user, response.data.token);
        }
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const loginWithOTP = async (phone, otp) => {
    try {
      console.log('🔐 LOGIN REQUEST:', { phone, otpLength: otp?.length });
      const response = await apiService.login(phone, otp);
      
      // CRITICAL: Print backend response to verify tokens
      console.log('✅ BACKEND LOGIN RESPONSE:', {
        success: response.success,
        hasToken: !!response.data?.token,
        hasRefreshToken: !!response.data?.refreshToken,
        hasUser: !!response.data?.user,
        tokenLength: response.data?.token?.length || 0,
        refreshTokenLength: response.data?.refreshToken?.length || 0,
        refreshTokenExpiresAt: response.data?.refreshTokenExpiresAt,
        fullResponse: response
      });
      
      if (response.success) {
        // CRITICAL: Verify tokens before storing
        if (!response.data?.token) {
          console.error('❌ ERROR: Backend response missing token!', response);
          throw new Error('Login response missing token');
        }
        if (!response.data?.refreshToken) {
          console.error('❌ ERROR: Backend response missing refreshToken!', response);
          throw new Error('Login response missing refreshToken');
        }
        
        console.log('💾 STORING TOKENS:', {
          token: response.data.token.substring(0, 20) + '...',
          refreshToken: response.data.refreshToken.substring(0, 20) + '...',
          user: response.data.user?.name || response.data.user?.phone
        });
        
        await login(response.data.user, response.data.token, response.data.refreshToken);
        
        // Verify tokens are stored
        const storedToken = localStorage.getItem('token');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        console.log('✅ TOKENS STORED VERIFICATION:', {
          tokenStored: !!storedToken,
          refreshTokenStored: !!storedRefreshToken,
          tokenMatch: storedToken === response.data.token,
          refreshTokenMatch: storedRefreshToken === response.data.refreshToken,
          tokenLength: storedToken?.length || 0,
          refreshTokenLength: storedRefreshToken?.length || 0
        });
        
        // Also send login event with phone number (in case user object doesn't have it)
        if (phone) {
          sendLoginEventToMobileApp(phone, response.data.user, response.data.token);
        }
      }
      return response;
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    updateUser,
    sendOTP,
    verifyOTP,
    register,
    loginWithOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

