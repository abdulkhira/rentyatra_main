import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, Eye, EyeOff, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { preventBackNavigation } from '../../utils/historyUtils';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.password.trim()) {
      setError('Please enter your password');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${apiUrl}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Authentication verified. Securing session...');

        // Use admin auth context to store session
        await login(data.data.admin, data.data.token);

        // Prevent back navigation after successful login
        preventBackNavigation();

        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Connection failed. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">

      {/* Left Side - Brand & Visuals (Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-[#0B1120] relative flex-col justify-between p-12 overflow-hidden">
        {/* Decorative Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] opacity-40 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-40 mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-blue-600 rounded-full blur-[100px] opacity-20 mix-blend-screen"></div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Package className="h-6 w-6 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight text-white">RentYatra</span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest mb-6">
            <Shield className="w-4 h-4" /> Admin Portal
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Master Control<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Environment
            </span>
          </h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
            Securely manage users, listings, revenue streams, and platform settings from a centralized command center.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-slate-500 text-sm font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          System Operational
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative min-h-screen md:min-h-0">

        {/* Mobile Brand Header (Only visible on small screens) */}
        <div className="md:hidden absolute top-8 left-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">RentYatra</span>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-12">

            {/* Form Header */}
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 font-medium mt-2">Enter your admin credentials to continue</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <p className="text-rose-700 text-sm font-bold">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-emerald-700 text-sm font-bold">{success}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block">
                  Admin Email
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <Mail className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="admin@rentyatra.com"
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                    required
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block">
                  Security Key
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2">
                    <Lock className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••••••"
                    className="w-full pl-14 pr-14 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                    required
                    disabled={isLoading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                    disabled={isLoading || success}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full py-4 mt-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2 group"
              >
                {isLoading || success ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{success ? 'Authenticating...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Session</span>
                    <Shield className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </button>
            </form>

          </div>

          <p className="text-center text-slate-400 text-xs font-bold mt-8 uppercase tracking-widest">
            Restricted Access Zone
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;