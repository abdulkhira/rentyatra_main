import { useState, useRef } from 'react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import apiService from '../../../services/api';
import {
  User, Mail, Phone, Calendar, Shield, Edit, Save, X,
  Camera, Upload, BadgeCheck, MapPin, Briefcase
} from 'lucide-react';

function AdminProfileView() {
  const { admin, updateAdmin } = useAdminAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    role: admin?.role || 'Admin'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    setIsUploading(true);
    setError(null);
    try {
      const response = await apiService.uploadAdminProfileImage(selectedImage);
      if (response.success) {
        updateAdmin(response.data.admin);
        setSuccess('Profile photo updated successfully!');
        setSelectedImage(null);
        setImagePreview(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to upload image');
      }
    } catch (error) {
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const updateData = { name: formData.name, phone: formData.phone };
      const response = await apiService.updateAdminProfile(updateData);
      if (response.success) {
        updateAdmin(response.data.admin);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (error) {
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: admin?.name || '',
      email: admin?.email || '',
      phone: admin?.phone || '',
      role: admin?.role || 'Admin'
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2 w-80">
        {success && (
          <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/20 backdrop-blur-md">
            <BadgeCheck className="h-5 w-5" />
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-400/20 backdrop-blur-md">
            <X className="h-5 w-5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}
      </div>

      {/* Header & Cover Section */}
      <div className="relative">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 rounded-3xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>

        {/* Profile Info Overlay Card */}
        <div className="relative -mt-16 px-6 pb-2">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-2xl p-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              {/* Avatar Logic */}
              <div className="relative group">
                <div className="h-32 w-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-100">
                  <img
                    className="h-full w-full object-cover"
                    src={imagePreview || admin?.profileImage || "https://placehold.co/128x128/6366F1/FFFFFF?text=Admin"}
                    alt="Profile"
                  />
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-3xl cursor-pointer">
                  <Camera className="h-8 w-8 text-white" />
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              </div>

              <div className="text-center md:text-left mb-2">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {isEditing ? (
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-slate-100 border-none rounded-xl px-3 py-1 text-2xl font-bold focus:ring-2 focus:ring-indigo-500 w-full"
                      />
                    ) : (admin?.name || 'Admin User')}
                  </h1>
                  {!isEditing && <BadgeCheck className="h-6 w-6 text-indigo-500 fill-indigo-50" />}
                </div>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1 flex items-center justify-center md:justify-start gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  {formData.role} Profile
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-2">
              {isEditing ? (
                <>
                  <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50">
                    {isLoading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                  <button onClick={handleCancel} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm">
                  <Edit className="h-4 w-4 text-indigo-500" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Image Upload Preview (Conditional) */}
        {selectedImage && (
          <div className="lg:col-span-3 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-2xl object-cover shadow-md" />
                <div>
                  <p className="font-black text-indigo-900">New profile photo ready</p>
                  <p className="text-sm text-indigo-600 font-medium">{selectedImage.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleImageUpload} disabled={isUploading} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                  {isUploading ? "Uploading..." : <><Upload className="h-4 w-4" /> Apply Photo</>}
                </button>
                <button onClick={handleRemoveImage} className="bg-white text-slate-500 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition-all">
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center: Details Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
                  <Mail className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                  <p className="text-slate-700 font-bold">{admin?.email}</p>
                </div>
                <p className="text-[10px] text-slate-400 italic px-1">* Email is managed by system security</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white border-indigo-200 ring-4 ring-indigo-50' : 'bg-slate-50 border-slate-100'}`}>
                  <Phone className={`h-5 w-5 ${isEditing ? 'text-indigo-500' : 'text-slate-400'}`} />
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-transparent border-none p-0 w-full focus:ring-0 font-bold text-slate-700"
                    />
                  ) : (
                    <p className="text-slate-700 font-bold">{admin?.phone || '+91 0000000000'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="h-24 w-24" />
            </div>
            <h3 className="text-lg font-bold mb-6">Account Status</h3>

            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Calendar className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Member Since</p>
                  <p className="font-black text-lg">
                    {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Jan 2024'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-emerald-500/20">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Security Level</p>
                  <p className="font-black text-lg text-emerald-400">Verified {formData.role}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 text-slate-600 mb-2">
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-bold">Rentyatra Management</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-bold">Main Headquarters</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminProfileView;