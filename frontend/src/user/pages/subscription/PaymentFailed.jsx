import { XCircle, ArrowLeft, RefreshCw, MessageCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';

const PaymentFailed = () => {
  const navigate = useNavigate();

  // Mock error details (will come from URL params or state)
  const errorDetails = {
    errorCode: 'PAYMENT_DECLINED',
    message: 'Payment was declined by your bank',
    orderId: `ORD-${Date.now()}`,
    amount: 1061
  };

  const commonReasons = [
    {
      icon: '💳',
      title: 'Insufficient Funds',
      description: 'Check if you have enough balance in your account'
    },
    {
      icon: '🔒',
      title: 'Card Security',
      description: 'Your bank may have blocked the transaction for security'
    },
    {
      icon: '⏰',
      title: 'Session Timeout',
      description: 'The payment session may have expired'
    },
    {
      icon: '🌐',
      title: 'Network Issue',
      description: 'Connection was lost during payment processing'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Failure Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slide-up">
        {/* Error Icon */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

          <div className="relative">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 shadow-2xl">
              <XCircle size={56} className="text-red-500" strokeWidth={3} />
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              Payment Failed
            </h1>
            <p className="text-xl text-red-100">
              Don't worry, no charges were made
            </p>
          </div>
        </div>

        {/* Error Details */}
        <div className="p-8 md:p-12">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-red-900 mb-1">
                  What went wrong?
                </h2>
                <p className="text-red-700">{errorDetails.message}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-t border-red-200">
                <span className="text-red-700">Error Code</span>
                <span className="font-mono font-bold text-red-900">
                  {errorDetails.errorCode}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-red-200">
                <span className="text-red-700">Reference ID</span>
                <span className="font-mono font-semibold text-red-900">
                  {errorDetails.orderId}
                </span>
              </div>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Common reasons for payment failure:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commonReasons.map((reason, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="text-3xl mb-2">{reason.icon}</div>
                  <h4 className="font-bold text-gray-900 mb-1 text-sm">
                    {reason.title}
                  </h4>
                  <p className="text-xs text-gray-600">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What to do next */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              What you can do:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Check your card details and try again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Try a different payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Contact your bank to authorize the transaction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Reach out to our support team for assistance</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/subscription')}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              <span>Try Again</span>
            </Button>

            <Button
              onClick={() => navigate('/support')}
              className="w-full py-4 bg-white border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              <span>Contact Support</span>
            </Button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>Go to Homepage</span>
            </button>
          </div>

          {/* Reassurance Message */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-sm text-green-800">
              🔒 <span className="font-semibold">Your data is safe.</span> No money was deducted from your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;

