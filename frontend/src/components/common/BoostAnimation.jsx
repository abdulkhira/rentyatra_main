import React, { useState, useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const BoostAnimation = ({ isVisible, onComplete, rentalTitle }) => {
  const [animationStep, setAnimationStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const dotLottieRef = useRef(null);

  useEffect(() => {
    if (!isVisible) {
      setAnimationStep(0);
      setProgress(0);
      setShowSuccess(false);
      return;
    }

    // Start the Lottie animation
    setAnimationStep(1);
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = 100 / (3000 / 50); // 3 seconds total
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    // Show success after animation completes
    setTimeout(() => {
      setShowSuccess(true);
      clearInterval(progressInterval);
      setProgress(100);
      
      // Complete animation after showing success
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    }, 3000);

    return () => clearInterval(progressInterval);
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        {/* Animation Container */}
        <div className="relative mb-6 h-32 flex items-center justify-center">
          {!showSuccess ? (
            <div className="w-full h-full flex items-center justify-center">
              <DotLottieReact
                src="https://lottie.host/075c4b83-852d-495e-92a4-44e642a9b842/1TSh8RRIuh.lottie"
                loop={false}
                autoplay={true}
                dotLottieRefCallback={(dotLottie) => {
                  dotLottieRef.current = dotLottie;
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <svg 
                  width="40" 
                  height="40" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="text-white"
                >
                  <path 
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {!showSuccess ? `Boosting "${rentalTitle}"` : 'Boost Complete!'}
          </h3>
          <p className="text-gray-600 text-sm">
            {!showSuccess 
              ? 'Your rental is being boosted to featured listings!' 
              : 'Your rental is now featured at the top!'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress Text */}
        <p className="text-xs text-gray-500">
          {Math.round(progress)}% Complete
        </p>
      </div>
    </div>
  );
};

export default BoostAnimation;