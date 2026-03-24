import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, User } from 'lucide-react';
import { preventBackNavigation } from '../../utils/historyUtils';

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

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
    
    if (!formData.password.trim()) {
      setError('Please enter a password');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${apiUrl}/admin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Admin account created successfully! Redirecting to login...');
        
        // Clear form data
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Prevent back navigation after successful signup
        preventBackNavigation();
        
        setTimeout(() => {
          navigate('/admin/login');
        }, 1500);
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Admin signup error:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center md:p-12 relative min-h-screen md:min-h-0">
        {/* Mobile Background */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-br from-blue-800 via-indigo-900 to-purple-900">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]"></div>
        </div>
        
        <div className="w-full md:max-w-md relative z-10 h-full md:h-auto flex items-center">
          <div className="w-full bg-white md:rounded-3xl md:shadow-2xl p-6 md:p-10 md:border border-gray-100 relative overflow-hidden min-h-screen md:min-h-0 flex flex-col justify-center">
            {/* Decorative Elements */}
            <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 opacity-10 blur-3xl rounded-full"></div>
            <div className="hidden md:block absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-500 to-pink-600 opacity-10 blur-3xl rounded-full"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Shield className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                      Admin Signup
                    </h2>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl animate-slide-up">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-slide-up">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-green-700 text-sm font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <User className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800">
                    Admin Email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Mail className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="admin@rentyatra.com"
                      className="w-full pl-12 pr-4 py-3.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <Lock className="text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-12 py-3.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium bg-gray-50 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>


                {/* Signup Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 text-base font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-600/50 transition-all rounded-xl disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Shield size={18} />
                      <span>Create Admin Account</span>
                    </div>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-3">
                    Already have an admin account?
                  </p>
                  <Link 
                    to="/admin/login" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                  >
                    <span>Login to Admin Panel</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
