// Push Notification Service Worker Registration and FCM Token Management
import { messaging, getToken, onMessage } from '../firebase';
import api from './api';

// VAPID Key for web push notifications
const VAPID_KEY = 'BAXnzclIUpol3ExXQV8JokW7plpWqSJhLIFrXlnNHueIylJFuC3TQ17wWRIspB4IOmi-NffJuWq2mz9C6sC1YlQ';

const RESOLVED_API_BASE =
	import.meta.env.VITE_API_URL ||
	(import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://api.rentyatra.com/api');

// Detect if running on mobile device
const isMobileDevice = () => {
	if (typeof window === 'undefined') return false;
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

// Detect if running in WebView/APK
const isWebView = () => {
	if (typeof window === 'undefined') return false;
	const userAgent = navigator.userAgent || '';
	return userAgent.includes('wv') || userAgent.includes('WebView');
};

// Register Service Worker for Push Notifications
export const registerServiceWorker = async (retries = 3) => {
	if (!('serviceWorker' in navigator)) {
		console.warn('Service workers not supported');
		return null;
	}

	const isMobile = isMobileDevice();

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			// Check if service worker is already registered
			let registration = await navigator.serviceWorker.getRegistration();

			if (!registration) {
				console.log(`📦 Registering service worker (attempt ${attempt}/${retries})...`);
				registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
				console.log('✅ Service worker registered:', registration.scope);

				// Wait for service worker to be ready
				// Mobile devices need longer wait
				try {
					await navigator.serviceWorker.ready;
					console.log('✅ Service worker ready');
					// Additional wait for mobile
					if (isMobile) {
						await new Promise(resolve => setTimeout(resolve, 2000));
					}
				} catch (readyError) {
					console.warn('⚠️ Service worker ready check failed, waiting...');
					await new Promise(resolve => setTimeout(resolve, isMobile ? 3000 : 2000));
				}
			} else {
				console.log('✅ Service worker already registered:', registration.scope);
				// Ensure it's ready
				try {
					await navigator.serviceWorker.ready;
					if (isMobile) {
						await new Promise(resolve => setTimeout(resolve, 1000));
					}
				} catch (readyError) {
					console.warn('⚠️ Service worker ready check failed, continuing...');
				}
			}

			return registration;
		} catch (err) {
			console.error(`❌ Service worker registration failed (attempt ${attempt}/${retries}):`, err);
			if (attempt < retries) {
				const waitTime = isMobile ? (3000 * attempt) : (2000 * attempt);
				console.log(`⏳ Waiting ${waitTime}ms before retry (${isMobile ? 'mobile' : 'desktop'})...`);
				await new Promise(resolve => setTimeout(resolve, waitTime));
			} else {
				console.error('❌ All service worker registration attempts failed');
				return null;
			}
		}
	}
	return null;
};

// Request notification permission
export const requestNotificationPermission = async (skipInAPK = true) => {
	if (typeof window === 'undefined' || typeof Notification === 'undefined') {
		return false;
	}

	// Check if in APK/WebView context
	const isInWebView = isWebView();
	const isAPKContext = isInWebView || window.cordova !== undefined || window.Capacitor !== undefined;

	if (isAPKContext) {
		console.log('📱 APK context detected - checking notification permission status');
		// In APK context, we might still want to register FCM tokens for background notifications
		// Check current permission status but don't request if skipInAPK is true
		if (Notification.permission === 'granted') {
			console.log('✅ Notification permission already granted in APK context');
			return true;
		} else if (Notification.permission === 'denied') {
			console.warn('⚠️ Notification permission denied in APK context');
			// Still allow FCM registration for background notifications even if denied
			// Native apps can handle notifications differently
			if (skipInAPK) {
				console.log('📱 APK context - allowing FCM registration without permission (for background notifications)');
				return true; // Allow registration even without permission in APK
			}
			return false;
		} else {
			// Permission is 'default' (not yet requested)
			if (skipInAPK) {
				console.log('📱 APK context - skipping permission request but allowing FCM registration');
				// Return true to allow FCM registration even without explicit permission
				// Native apps handle notifications via native FCM, not browser notifications
				return true;
			}
		}
	}

	if (Notification.permission === 'granted') {
		return true;
	}

	if (Notification.permission === 'denied') {
		console.warn('Notification permission denied');
		return false;
	}

	// Request permission for non-APK contexts
	const permission = await Notification.requestPermission();
	return permission === 'granted';
};

