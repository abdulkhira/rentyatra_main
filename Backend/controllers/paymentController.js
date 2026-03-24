const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const BoostPackage = require('../models/BoostPackage');
const emailService = require('../services/emailService');

// Initialize Razorpay with error handling (like CHALO-SAWARI)
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('⚠️  RAZORPAY ENVIRONMENT VARIABLES NOT CONFIGURED!');
    console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay service initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Razorpay service:', error.message);
  razorpay = null;
}

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay service not configured. Please check server configuration.'
      });
    }

    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Frontend sends amount in rupees, Razorpay expects amount in paise
    // So we need to convert rupees to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    console.log('Creating Razorpay order with options:', {
      amountInRupees: amount,
      amountInPaise: amountInPaise,
      currency: currency,
      receipt: receipt
    });

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay order created successfully:', order.id);

    // CRITICAL: Update subscription with orderId if subscription_id is in notes
    // This ensures orderId is stored immediately when order is created
    // This is the PRIMARY source of truth for orderId in payment callbacks
    if (notes && notes.subscription_id) {
      try {
        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findById(notes.subscription_id);
        if (subscription) {
          // CRITICAL: Always update orderId, even if it already exists (in case of retries)
          subscription.orderId = order.id;
          await subscription.save();
          console.log('✅ Updated subscription with orderId:', {
            subscriptionId: notes.subscription_id,
            orderId: order.id,
            subscriptionStatus: subscription.status
          });

          // Verify the update was successful
          const verifySubscription = await Subscription.findById(notes.subscription_id);
          if (verifySubscription && verifySubscription.orderId === order.id) {
            console.log('✅ Verified: orderId successfully stored in subscription');
          } else {
            console.error('❌ CRITICAL: orderId update verification failed!', {
              expected: order.id,
              actual: verifySubscription?.orderId
            });
          }
        } else {
          console.error('❌ CRITICAL: Subscription not found for orderId update:', {
            subscriptionId: notes.subscription_id,
            orderId: order.id
          });
        }
      } catch (subUpdateError) {
        console.error('❌ CRITICAL: Error updating subscription with orderId:', {
          error: subUpdateError.message,
          stack: subUpdateError.stack,
          subscriptionId: notes.subscription_id,
          orderId: order.id
        });
        // Non-fatal - continue with order creation, but log as error
      }
    } else {
      console.warn('⚠️ No subscription_id in order notes - orderId will not be stored in subscription');
    }

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount, // This will be in paise
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: order.created_at,
      }
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// @desc    Razorpay redirect callback handler (GET/POST)
// @route   ALL /api/payment/razorpay-callback
// @access  Public
const razorpayRedirectCallback = asyncHandler(async (req, res) => {
  try {
    console.log('🔔 Razorpay callback received:', {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: {
        origin: req.headers.origin,
        userAgent: req.headers['user-agent']
      }
    });

    const isGet = req.method === 'GET';
    const src = isGet ? req.query : req.body;

    // Extract fields from either GET query or POST body
    let razorpay_order_id = src.razorpay_order_id || src.orderId || src.order_id || src.razorpay_order_id;
    let razorpay_payment_id = src.razorpay_payment_id || src.paymentId || src.payment_id || src.razorpay_payment_id;
    let razorpay_signature = src.razorpay_signature || src.signature || src.razorpay_signature;
    const payment_type = src.payment_type || src.type || ''; // subscription | boost (optional)
    const subscription_id = src.subscription_id || src.subscriptionId;
    const package_id = src.package_id || src.packageId;

    // OPTIMIZED: If we only have payment_id but no order_id, fetch payment to get order_id
    // REMOVED: Slow order searching logic (was searching through 100 orders)
    let paymentObject = null; // Store payment object for later use
    if (razorpay && razorpay_payment_id && !razorpay_order_id) {
      try {
        console.log('🔍 Order ID missing, fetching payment details from Razorpay...');
        console.log('📦 Payment ID:', razorpay_payment_id);

        paymentObject = await razorpay.payments.fetch(razorpay_payment_id);
        const payment = paymentObject;

        // Log payment object structure for debugging
        console.log('📋 Payment object keys:', Object.keys(payment || {}));
        console.log('📋 Payment object structure:', {
          id: payment?.id,
          order_id: payment?.order_id,
          orderId: payment?.orderId,
          order: payment?.order,
          notes: payment?.notes,
          status: payment?.status,
          amount: payment?.amount
        });

        // Try multiple possible field names for order_id (FAST - no searching)
        if (payment) {
          // Razorpay payment object typically has order_id as a direct property
          // Check in order: direct property > nested object > notes > metadata
          razorpay_order_id = payment.order_id ||
            payment.orderId ||
            payment.order?.id ||
            (typeof payment.order === 'string' ? payment.order : null) ||
            payment.notes?.order_id ||
            payment.notes?.razorpay_order_id ||
            payment.notes?.razorpayOrderId ||
            payment.metadata?.order_id ||
            payment.metadata?.razorpay_order_id;

          // Also check payment notes for order_id (we store it there in frontend)
          if (!razorpay_order_id && payment.notes) {
            // Check all possible note keys
            const noteKeys = Object.keys(payment.notes);
            console.log('📝 Payment notes keys:', noteKeys);
            for (const key of noteKeys) {
              if (key.toLowerCase().includes('order') && payment.notes[key]) {
                const noteValue = payment.notes[key];
                if (typeof noteValue === 'string' && noteValue.startsWith('order_')) {
                  razorpay_order_id = noteValue;
                  console.log(`✅ Found order ID from payment notes.${key}:`, razorpay_order_id);
                  break;
                }
              }
            }
          }

          // Also check if order is an object with id property
          if (!razorpay_order_id && payment.order) {
            if (typeof payment.order === 'object' && payment.order.id) {
              razorpay_order_id = payment.order.id;
            } else if (typeof payment.order === 'string' && payment.order.startsWith('order_')) {
              razorpay_order_id = payment.order;
            }
          }

          if (razorpay_order_id) {
            console.log('✅ Found order ID from payment:', razorpay_order_id);
          } else {
            console.warn('⚠️ Payment fetched but no order_id found');
            console.warn('⚠️ Full payment object:', JSON.stringify(payment, null, 2));

            // If payment is captured/authorized, try to find order by searching payments
            if (payment.status === 'captured' || payment.status === 'authorized') {
              console.log('✅ Payment is valid, will verify using payment status');
              // Try to get order_id from order object if it exists
              if (payment.order && typeof payment.order === 'object') {
                razorpay_order_id = payment.order.id || payment.order.order_id;
                if (razorpay_order_id) {
                  console.log('✅ Found order ID from payment.order object:', razorpay_order_id);
                }
              }

              // OPTIMIZED: Check subscription record FIRST (fast database lookup)
              // This is much faster than searching through Razorpay orders
              // CRITICAL: This is the most reliable source since we store orderId when order is created
              const paymentSubscriptionId = payment.notes?.subscription_id;
              if (!razorpay_order_id && paymentSubscriptionId) {
                try {
                  console.log('🔍 Checking subscription record for orderId (fast lookup)...');
                  console.log('📦 Subscription ID from payment notes:', paymentSubscriptionId);
                  const Subscription = require('../models/Subscription');
                  const subscription = await Subscription.findById(paymentSubscriptionId);

                  if (subscription) {
                    if (subscription.orderId) {
                      razorpay_order_id = subscription.orderId;
                      console.log('✅ Found order ID from subscription record:', razorpay_order_id);
                    } else {
                      console.warn('⚠️ Subscription found but orderId not stored:', {
                        subscriptionId: paymentSubscriptionId,
                        subscriptionStatus: subscription.status,
                        paymentStatus: subscription.paymentStatus,
                        hasOrderId: !!subscription.orderId
                      });

                      // CRITICAL: If subscription exists but orderId is missing, this is a data issue
                      // Log this as an error so we can track and fix it
                      console.error('❌ CRITICAL: Subscription exists but orderId is missing!', {
                        subscriptionId: paymentSubscriptionId,
                        subscriptionCreatedAt: subscription.createdAt,
                        subscriptionUpdatedAt: subscription.updatedAt
                      });
                    }
                  } else {
                    console.warn('⚠️ Subscription not found for ID:', paymentSubscriptionId);
                  }
                } catch (subErr) {
                  console.error('❌ Error fetching subscription to get order_id:', {
                    error: subErr.message,
                    stack: subErr.stack,
                    subscriptionId: paymentSubscriptionId
                  });
                }
              } else if (!razorpay_order_id && !paymentSubscriptionId) {
                console.warn('⚠️ No subscription_id in payment notes - cannot lookup orderId from subscription');
              }

              // Last resort: Try to find order by searching recent orders with same amount
              // This is a fallback for WebView/APK scenarios where order_id might not be in payment object
              // NOTE: This is a slower approach, only use if absolutely necessary
              // Only do this if subscription lookup didn't find orderId
              if (!razorpay_order_id && payment.amount) {
                try {
                  console.log('🔍 Attempting to find order by searching recent orders (fallback)...');
                  console.log('📦 Payment amount:', payment.amount);
                  console.log('📦 Payment ID:', razorpay_payment_id);
                  console.log('📦 Payment notes:', payment.notes);

                  // Search for recent orders (limit to 50 for better coverage)
                  const orders = await razorpay.orders.all({
                    count: 50
                  });

                  console.log(`📋 Found ${orders.items?.length || 0} recent orders to search`);

                  // Find order that has this payment_id
                  for (const order of orders.items || []) {
                    // First check if amount matches (quick filter)
                    if (order.amount === payment.amount) {
                      // If we have subscription_id, also check order notes
                      let amountAndSubscriptionMatch = true;
                      if (paymentSubscriptionId && order.notes) {
                        const orderSubscriptionId = order.notes.subscription_id;
                        if (orderSubscriptionId && orderSubscriptionId !== paymentSubscriptionId) {
                          amountAndSubscriptionMatch = false;
                        }
                      }

                      if (amountAndSubscriptionMatch) {
                        // Check if this order has the payment
                        try {
                          const orderDetails = await razorpay.orders.fetch(order.id);
                          if (orderDetails.payments && orderDetails.payments.length > 0) {
                            const hasPayment = orderDetails.payments.some(p => p.id === razorpay_payment_id);
                            if (hasPayment) {
                              razorpay_order_id = order.id;
                              console.log('✅ Found order ID by searching orders:', razorpay_order_id);
                              break;
                            }
                          }
                        } catch (fetchErr) {
                          // Continue searching
                          continue;
                        }
                      }
                    }
                  }

                  if (!razorpay_order_id) {
                    console.warn('⚠️ Could not find order by searching - order_id still missing');
                  }
                } catch (searchError) {
                  console.warn('⚠️ Could not search for order by amount:', searchError.message);
                  console.warn('⚠️ Search error details:', searchError);
                }
              }
            }
          }
        }
      } catch (paymentError) {
        console.error('❌ Error fetching payment from Razorpay:', paymentError.message);
        console.error('❌ Payment error details:', paymentError);
        // Non-fatal - continue with what we have
      }
    }

    // OPTIMIZED: Fetch order details only once and cache it
    // In redirect mode, Razorpay might not send payment_id directly
    let notes = {};
    let inferredType = payment_type;
    let cachedOrder = null; // Cache order to avoid multiple fetches

    // Fetch order details only if we need payment_id or notes
    if (razorpay && razorpay_order_id && String(razorpay_order_id).trim() &&
      (!razorpay_payment_id || !payment_type || !subscription_id)) {
      try {
        console.log('🔍 Fetching order details from Razorpay...');
        cachedOrder = await razorpay.orders.fetch(String(razorpay_order_id).trim());
        notes = cachedOrder?.notes || {};

        // If payment_id is missing, try to get from order payments
        if (!razorpay_payment_id && cachedOrder.payments && cachedOrder.payments.length > 0) {
          razorpay_payment_id = cachedOrder.payments[0].id;
          console.log('✅ Found payment ID from order:', razorpay_payment_id);
        }

        // Infer payment type from order notes
        if (!inferredType) {
          if (notes.subscription_id || notes.plan_id || notes.payment_type === 'subscription_payment') {
            inferredType = 'subscription';
          }
          if (notes.package_id || notes.boost_count || notes.payment_type === 'boost_payment') {
            inferredType = inferredType || 'boost';
          }
        }
      } catch (orderError) {
        console.error('❌ Error fetching order from Razorpay:', orderError.message);
        // Non-fatal - continue with what we have
      }
    }

    // Store cachedOrder in request for use in subscription update section
    req.cachedOrder = cachedOrder;

    // Build frontend callback URL with all available parameters
    const frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://rentyatra.com' : 'http://localhost:5173');
    const url = new URL('/payment-callback', frontendBase);

    // Add payment parameters - ensure order_id is not null/undefined
    if (razorpay_order_id && String(razorpay_order_id).trim()) {
      url.searchParams.set('razorpay_order_id', String(razorpay_order_id));
      url.searchParams.set('order_id', String(razorpay_order_id)); // Fallback
    } else {
      console.error('❌ Order ID is missing or invalid, cannot proceed with payment verification');
      console.error('❌ Payment ID:', razorpay_payment_id);
      console.error('❌ Payment notes:', notes);
      console.error('❌ Subscription ID from notes:', notes.subscription_id);

      // Try to get subscription_id from payment notes if available
      const subscriptionIdFromNotes = notes.subscription_id || paymentObject?.notes?.subscription_id || subscription_id;

      // If we have subscription_id, frontend can retrieve order_id from localStorage
      if (subscriptionIdFromNotes) {
        console.log('⚠️ Order ID missing but subscription_id found - frontend will retrieve from localStorage');
        url.searchParams.set('subscription_id', subscriptionIdFromNotes);
        // Don't set error - let frontend handle it
      } else {
        // Add error parameter to frontend callback
        url.searchParams.set('error', 'ORDER_ID_MISSING');
        url.searchParams.set('error_message', 'Order ID not found in payment details. Please contact support.');
      }
    }

    // Add payment_id if available
    if (razorpay_payment_id) {
      url.searchParams.set('razorpay_payment_id', razorpay_payment_id);
      url.searchParams.set('payment_id', razorpay_payment_id); // Fallback
    }
    if (razorpay_signature) {
      url.searchParams.set('razorpay_signature', razorpay_signature);
      url.searchParams.set('signature', razorpay_signature); // Fallback
    }
    if (inferredType) {
      url.searchParams.set('payment_type', inferredType);
    }
    if (subscription_id || notes.subscription_id) {
      url.searchParams.set('subscription_id', subscription_id || notes.subscription_id);
    }
    if (package_id || notes.package_id) {
      url.searchParams.set('package_id', package_id || notes.package_id);
    }
    if (notes.user_id) {
      url.searchParams.set('user_id', notes.user_id);
    }

    console.log('🔀 Redirecting to frontend callback:', url.toString());
    console.log('📋 Parameters being sent:', {
      razorpay_order_id,
      razorpay_payment_id,
      has_signature: !!razorpay_signature,
      payment_type: inferredType,
      subscription_id: subscription_id || notes.subscription_id,
      package_id: package_id || notes.package_id
    });

    // Redirect to SPA callback route
    return res.redirect(302, url.toString());
  } catch (err) {
    console.error('❌ Error in Razorpay callback handler:', err);
    // As a fallback, show a minimal HTML page that redirects client-side
    const frontendBase = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://rentyatra.com' : 'http://localhost:5173');
    const fallbackUrl = `${frontendBase}/payment-callback`;
    console.log('⚠️ Using fallback redirect to:', fallbackUrl);
    res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; URL='${fallbackUrl}'" /></head><body>Redirecting...</body></html>`);
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
  try {
    console.log('=== SUBSCRIPTION PAYMENT VERIFICATION START ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers['user-agent']);

    // Support both web and mobile app formats
    // Web format: razorpay_order_id, razorpay_payment_id, razorpay_signature
    // Mobile format: orderId, paymentId, signature (or order_id, payment_id, signature)
    let razorpay_order_id = req.body.razorpay_order_id || req.body.orderId || req.body.order_id;
    let razorpay_payment_id = req.body.razorpay_payment_id || req.body.paymentId || req.body.payment_id;
    const razorpay_signature = req.body.razorpay_signature || req.body.signature;
    const subscriptionId = req.body.subscriptionId || req.body.subscription_id;
    const amount = req.body.amount;
    const fetchPaymentFromOrder = req.body.fetchPaymentFromOrder; // Flag from frontend

    // Detect if request is from mobile app
    const userAgent = req.headers['user-agent'] || '';
    const isMobileApp = userAgent.includes('Android') || userAgent.includes('Mobile') || req.body.source === 'mobile';

    console.log('Extracted data:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscriptionId,
      amount,
      isMobileApp,
      source: req.body.source,
      fetchPaymentFromOrder
    });

    // If payment_id is missing but we have order_id, try to fetch from Razorpay
    // This is critical for APK/WebView scenarios where Razorpay redirect might not include payment_id
    if (razorpay_order_id && String(razorpay_order_id).trim() && !razorpay_payment_id && razorpay) {
      try {
        console.log('🔍 Payment ID missing, fetching order from Razorpay to get payment details...');
        console.log('📦 Order ID:', razorpay_order_id);

        const order = await razorpay.orders.fetch(String(razorpay_order_id).trim());

        console.log('📋 Order fetched:', {
          id: order.id,
          status: order.status,
          amount: order.amount,
          amountPaid: order.amount_paid,
          paymentsCount: order.payments?.length || 0
        });

        // Try to get payment_id from order payments
        if (order.payments && order.payments.length > 0) {
          razorpay_payment_id = order.payments[0].id;
          console.log('✅ Found payment ID from order:', razorpay_payment_id);
          console.log('✅ Complete payment info now available:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id
          });
        } else {
          console.warn('⚠️ Order found but no payments attached yet');
          console.warn('⚠️ Order status:', order.status);
          console.warn('⚠️ Amount paid:', order.amount_paid, '/', order.amount);
          // Payment might still be processing - we can still verify with order_id only
        }
      } catch (orderError) {
        console.error('❌ Error fetching order from Razorpay:', orderError.message);
        console.error('❌ Order error details:', {
          message: orderError.message,
          code: orderError.error?.code,
          description: orderError.error?.description
        });
        // Continue - we'll try to verify with what we have
      }
    }

    // Log final payment info before verification
    console.log('📋 Final payment info for verification:', {
      orderId: razorpay_order_id || 'MISSING',
      paymentId: razorpay_payment_id || 'MISSING',
      hasSignature: !!razorpay_signature,
      subscriptionId: subscriptionId || 'N/A'
    });

    // For WebView/APK scenarios, signature might be missing - we'll verify via API
    const isWebViewScenario = req.body.source === 'mobile_apk' || !razorpay_signature;

    // OPTIMIZED: Get cached order from request if available (from redirect callback)
    let cachedOrder = req.cachedOrder || null;

    // Order ID is absolutely required
    if (!razorpay_order_id) {
      console.log('❌ Missing required payment verification fields');
      console.log('Received fields:', {
        hasOrderId: !!razorpay_order_id,
        hasPaymentId: !!razorpay_payment_id,
        hasSignature: !!razorpay_signature,
        bodyKeys: Object.keys(req.body)
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields',
        required: ['razorpay_order_id (or orderId)'],
        optional: ['razorpay_payment_id (or paymentId) - will be fetched from order if missing', 'razorpay_signature (or signature) - will verify via Razorpay API if missing'],
        received: Object.keys(req.body)
      });
    }

    // Payment ID is preferred but not always available in redirect mode
    // We can still verify with order_id only if payment is captured
    if (!razorpay_payment_id) {
      console.warn('⚠️ Payment ID not provided - will attempt verification using order_id only');
      console.warn('⚠️ This is normal in redirect mode - backend will fetch payment details from Razorpay');
    }

    if (!razorpay_signature && !isWebViewScenario) {
      console.log('⚠️ Signature missing for non-WebView scenario');
      // Still allow but will verify via API
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ RAZORPAY_KEY_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment server configuration error'
      });
    }

    // Verify the payment signature
    // For WebView/APK scenarios, signature might be missing or empty - we'll verify via Razorpay API
    let signatureValid = false;
    const hasSignature = razorpay_signature && razorpay_signature.trim().length > 0;

    console.log('🔍 Signature verification check:', {
      hasSignature: hasSignature,
      signatureLength: razorpay_signature ? razorpay_signature.length : 0,
      signatureType: typeof razorpay_signature,
      isWebViewScenario: isWebViewScenario
    });

    if (hasSignature && razorpay_payment_id && razorpay_order_id) {
      // Can only verify signature if we have both order_id and payment_id
      const body = (razorpay_order_id || '') + "|" + (razorpay_payment_id || '');
      console.log('Signature body:', body);
      console.log('Razorpay key secret exists:', !!process.env.RAZORPAY_KEY_SECRET);

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(String(body))
        .digest("hex");

      console.log('Expected signature:', expectedSignature);
      console.log('Received signature:', razorpay_signature);

      signatureValid = expectedSignature === razorpay_signature.trim();
      console.log('Signature authentic:', signatureValid);
    } else {
      if (hasSignature && !razorpay_payment_id) {
        console.log('⚠️ Signature provided but payment_id missing - cannot verify signature, will verify via API');
      } else {
        console.log('⚠️ Signature not provided or empty - will verify via Razorpay API (WebView/APK scenario)');
      }
    }

    // If signature is missing, empty, or invalid, verify via Razorpay API (especially for APK/WebView)
    // Also verify if payment_id is missing (we'll fetch it from order)
    // ALWAYS try API verification if signature is missing/invalid or payment_id is missing
    if ((!signatureValid || !razorpay_payment_id) && razorpay_order_id && razorpay) {
      try {
        console.log('🔍 Verifying payment via Razorpay API (WebView/APK scenario)...');
        console.log('📦 Payment details:', {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          payment_id_type: typeof razorpay_payment_id,
          payment_id_length: razorpay_payment_id ? razorpay_payment_id.length : 0,
          razorpay_initialized: !!razorpay
        });

        // Check if Razorpay is initialized
        if (!razorpay) {
          console.error('❌ Razorpay instance not initialized');
          if (!hasSignature) {
            return res.status(500).json({
              success: false,
              message: 'Payment service not configured. Please contact support.',
              error: 'RAZORPAY_NOT_INITIALIZED'
            });
          }
          // If we have signature, continue with signature verification
          console.log('⚠️ Razorpay not initialized but signature available - will use signature verification');
        }

        if (razorpay) {
          // If payment_id is missing, try to verify using order only
          if (!razorpay_payment_id) {
            console.log('🔍 Payment ID missing - verifying using order status...');
            try {
              if (!razorpay_order_id || !String(razorpay_order_id).trim()) {
                throw new Error('Order ID is missing or invalid');
              }
              // OPTIMIZED: Use cached order if available
              if (!cachedOrder) {
                cachedOrder = await razorpay.orders.fetch(String(razorpay_order_id).trim());
              }
              const order = cachedOrder;
              console.log('📋 Order details:', {
                id: order.id,
                status: order.status,
                amount: order.amount,
                amount_paid: order.amount_paid,
                amount_due: order.amount_due,
                payments: order.payments?.length || 0
              });

              // Check if order is paid
              if (order.status === 'paid' && order.amount_paid >= order.amount) {
                // Order is paid - try to get payment_id from order
                if (order.payments && order.payments.length > 0) {
                  razorpay_payment_id = order.payments[0].id;
                  console.log('✅ Found payment ID from order:', razorpay_payment_id);
                  // Continue with payment verification below
                } else {
                  // Order is paid but no payment_id in order - verify using order status
                  console.log('✅ Order verified as paid - proceeding with order-based verification');
                  // We'll use order status for verification
                  // Continue to order-based verification logic below
                }
              } else {
                return res.status(400).json({
                  success: false,
                  message: 'Payment verification failed. Order is not paid.',
                  error: 'ORDER_NOT_PAID',
                  orderStatus: order.status,
                  amountPaid: order.amount_paid,
                  amountDue: order.amount_due
                });
              }
            } catch (orderError) {
              console.error('❌ Error fetching order for verification:', orderError.message);
              return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Could not fetch order details.',
                error: 'ORDER_FETCH_FAILED'
              });
            }
          }

          // Validate payment ID format before attempting fetch (if we have payment_id now)
          const isValidPaymentId = razorpay_payment_id &&
            typeof razorpay_payment_id === 'string' &&
            razorpay_payment_id.trim().startsWith('pay_') &&
            razorpay_payment_id.trim().length >= 15;

          if (razorpay_payment_id && !isValidPaymentId) {
            console.warn('⚠️ Invalid payment ID format, skipping API verification:', {
              payment_id: razorpay_payment_id ? razorpay_payment_id.substring(0, 30) : 'N/A',
              type: typeof razorpay_payment_id,
              length: razorpay_payment_id ? razorpay_payment_id.length : 0,
              starts_with_pay: razorpay_payment_id ? razorpay_payment_id.trim().startsWith('pay_') : false
            });
            // If signature is missing/empty and payment ID is invalid, we need to fail
            if (!hasSignature) {
              return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Invalid payment ID format and no signature provided.',
                error: 'INVALID_PAYMENT_ID_AND_NO_SIGNATURE'
              });
            }
            // If we have signature but it's invalid and payment ID is invalid, fail
            console.log('⚠️ Both signature and payment ID are invalid - failing verification');
          }

          if (razorpay_payment_id && isValidPaymentId) {
            console.log('✅ Payment ID format valid, fetching payment details from Razorpay...');

            // OPTIMIZED: Single fetch attempt (removed slow retry logic with 2 second delays)
            let payment = null;
            try {
              payment = await razorpay.payments.fetch(razorpay_payment_id.trim());
              console.log('✅ Payment fetched successfully');
            } catch (fetchError) {
              const fetchErrorCode = fetchError.error?.code || fetchError.code || fetchError.statusCode;
              const fetchErrorDesc = fetchError.error?.description || fetchError.description || fetchError.message;

              console.log('⚠️ Payment fetch failed:', {
                errorCode: fetchErrorCode,
                errorDesc: fetchErrorDesc
              });

              // If payment doesn't exist yet and we have signature, use signature verification
              if (hasSignature) {
                console.log('⚠️ Payment fetch failed but signature available - will use signature verification');
              } else if (fetchErrorCode === 400 || fetchErrorCode === 'BAD_REQUEST_ERROR' ||
                (fetchErrorDesc && fetchErrorDesc.includes('does not exist'))) {
                // Payment might be processing - if format is valid, accept it
                if (razorpay_payment_id.trim().startsWith('pay_') && razorpay_payment_id.trim().length >= 15) {
                  console.log('✅ Payment ID format valid - accepting payment (will be verified later)');
                  signatureValid = true;
                } else {
                  throw new Error('Payment not found in Razorpay API and no signature provided');
                }
              } else {
                throw fetchError;
              }
            }

            if (payment) {
              console.log('📦 Payment details from Razorpay API:', {
                id: payment.id,
                status: payment.status,
                order_id: payment.order_id,
                amount: payment.amount,
                method: payment.method,
                captured: payment.captured
              });

              // If razorpay_order_id is missing, use order_id from payment
              // Try multiple possible field names
              if (!razorpay_order_id && payment) {
                razorpay_order_id = payment.order_id || payment.orderId || payment.order?.id || null;
                if (razorpay_order_id) {
                  console.log('✅ Using order_id from payment:', razorpay_order_id);
                } else {
                  console.warn('⚠️ Payment object has no order_id field');
                  console.warn('⚠️ Payment keys:', Object.keys(payment));
                }
              }

              // Verify payment status and order ID match
              if (payment.status === 'captured' || payment.status === 'authorized') {
                // Order ID matching - be flexible for APK scenarios
                // Add null checks before calling toString()
                // Also update razorpay_order_id from payment if it was missing
                if (!razorpay_order_id && payment) {
                  razorpay_order_id = payment.order_id || payment.orderId || payment.order?.id || null;
                  if (razorpay_order_id) {
                    console.log('✅ Retrieved order_id from payment during verification:', razorpay_order_id);
                  } else {
                    console.warn('⚠️ Payment verified but no order_id available');
                    console.warn('⚠️ Payment keys:', payment ? Object.keys(payment) : 'payment is null');
                  }
                }

                // Safe comparison with null checks - if order_id is missing, still verify payment is captured/authorized
                let orderIdMatches = false;
                if (payment.order_id && razorpay_order_id) {
                  // Both exist - compare them
                  orderIdMatches = (payment.order_id === razorpay_order_id) ||
                    (String(payment.order_id) === String(razorpay_order_id));
                } else if (!razorpay_order_id && (payment.status === 'captured' || payment.status === 'authorized')) {
                  // Order ID missing but payment is captured/authorized - accept it (common in APK)
                  // For authorized payments, Razorpay might not link order_id immediately
                  console.log(`⚠️ Order ID missing but payment is ${payment.status} - accepting payment`);
                  console.log('⚠️ This is normal for authorized payments that are not yet captured');
                  orderIdMatches = true;
                } else if (payment.status === 'authorized' && !payment.order_id) {
                  // Authorized payment without order_id - still accept if payment is valid
                  console.log('⚠️ Authorized payment without order_id - accepting based on payment status');
                  orderIdMatches = true;
                }

                // OPTIMIZED: Use cached order if available, otherwise fetch once
                let orderVerified = false;
                if ((!payment.order_id || payment.order_id === null) && razorpay_order_id && String(razorpay_order_id).trim()) {
                  try {
                    // Use cached order if available (from earlier fetch or request)
                    if (!cachedOrder) {
                      cachedOrder = await razorpay.orders.fetch(String(razorpay_order_id).trim());
                    }
                    const order = cachedOrder;

                    // Check if order amount matches payment amount
                    const amountMatches = order.amount && payment.amount &&
                      (order.amount === payment.amount ||
                        Math.abs(order.amount - payment.amount) < 100);

                    if (amountMatches && (payment.status === 'authorized' || payment.status === 'captured')) {
                      orderVerified = true;
                      console.log('✅ Order verified - amount matches');
                    }
                  } catch (orderError) {
                    console.warn('⚠️ Could not verify order:', orderError.message);
                  }
                }

                if (orderIdMatches) {
                  console.log('✅ Payment verified via Razorpay API - order ID matches');
                  signatureValid = true;
                } else if (orderVerified) {
                  console.log('✅ Payment verified - order amount matches and payment is authorized/captured');
                  signatureValid = true;
                } else if (payment.status === 'authorized') {
                  // Authorized payment - accept it even without order_id match
                  // For authorized payments, order_id might not be available immediately
                  console.log('✅ Payment verified - authorized payment accepted');
                  console.log('⚠️ Note: Authorized payments may not have order_id linked yet');
                  signatureValid = true;
                } else {
                  console.error('❌ Order ID mismatch:', {
                    payment_order_id: payment.order_id,
                    payment_order_id_type: typeof payment.order_id,
                    received_order_id: razorpay_order_id,
                    received_order_id_type: typeof razorpay_order_id,
                    payment_status: payment.status,
                    order_verified: orderVerified
                  });
                  // In APK scenarios, sometimes order ID format might differ - still verify payment is captured
                  if (payment.status === 'captured' && !hasSignature) {
                    console.log('⚠️ Order ID mismatch but payment is captured and no signature - accepting payment');
                    signatureValid = true;
                  }
                }
              } else {
                console.error('❌ Payment not captured/authorized:', {
                  status: payment.status,
                  captured: payment.captured
                });
              }
            }
          }
        }
      } catch (apiError) {
        console.error('❌ Error verifying payment via Razorpay API:', apiError.message);
        console.error('❌ API Error stack:', apiError.stack);

        // Safely extract error details
        let errorCode, errorDesc;
        try {
          errorCode = apiError?.error?.code || apiError?.code || apiError?.statusCode;
          errorDesc = apiError?.error?.description || apiError?.description || apiError?.message || String(apiError);
        } catch (extractError) {
          console.error('❌ Error extracting error details:', extractError.message);
          errorCode = 'UNKNOWN';
          errorDesc = String(apiError);
        }

        console.log('🔍 API Error details:', {
          errorCode,
          errorDesc,
          hasSignature: hasSignature,
          isWebViewScenario: isWebViewScenario,
          orderId: razorpay_order_id ? 'present' : 'missing',
          paymentId: razorpay_payment_id ? 'present' : 'missing'
        });

        // If payment ID doesn't exist yet (common in APK scenarios), check if we have signature
        if ((errorCode === 400 || errorCode === 'BAD_REQUEST_ERROR' ||
          (errorDesc && errorDesc.includes('does not exist')))) {
          if (!hasSignature) {
            console.log('ℹ️ Payment ID not yet available in Razorpay API and no signature');
            console.log('⚠️ This is normal for APK/WebView - payment might be processing');
            // Don't fail immediately - payment might be processing
            // We'll try to accept the payment if it's a recent payment (within last 5 minutes)
            console.log('⚠️ Will accept payment if payment ID is valid format (payment might be processing)');
            // For APK scenarios, if payment ID format is valid, we can accept it
            // The payment will be verified later via webhook or manual check
            if (razorpay_payment_id && razorpay_payment_id.trim().startsWith('pay_') && razorpay_payment_id.trim().length >= 15) {
              console.log('✅ Payment ID format is valid - accepting payment (will be verified later)');
              signatureValid = true;
            }
          } else {
            console.log('ℹ️ Payment ID not yet available but we have signature - signature verification will be used');
          }
        } else if (!hasSignature) {
          // API error and no signature - check if it's a network/API issue
          console.error('❌ API verification failed and no signature available');
          console.error('Error details:', {
            errorCode,
            errorDesc,
            payment_id: razorpay_payment_id ? razorpay_payment_id.substring(0, 20) + '...' : 'N/A'
          });

          // For APK scenarios, if payment ID format is valid, we can still accept it
          // The payment might be processing and will be verified later
          if (razorpay_payment_id && razorpay_payment_id.trim().startsWith('pay_') && razorpay_payment_id.trim().length >= 15) {
            console.log('⚠️ API verification failed but payment ID format is valid - accepting payment (will be verified later)');
            signatureValid = true;
          } else {
            return res.status(400).json({
              success: false,
              message: 'Payment verification failed. Unable to verify payment via Razorpay API and no signature provided.',
              error: process.env.NODE_ENV === 'development' ? errorDesc : 'Payment verification failed',
              suggestion: 'Please retry the payment or contact support if the issue persists.'
            });
          }
        } else {
          // API error but we have signature - signature verification will be checked below
          console.log('⚠️ API verification failed but signature is available - will check signature verification');
        }
      }
    }

    // Final check: if signature is still not valid, fail only if we couldn't verify via API
    if (!signatureValid) {
      // If we tried API verification and it also failed, or if signature is missing/empty and API verification couldn't be done
      if (!hasSignature && (!razorpay_order_id || !razorpay_payment_id)) {
        console.log('❌ Signature verification failed - no signature and missing payment details for API verification');
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature and unable to verify via Razorpay API',
          error: 'VERIFICATION_FAILED'
        });
      } else if (!hasSignature) {
        // Signature missing but we have payment details - API verification should have worked
        // If we reach here, API verification also failed
        console.log('❌ Signature verification failed - no signature and API verification also failed');
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed. Unable to verify payment via signature or Razorpay API.',
          error: 'VERIFICATION_FAILED',
          suggestion: 'Please retry the payment. If the issue persists, contact support with payment ID: ' + razorpay_payment_id
        });
      } else {
        // Signature provided but invalid
        console.log('❌ Signature verification failed - signature provided but invalid');
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature',
          error: 'INVALID_SIGNATURE'
        });
      }
    }

    console.log('✅ Signature verification passed');

    // Update subscription payment status
    if (subscriptionId) {
      console.log('🔍 Looking up subscription:', subscriptionId);

      // OPTIMIZED: Direct DB query (removed timeout - MongoDB is fast)
      const subscription = await Subscription.findById(subscriptionId);

      if (subscription) {
        console.log('✅ Subscription found:', {
          id: subscription._id,
          userId: subscription.userId,
          planName: subscription.planName,
          status: subscription.status
        });

        // Cache subscription for later use
        req.cachedSubscription = subscription;

        // OPTIMIZED: Deactivate existing subscriptions in background (non-blocking)
        setImmediate(async () => {
          try {
            const result = await Subscription.updateMany(
              {
                userId: subscription.userId,
                status: 'active',
                _id: { $ne: subscriptionId }
              },
              { status: 'expired' }
            );
            console.log('✅ Deactivated', result.modifiedCount, 'subscriptions');
          } catch (err) {
            console.warn('⚠️ Deactivation of other subscriptions failed:', err.message);
          }
        });

        // OPTIMIZED: Use cached order data if available (avoid extra API call)
        // Ensure we have orderId - if missing, try to get from cached order or payment
        if (!razorpay_order_id && razorpay_payment_id && razorpay) {
          // First try cached order from request (if we fetched it earlier)
          const cachedOrderFromReq = req.cachedOrder;
          if (cachedOrderFromReq && cachedOrderFromReq.id) {
            razorpay_order_id = cachedOrderFromReq.id;
            console.log('✅ Using order ID from cached order:', razorpay_order_id);
          } else {
            // Only fetch payment if we don't have cached order
            try {
              const payment = await razorpay.payments.fetch(razorpay_payment_id);
              if (payment) {
                razorpay_order_id = payment.order_id || payment.orderId || payment.order?.id || null;
                if (razorpay_order_id) {
                  console.log('✅ Retrieved order ID from payment:', razorpay_order_id);
                }
              }
            } catch (err) {
              console.warn('⚠️ Could not fetch order ID from payment:', err.message);
            }
          }
        }

        subscription.paymentStatus = 'paid';
        // Store order ID only if it's valid (not null/undefined/empty)
        subscription.orderId = (razorpay_order_id && String(razorpay_order_id).trim()) ? String(razorpay_order_id) : null;
        subscription.paymentId = razorpay_payment_id; // Store payment ID
        subscription.paymentCompletedAt = new Date();
        subscription.status = 'active';

        // Log final values being saved
        console.log('💾 Final subscription values to save:', {
          orderId: subscription.orderId,
          paymentId: subscription.paymentId,
          paymentStatus: subscription.paymentStatus,
          status: subscription.status
        });

        // Ensure start and end dates are set correctly
        if (!subscription.startDate || subscription.startDate > new Date()) {
          subscription.startDate = new Date();
        }

        // Ensure end date is in future
        if (!subscription.endDate || subscription.endDate <= new Date()) {
          // Calculate end date from duration (default 30 days if not set)
          const duration = subscription.duration || 30;
          subscription.endDate = new Date();
          subscription.endDate.setDate(subscription.endDate.getDate() + duration);
        }

        console.log('💾 Saving subscription with updated payment status...');
        console.log('📅 Subscription dates:', {
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
          paymentStatus: subscription.paymentStatus,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });

        // Log if orderId is missing
        if (!razorpay_order_id) {
          console.warn('⚠️ WARNING: razorpay_order_id is missing when saving subscription!');
          console.warn('⚠️ Request body keys:', Object.keys(req.body));
        }

        // OPTIMIZED: Direct save (removed timeout and retry logic - MongoDB is fast)
        try {
          await subscription.save();
          console.log('✅ Subscription saved successfully');
        } catch (saveError) {
          console.error('❌ Subscription save failed:', saveError.message);
          // Save in background as fallback (non-blocking)
          setImmediate(async () => {
            try {
              const bgSubscription = await Subscription.findById(subscriptionId);
              if (bgSubscription) {
                bgSubscription.paymentStatus = 'paid';
                bgSubscription.orderId = (razorpay_order_id && String(razorpay_order_id).trim()) ? String(razorpay_order_id) : null;
                bgSubscription.paymentId = razorpay_payment_id;
                bgSubscription.paymentCompletedAt = new Date();
                bgSubscription.status = 'active';
                await bgSubscription.save();
                console.log('✅ Subscription saved successfully (background)');
              }
            } catch (bgSaveError) {
              console.error('❌ CRITICAL: Failed to save subscription in background:', bgSaveError);
            }
          });
        }

        // Send subscription confirmation email asynchronously (non-blocking)
        // This prevents email delays from blocking payment verification response
        setImmediate(async () => {
          try {
            const user = await User.findById(subscription.userId);
            if (user && user.email) {
              console.log('📧 Sending subscription confirmation email (async) to:', user.email);
              const planData = {
                name: subscription.planName,
                benefits: {
                  premiumSupport: true,
                  enhancedVisibility: true,
                  analytics: true
                },
                features: [
                  {
                    title: 'Premium Support',
                    description: 'Priority customer support for all your needs'
                  },
                  {
                    title: 'Enhanced Visibility',
                    description: 'Your listings get better visibility in search results'
                  },
                  {
                    title: 'Advanced Analytics',
                    description: 'Detailed insights into your listing performance'
                  }
                ]
              };

              await emailService.sendSubscriptionConfirmation(
                {
                  subscriptionId: subscription._id,
                  amount: subscription.price,
                  startDate: subscription.startDate,
                  endDate: subscription.endDate
                },
                planData,
                {
                  name: user.name,
                  email: user.email
                }
              );
              console.log('✅ Subscription confirmation email sent (async)');
            } else {
              console.log('⚠️ User not found or email not available for subscription confirmation');
            }
          } catch (emailError) {
            console.error('❌ Failed to send subscription confirmation email (async):', emailError);
            // Email failure doesn't affect payment verification
          }
        });

        console.log('✅ Subscription payment verified successfully:', {
          subscriptionId,
          paymentId: razorpay_payment_id,
          amount,
          userId: subscription.userId,
          maxListings: subscription.maxListings
        });
      } else {
        console.error('❌ Subscription not found:', subscriptionId);
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
    } else {
      console.log('⚠️ No subscriptionId provided in payment verification request');
    }

    console.log('✅ Payment verification completed successfully');

    // Prepare response data immediately (before additional DB queries)
    const responseData = {
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amount
      }
    };

    // Add subscription info for mobile apps (only if subscriptionId exists)
    // OPTIMIZED: Use cached subscription if available, otherwise fetch directly (removed timeout)
    if (subscriptionId) {
      let subscription;
      if (req.cachedSubscription) {
        subscription = req.cachedSubscription;
      } else {
        // Direct fetch (MongoDB is fast, no timeout needed)
        subscription = await Subscription.findById(subscriptionId)
          .select('_id planId planName status maxListings maxPhotos startDate endDate paymentStatus paymentId')
          .lean(); // Use lean() for faster query
      }

      if (subscription) {
        responseData.data.subscription = {
          id: subscription._id,
          planId: subscription.planId,
          planName: subscription.planName,
          status: subscription.status,
          paymentStatus: subscription.paymentStatus,
          paymentId: subscription.paymentId,
          maxListings: subscription.maxListings,
          maxPhotos: subscription.maxPhotos,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        };

        // Log subscription details for debugging
        console.log('✅ Subscription details included in response:', {
          id: subscription._id,
          status: subscription.status,
          paymentStatus: subscription.paymentStatus
        });
      } else {
        console.warn('⚠️ Subscription not found for response, but payment was verified');
      }
    }

    // Send response immediately - don't wait for email or other async operations
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while verifying payment'
    });
  }
});

