import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Shield, Zap, Check, Send, Sparkles, Award, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import OTPInput from '../../components/auth/OTPInput';
import ResendTimer from '../../components/auth/ResendTimer';
// LocationCaptureModal removed - location is now automatically captured in background
import { preventBackNavigation } from '../../utils/historyUtils';

// Custom Arrow components
const ArrowRight = ({ size, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const ArrowLeft = ({ size, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
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
  // Location modal removed - location is now automatically captured in background
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
      setSuccess('🎉 Account created! Please login with your credentials.');
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
        setSuccess(`OTP sent successfully to ${maskedPhone}`);
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

    console.log('🔍 handleVerifyOTP called:', {
      customOtpValue,
      otpState: otp,
      finalOtpValue: otpValue,
      otpLength: otpValue.length
    });

    setIsVerifying(true);
    isVerifyingRef.current = true;

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      console.log('📤 Sending login request:', { phone: cleanPhone, otpLength: otpValue.length });
      const response = await loginWithOTP(cleanPhone, otpValue);

      console.log('📥 Login response:', response);

      if (response.success) {
        setSuccess('Login successful!');
        setLoginSuccess(true);

        // Location will be automatically captured in background (no modal shown)
        // Just navigate to home - location will be saved automatically
        preventBackNavigation();
        setTimeout(() => {
          navigate('/');
        }, 800);
      } else {
        setIsVerifying(false);
        isVerifyingRef.current = false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
      setIsVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  // Auto-verify when all 6 digits are entered
  const handleOTPChange = (newOTP) => {
    console.log('📝 handleOTPChange called:', { newOTP, isVerifying: isVerifyingRef.current });
    setOtp(newOTP);
    setError('');

    // Auto-verify if all 6 digits are filled
    if (newOTP.every(digit => digit !== '') && !isVerifyingRef.current) {
      console.log('✅ All 6 digits filled, starting auto-verification...');
      // Prevent multiple submissions using ref
      isVerifyingRef.current = true;
      setIsVerifying(true);

      // Delay auto-verification to ensure state is updated
      setTimeout(() => {
        // Double-check that we still have all 6 digits
        const currentOtp = newOTP.join('');
        console.log('⏰ Auto-verification timeout fired:', { currentOtp, length: currentOtp.length });
        if (currentOtp.length === 6) {
          handleVerifyOTP({ preventDefault: () => { } }, currentOtp);
        } else {
          console.log('❌ OTP length mismatch, canceling auto-verification');
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
      <div className="min-h-screen flex flex-col md:flex-row md:bg-gradient-to-br md:from-slate-50 md:via-blue-50 md:to-indigo-100">
        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center md:p-12 relative min-h-screen md:min-h-0">
          {/* Mobile Full-Screen Background */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700">
            {/* Animated Orbs for Mobile */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            </div>
          </div>

          <div className="w-full md:max-w-md relative z-10 h-full md:h-auto flex items-center">
            {/* Form Container - Full Screen Mobile */}
            <div className="w-full bg-white md:rounded-3xl md:shadow-2xl p-6 md:p-10 md:border border-gray-100 relative overflow-hidden min-h-screen md:min-h-0 flex flex-col justify-center">
              {/* Decorative Gradient - Desktop Only */}
              <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 opacity-10 blur-3xl rounded-full"></div>
              <div className="hidden md:block absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-500 to-pink-600 opacity-10 blur-3xl rounded-full"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="mb-5 md:mb-8">
                  <h2 className="text-2xl md:text-5xl font-black text-gray-900 mb-2 md:mb-3 leading-tight">
                    {otpSent ? (
                      <>
                        Verify <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">OTP</span>
                      </>
                    ) : (
                      <>
                        Welcome <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Back!</span>
                      </>
                    )}
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    {otpSent
                      ? 'Enter the code we sent to your phone'
                      : 'Login securely with OTP verification'
                    }
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 md:p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl animate-slide-up">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      <p className="text-red-700 text-xs md:text-sm font-medium flex-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="mb-4 p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-slide-up">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={14} className="text-white" />
                      </div>
                      <p className="text-green-700 text-xs md:text-sm font-medium flex-1">{success}</p>
                    </div>
                  </div>
                )}

                {!otpSent ? (
                  /* Step 1: Enter Phone Number */
                  <form onSubmit={handleSendOTP} className="space-y-4 md:space-y-5">
                    {/* Phone Number Input */}
                    <div className="space-y-2">
                      <label className="block text-sm md:text-base font-bold text-gray-800">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-focus-within:scale-110 transition-transform">
                            <Phone className="text-white" size={16} />
                          </div>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="+91 98765 43210"
                          className="w-full pl-14 pr-4 py-3.5 md:py-4 text-sm md:text-base border-2 border-gray-200 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-1">
                        <Shield size={12} className="text-blue-600" />
                        OTP will be sent via SMS
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSendingOTP}
                      className="w-full py-3.5 md:py-4 text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-600/50 transition-all group rounded-xl md:rounded-2xl"
                    >
                      {isSendingOTP ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending OTP...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Send size={18} className="group-hover:rotate-12 transition-transform" />
                          <span>Send OTP</span>
                          <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" size={18} />
                        </div>
                      )}
                    </Button>

                    {/* Security Info */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Shield size={14} className="text-green-600" />
                      <span className="text-xs text-gray-600 font-medium">Protected by 256-bit encryption</span>
                    </div>
                  </form>
                ) : (
                  /* Step 2: OTP Verification */
                  <form onSubmit={handleVerifyOTP} className="space-y-4 md:space-y-6">
                    {/* OTP Input */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-blue-200">
                        <OTPInput
                          length={6}
                          value={otp}
                          onChange={handleOTPChange}
                          disabled={isVerifying}
                        />
                      </div>

                      <div className="text-center space-y-2">
                        <p className="text-sm md:text-base text-gray-700 font-medium">
                          Enter the 6-digit verification code
                        </p>
                        <p className="text-xs text-gray-500">
                          Check your phone for the OTP
                        </p>
                      </div>
                    </div>

                    {/* Resend Timer */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <ResendTimer
                        initialTime={30}
                        onResend={handleResendOTP}
                        disabled={isVerifying}
                      />
                    </div>

                    {/* Verify Button */}
                    <Button
                      type="submit"
                      disabled={isVerifying || otp.join('').length !== 6}
                      className="w-full py-3.5 md:py-4 text-base md:text-lg font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-600/50 transition-all rounded-xl md:rounded-2xl"
                    >
                      {isVerifying ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Check size={18} />
                          <span>Verify & Login</span>
                        </div>
                      )}
                    </Button>

                    {/* Edit Phone */}
                    <button
                      type="button"
                      onClick={handleEditPhone}
                      className="w-full text-sm text-gray-600 hover:text-gray-900 font-semibold transition py-2 hover:bg-gray-50 rounded-lg"
                    >
                      ← Change Phone Number
                    </button>
                  </form>
                )}

                {/* Signup Link */}
                <div className="mt-6 md:mt-8 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm md:text-base mb-3">
                      Don't have an account?
                    </p>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/50 hover:shadow-xl hover:scale-105 group"
                    >
                      <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                      <span>Create Account</span>
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