// Register FCM Token and save to backend
export const registerFCMToken = async (forceUpdate = false, retries = 5) => {
	const isMobile = isMobileDevice();
	const isInWebView = isWebView();

	console.log('🔄 Starting FCM token registration...', {
		forceUpdate,
		retries,
		isMobile,
		isInWebView,
		userAgent: navigator.userAgent?.substring(0, 50)
	});

	// Check if browser supports notifications
	if (typeof window === 'undefined' || typeof Notification === 'undefined') {
		console.warn('⚠️ Notifications not supported in this environment');
		return null;
	}

	// Check HTTPS (required for service workers and push notifications)
	if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
		console.warn('⚠️ HTTPS required for push notifications. Current protocol:', location.protocol);
		console.warn('⚠️ Service workers and push notifications require HTTPS in production');
		// Continue anyway but log warning
	}

	// Request permission first
	const hasPermission = await requestNotificationPermission();
	if (!hasPermission) {
		console.warn('⚠️ Notification permission not granted');
		// On mobile, permission might need user interaction - don't fail immediately
		if (isMobile) {
			console.log('📱 Mobile device detected - permission might require user interaction');
		}
		return null;
	}

	// Step 1: Register service worker with retries
	let swRegistration = null;
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			// Check if service worker is already registered and ready
			const existingReg = await navigator.serviceWorker.getRegistration();
			if (existingReg) {
				console.log('✅ Found existing service worker registration');
				swRegistration = existingReg;
				// Wait for it to be ready
				await navigator.serviceWorker.ready;
				console.log('✅ Service worker is ready');
				break;
			} else {
				console.log(`📦 Registering service worker (attempt ${attempt}/${retries})...`);
				swRegistration = await registerServiceWorker(3);
				if (swRegistration) {
					break;
				}
			}
		} catch (error) {
			console.error(`❌ Service worker setup failed (attempt ${attempt}/${retries}):`, error);
			if (attempt < retries) {
				const waitTime = Math.min(2000 * attempt, 10000); // Max 10 seconds
				console.log(`⏳ Waiting ${waitTime}ms before retry...`);
				await new Promise(resolve => setTimeout(resolve, waitTime));
			}
		}
	}

	if (!swRegistration) {
		console.error('❌ Failed to get service worker registration after all retries');
		return null;
	}

	// Step 2: Wait for service worker to be fully ready
	try {
		console.log('⏳ Waiting for service worker to be ready...');
		swRegistration = await navigator.serviceWorker.ready;
		console.log('✅ Service worker confirmed ready');

		// Mobile devices need longer wait times
		const waitTime = isMobile ? 3000 : 1500;
		console.log(`⏳ Waiting ${waitTime}ms for messaging to initialize (${isMobile ? 'mobile' : 'desktop'})...`);
		await new Promise(resolve => setTimeout(resolve, waitTime));
	} catch (error) {
		console.error('❌ Error waiting for service worker:', error);
		return null;
	}

	// Step 3: Get FCM token with retries
	let token = null;
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			console.log(`🔑 Getting FCM token (attempt ${attempt}/${retries})...`);
			token = await getToken(messaging, {
				vapidKey: VAPID_KEY,
				serviceWorkerRegistration: swRegistration,
			});

			if (token) {
				console.log('✅ FCM token retrieved:', token.substring(0, 20) + '...');
				break;
			}
		} catch (error) {
			console.error(`❌ Failed to get FCM token (attempt ${attempt}/${retries}):`, error);
			console.error('Error details:', {
				code: error.code,
				message: error.message,
				stack: error.stack
			});

			// Special handling for common errors
			if (error.code === 'messaging/registration-token-not-retrieved') {
				console.log('⚠️ Token not retrieved, waiting longer...');
				// Mobile devices need longer wait times
				const waitTime = isMobile ? (4000 * attempt) : (3000 * attempt);
				await new Promise(resolve => setTimeout(resolve, waitTime));
			} else if (error.code === 'messaging/failed-service-worker-registration') {
				console.log('⚠️ Service worker registration issue, re-registering...');
				swRegistration = await registerServiceWorker(3);
				if (!swRegistration) {
					console.error('❌ Failed to re-register service worker');
					return null;
				}
				const waitTime = isMobile ? 3000 : 2000;
				await new Promise(resolve => setTimeout(resolve, waitTime));
			} else if (attempt < retries) {
				// Mobile devices need longer wait times between retries
				const baseWaitTime = isMobile ? 4000 : 3000;
				const waitTime = Math.min(baseWaitTime * attempt, isMobile ? 15000 : 10000);
				console.log(`⏳ Waiting ${waitTime}ms before retry (${isMobile ? 'mobile' : 'desktop'})...`);
				await new Promise(resolve => setTimeout(resolve, waitTime));
			}
		}
	}

	if (!token) {
		console.error('❌ Failed to get FCM token after all retries');
		return null;
	}

	// Step 4: Check if token has changed
	const lastSavedToken = localStorage.getItem('fcm_token');
	const lastSavedTime = localStorage.getItem('fcm_token_time');
	const now = Date.now();
	const timeSinceLastSave = lastSavedTime ? now - parseInt(lastSavedTime) : Infinity;

	console.log('📊 Token comparison:', {
		hasLastToken: !!lastSavedToken,
		tokensMatch: lastSavedToken === token,
		forceUpdate,
		timeSinceLastSave: `${Math.round(timeSinceLastSave / 1000)}s ago`,
		lastTokenPreview: lastSavedToken ? lastSavedToken.substring(0, 30) + '...' : 'none',
		currentTokenPreview: token ? token.substring(0, 30) + '...' : 'none'
	});

	// Update if forced, or if token changed, or if last update was more than 1 hour ago
	if (!forceUpdate && lastSavedToken === token && timeSinceLastSave < 3600000) {
		console.log('ℹ️ FCM token unchanged and recent, skipping backend update');
		console.log('ℹ️ To force update, call with forceUpdate: true');
		return token;
	}

	// If forceUpdate is true, always proceed to backend update
	if (forceUpdate) {
		console.log('🔄 Force update requested - will update backend even if token matches');
	}

	// Step 5: Save token to backend
	const authToken = localStorage.getItem('token');
	if (!authToken) {
		console.log('⚠️ User not authenticated, storing FCM token locally only');
		console.log('⚠️ Token will be saved to backend after login');
		localStorage.setItem('fcm_token', token);
		localStorage.setItem('fcm_token_time', now.toString());
		return token;
	}

	// Log device info for debugging
	console.log('📱 Device Information:', {
		isMobile,
		isInWebView,
		userAgent: navigator.userAgent,
		platform: navigator.platform,
		vendor: navigator.vendor
	});

	// Try to save to backend with retries
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			console.log(`💾 Saving FCM token to backend (attempt ${attempt}/3)...`);
			console.log(`📤 Sending token: ${token.substring(0, 30)}...`);
			console.log(`🌐 API URL: ${RESOLVED_API_BASE}/users/save-fcm-token`);
			console.log(`🔑 Auth token present: ${!!authToken}`);

			const response = await api.post('/users/save-fcm-token', { token });

			console.log('📥 Backend response:', response);

			// API service returns data directly (not wrapped in .data)
			// Backend returns: { success: true, message: ..., updated: ..., tokenCount: ..., devicesRegistered: ... }
			if (response && response.success) {
				console.log('✅ FCM token saved to backend successfully');
				console.log('✅ Backend confirmed token save:', {
					updated: response.updated,
					tokenCount: response.tokenCount,
					previousTokenCount: response.previousTokenCount,
					devicesRegistered: response.devicesRegistered,
					maxTokens: response.maxTokens,
					message: response.message
				});

				// Store token and timestamp in localStorage
				localStorage.setItem('fcm_token', token);
				localStorage.setItem('fcm_token_time', now.toString());

				// Log success message for multiple devices
				if (response.devicesRegistered && response.devicesRegistered > 1) {
					console.log(`🎉 Multiple devices registered! Total devices: ${response.devicesRegistered}`);
					console.log(`📱 This device token added to existing ${response.devicesRegistered - 1} device(s)`);
				} else if (response.updated) {
					console.log('✅ New device token successfully added');
				}

				// If forceUpdate was true but backend says not updated, log warning
				if (forceUpdate && response.updated === false) {
					console.warn('⚠️ Force update requested but backend reports no update.');
					console.warn('⚠️ This means the token already exists in database - good!');
					console.warn(`📊 Current devices registered: ${response.tokenCount || response.devicesRegistered || 1}`);
				}

				return token;
			} else {
				const errorMsg = response?.message || 'Backend returned success: false';
				console.error('❌ Backend returned unsuccessful response:', response);
				throw new Error(errorMsg);
			}
		} catch (error) {
			console.error(`❌ Failed to save FCM token to backend (attempt ${attempt}/3):`, error);
			console.error('Error details:', {
				status: error.response?.status,
				statusText: error.response?.statusText,
				message: error.message,
				data: error.response?.data,
				url: error.config?.url,
				isMobile,
				userAgent: navigator.userAgent?.substring(0, 50)
			});

			if (attempt < 3) {
				const waitTime = isMobile ? (3000 * attempt) : (2000 * attempt);
				console.log(`⏳ Waiting ${waitTime}ms before retry (${isMobile ? 'mobile' : 'desktop'})...`);
				await new Promise(resolve => setTimeout(resolve, waitTime));
			} else {
				// Save locally even if backend fails
				console.warn('⚠️ All backend save attempts failed, storing locally only');
				console.warn('⚠️ Token will be saved to backend on next successful attempt');
				console.warn('⚠️ Please check:');
				console.warn('   1. Backend server is running');
				console.warn('   2. Network connection is stable');
				console.warn('   3. API endpoint is accessible');
				localStorage.setItem('fcm_token', token);
				localStorage.setItem('fcm_token_time', now.toString());
			}
		}
	}

	return token;
};

// Initialize push notifications (service worker + FCM token)
export const initializePushNotifications = async () => {
	try {
		// Register service worker first
		await registerServiceWorker();

		// Register FCM token
		await registerFCMToken();
	} catch (error) {
		console.error('Push notification initialization failed:', error);
	}
};

// Handle foreground notifications
export const setupForegroundNotificationHandler = (callback) => {
	try {
		const unsubscribe = onMessage(messaging, (payload) => {
			console.log('🔔 Foreground notification received:', payload);

			// Check if in APK/WebView context - don't show notifications in payment flows
			const isInWebView = isWebView();
			const isAPKContext = isInWebView || window.cordova !== undefined || window.Capacitor !== undefined;
			const isMobile = isMobileDevice();
			const isDesktop = !isMobile && !isAPKContext;

			// For desktop, always show notifications when app is in foreground
			// For mobile/APK, only show if not in APK context and not payment-related
			if (payload?.notification && Notification.permission === 'granted') {
				const isPaymentNotification = payload?.data?.type === 'payment' ||
					payload?.notification?.title?.toLowerCase().includes('payment') ||
					payload?.notification?.body?.toLowerCase().includes('payment');

				// Show notification for desktop always, or for mobile if not APK and not payment
				const shouldShowNotification = isDesktop || (!isAPKContext && !isPaymentNotification);

				if (shouldShowNotification) {
					console.log(`🔔 Showing ${isDesktop ? 'desktop' : 'mobile'} notification:`, payload.notification.title);

					const notificationOptions = {
						body: payload.notification.body,
						icon: payload.notification.icon || '/favicon.png',
						badge: '/favicon.png',
						tag: payload.data?.messageId || payload.data?.conversationId || 'notification',
						requireInteraction: false,
						data: {
							...payload.data,
							link: payload.fcmOptions?.link || payload.data?.link || '/messages',
							clickAction: payload.notification?.clickAction || payload.data?.handlerName || 'message'
						}
					};

					// Add image if available
					if (payload.notification.image) {
						notificationOptions.image = payload.notification.image;
					}

					const notification = new Notification(
						payload.notification.title || 'New Notification',
						notificationOptions
					);

					// Handle notification click
					notification.onclick = (event) => {
						event.preventDefault();
						const link = payload.fcmOptions?.link || payload.data?.link || '/messages';
						console.log('🔔 Notification clicked, opening:', link);
						window.focus();
						window.location.href = link;
						notification.close();
					};
				} else {
					console.log('📱 Skipping notification (APK context or payment-related)');
				}
			} else if (!payload?.notification) {
				console.log('⚠️ Payload missing notification object:', payload);
			} else if (Notification.permission !== 'granted') {
				console.log('⚠️ Notification permission not granted:', Notification.permission);
			}

			// Call custom callback if provided
			if (callback && typeof callback === 'function') {
				callback(payload);
			}
		});

		return unsubscribe;
	} catch (error) {
		console.error('❌ Foreground notification handler setup failed:', error);
		return null;
	}
};