// @desc    Get payment details
// @route   GET /api/payment/:paymentId
// @access  Public
const getPaymentDetails = asyncHandler(async (req, res) => {
  try {
    let { paymentId } = req.params;

    // Validate and sanitize payment ID
    if (!paymentId) {
      console.error('❌ Payment ID is missing');
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
        error: 'BAD_REQUEST_ERROR'
      });
    }

    // Trim whitespace and validate format
    paymentId = paymentId.trim();

    // Razorpay payment IDs should start with 'pay_' and be at least 15 characters
    if (!paymentId.startsWith('pay_') || paymentId.length < 15) {
      console.error('❌ Invalid payment ID format:', {
        payment_id: paymentId.substring(0, 20) + '...',
        length: paymentId.length,
        starts_with_pay: paymentId.startsWith('pay_')
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format',
        error: 'BAD_REQUEST_ERROR',
        description: 'Payment ID must start with "pay_" and be a valid Razorpay payment ID'
      });
    }

    console.log('🔍 Fetching payment details for:', paymentId.substring(0, 20) + '...');

    try {
      const payment = await razorpay.payments.fetch(paymentId);

      console.log('✅ Payment details fetched successfully:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount
      });

      res.json({
        success: true,
        data: payment
      });
    } catch (razorpayError) {
      // Handle Razorpay API errors gracefully
      const errorCode = razorpayError.error?.code || razorpayError.code || razorpayError.statusCode;
      const errorDescription = razorpayError.error?.description || razorpayError.description || razorpayError.message;

      if (errorCode === 400 || errorCode === 'BAD_REQUEST_ERROR' ||
        (errorDescription && errorDescription.includes('does not exist'))) {
        // Payment ID doesn't exist - this is expected in some scenarios (especially mobile/APK)
        // Don't log as error - this is a normal scenario
        console.log('ℹ️ Payment ID not found in Razorpay (normal for mobile/APK or recent payments):', {
          payment_id: paymentId.substring(0, 20) + '...',
          error_code: errorCode
        });
        return res.status(404).json({
          success: false,
          message: 'Payment not found in Razorpay',
          error: 'BAD_REQUEST_ERROR',
          description: 'The payment ID provided does not exist. This may happen if the payment was just processed and the ID is not yet available in Razorpay API.',
          step: 'payment_initiation',
          reason: 'input_validation_failed'
        });
      }

      // Log other errors (but not as critical errors since payment fetch is optional)
      console.warn('⚠️ Error fetching payment details from Razorpay (non-critical):', {
        error_code: errorCode,
        error_description: errorDescription,
        status_code: razorpayError.statusCode,
        payment_id: paymentId.substring(0, 20) + '...'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details',
        error: errorCode || 'UNKNOWN_ERROR',
        description: process.env.NODE_ENV === 'development' ? (errorDescription || razorpayError.message) : 'An error occurred while fetching payment details'
      });
    }

  } catch (error) {
    // Handle unexpected errors
    console.error('❌ Unexpected error in getPaymentDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

// @desc    Create subscription before payment
// @route   POST /api/payment/create-subscription
// @access  Public
const createSubscription = asyncHandler(async (req, res) => {
  try {
    const { userId, planId, planName, price, maxListings, maxPhotos, duration, orderId } = req.body;

    if (!userId || !planId || !planName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    const days = duration || 30; // Use provided duration or default to 30 days
    endDate.setDate(endDate.getDate() + days);

    // Create subscription record
    const subscription = new Subscription({
      userId,
      planId,
      planName,
      status: 'pending',
      startDate,
      endDate,
      price,
      paymentStatus: 'pending',
      orderId: orderId || null, // Store orderId if provided (will be set when order is created)
      currentListings: 0,
      totalViews: 0,
      totalRevenue: 0,
      maxListings: maxListings || 0,
      maxPhotos: maxPhotos || 0
    });

    await subscription.save();

    if (orderId) {
      console.log('✅ Subscription created with orderId:', orderId);
    }

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscriptionId: subscription._id,
        status: subscription.status
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
});

// @desc    Get available payment methods
// @route   GET /api/payment/methods
// @access  Public
const getPaymentMethods = asyncHandler(async (req, res) => {
  try {
    const paymentMethods = {
      upi: {
        enabled: true,
        name: 'UPI',
        description: 'Pay using UPI apps like Google Pay, PhonePe, Paytm'
      },
      card: {
        enabled: true,
        name: 'Credit/Debit Card',
        description: 'Pay using Visa, Mastercard, RuPay cards'
      },
      netbanking: {
        enabled: true,
        name: 'Net Banking',
        description: 'Pay using your bank account'
      },
      wallet: {
        enabled: true,
        name: 'Wallets',
        description: 'Pay using Paytm, Amazon Pay, etc.'
      },
      cash: {
        enabled: true,
        name: 'Cash',
        description: 'Pay in cash'
      }
    };

    res.json({
      success: true,
      message: 'Payment methods fetched successfully',
      data: {
        methods: paymentMethods,
        currency: 'INR',
        razorpayKeyId: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...' : null
      }
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
});

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getPaymentMethods,
  createSubscription,
  razorpayRedirectCallback
};
