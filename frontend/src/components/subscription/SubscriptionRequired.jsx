import { X, Crown, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

const SubscriptionRequired = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleViewPlans = () => {
    onClose();
    navigate('/subscription');
  };

  const benefits = [
    'List multiple products and reach thousands of renters',
    'Secure payment processing and instant transfers',
    'Priority customer support 24/7',
    'Analytics dashboard to track your performance',
    'Insurance coverage for all transactions'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Header with Gradient */}
        <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 px-8 pt-12 pb-16 text-center relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6 shadow-xl">
            <Crown size={40} className="text-yellow-300" fill="currentColor" />
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            Subscription Required
          </h2>
          <p className="text-blue-100 text-lg">
            Unlock the power to list your products
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <p className="text-gray-700 text-center mb-6 text-lg leading-relaxed">
            To add products for rent, you need an active subscription plan.
          </p>

          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
              ✨ What You'll Get:
            </p>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle
                  size={20}
                  className="text-green-500 flex-shrink-0 mt-0.5"
                  strokeWidth={2.5}
                />
                <span className="text-gray-700 text-sm leading-relaxed">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleViewPlans}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>View Subscription Plans</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </Button>

            <button
              onClick={onClose}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors duration-200"
            >
              Maybe Later
            </button>
          </div>

          {/* Trust Badge */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure • Cancel Anytime • No Hidden Fees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequired;

