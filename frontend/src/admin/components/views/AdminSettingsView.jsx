import { useState } from 'react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import apiService from '../../../services/api';
import {
  Lock, Eye, EyeOff, Save, X, Shield, Key, AlertCircle,
  User, Mail, Calendar, ShieldCheck, CheckCircle
} from 'lucide-react';

function AdminSettingsView() {
  const { admin } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password must be different from current password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.changeAdminPassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      if (response.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Settings</h1>
          <p className="text-slate-500 font-medium">Manage your account security and preferences</p>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700 font-bold text-sm">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-rose-700 font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Identity & Security Status (Takes up 5 columns) */}
        <div className="lg:col-span-5 space-y-8">

          {/* Account Information */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-white">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Identity Details</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Read-Only Overview</p>
              </div>
            </div>

            <div className="p-8 space-y-4 bg-slate-50/30">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-sm">
                <User className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Full Name</p>
                  <p className="text-sm font-bold text-slate-800">{admin?.name || 'Not available'}</p>
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-sm">
                <Mail className="w-5 h-5 text-slate-400" />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Email Address</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{admin?.email || 'Not available'}</p>
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-sm">
                <Shield className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Access Role</p>
                  <p className="text-sm font-bold text-slate-800 capitalize">{admin?.role || 'Admin'}</p>
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-sm">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Member Since</p>
                  <p className="text-sm font-bold text-slate-800">
                    {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-white">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Security Status</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">System Verification</p>
              </div>
            </div>

            <div className="p-8 space-y-4 bg-slate-50/30">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex gap-4 items-start">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-900 mb-1">Email Verified</p>
                  <p className="text-xs font-medium text-emerald-700 leading-snug">Your administrative email address has been verified and is secured.</p>
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
                <Lock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-black text-blue-900 mb-1">Account Active</p>
                  <p className="text-xs font-medium text-blue-700 leading-snug">Your admin account privileges are currently active and fully operational.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Password Management (Takes up 7 columns) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden h-full">
            <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-white">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Change Password</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Update credentials</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="p-8 space-y-8">

              <div className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full pl-5 pr-14 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="Enter your current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-1 block">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handleInputChange}
                      className="w-full pl-5 pr-14 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="Create a new secure password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-1 block">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-5 pr-14 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="Repeat your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Info Box */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-indigo-900 mb-2">Security Requirements</h4>
                      <ul className="text-xs font-medium text-indigo-700/80 space-y-1.5">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-400"></div> Minimum 6 characters long</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-400"></div> Must be different from your current password</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-400"></div> Recommend mixing numbers, symbols, and letters</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t border-slate-50">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all disabled:opacity-50"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsView;