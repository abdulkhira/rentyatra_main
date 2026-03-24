import { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import Button from './Button';

const SafetyTipsModal = ({ isOpen, onClose, onContinue }) => {
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

  if (!isOpen) return null;

  const safetyTips = [
    {
      icon: <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><div className="w-3 h-3 bg-gray-400 rounded-sm"></div></div>,
      title: "Don't enter UPI PIN/OTP, scan unknown QR codes, or click unsafe links."
    },
    {
      icon: <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><div className="w-4 h-3 bg-gray-400 rounded-sm"></div></div>,
      title: "Never give money or product in advance"
    },
    {
      icon: <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><div className="w-3 h-3 bg-gray-400 rounded-full"></div></div>,
      title: "Report suspicious users to RentYatra"
    },
    {
      icon: <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><div className="w-4 h-3 bg-gray-400 rounded-sm"></div></div>,
      title: "Don't share personal details like photos or IDs."
    },
    {
      icon: <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"><div className="w-3 h-3 bg-gray-400 rounded-full"></div></div>,
      title: "Be cautious during buyer-seller meetings."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Tips for a safe deal</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Safety Tips */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {safetyTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {tip.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {tip.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="p-6 pt-4">
          <Button
            onClick={onContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
            size="lg"
          >
            Continue to chat
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SafetyTipsModal;