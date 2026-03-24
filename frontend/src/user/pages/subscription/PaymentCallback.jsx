import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import razorpayService from '../../../services/razorpayService';
import boostPaymentService from '../../../services/boostPaymentService';
import { useBoost } from '../../../contexts/BoostContext';
import { useAuth } from '../../../contexts/AuthContext';
import { isRunningInFlutterWebView, navigateInMobileApp } from '../../../utils/mobileAppBridge';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBoostCredits, updateBoostCredits, loadBoostCredits } = useBoost(); // BoostContext has built-in fallback handling
  
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing payment...');
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  // CRITICAL: Prevent duplicate verification requests
  const verificationStarted = useRef(false);
  const processedPayments = useRef(new Set());

  useEffect(() => {
    const processPaymentCallback = async () => {
      // CRITICAL: Prevent duplicate verification - check if already processing
      if (verificationStarted.current) {
        console.log('⚠️ Payment verification already in progress, skipping duplicate request');
        return;
      }
      try {
        // Check if we're in browser instead of WebView (this means callback opened in external browser)
        const isInBrowser = !isRunningInFlutterWebView();
        if (isInBrowser) {
          console.log('⚠️ Payment callback opened in external browser instead of WebView');
          console.log('📱 This means the Flutter app needs to intercept the callback URL');
          // Try to redirect back to app using deep link or show message
          // For now, we'll continue processing but show a note
        }
        
        // Check for error parameters first
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('error_message');
        
        if (error === 'ORDER_ID_MISSING') {
          console.error('❌ Order ID missing error from backend:', errorMessage);
          setStatus('error');
          setMessage(errorMessage || 'Payment verification failed: Order ID not found. Please contact support with your payment details.');
          return;
        }
        
        // Extract payment details from URL parameters
        // Razorpay redirect mode may include payment details in different formats
        // CRITICAL: Extract all possible parameter names for APK compatibility
        let razorpay_order_id = searchParams.get('razorpay_order_id') || 
                                 searchParams.get('orderId') || 
                                 searchParams.get('order_id') ||
                                 searchParams.get('razorpay_order_id') ||
                                 searchParams.get('razorpayOrderId'); // Check all possible formats
        
        let razorpay_payment_id = searchParams.get('razorpay_payment_id') || 
                                  searchParams.get('paymentId') || 
                                  searchParams.get('payment_id') ||
                                  searchParams.get('razorpay_payment_id') ||
                                  searchParams.get('razorpayPaymentId');
        
        let razorpay_signature = searchParams.get('razorpay_signature') || 
                                searchParams.get('signature') ||
                                searchParams.get('razorpay_signature') ||
                                searchParams.get('razorpaySignature');
        
        // Log extracted parameters for debugging
        console.log('🔍 Extracted payment parameters from URL:', {
          razorpay_order_id: razorpay_order_id || 'MISSING',
          razorpay_payment_id: razorpay_payment_id || 'MISSING',
          has_signature: !!razorpay_signature,
          allParams: Object.fromEntries(searchParams.entries())
        });
        
        const payment_type = searchParams.get('payment_type') || 'subscription'; // 'subscription' or 'boost'
        let package_id = searchParams.get('package_id') || searchParams.get('packageId');
        let subscription_id = searchParams.get('subscription_id') || searchParams.get('subscriptionId');
        const order_id_from_url = searchParams.get('order_id'); // From our callback URL
        const user_id = searchParams.get('user_id');

        console.log('📋 All URL parameters received:', {
          razorpay_order_id,
          razorpay_payment_id,
          has_signature: !!razorpay_signature,
          payment_type,
          package_id,
          subscription_id,
          order_id_from_url,
          user_id,
          allParams: Object.fromEntries(searchParams.entries())
        });

        // If payment details missing from URL, try to get from localStorage (WebView scenario)
        // This is critical for redirect mode where Razorpay might not include all params
        if ((!razorpay_order_id || !razorpay_payment_id) && payment_type === 'subscription') {
          try {
            const storedPayment = JSON.parse(localStorage.getItem('pending_payment') || '{}');
            if (storedPayment.type === 'subscription' && storedPayment.orderId) {
              console.log('📦 Retrieving payment info from localStorage:', storedPayment);
              razorpay_order_id = razorpay_order_id || storedPayment.orderId;
              subscription_id = subscription_id || storedPayment.subscriptionId;
              
              // Use order_id from our callback URL if available
              if (order_id_from_url && !razorpay_order_id) {
                razorpay_order_id = order_id_from_url;
                console.log('✅ Using order_id from callback URL:', order_id_from_url);
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not retrieve payment info from localStorage:', e);
          }
        }

        // Try to get boost payment info from localStorage if missing
        if ((!razorpay_order_id || !razorpay_payment_id) && payment_type === 'boost') {
          try {
            const storedPayment = JSON.parse(localStorage.getItem('pending_boost_payment') || '{}');
            if (storedPayment.type === 'boost' && storedPayment.orderId) {
              console.log('📦 Retrieving boost payment info from localStorage:', storedPayment);
              razorpay_order_id = razorpay_order_id || storedPayment.orderId;
              package_id = package_id || storedPayment.packageId;
              
              // Use order_id from our callback URL if available
              if (order_id_from_url && !razorpay_order_id) {
                razorpay_order_id = order_id_from_url;
                console.log('✅ Using order_id from callback URL:', order_id_from_url);
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not retrieve boost payment info from localStorage:', e);
          }
        }

        console.log('Payment callback received:', {
          razorpay_order_id,
          razorpay_payment_id,
          has_signature: !!razorpay_signature,
          payment_type,
          package_id,
          subscription_id
        });

        // For WebView scenarios, if we have order_id but no payment_id, try to fetch from backend
        // This can happen in redirect mode where Razorpay doesn't send payment_id directly
        if (razorpay_order_id && !razorpay_payment_id) {
          console.log('⚠️ Payment ID missing, attempting to fetch from backend using order ID...');
          try {
            // Try to get payment details from backend using order_id
            const paymentDetailsResponse = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/payment/${razorpay_order_id}`);
            if (paymentDetailsResponse.ok) {
              const paymentData = await paymentDetailsResponse.json();
              if (paymentData.success && paymentData.data) {
                // Try to extract payment_id from order payments
                const order = paymentData.data;
                if (order.payments && order.payments.length > 0) {
                  razorpay_payment_id = order.payments[0].id;
                  console.log('✅ Found payment ID from backend:', razorpay_payment_id);
                }
              }
            }
          } catch (fetchError) {
            console.warn('⚠️ Could not fetch payment details from backend:', fetchError);
          }
        }
        
        // If still missing critical parameters, show error but also try localStorage
        if (!razorpay_order_id) {
          console.error('❌ Missing order_id - cannot proceed with verification');
          setStatus('error');
          setMessage('Payment verification failed: Missing order ID. Please contact support with your payment details.');
          return;
        }
        
        // Payment ID is critical - if still missing, we can't verify
        // But backend can verify using just order_id in some cases
        if (!razorpay_payment_id) {
          console.warn('⚠️ Payment ID still missing after all attempts');
          console.warn('⚠️ Will attempt verification with order_id only - backend will fetch payment details');
          // Don't fail immediately - backend might be able to handle it
        }
        
        // If signature is missing, backend will handle it for WebView scenarios
        if (!razorpay_signature) {
          console.log('⚠️ Signature not found in URL - backend will handle verification');
        }

        // CRITICAL: Check if this payment was already processed
        const paymentKey = `${razorpay_order_id}_${razorpay_payment_id || 'no_payment_id'}`;
        
        // Check localStorage for already processed payments
        const processedPaymentsStorage = JSON.parse(
          localStorage.getItem('processed_payments') || '[]'
        );
        
        if (processedPaymentsStorage.includes(paymentKey) || processedPayments.current.has(paymentKey)) {
          console.warn('⚠️ Payment already processed, skipping duplicate verification:', paymentKey);
          setStatus('success');
          setMessage('Payment already processed successfully.');
          
          // Navigate to boost page
          setTimeout(() => {
            navigate('/my-boost', { state: { paymentSuccess: true } });
          }, 1000);
          return;
        }
        
        // Mark as processing
        verificationStarted.current = true;
        processedPayments.current.add(paymentKey);

        // Verify payment based on type
        if (payment_type === 'boost') {
          // Boost payment verification
          console.log('🚀 Processing boost payment verification...');
          
          const verificationData = {
            razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id || undefined,
            razorpay_signature: razorpay_signature || undefined,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id || undefined,
            signature: razorpay_signature || undefined
          };
          
          console.log('📤 Boost verification data:', {
            razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id || 'MISSING - will fetch from order',
            has_signature: !!razorpay_signature,
            package_id
          });

          try {
            const result = await boostPaymentService.verifyBoostPayment(verificationData);
            console.log('✅ Boost payment verified:', result);
            
            setPaymentDetails({
              ...result,
              boostCount: result.boostCount || result.creditsAdded
            });
            setStatus('success');
            setMessage(`Boost payment successful! ${result.boostCount || result.creditsAdded || 0} boosts added to your account.`);
            
            // Update boost credits in context
            if (result.boostCount || result.creditsAdded) {
              const creditsToAdd = result.boostCount || result.creditsAdded;
              console.log('💰 Adding boost credits to context:', creditsToAdd);
              addBoostCredits(creditsToAdd, 'purchased');
              
              // Sync with API to get latest credits
              try {
                const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
                const token = localStorage.getItem('token');
                const response = await fetch(`${apiUrl}/boost/credits`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.boostCredits && updateBoostCredits) {
                    console.log('✅ Updated boost credits from API:', data.boostCredits);
                    updateBoostCredits(data.boostCredits);
                  }
                }
              } catch (syncError) {
                console.warn('⚠️ Could not sync boost credits:', syncError);
                // Reload credits as fallback
                if (loadBoostCredits) {
                  loadBoostCredits();
                }
              }
            }
            
            // Clear stored payment info
            try {
              localStorage.removeItem('pending_boost_payment');
              console.log('🧹 Cleared stored boost payment info');
            } catch (e) {
              console.warn('⚠️ Could not clear stored boost payment info:', e);
            }

            // Mark payment as processed
            const processedPaymentsStorage = JSON.parse(
              localStorage.getItem('processed_payments') || '[]'
            );
            if (!processedPaymentsStorage.includes(paymentKey)) {
              processedPaymentsStorage.push(paymentKey);
              localStorage.setItem('processed_payments', JSON.stringify(processedPaymentsStorage));
            }

            // Redirect to boost page
            const redirectToBoost = () => {
              if (isRunningInFlutterWebView()) {
                console.log('📱 Mobile APK detected, using bridge for navigation');
                const navigated = navigateInMobileApp('/my-boost');
                if (!navigated) {
                  console.log('⚠️ Bridge navigation failed, using regular navigation');
                  navigate('/my-boost', { state: { paymentSuccess: true, boostCount: result.boostCount || result.creditsAdded } });
                } else {
                  setTimeout(() => {
                    navigate('/my-boost', { state: { paymentSuccess: true, boostCount: result.boostCount || result.creditsAdded } });
                  }, 1000);
                }
              } else {
                console.log('⚠️ Not in WebView, navigating in browser');
                navigate('/my-boost', { state: { paymentSuccess: true, boostCount: result.boostCount || result.creditsAdded } });
              }
            };
            
            // Try immediately if in WebView, otherwise wait 2 seconds
            if (isRunningInFlutterWebView()) {
              setTimeout(redirectToBoost, 100);
              setTimeout(redirectToBoost, 2000);
            } else {
              setTimeout(redirectToBoost, 2000);
            }
          } catch (error) {
            console.error('❌ Boost payment verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Boost payment verification failed. Please try again or contact support.');
            verificationStarted.current = false;
          }
        } else if (payment_type === 'subscription' || !payment_type) {
          // Subscription payment verification
          // If payment_id is missing, backend will fetch it from Razorpay using order_id
          const verificationData = {
            razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id || undefined, // Send undefined if missing, not empty string
            razorpay_signature: razorpay_signature || undefined, // Send undefined if missing
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id || undefined,
            signature: razorpay_signature || undefined,
            subscriptionId: subscription_id,
            source: 'mobile_apk',
            // Add flag to indicate payment_id might be missing
            fetchPaymentFromOrder: !razorpay_payment_id
          };
          
          console.log('📤 Subscription verification data:', {
            razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id || 'MISSING - will fetch from order',
            has_signature: !!razorpay_signature,
            subscriptionId: subscription_id,
            fetchPaymentFromOrder: !razorpay_payment_id
          });

          const result = await razorpayService.verifyPayment(verificationData);
          setPaymentDetails(result);
          setStatus('success');
          setMessage('Subscription payment successful! Your subscription is now active.');
          
          // Clear stored payment info
          try {
            localStorage.removeItem('pending_payment');
            console.log('🧹 Cleared stored payment info');
          } catch (e) {
            console.warn('⚠️ Could not clear stored payment info:', e);
          }

          // Redirect - try immediately if in WebView, otherwise after 3 seconds
          const redirectToSubscription = () => {
            // Check if running in mobile APK and use bridge for navigation
            if (isRunningInFlutterWebView()) {
              console.log('📱 Mobile APK detected, using bridge for navigation');
              // Try bridge navigation first
              const navigated = navigateInMobileApp('/my-subscription');
              if (!navigated) {
                // Fallback to regular navigation if bridge fails
                console.log('⚠️ Bridge navigation failed, using regular navigation');
                navigate('/my-subscription');
              } else {
                // Also try regular navigation as backup after a short delay
                setTimeout(() => {
                  navigate('/my-subscription');
                }, 1000);
              }
            } else {
              // If in browser, show message and try to navigate
              console.log('⚠️ Not in WebView, navigating in browser');
              navigate('/my-subscription');
            }
          };
          
          // Try immediately if in WebView, otherwise wait 3 seconds
          if (isRunningInFlutterWebView()) {
            // Try immediately in WebView - use shorter delay for better UX
            setTimeout(redirectToSubscription, 100);
            // Also set a backup redirect in case the first one doesn't work
            setTimeout(redirectToSubscription, 2000);
          } else {
            // Wait 3 seconds if in browser
            setTimeout(redirectToSubscription, 3000);
          }
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Payment verification failed. Please try again or contact support.');
        
        // Reset verification flag on error (but keep processed payments list)
        verificationStarted.current = false;
      }
    };

    processPaymentCallback();
  }, [searchParams, navigate, addBoostCredits, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <Card className="p-8 text-center max-w-md w-full">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecting...</p>
            <Button onClick={() => {
              const route = paymentDetails?.boostCount ? '/my-boost' : '/my-subscription';
              console.log('🔄 Manual redirect triggered to:', route);
              // Check if running in mobile APK and use bridge for navigation
              if (isRunningInFlutterWebView()) {
                console.log('📱 Mobile APK detected, using bridge for navigation');
                // Try bridge navigation first
                const navigated = navigateInMobileApp(route);
                // Always also try regular navigation as backup
                setTimeout(() => {
                  navigate(route);
                }, 100);
                if (!navigated) {
                  // Immediate fallback if bridge returns false
                  navigate(route);
                }
              } else {
                navigate(route);
              }
            }}>
              Continue
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/subscription')}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentCallback;

