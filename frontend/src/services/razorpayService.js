// Razorpay service for RentYatra frontend
class RazorpayService {
  constructor() {
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RdvKOG3GEcWnDk';
    this.apiUrl = import.meta.env.VITE_API_URL || '/api';

    // Validate API URL in production
    if (import.meta.env.PROD && this.apiUrl === '/api') {
      console.warn(' VITE_API_URL not set! Using relative path "/api".');
      console.warn(' This may cause payment failures in production.');
      console.warn(' Please set VITE_API_URL in Vercel environment variables.');
    }

    // Log API URL for debugging (ALWAYS log in production for APK debugging)
    console.log('🔧 RazorpayService initialized:', {
      apiUrl: this.apiUrl,
      razorpayKey: this.razorpayKey ? `${this.razorpayKey.substring(0, 8)}...` : 'NOT SET',
      env: import.meta.env.MODE || 'unknown'
    });

    if (!this.razorpayKey) {
      console.error('⚠️  RAZORPAY_KEY_ID not configured in environment variables');
    }
  }

  static getInstance() {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Get Razorpay test cards for automatic success/failure
   * Use these in test mode to skip manual bank page clicks
   */
  getTestCards() {
    return {
      // Automatic Success Cards (no manual click needed)
      success: {
        visa: {
          number: '4111111111111111',
          cvv: '123',
          expiry: '12/25',
          name: 'Test User'
        },
        mastercard: {
          number: '5105105105105100',
          cvv: '123',
          expiry: '12/25',
          name: 'Test User'
        },
        
        rupay: {
          number: '6073846073846073',
          cvv: '123',
          expiry: '12/25',
          name: 'Test User'
        }
      },
      // Automatic Failure Cards
      failure: {
        declined: {
          number: '4111111111111112',
          cvv: '123',
          expiry: '12/25',
          name: 'Test User'
        }
      },
      // Test UPI IDs (auto-success)
      upi: {
        success: 'success@razorpay', // Auto-success UPI
        failure: 'failure@razorpay'  // Auto-failure UPI
      }
    };
  }

  /**
   * Detect if running in APK/WebView context
   */
  isAPKContext() {
    try {
      if (typeof navigator === 'undefined' || typeof window === 'undefined') {
        return false;
      }

      const userAgent = navigator.userAgent || '';

      // Check for webview indicators
      const isWebView = /wv|WebView/i.test(userAgent);

      // Check for standalone mode (PWA)
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

      // Check for iOS standalone
      const isIOSStandalone = window.navigator.standalone === true;

      // Check for mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      // Check for Flutter bridge or Android bridge
      const hasNativeBridge = typeof window.flutter_inappwebview !== 'undefined' ||
        typeof window.Android !== 'undefined';

      return isWebView || isStandalone || isIOSStandalone || (isMobileDevice && hasNativeBridge) || (window.self !== window.top);
    } catch (error) {
      console.error('Error detecting mobile context:', error);
      return false;
    }
  }

  /**
   * Detect if running in iframe
   */
  isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Send message to parent window (for iframe scenarios)
   */
  sendMessageToParent(messageType, data) {
    if (this.isInIframe()) {
      try {
        window.parent.postMessage({
          type: messageType,
          data: data,
          source: 'rentyatra-payment'
        }, '*'); // In production, use specific origin
        console.log(`📤 Sent message to parent: ${messageType}`, data);
      } catch (error) {
        console.error('❌ Error sending message to parent:', error);
      }
    }
  }

  /**
   * Setup WebView callback URL monitoring
   */
  setupWebViewCallbackMonitoring(orderId, subscriptionId, paymentData) {
    console.log('🔍 Setting up WebView callback monitoring for order:', orderId);

    // Monitor URL changes
    let lastUrl = window.location.href;

    const checkUrlChange = () => {
      const currentUrl = window.location.href;

      // Check if we're on Razorpay callback URL
      if (currentUrl.includes('api.razorpay.com') && currentUrl.includes('/callback/')) {
        console.log('🔔 Detected Razorpay callback URL:', currentUrl);

        try {
          // Extract payment ID from URL
          const urlMatch = currentUrl.match(/\/payments\/(pay_[^/]+)\/callback/);
          if (urlMatch && urlMatch[1]) {
            const paymentId = urlMatch[1];
            console.log('📦 Extracted payment ID from callback URL:', paymentId);

            // Extract status from URL
            const urlParams = new URL(currentUrl).searchParams;
            const status = urlParams.get('status');

            if (status === 'authorized' || status === 'captured') {
              console.log('✅ Payment authorized/captured, redirecting to callback page...');

              // Redirect to our callback page with payment details
              const callbackUrl = new URL('/payment-callback', window.location.origin);
              callbackUrl.searchParams.set('razorpay_order_id', orderId);
              callbackUrl.searchParams.set('razorpay_payment_id', paymentId);
              callbackUrl.searchParams.set('payment_type', 'subscription');
              callbackUrl.searchParams.set('subscription_id', subscriptionId);

              console.log('🔀 Redirecting to callback:', callbackUrl.toString());

              // Clear monitoring
              clearInterval(urlCheckInterval);

              // Redirect after a short delay to ensure payment is processed
              setTimeout(() => {
                window.location.href = callbackUrl.toString();
              }, 1000);
            }
          }
        } catch (error) {
          console.error('❌ Error processing callback URL:', error);
        }
      }

      lastUrl = currentUrl;
    };

    // Check URL every 500ms
    const urlCheckInterval = setInterval(checkUrlChange, 500);

    // Also listen for popstate events
    window.addEventListener('popstate', checkUrlChange);

    // Store interval ID for cleanup
    if (!this.urlMonitoringIntervals) {
      this.urlMonitoringIntervals = [];
    }
    this.urlMonitoringIntervals.push({
      interval: urlCheckInterval,
      orderId: orderId,
      cleanup: () => {
        clearInterval(urlCheckInterval);
        window.removeEventListener('popstate', checkUrlChange);
      }
    });

    // Auto-cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(urlCheckInterval);
      window.removeEventListener('popstate', checkUrlChange);
      console.log('🧹 Cleaned up URL monitoring for order:', orderId);
    }, 300000); // 5 minutes
  }

  /**
   * Load Razorpay script dynamically
   */
  async loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Razorpay) {
        resolve();
        return;
      }

      // For mobile webview, try to load script with retry mechanism
      const isMobile = this.isAPKContext();

      if (isMobile) {
        console.log('📱 Mobile webview detected, loading Razorpay with mobile configuration');
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.defer = true;

        // Add timeout for mobile
        const timeout = setTimeout(() => {
          if (!window.Razorpay) {
            console.warn('⚠️ Razorpay script loading timeout, retrying...');
            // Retry once
            const retryScript = document.createElement('script');
            retryScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
            retryScript.async = true;
            retryScript.onload = () => {
              if (window.Razorpay) {
                resolve();
              } else {
                reject(new Error('Razorpay not available after retry'));
              }
            };
            retryScript.onerror = () => reject(new Error('Failed to load Razorpay script after retry'));
            document.head.appendChild(retryScript);
          }
        }, isMobile ? 5000 : 3000);

        script.onload = () => {
          clearTimeout(timeout);
          if (window.Razorpay) {
            console.log('✅ Razorpay script loaded successfully');
            resolve();
          } else {
            reject(new Error('Razorpay script loaded but window.Razorpay is not available'));
          }
        };

        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load Razorpay script'));
        };

        // Append to head or body
        if (document.head) {
          document.head.appendChild(script);
        } else if (document.body) {
          document.body.appendChild(script);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            (document.head || document.body).appendChild(script);
          });
        }
      } catch (error) {
        reject(new Error(`Error creating Razorpay script: ${error}`));
      }
    });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(amount, receipt, notes = {}) {
    try {
      console.log('🔍 Creating Razorpay order with data:', { amount, receipt, notes });

      const apiUrl = `${this.apiUrl}/payment/create-order`;
      console.log('📡 API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt,
          notes
        }),
      });

      console.log('📡 Create order response status:', response.status);
      console.log('📡 Create order response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        let errorMessage = 'Failed to create order';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📦 Create order response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);

      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to payment server. Please check your internet connection and try again.');
      }

      throw error;
    }
  }

  /**
   * Create subscription before payment
   */
  async createSubscription(subscriptionData) {
    try {
      console.log('📝 Creating subscription with data:', subscriptionData);

      const apiUrl = `${this.apiUrl}/payment/create-subscription`;
      console.log('📡 Calling create-subscription API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      console.log('📡 Create subscription response status:', response.status);
      console.log('📡 Create subscription response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        let errorMessage = 'Failed to create subscription';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Failed to create subscription: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📦 Create subscription response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create subscription');
      }

      console.log('✅ Subscription created successfully:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscriptionPayment(paymentData) {
    try {
      console.log('🚀 Processing subscription payment with data:', {
        planId: paymentData.planId,
        planName: paymentData.planName,
        amount: paymentData.amount,
        userId: paymentData.userId
      });

      // Detect APK/iframe context early
      const isAPK = this.isAPKContext();
      const isInIframe = this.isInIframe();

      // CRITICAL: WebView/APK requires redirect mode, not modal mode
      // Modal mode (redirect: false) doesn't work in WebView due to iframe restrictions
      // We must use redirect mode with callback URL for WebView
      const useRedirectMode = isAPK || isInIframe || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Also check for Flutter WebView specifically
      const hasFlutterWebView = window.flutter_inappwebview !== undefined;
      const hasFlutterInUserAgent = (navigator.userAgent || '').includes('Flutter');

      console.log('🔍 Payment context detection:', {
        isAPK,
        isInIframe,
        useRedirectMode,
        hasFlutterWebView,
        hasFlutterInUserAgent,
        userAgent: navigator.userAgent,
        windowLocation: window.location.href,
        hasCordova: window.cordova !== undefined,
        hasCapacitor: window.Capacitor !== undefined,
        isWebViewUA: /wv|WebView/i.test(navigator.userAgent || '')
      });

      if (!isAPK && (hasFlutterWebView || hasFlutterInUserAgent)) {
        console.warn('⚠️ Flutter WebView detected but isAPKContext() returned false! This may cause payment issues.');
        console.warn('⚠️ Please check isAPKContext() implementation.');
      }

      // OPTIMIZED: Load Razorpay script and create subscription in parallel for faster initialization
      console.log('📜 Loading Razorpay script and creating subscription in parallel...');
      const [_, subscription] = await Promise.all([
        this.loadRazorpayScript().then(() => console.log('✅ Razorpay script loaded')),
        this.createSubscription({
          userId: paymentData.userId,
          planId: paymentData.planId,
          planName: paymentData.planName,
          price: paymentData.amount,
          maxListings: paymentData.maxListings,
          maxPhotos: paymentData.maxPhotos,
          duration: paymentData.duration
        }).then(sub => {
          console.log('✅ Subscription created:', sub.subscriptionId);
          return sub;
        })
      ]);

      // Create order (needed for callback URL) - requires subscription ID
      console.log('💳 Creating payment order...');
      const order = await this.createOrder(
        paymentData.amount,
        `subscription_${Date.now()}`,
        {
          description: 'Subscription payment',
          plan_id: paymentData.planId,
          user_id: paymentData.userId,
          subscription_id: subscription.subscriptionId
        }
      );
      console.log('✅ Payment order created:', order.id);

      // Build callback URL for redirect mode (WebView/APK) - point to backend to avoid 405 on SPA
      const apiBase = this.apiUrl;
      const callbackUrl = useRedirectMode
        ? `${apiBase}/payment/razorpay-callback`
        : undefined;

      // Store payment info in localStorage for WebView callback handling
      if (useRedirectMode) {
        try {
          localStorage.setItem('pending_payment', JSON.stringify({
            type: 'subscription',
            orderId: order.id,
            subscriptionId: subscription.subscriptionId,
            userId: paymentData.userId,
            planId: paymentData.planId,
            amount: paymentData.amount,
            callbackUrl: callbackUrl,
            timestamp: Date.now()
          }));
          console.log('💾 Stored payment info in localStorage for callback handling:', {
            orderId: order.id,
            subscriptionId: subscription.subscriptionId,
            callbackUrl: callbackUrl
          });
        } catch (e) {
          console.warn('⚠️ Could not store payment info:', e);
        }
      }

      // Setup URL monitoring for WebView callback detection (only if using redirect mode)
      if (useRedirectMode) {
        this.setupWebViewCallbackMonitoring(order.id, subscription.subscriptionId, paymentData);
      }

      // Razorpay options - optimized for both web and APK/iframe
      // Add test mode configuration for automatic success
      const isTestMode = this.razorpayKey && this.razorpayKey.includes('test');

      const options = {
        key: this.razorpayKey,
        amount: order.amount, // Amount is already in paise from backend
        currency: order.currency || 'INR',
        name: 'RentYatra',
        description: paymentData.description || 'Subscription payment',
        order_id: order.id,
        prefill: {
          name: paymentData.name || '',
          email: paymentData.email || '',
          contact: paymentData.phone || '',
        },
        notes: {
          payment_type: 'subscription_payment',
          plan_id: paymentData.planId,
          subscription_id: subscription.subscriptionId,
          // Store order_id in payment notes for callback retrieval
          // This helps when payment object is fetched from Razorpay
          razorpay_order_id: order.id,
          order_id: order.id
        },
        theme: {
          color: '#3B82F6',
        },
        retry: {
          enabled: false,
        },
        webview_intent: true,
        // Match fixifly's stable configuration logic: undefined for mobile, custom for desktop
        config: isAPK || isInIframe ? undefined : {
          display: {
            blocks: {
              upi: {
                name: "UPI",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent"],
                  },
                ],
              },
              banks: {
                name: "Other Payment Methods",
                instruments: [
                  {
                    method: "upi",
                    flows: ["collect"],
                  },
                  {
                    method: "card",
                  },
                  {
                    method: "netbanking",
                  },
                  {
                    method: "wallet",
                  },
                ],
              },
            },
            sequence: ["block.upi", "block.banks"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        handler: async (response) => {
          try {
            console.log('🎯 Razorpay payment handler called with response:', JSON.stringify(response, null, 2));
            console.log('📦 Order data available:', JSON.stringify(order, null, 2));
            console.log('📱 Is APK context:', isAPK);
            console.log('🖼️ Is in iframe:', isInIframe);

            // Flutter bridge call for WebView integration (from fixifly)
            if (window.flutter_inappwebview) {
              try {
                window.flutter_inappwebview.callHandler('razorpayResponse', response);
                console.log('📱 Flutter bridge called with payment response');
              } catch (error) {
                console.error('❌ Error calling Flutter bridge:', error);
              }
            }

            // Show success alert for WebView
            if (isAPK) {
              alert("Payment Success!");
            }

            // Notify parent window about payment start (for iframe scenarios)
            if (isInIframe) {
              this.sendMessageToParent('payment_handler_triggered', {
                orderId: order.id,
                subscriptionId: subscription.subscriptionId
              });
            }

            // Support both web and mobile APK formats with extensive fallbacks
            // Web: response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature
            // Mobile APK: response.orderId, response.paymentId, response.signature
            // Also check for nested objects and URL params (for redirect scenarios)
            const razorpay_order_id = response.razorpay_order_id || response.orderId || response.order_id ||
              response.order?.id || response.order_id_response?.id;
            const razorpay_payment_id = response.razorpay_payment_id || response.paymentId || response.payment_id ||
              response.payment?.id || response.payment_id_response?.id;
            const razorpay_signature = response.razorpay_signature || response.signature ||
              response.signature_response || response.signature_data;

            // If response is a URL string (redirect scenario in APK), extract params
            let urlParams = {};
            if (typeof response === 'string' && response.includes('?')) {
              try {
                const url = new URL(response);
                urlParams = Object.fromEntries(url.searchParams);
                console.log('📱 Extracted URL params from redirect:', urlParams);
              } catch (e) {
                console.warn('⚠️ Failed to parse response as URL:', e);
              }
            }

            // Use URL params if available and direct response fields are missing
            // IMPORTANT: Use order.id as fallback for order_id (we created it, so we know it)
            const final_order_id = razorpay_order_id || urlParams.razorpay_order_id || urlParams.orderId || urlParams.order_id || order.id || order.orderId;
            const final_payment_id = razorpay_payment_id || urlParams.razorpay_payment_id || urlParams.paymentId || urlParams.payment_id;
            const final_signature = razorpay_signature || urlParams.razorpay_signature || urlParams.signature;

            console.log('🔍 Extracted payment data:', {
              razorpay_order_id: final_order_id,
              razorpay_payment_id: final_payment_id,
              has_signature: !!final_signature,
              signature_length: final_signature ? final_signature.length : 0,
              order_amount: order.amount,
              order_amount_in_rupees: order.amount / 100,
              order_id_used: final_order_id === order.id || final_order_id === order.orderId ? 'from_order_object' : 'from_response',
              full_response: response,
              url_params: urlParams,
              is_apk: isAPK,
              is_iframe: isInIframe
            });

            // Validate required fields - payment_id is absolutely required
            // Order_id can be from order object if not in response
            // Signature can be missing in APK/WebView - backend will verify via API
            if (!final_payment_id) {
              console.error('❌ Missing required payment_id');
              console.error('Full response received:', response);
              console.error('URL params extracted:', urlParams);
              throw new Error('Payment response missing required field: payment_id');
            }

            // Order ID validation - must exist (either from response or order object)
            if (!final_order_id) {
              console.error('❌ Missing order_id and order object ID not available');
              console.error('Full response received:', response);
              console.error('Order object:', order);
              throw new Error('Payment response missing required field: order_id');
            }

            // Signature is optional in APK/WebView scenarios - backend will verify via Razorpay API
            if (!final_signature) {
              console.log('ℹ️ Signature missing - this is normal in APK/WebView scenarios');
              console.log('ℹ️ Backend will verify payment via Razorpay API');
            }

            // Verify payment - use order.amount which is already in paise from backend
            // Note: signature can be empty/undefined in APK scenarios - backend will verify via API
            // IMPORTANT: Don't send empty string for signature - send undefined/null if missing
            // Backend will handle undefined/null properly
            const verificationData = {
              razorpay_order_id: final_order_id,
              razorpay_payment_id: final_payment_id,
              razorpay_signature: final_signature && final_signature.trim().length > 0 ? final_signature.trim() : undefined, // Send undefined if empty - backend will verify via API
              // Support both formats for backend
              orderId: final_order_id,
              paymentId: final_payment_id,
              signature: final_signature && final_signature.trim().length > 0 ? final_signature.trim() : undefined, // Send undefined if empty
              subscriptionId: subscription.subscriptionId,
              amount: order.amount, // Use order.amount which is in paise
              source: isAPK || isInIframe ? 'mobile_apk' : 'web' // Detect mobile/APK/iframe
            };

            console.log('📤 Verification data being sent:', {
              razorpay_order_id: verificationData.razorpay_order_id,
              razorpay_payment_id: verificationData.razorpay_payment_id,
              has_signature: !!verificationData.razorpay_signature,
              signature_length: verificationData.razorpay_signature ? verificationData.razorpay_signature.length : 0,
              subscriptionId: verificationData.subscriptionId,
              amount: verificationData.amount,
              source: verificationData.source
            });

            console.log('🔍 Calling verifyPayment with data:', verificationData);
            console.log('⏰ Verification started at:', new Date().toISOString());
            console.log('📱 Is APK context:', isAPK);

            // Add timeout for verification - longer timeout for APK (60s) vs web (30s)
            const timeoutDuration = isAPK ? 60000 : 30000;
            console.log(`⏱️ Setting timeout to ${timeoutDuration / 1000} seconds (${isAPK ? 'APK' : 'web'})`);

            // Add retry logic for APK context
            let verificationResult;
            const maxRetries = isAPK ? 2 : 1;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                console.log(`🔄 Verification attempt ${attempt}/${maxRetries}`);

                const verificationPromise = this.verifyPayment(verificationData);
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Payment verification timeout')), timeoutDuration)
                );

                verificationResult = await Promise.race([verificationPromise, timeoutPromise]);
                console.log(`✅ Verification successful on attempt ${attempt}`);
                break; // Success, exit retry loop
              } catch (error) {
                console.error(`❌ Verification attempt ${attempt} failed:`, error.message);

                // Check if it's a timeout error
                const isTimeout = error.message.includes('timeout') || error.message.includes('timeout');

                if (attempt < maxRetries && isAPK) {
                  // Wait before retry (only for APK)
                  const retryDelay = 3000 * attempt; // 3s, 6s
                  console.log(`⏳ Waiting ${retryDelay / 1000}s before retry...`);
                  await new Promise(resolve => setTimeout(resolve, retryDelay));
                  console.log(`🔄 Retrying verification...`);
                } else {
                  // Last attempt failed - provide helpful error message
                  if (isTimeout) {
                    const timeoutError = new Error('Payment verification is taking longer than expected. Your payment was successful, but verification is still processing. Please check your subscription status in a few moments.');
                    timeoutError.isTimeout = true;
                    timeoutError.paymentId = verificationData.razorpay_payment_id || verificationData.paymentId;
                    timeoutError.orderId = verificationData.razorpay_order_id || verificationData.orderId;
                    throw timeoutError;
                  }
                  throw error;
                }
              }
            }
            console.log('✅✅✅ SUBSCRIPTION PAYMENT VERIFICATION SUCCESS ✅✅✅');
            console.log('✅ Payment verification successful:', verificationResult);

            // Notify parent window about payment success (for iframe scenarios)
            if (isInIframe) {
              this.sendMessageToParent('payment_success', {
                orderId: final_order_id,
                paymentId: final_payment_id,
                subscriptionId: subscription.subscriptionId,
                verificationResult: verificationResult
              });
            }

            // Prevent notification triggers in APK context
            if (isAPK) {
              console.log('📱 APK context detected - skipping notification triggers');
            }

            console.log('✅ Calling onSuccess callback');
            console.log('✅ Success callback function exists:', typeof paymentData.onSuccess === 'function');

            try {
              paymentData.onSuccess(verificationResult);
              console.log('✅ onSuccess callback executed successfully');
            } catch (successError) {
              console.error('❌ Error in onSuccess callback:', successError);
              // Even if callback fails, notify parent in iframe
              if (isInIframe) {
                this.sendMessageToParent('payment_success_callback_failed', {
                  error: successError.message,
                  verificationResult: verificationResult
                });
              }
            }
          } catch (error) {
            console.error('❌ Error in payment handler:', error);
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name,
              response_received: response
            });

            // Provide user-friendly error message with more context
            let errorMessage = 'Payment verification failed';
            if (error.isTimeout || error.message.includes('timeout') || error.message.includes('taking longer than expected')) {
              // Use the better timeout message if available
              errorMessage = error.message || 'Payment verification is taking longer than expected. Your payment was successful, but verification is still processing. Please check your account status in a few moments.';
            } else if (error.message.includes('Missing')) {
              errorMessage = 'Invalid payment response received. Please try again.';
            } else if (error.message.includes('verification failed') || error.message.includes('verification')) {
              errorMessage = 'Payment could not be verified. Please try again or contact support if the issue persists.';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
              errorMessage = 'Network error occurred. Please check your internet connection and try again.';
            } else if (error.message.includes('signature')) {
              errorMessage = 'Payment signature verification failed. Please try again.';
            } else if (error.message) {
              errorMessage = error.message;
            }

            console.error('❌ Calling onError with message:', errorMessage);

            // Notify parent window about payment error (for iframe scenarios)
            if (isInIframe) {
              this.sendMessageToParent('payment_error', {
                error: errorMessage,
                orderId: order.id,
                subscriptionId: subscription.subscriptionId
              });
            }

            paymentData.onError(new Error(errorMessage));
          }
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment modal dismissed by user');
            paymentData.onError(new Error('PAYMENT_CANCELLED'));
          },
          backdropclose: false, // Prevent closing by clicking outside
          escape: false, // Prevent closing with ESC key
          animation: false // Disable animations for better performance in WebView
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300
      };

      // Open Razorpay checkout
      console.log('🔄 Opening Razorpay checkout for subscription payment...');
      console.log('🔍 Razorpay Key:', this.razorpayKey ? `${this.razorpayKey.substring(0, 8)}...` : 'NOT SET');
      console.log('🔍 Order ID:', order.id);
      console.log('🔍 Amount:', order.amount, 'paise (', order.amount / 100, 'INR)');
      console.log('🔍 Subscription ID:', subscription.subscriptionId);

      if (!window.Razorpay) {
        console.error('❌ window.Razorpay not available');
        throw new Error('Razorpay object not available. Please check your internet connection.');
      }

      try {
        const razorpay = new window.Razorpay(options);
        console.log('✅ Razorpay instance created successfully');

        // Add error handlers
        razorpay.on('payment.failed', function (response) {
          console.error('❌ Razorpay payment.failed event triggered:', JSON.stringify(response, null, 2));
          const errorDescription = response.error?.description || response.error?.reason || 'Payment failed';
          console.error('❌ Payment failed error:', errorDescription);
          paymentData.onError(new Error(errorDescription));
        });

        razorpay.on('payment.authorized', function (response) {
          console.log('✅ Razorpay payment.authorized event:', response);
        });

        razorpay.on('payment.captured', function (response) {
          console.log('✅ Razorpay payment.captured event:', response);
        });

        razorpay.open();
        console.log('✅ Razorpay checkout opened successfully');
      } catch (openError) {
        console.error('❌ Error opening Razorpay checkout:', openError);
        throw new Error(`Failed to open payment gateway: ${openError.message}`);
      }
    } catch (error) {
      console.error('❌ Error processing subscription payment:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        const networkError = new Error('Unable to connect to payment server. Please check your internet connection and try again.');
        paymentData.onError(networkError);
      } else {
        paymentData.onError(error);
      }
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentData) {
    try {
      console.log('🔍 Verifying subscription payment with data:', {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        subscriptionId: paymentData.subscriptionId,
        amount: paymentData.amount
      });

      const apiUrl = `${this.apiUrl}/payment/verify`;
      console.log('📡 Calling payment verification API:', apiUrl);

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const isAPK = this.isAPKContext();
      const timeoutDuration = isAPK ? 55000 : 25000; // Slightly less than Promise.race timeout

      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Fetch timeout reached, aborting...');
        controller.abort();
      }, timeoutDuration);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });

          let errorMessage = 'Payment verification failed';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorMessage = `Payment verification failed: ${response.status} ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('📦 Response data:', data);

        if (!data.success) {
          console.log('❌ Verification failed:', data.message);
          throw new Error(data.message || 'Payment verification failed');
        }

        console.log('✅ Verification successful:', data.data);
        return data.data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Payment verification timeout - request took too long');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        isTimeout: error.message.includes('timeout')
      });
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      // Validate payment ID before making request
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }

      // Trim and validate format
      paymentId = paymentId.trim();

      // Razorpay payment IDs should start with 'pay_' and be at least 15 characters
      if (!paymentId.startsWith('pay_') || paymentId.length < 15) {
        console.error('❌ Invalid payment ID format:', {
          payment_id: paymentId.substring(0, 20) + '...',
          length: paymentId.length,
          starts_with_pay: paymentId.startsWith('pay_')
        });
        throw new Error('Invalid payment ID format. Payment ID must start with "pay_" and be a valid Razorpay payment ID.');
      }

      console.log('🔍 Fetching payment details for:', paymentId.substring(0, 20) + '...');

      const apiUrl = `${this.apiUrl}/payment/${encodeURIComponent(paymentId)}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        // Handle specific error cases
        if (data.error === 'BAD_REQUEST_ERROR' && data.description?.includes('does not exist')) {
          console.warn('⚠️ Payment ID not found in Razorpay (may be normal in mobile/APK scenarios):', paymentId.substring(0, 20) + '...');
          throw new Error('Payment ID not found in Razorpay. This may happen if the payment was just processed and the ID is not yet available.');
        }
        throw new Error(data.message || data.description || 'Failed to get payment details');
      }

      console.log('✅ Payment details fetched successfully');
      return data.data;
    } catch (error) {
      console.error('❌ Error getting payment details:', error);
      console.error('Payment ID:', paymentId ? paymentId.substring(0, 20) + '...' : 'N/A');
      throw error;
    }
  }
}

// Create singleton instance
const razorpayService = RazorpayService.getInstance();

export default razorpayService;
