import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Shield, Check, Send, Upload, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import OTPInput from '../../components/auth/OTPInput';
import ResendTimer from '../../components/auth/ResendTimer';
import documentService from '../../services/documentService';
import { preventBackNavigation } from '../../utils/historyUtils';

const Signup = () => {
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Aadhar card (front and back)
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharFrontPreview, setAadharFrontPreview] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [aadharBackPreview, setAadharBackPreview] = useState(null);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { sendOTP, verifyOTP, register, user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAadharFrontUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!documentService.validateFileSize(file)) {
        setError('Document file size should be less than 5MB');
        return;
      }

      if (!documentService.validateFileType(file)) {
        setError('Please upload a valid image file (JPG, PNG, WebP)');
        return;
      }

      try {
        const compressedFile = await documentService.compressImage(file);
        setAadharFront(compressedFile);
        setError('');

        const preview = await documentService.createImagePreview(compressedFile);
        setAadharFrontPreview(preview);
      } catch (error) {
        setError('Failed to process image. Please try again.');
      }
    }
  };

  const handleAadharBackUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!documentService.validateFileSize(file)) {
        setError('Document file size should be less than 5MB');
        return;
      }

      if (!documentService.validateFileType(file)) {
        setError('Please upload a valid image file (JPG, PNG, WebP)');
        return;
      }

      try {
        const compressedFile = await documentService.compressImage(file);
        setAadharBack(compressedFile);
        setError('');

        const preview = await documentService.createImagePreview(compressedFile);
        setAadharBackPreview(preview);
      } catch (error) {
        setError('Failed to process image. Please try again.');
      }
    }
  };

  const removeAadharFront = () => {
    setAadharFront(null);
    setAadharFrontPreview(null);
  };

  const removeAadharBack = () => {
    setAadharBack(null);
    setAadharBackPreview(null);
  };

  // Validate form before sending OTP
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
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

    if (!validateForm()) return;

    setIsSendingOTP(true);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const response = await sendOTP(cleanPhone, 'signup');

      if (response.success) {
        setOtpSent(true);
        setSuccess(`OTP sent to ${formData.phone}`);
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

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const response = await sendOTP(cleanPhone, 'signup');

      if (response.success) {
        setSuccess('OTP resent successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.message || 'Failed to resend OTP. Please try again.');
    }
  };

  // Verify OTP and create account
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsVerifying(true);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');

      const response = await verifyOTP(cleanPhone, otpValue, formData.name, formData.email);

      if (response.success) {
        setSignupSuccess(true);
        setSuccess('Account created successfully!');

        preventBackNavigation();
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      setError(error.message || 'Invalid OTP. Please try again.');
      setIsVerifying(false);
    }
  };

  // Auto-verify when all 6 digits are entered
  const handleOTPChange = (newOTP) => {
    setOtp(newOTP);
    setError('');

    if (newOTP.every(digit => digit !== '') && !isVerifying) {
      setTimeout(() => {
        const otpValue = newOTP.join('');
        if (otpValue.length === 6) {
          handleVerifyOTP();
        }
      }, 200);
    }
  };

  // Go back to form editing
  const handleEditDetails = () => {
    setOtpSent(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
  };

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row bg-[#f0f0f5] font-sans">

        {/* Main Content */}
        <div className="flex-1 flex items-end md:items-center justify-center relative min-h-screen md:min-h-0">

          <div className="w-full md:max-w-md relative z-10">
            {/* Form Container - Bottom Sheet on Mobile, Centered Card on Desktop */}
            <div className="w-full bg-white rounded-t-3xl md:rounded-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] md:shadow-sm p-6 md:p-10 pt-8 md:pt-10 md:border border-gray-100 relative min-h-[85vh] md:min-h-0 flex flex-col justify-center">

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
                        Create <span className="text-[#fc8019]">Account</span>
                      </>
                    )}
                  </h2>
                  <p className="text-gray-500 font-medium text-sm md:text-base">
                    {otpSent
                      ? 'Enter the 6-digit code sent to your phone'
                      : 'Join us today. It takes less than a minute.'
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
                  /* Step 1: Registration Form */
                  <form onSubmit={handleSendOTP} className="space-y-4">

                    {/* Name */}
                    <div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center group-focus-within:bg-[#fc8019] group-focus-within:text-white transition-colors text-[#fc8019]">
                            <User size={16} />
                          </div>
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Full Name"
                          className="w-full pl-14 pr-4 py-4 text-base border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-[#fc8019] outline-none transition-all text-gray-900 font-extrabold bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center group-focus-within:bg-[#fc8019] group-focus-within:text-white transition-colors text-[#fc8019]">
                            <Mail size={16} />
                          </div>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email Address"
                          className="w-full pl-14 pr-4 py-4 text-base border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-[#fc8019] outline-none transition-all text-gray-900 font-extrabold bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center group-focus-within:bg-[#fc8019] group-focus-within:text-white transition-colors text-[#fc8019]">
                            <Phone size={16} />
                          </div>
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className="w-full pl-14 pr-4 py-4 text-base border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-[#fc8019] outline-none transition-all text-gray-900 font-extrabold bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    {false && (
                      // Document Upload - Disabled
                      <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                          <Shield size={14} className="text-[#fc8019]" />
                          Verification Document
                        </label>
                        {/* Formatting kept intact per original request, stripped of old gradients */}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSendingOTP}
                      className="w-full mt-2 py-4 text-base font-extrabold bg-[#fc8019] hover:bg-orange-600 text-white shadow-sm transition-colors rounded-2xl border-none"
                    >
                      {isSendingOTP ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Send OTP</span>
                        </div>
                      )}
                    </Button>

                    {/* Security Badge */}
                    <div className="flex items-center justify-center gap-1.5 pt-3">
                      <Shield size={14} className="text-green-500" />
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">256-bit Secure Encryption</span>
                    </div>
                  </form>
                ) : (
                  /* Step 2: OTP Verification */
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
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
                          onClick={handleEditDetails}
                          className="text-sm text-gray-500 hover:text-[#fc8019] font-bold transition-colors"
                        >
                          Edit Details
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
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>Verify & Join</span>
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {/* Login Link */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm font-medium mb-4">
                      Already have an account?
                    </p>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-extrabold rounded-2xl transition-all shadow-sm w-full"
                    >
                      <span>Login to Your Account</span>
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

export default Signup;