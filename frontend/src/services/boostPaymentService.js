/**
 * Boost Payment Service
 * Handles boost package payment via Razorpay
 * Separate from subscription payment
 */

class BoostPaymentService {
  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RdvKOG3GEcWnDk';

    console.log('🔧 BoostPaymentService initialized:', {
      apiUrl: this.apiUrl,
      hasRazorpayKey: !!this.razorpayKey,
      razorpayKeyPreview: this.razorpayKey ? `${this.razorpayKey.substring(0, 8)}...` : 'NOT SET'
    });

    if (!this.razorpayKey) {
      console.error('⚠️ RAZORPAY_KEY_ID not configured');
    }
  }

  /**
   * Load Razorpay script
   */
  async loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('✅ Razorpay script loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Check if running in APK/WebView
   */
  /**
   * Check if running in APK/WebView/Mobile
   * Matches logic from razorpayService.js
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
   * Check if running in iframe
   */
  isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Create boost payment order
   */
  async createBoostPaymentOrder(packageData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      console.log('📤 Creating boost payment order:', {
        packageId: packageData.id,
        packageName: packageData.name,
        boostCount: packageData.boostCount,
        price: packageData.price,
        apiUrl: `${this.apiUrl}/boost/create-payment-order`
      });

      const response = await fetch(`${this.apiUrl}/boost/create-payment-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: packageData.id,
          packageName: packageData.name,
          boostCount: packageData.boostCount,
          price: packageData.price
        })
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Failed to create payment order';
        try {
          const errorData = await response.json();
          console.error('❌ Error response:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.error('❌ Error response (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Payment order created:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Error creating boost payment order:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Verify boost payment
   */
  async verifyBoostPayment(paymentData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.apiUrl}/boost/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: paymentData.razorpay_order_id || paymentData.orderId,
          razorpay_payment_id: paymentData.razorpay_payment_id || paymentData.paymentId,
          razorpay_signature: paymentData.razorpay_signature || paymentData.signature
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment verification failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ Error verifying boost payment:', error);
      throw error;
    }
  }

  /**
   * Process boost payment
   */
  async processBoostPayment(packageData, userData) {
    try {
      console.log('🚀 Processing boost payment:', packageData);

      // Load Razorpay script
      await this.loadRazorpayScript();

      // Calculate total with GST
      const gstAmount = Math.round(packageData.price * 0.18);
      const totalAmount = packageData.price + gstAmount;

      // Create payment order
      const order = await this.createBoostPaymentOrder(packageData);
      console.log('✅ Payment order created:', order.orderId);

      const isAPK = this.isAPKContext();
      const isInIframe = this.isInIframe();

      // Matches razorpayService.js logic for redirect mode
      const useRedirectMode = isAPK || isInIframe || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Build callback URL for redirect mode
      const apiBase = this.apiUrl;
      const callbackUrl = useRedirectMode
        ? `${apiBase}/payment/razorpay-callback`
        : undefined;

      // Validate Razorpay key
      if (!this.razorpayKey || this.razorpayKey.trim() === '') {
        console.error('❌ Razorpay key is missing or empty');
        throw new Error('Razorpay key not configured. Please set VITE_RAZORPAY_KEY_ID in environment variables.');
      }

      console.log('🔑 Using Razorpay key:', this.razorpayKey.substring(0, 8) + '...');

      const options = {
        key: this.razorpayKey.trim(),
        amount: order.amount, // Already in paise
        currency: order.currency || 'INR',
        name: 'RentYatra',
        description: `${packageData.name} - ${packageData.boostCount} Boosts`,
        order_id: order.orderId,
        prefill: {
          name: userData.name || '',
          email: userData.email || '',
          contact: userData.phone || '',
        },
        notes: {
          payment_type: 'boost_payment',
          package_id: packageData.id,
          package_name: packageData.name,
          boost_count: packageData.boostCount.toString(),
          user_id: userData.userId || userData.id
        },
        theme: {
          color: '#FF6B35',
        },
        method: {
          card: true,
          netbanking: true,
          wallet: true,
          upi: true,
        },
        ...(useRedirectMode && {
          redirect: true,
          callback_url: callbackUrl,
        }),
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
            console.log('🎯 Razorpay payment handler called:', response);

            // Support both web and mobile APK formats
            // Check if response is a URL string (redirect scenario)
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

            // Extract payment data considering all possible sources
            const razorpay_order_id = response.razorpay_order_id || response.orderId || response.order_id ||
              urlParams.razorpay_order_id || urlParams.orderId || urlParams.order_id || order.orderId;

            const razorpay_payment_id = response.razorpay_payment_id || response.paymentId || response.payment_id ||
              urlParams.razorpay_payment_id || urlParams.paymentId || urlParams.payment_id;

            const razorpay_signature = response.razorpay_signature || response.signature ||
              urlParams.razorpay_signature || urlParams.signature;

            if (!razorpay_payment_id) {
              throw new Error('Payment response missing payment_id');
            }

            // Verify payment
            const verificationData = {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature: razorpay_signature || undefined
            };

            console.log('🔍 Verifying boost payment...');
            const verificationResult = await this.verifyBoostPayment(verificationData);
            console.log('✅ Payment verified:', verificationResult);

            // Call success callback
            if (packageData.onSuccess) {
              packageData.onSuccess(verificationResult);
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            if (packageData.onError) {
              packageData.onError(error);
            }
          }
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment modal dismissed');
            if (packageData.onError) {
              packageData.onError(new Error('PAYMENT_CANCELLED'));
            }
          },
          backdropclose: false,
          escape: false,
          animation: false
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300
      };

      // Open Razorpay checkout
      if (!window.Razorpay) {
        throw new Error('Razorpay not available');
      }

      console.log('🔧 Creating Razorpay instance with options:', {
        key: options.key ? options.key.substring(0, 8) + '...' : 'MISSING',
        amount: options.amount,
        order_id: options.order_id,
        currency: options.currency
      });

      const razorpay = new window.Razorpay(options);

      // Add error handlers
      razorpay.on('payment.failed', (response) => {
        console.error('❌ Razorpay payment failed:', response);
        const errorDescription = response.error?.description || response.error?.reason || 'Payment failed';
        if (packageData.onError) {
          packageData.onError(new Error(errorDescription));
        }
      });

      razorpay.open();
      console.log('✅ Razorpay checkout opened');

    } catch (error) {
      console.error('❌ Error processing boost payment:', error);
      if (packageData.onError) {
        packageData.onError(error);
      }
      throw error;
    }
  }
}

// Export singleton instance
export default new BoostPaymentService();

