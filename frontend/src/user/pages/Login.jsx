import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Shield, Zap, Check, Send, Sparkles, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import OTPInput from '../../components/auth/OTPInput';
import ResendTimer from '../../components/auth/ResendTimer';
import { preventBackNavigation } from '../../utils/historyUtils';

// Custom Arrow components
const ArrowRight = ({ size, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const Login = () => {
  // Form data
  const [phone, setPhone] = useState('');

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Use ref to prevent race conditions in auto-verification
  const isVerifyingRef = useRef(false);

  const { loginWithOTP, sendOTP, user } = useAuth();
  const navigate = useNavigate();

  // Check if user just signed up
  useEffect(() => {
    const pendingUser = localStorage.getItem('pendingUser');
    if (pendingUser) {
      setIsNewUser(true);
      setSuccess('Account created! Please login with your credentials.');
      // Clear the pending user after showing message
      setTimeout(() => {
        localStorage.removeItem('pendingUser');
        setIsNewUser(false);
      }, 5000);
    }
  }, []);

  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    setError('');
  };

  // Validate phone number
  const validatePhone = () => {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    if (!/^[\d\s\+\-\(\)]+$/.test(phone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePhone()) return;

    setIsSendingOTP(true);

    try {
      // Clean phone number (remove spaces, +, -, etc.)
      const cleanPhone = phone.replace(/\D/g, '');

      const response = await sendOTP(cleanPhone, 'login');

      if (response.success) {
        // Mask phone number for display
        const maskedPhone = phone.replace(/(\d{2})(\d+)(\d{4})/, '$1*****$3');

        setOtpSent(true);
        setSuccess(`OTP sent to ${maskedPhone}`);
      }
    } catch (error) {
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError('');
    setOtp(['', '', '', '', '', '']);
    setIsVerifying(false);
    isVerifyingRef.current = false;

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await sendOTP(cleanPhone, 'login');

      if (response.success) {
        setSuccess('OTP resent successfully!');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.message || 'Failed to resend OTP. Please try again.');
    }
  };

  // Verify OTP and login (can accept custom OTP value)
  const handleVerifyOTP = async (e, customOtpValue = null) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Use custom OTP if provided, otherwise use current state
    const otpValue = customOtpValue || otp.join('');

    setIsVerifying(true);
    isVerifyingRef.current = true;

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await loginWithOTP(cleanPhone, otpValue);

      if (response.success) {
        setSuccess('Login successful!');
        setLoginSuccess(true);

        preventBackNavigation();
        setTimeout(() => {
          navigate('/');
        }, 800);
      } else {
        setIsVerifying(false);
        isVerifyingRef.current = false;
      }
    } catch (error) {
      setError(error.message || 'Invalid OTP. Please try again.');
      setIsVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  // Auto-verify when all 6 digits are entered
  const handleOTPChange = (newOTP) => {
    setOtp(newOTP);
    setError('');

    // Auto-verify if all 6 digits are filled
    if (newOTP.every(digit => digit !== '') && !isVerifyingRef.current) {
      // Prevent multiple submissions using ref
      isVerifyingRef.current = true;
      setIsVerifying(true);

      // Delay auto-verification to ensure state is updated
      setTimeout(() => {
        // Double-check that we still have all 6 digits
        const currentOtp = newOTP.join('');
        if (currentOtp.length === 6) {
          handleVerifyOTP({ preventDefault: () => { } }, currentOtp);
        } else {
          setIsVerifying(false);
          isVerifyingRef.current = false;
        }
      }, 200);
    }
  };

  // Go back to phone input
  const handleEditPhone = () => {
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    setIsVerifying(false);
    isVerifyingRef.current = false;
  };

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row bg-[#f0f0f5] font-sans">

        {/* Main Content */}
        <div className="flex-1 flex items-end md:items-center justify-center relative min-h-screen md:min-h-0">

          <div className="w-full md:max-w-md relative z-10">
            {/* Form Container - Bottom Sheet on Mobile, Centered Card on Desktop */}
            <div className="w-full bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] md:shadow-sm p-6 md:p-10 pt-8 md:pt-10 md:border border-gray-100 relative min-h-[75vh] md:min-h-0 flex flex-col justify-center">

              {/* Mobile handle indicator */}
              <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full absolute top-3 left-1/2 -translate-x-1/2"></div>

              <div className="relative z-10 mt-4 md:mt-0">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight leading-tight">
                    {otpSent ? (
                      <>
                        Verify <span className="text-[#fc8019]">OTP</span>
                      </>
                    ) : (
                      <>
                        Login <span className="text-gray-400 font-medium">or</span> <span className="text-[#fc8019]">Signup</span>
                      </>
                    )}
                  </h2>
                  <p className="text-gray-500 font-medium text-sm md:text-base">
                    {otpSent
                      ? 'Enter the 6-digit code sent to your phone'
                      : 'Enter your mobile number to proceed'
                    }
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl animate-slide-up flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <X size={14} className="text-red-600" />
                    </div>
                    <p className="text-red-800 text-sm font-bold mt-0.5">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="mb-5 p-4 bg-green-50 border border-green-100 rounded-2xl animate-slide-up flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-green-600" />
                    </div>
                    <p className="text-green-800 text-sm font-bold mt-0.5">{success}</p>
                  </div>
                )}

                {!otpSent ? (
                  /* Step 1: Enter Phone Number */
                  <form onSubmit={handleSendOTP} className="space-y-6">
                    {/* Phone Number Input */}
                    <div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center group-focus-within:bg-[#fc8019] group-focus-within:text-white transition-colors text-[#fc8019]">
                            <Phone size={16} />
                          </div>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="+91 98765 43210"
                          className="w-full pl-14 pr-4 py-4 text-base border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-[#fc8019] outline-none transition-all text-gray-900 font-extrabold bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSendingOTP}
                      className="w-full py-4 text-base font-extrabold bg-[#fc8019] hover:bg-orange-600 text-white shadow-sm transition-colors rounded-2xl border-none"
                    >
                      {isSendingOTP ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Continue</span>
                        </div>
                      )}
                    </Button>

                    <div className="pt-2 text-center">
                      <p className="text-xs text-gray-400 font-medium">
                        By continuing, you agree to our <span className="text-gray-600 underline cursor-pointer">Terms of Service</span> and <span className="text-gray-600 underline cursor-pointer">Privacy Policy</span>
                      </p>
                    </div>
                  </form>
                ) : (
                  /* Step 2: OTP Verification */
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    {/* OTP Input */}
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <OTPInput
                          length={6}
                          value={otp}
                          onChange={handleOTPChange}
                          disabled={isVerifying}
                        />
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <button
                          type="button"
                          onClick={handleEditPhone}
                          className="text-sm text-gray-500 hover:text-gray-900 font-bold transition-colors"
                        >
                          Edit Number
                        </button>

                        <ResendTimer
                          initialTime={30}
                          onResend={handleResendOTP}
                          disabled={isVerifying}
                        />
                      </div>
                    </div>

                    {/* Verify Button */}
                    <Button
                      type="submit"
                      disabled={isVerifying || otp.join('').length !== 6}
                      className="w-full py-4 text-base font-extrabold bg-[#fc8019] hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white shadow-sm transition-colors rounded-2xl border-none"
                    >
                      {isVerifying ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Verify & Login</span>
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* Signup Link */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm font-medium mb-4">
                      New to RentYatra?
                    </p>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-extrabold rounded-2xl transition-all shadow-sm w-full"
                    >
                      <span>Create an Account</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;