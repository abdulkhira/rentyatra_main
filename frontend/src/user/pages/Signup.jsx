import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Shield, Zap, Check, Send, Sparkles, Award, Users, TrendingUp, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import OTPInput from '../../components/auth/OTPInput';
import ResendTimer from '../../components/auth/ResendTimer';
// LocationCaptureModal removed - location is now automatically captured in background
import documentService from '../../services/documentService';
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
  // Location modal removed - location is now automatically captured in background
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
      // Validate file size
      if (!documentService.validateFileSize(file)) {
        setError('Aadhar card file size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!documentService.validateFileType(file)) {
        setError('Please upload a valid image file (JPG, PNG, WebP) for Aadhar card');
        return;
      }

      try {
        // Compress image before storing
        const compressedFile = await documentService.compressImage(file);
        setAadharFront(compressedFile);
        setError('');
        
        // Create preview
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
      // Validate file size
      if (!documentService.validateFileSize(file)) {
        setError('Aadhar card file size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!documentService.validateFileType(file)) {
        setError('Please upload a valid image file (JPG, PNG, WebP) for Aadhar card');
        return;
      }

      try {
        // Compress image before storing
        const compressedFile = await documentService.compressImage(file);
        setAadharBack(compressedFile);
        setError('');
        
        // Create preview
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
    // if (!aadharFront) {
    //   setError('Please upload Aadhar card front side (mandatory)');
    //   return false;
    // }
    // if (!aadharBack) {
    //   setError('Please upload Aadhar card back side (mandatory)');
    //   return false;
    // }
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
      // Clean phone number (remove spaces, +, -, etc.)
      const cleanPhone = formData.phone.replace(/\D/g, '');
      
      const response = await sendOTP(cleanPhone, 'signup');
      
      if (response.success) {
        setOtpSent(true);
        setSuccess(`OTP sent successfully to ${formData.phone}`);
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
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.message || 'Failed to resend OTP. Please try again.');
    }
  };

  // Verify OTP and create account
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
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
      
      // First verify OTP and create account
      const response = await verifyOTP(cleanPhone, otpValue, formData.name, formData.email);
      
      if (response.success) {
        setSignupSuccess(true);

        setSuccess('Account created successfully!');
        // After successful account creation, upload Aadhar images
        // try {
        //   // Upload Aadhar images without Aadhar number (backend will extract it using OCR)
        //   const uploadResponse = await documentService.uploadAadharCard(null, aadharFront, aadharBack);
          
        //   if (uploadResponse.data.aadhar.extractedNumber) {
        //     setSuccess('Account created and Aadhar card uploaded successfully! Aadhar number extracted automatically.');
        //   } else {
        //     setSuccess('Account created and Aadhar card uploaded successfully!');
        //   }
        // } catch (uploadError) {
        //   console.error('Document upload error:', uploadError);
        //   setSuccess('Account created successfully! You can upload documents later from your profile.');
        // }
        
        // Location will be automatically captured in background (no modal shown)
        // Just navigate to home - location will be saved automatically
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
    
    // Auto-verify if all 6 digits are filled
    if (newOTP.every(digit => digit !== '') && !isVerifying) {
      setTimeout(() => {
        const otpValue = newOTP.join('');
        if (otpValue.length === 6) {
          handleVerifyOTP({ preventDefault: () => {} });
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
      <div className="min-h-screen flex flex-col md:flex-row md:bg-gradient-to-br md:from-slate-50 md:via-purple-50 md:to-pink-100">

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center md:p-12 relative min-h-screen md:min-h-0">
        {/* Mobile Full-Screen Background */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-700">
          {/* Animated Orbs for Mobile */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          </div>
        </div>
        
        <div className="w-full md:max-w-md relative z-10 h-full md:h-auto flex items-center">
          {/* Form Container - Full Screen Mobile */}
          <div className="w-full bg-white md:rounded-2xl md:shadow-2xl p-4 md:p-6 md:border border-gray-100 relative overflow-hidden min-h-screen md:min-h-0 flex flex-col justify-center">
            {/* Decorative Gradients - Desktop Only */}
            <div className="hidden md:block absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 blur-3xl rounded-full"></div>
            <div className="hidden md:block absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-500 to-rose-600 opacity-10 blur-3xl rounded-full"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-xl md:text-3xl font-black text-gray-900 mb-1 leading-tight">
                  {otpSent ? (
                    <>
                      Verify <span className="bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">OTP</span>
                    </>
                  ) : (
                    <>
                      Create <span className="bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">Account</span>
                    </>
                  )}
                </h2>
                <p className="text-gray-600 text-xs">
                  {otpSent 
                    ? 'Almost there! Enter your verification code' 
                    : 'Join thousands of happy users today'
                  }
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-3 p-2.5 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg animate-slide-up">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">!</span>
                    </div>
                    <p className="text-red-700 text-[10px] font-medium flex-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-3 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-slide-up">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={10} className="text-white" />
                    </div>
                    <p className="text-green-700 text-[10px] font-medium flex-1">{success}</p>
                  </div>
                </div>
              )}

              {!otpSent ? (
                /* Step 1: Registration Form */
                <form onSubmit={handleSendOTP} className="space-y-2 md:space-y-3">
                  {/* Name and Email in horizontal row on desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        Full Name
                      </label>
                      <div className="relative group">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-focus-within:scale-110 transition-transform">
                            <User className="text-white" size={12} />
                          </div>
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter Full Name"
                          className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-800">
                        Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center group-focus-within:scale-110 transition-transform">
                            <Mail className="text-white" size={12} />
                          </div>
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter Email Address"
                          className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-800">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-focus-within:scale-110 transition-transform">
                          <Phone className="text-white" size={12} />
                        </div>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter Phone Number"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {false && (
                    //  Aadhar Card Upload - Front & Back 
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800">
                        <Shield size={14} className="text-orange-600" />
                        Aadhar Card (Both Sides)
                        <span className="text-red-600 text-[10px] font-black px-1.5 py-0.5 bg-red-50 rounded-full">Required</span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-gray-700">Front Side</p>
                          {!aadharFrontPreview ? (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAadharFrontUpload}
                                className="hidden"
                                id="aadhar-front-upload"
                              />
                              <label
                                htmlFor="aadhar-front-upload"
                                className="flex flex-col items-center justify-center w-full p-2 border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg cursor-pointer hover:border-orange-500 hover:from-orange-100 hover:to-amber-100 transition-all group"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                  <Upload className="text-white" size={14} />
                                </div>
                                <p className="text-[10px] text-gray-700 font-bold">Front</p>
                              </label>
                            </div>
                          ) : (
                            <div className="relative group">
                              <div className="relative rounded-lg overflow-hidden border-2 border-green-400">
                                <img
                                  src={aadharFrontPreview}
                                  alt="Aadhar Front"
                                  className="w-full h-16 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={removeAadharFront}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-600 flex items-center gap-1"
                                  >
                                    <X size={10} />
                                    Remove
                                  </button>
                                </div>
                              </div>
                              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5">
                                <Check size={8} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-gray-700">Back Side</p>
                          {!aadharBackPreview ? (
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAadharBackUpload}
                                className="hidden"
                                id="aadhar-back-upload"
                              />
                              <label
                                htmlFor="aadhar-back-upload"
                                className="flex flex-col items-center justify-center w-full p-2 border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg cursor-pointer hover:border-orange-500 hover:from-orange-100 hover:to-amber-100 transition-all group"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                  <Upload className="text-white" size={14} />
                                </div>
                                <p className="text-[10px] text-gray-700 font-bold">Back</p>
                              </label>
                            </div>
                          ) : (
                            <div className="relative group">
                              <div className="relative rounded-lg overflow-hidden border-2 border-green-400">
                                <img
                                  src={aadharBackPreview}
                                  alt="Aadhar Back"
                                  className="w-full h-16 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={removeAadharBack}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-600 flex items-center gap-1"
                                  >
                                    <X size={10} />
                                    Remove
                                  </button>
                                </div>
                              </div>
                              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5">
                                <Check size={8} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-[9px] text-gray-500 flex items-center gap-1">
                        <Shield size={8} className="text-indigo-600" />
                        Securely encrypted • Max 5MB
                      </p>
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    disabled={isSendingOTP}
                    className="w-full py-2.5 text-sm font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-600/50 transition-all group rounded-lg"
                  >
                    {isSendingOTP ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Send size={14} className="group-hover:rotate-12 transition-transform" />
                        <span>Send OTP</span>
                        <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" size={14} />
                      </div>
                    )}
                  </Button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <Shield size={12} className="text-green-600" />
                    <span className="text-[10px] text-gray-600 font-semibold">256-bit Secure Encryption</span>
                  </div>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyOTP} className="space-y-3">
                  {/* OTP Input with Decorative Box */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-xl p-4 border-2 border-purple-200 relative overflow-hidden">
                      {/* Decorative Corner */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 opacity-20 blur-2xl"></div>
                      
                      <div className="relative z-10">
                        <OTPInput
                          length={6}
                          value={otp}
                          onChange={handleOTPChange}
                          disabled={isVerifying}
                        />
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-sm text-gray-700 font-semibold">
                        Enter your verification code
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Check your phone for the 6-digit OTP
                      </p>
                    </div>
                  </div>

                  {/* Resend Timer */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-2.5 border border-gray-200">
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
                    className="w-full py-2.5 text-sm font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-600/50 transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Check size={14} />
                        <span>Verify & Create Account</span>
                      </div>
                    )}
                  </Button>

                  {/* Edit Details */}
                  <button
                    type="button"
                    onClick={handleEditDetails}
                    className="w-full text-[10px] text-gray-600 hover:text-indigo-600 font-bold transition py-1.5 hover:bg-indigo-50 rounded-lg flex items-center justify-center gap-2 group"
                  >
                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Edit Details</span>
                  </button>
                </form>
              )}

              {/* Login Link */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-center space-y-2">
                  <p className="text-gray-600 text-xs font-medium">
                    Already have an account?
                  </p>
                  <Link 
                    to="/login" 
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/50 hover:shadow-xl hover:scale-105 group text-sm"
                  >
                    <span>Login to Your Account</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
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
