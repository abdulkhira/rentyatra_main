import { useState, useEffect } from 'react';
import { X, Check, Shield, Star, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import razorpayService from '../../services/razorpayService';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

function PlanSummaryModal({ isOpen, onClose, plan }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const { user } = useAuth();
  const { loadUserSubscription } = useSubscription();
  const navigate = useNavigate();

  // Hide bottom navigation when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        alert('User not found. Please login again.');
        setIsProcessing(false);
        return;
      }

      // Calculate total amount with GST
      const basePrice = parseInt(plan.price);
      const gstAmount = Math.round(basePrice * 0.18);
      const totalAmount = basePrice + gstAmount;

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Processing subscription payment via Razorpay:', {
          userId,
          planId: plan.id,
          planName: plan.name,
          amount: totalAmount,
          maxListings: plan.maxListings,
          maxPhotos: plan.maxPhotos
        });
      }

      // Process payment with Razorpay
      await razorpayService.processSubscriptionPayment({
        amount: totalAmount, // Amount in rupees (backend will convert to paise)
        planId: plan.id,
        planName: plan.name,
        userId: userId,
        name: user.name || user.firstName + ' ' + user.lastName,
        email: user.email,
        phone: user.phone || user.mobile,
        maxListings: plan.maxListings,
        maxPhotos: plan.maxPhotos,
        duration: plan.duration,
        description: `${plan.name} - Subscription`,
        onSuccess: async (result) => {
          console.log('✅ Payment successful:', result);
          console.log('📦 Payment result data:', result);
          
          // OPTIMIZED: Reduced initial wait time
          await new Promise(resolve => setTimeout(resolve, 800)); // Reduced from 1500ms to 800ms
          
          // Reload user subscription after successful payment with optimized retries
          if (userId) {
            try {
              // OPTIMIZED: Faster retry logic with reduced delays
              let retryCount = 0;
              const maxRetries = 2; // Reduced from 3 to 2
              
              while (retryCount < maxRetries) {
                try {
                  console.log(`🔄 Loading subscription (attempt ${retryCount + 1}/${maxRetries})...`);
                  await loadUserSubscription(userId);
                  
                  // OPTIMIZED: Reduced wait time for state update
                  await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 500ms to 300ms
                  
                  // Check if subscription data is available in result
                  if (result?.subscription && result.subscription.status === 'active') {
                    console.log('✅ Subscription confirmed active from payment result');
                    break;
                  }
                  
                  // If we have subscription data in result, it's likely saved
                  if (result?.subscription) {
                    console.log('✅ Subscription data received from payment result:', result.subscription);
                    break;
                  }
                  
                  // If this is not the last retry, wait and try again
                  if (retryCount < maxRetries - 1) {
                    retryCount++;
                    const delay = 1000 * retryCount; // Reduced: 1s, 2s (was 2s, 4s)
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                  } else {
                    console.log('⚠️ Subscription may not be active yet, but payment was successful');
                    console.log('💡 User will see updated subscription when they navigate to My Subscription page');
                  }
                } catch (loadError) {
                  console.error('❌ Error loading subscription:', loadError);
                  if (retryCount < maxRetries - 1) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms
                  } else {
                    console.warn('⚠️ Could not load subscription after retries, but payment was successful');
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error refreshing subscription:', error);
              // Payment was successful, so continue even if refresh fails
              console.log('💡 Subscription will be refreshed when user navigates to My Subscription page');
            }
          }
          
          // Show thank you popup
          setShowThankYou(true);
          
          // OPTIMIZED: Faster redirect
          setTimeout(() => {
            navigate('/my-subscription');
            onClose();
          }, 1800); // Reduced from 2500ms to 1800ms
          
          setIsProcessing(false);
        },
        onError: (error) => {
          // Only log errors in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Payment failed:', error.message || error);
          }
          
          setIsProcessing(false);
          
          if (error.message === 'PAYMENT_CANCELLED') {
            // User cancelled payment, don't show error
            return;
          }
          
          // Show more specific error message
          let errorMessage = 'Payment failed. Please try again.';
          if (error.message) {
            if (error.message.includes('timeout')) {
              errorMessage = 'Payment verification timed out. Please check your internet connection and try again.';
            } else if (error.message.includes('verification')) {
              errorMessage = 'Payment verification failed. Please try again or contact support.';
            } else if (error.message.includes('Missing')) {
              errorMessage = 'Invalid payment response. Please try again.';
            } else if (error.message.includes('signature')) {
              errorMessage = 'Payment verification failed. Please try again.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
              errorMessage = 'Network error. Please check your internet connection and try again.';
            } else {
              errorMessage = error.message;
            }
          }
          
          alert(errorMessage);
        }
      });

    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Subscription payment error:', error.message || error);
      }
      setIsProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-0 md:p-4">
      {/* Thank You Popup */}
      {showThankYou && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-bounce">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Thank you for your subscription!
            </h3>
            <p className="text-gray-600">
              Redirecting to My Subscription...
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white w-full h-full md:rounded-xl md:shadow-xl md:max-w-md md:max-h-[90vh] md:h-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Plan Summary</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Plan Details */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-32 md:pb-6">
          {/* Plan Header */}
          <div className={`bg-gradient-to-br ${plan.gradient} text-white p-6 rounded-xl`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold">₹{plan.price}</span>
                  <span className="text-lg opacity-90">one-time</span>
                </div>
                <p className="text-sm opacity-90 mt-1">Valid for {plan.duration} days</p>
              </div>
              {plan.popular && (
                <div className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  POPULAR
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">What's included:</h4>
            <div className="space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Limits */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Plan Limits:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Max Listings:</span>
                <span className="font-medium">{plan.maxListings === -1 ? 'Unlimited' : plan.maxListings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{plan.duration} days</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t border-gray-200 pt-4">
            {(() => {
              const basePrice = parseInt(plan.price);
              const gstAmount = Math.round(basePrice * 0.18);
              const totalAmount = basePrice + gstAmount;
              
              return (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Plan Price:</span>
                    <span className="font-medium">₹{basePrice}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">GST (18%):</span>
                    <span className="font-medium">₹{gstAmount}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                      <span className="text-xl font-bold text-gray-900">₹{totalAmount}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePayNow}
              disabled={isProcessing}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 shadow-lg hover:shadow-xl`
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CreditCard size={16} />
                  Pay Now
                </div>
              )}
            </button>
          </div>
          
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <Shield size={12} />
              <span>Secure payment powered by Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanSummaryModal;
