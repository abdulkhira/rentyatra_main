import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const ResendTimer = ({ initialTime = 30, onResend, disabled = false }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleResend = () => {
    if (canResend && !disabled) {
      setTimeLeft(initialTime);
      setCanResend(false);
      onResend();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="text-center">
      {canResend ? (
        <button
          onClick={handleResend}
          disabled={disabled}
          className={`
            text-sm font-semibold transition-all
            ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-indigo-600 hover:text-indigo-700 hover:underline'
            }
          `}
        >
          Resend OTP
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Clock size={16} className="text-gray-400" />
          <span>
            Resend OTP in <span className="font-semibold text-indigo-600">{formatTime(timeLeft)}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default ResendTimer;

