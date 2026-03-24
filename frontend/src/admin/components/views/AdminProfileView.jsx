import { useState, useRef } from 'react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import apiService from '../../../services/api';
import { User, Mail, Phone, Calendar, Shield, Edit, Save, X, Camera, Upload } from 'lucide-react';

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      console.log('Uploading admin profile image:', selectedImage);
      
      // Upload image using the admin-specific API
      const response = await apiService.uploadAdminProfileImage(selectedImage);
      
      if (response.success) {
        // Update admin context with new data
        updateAdmin(response.data.admin);
        setSuccess('Profile photo updated successfully!');
        setSelectedImage(null);
        setImagePreview(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for API (only send fields that can be updated)
      const updateData = {
        name: formData.name,
        phone: formData.phone
        // Note: email and role are typically not editable for security reasons
      };

      console.log('Updating admin profile:', updateData);
      
      const response = await apiService.updateAdminProfile(updateData);
      
      if (response.success) {
        // Update the admin context with new data
        updateAdmin(response.data.admin);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
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
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Profile</h1>
        <p className="text-slate-600 mt-2">Manage your admin account information</p>
        
        {/* Success Message */}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="p-8">
          {/* Profile Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <img 
                  className="h-20 w-20 rounded-full object-cover border-4 border-indigo-200" 
                  src={imagePreview || admin?.profileImage || "https://placehold.co/80x80/6366F1/FFFFFF?text=A"} 
                  alt="Admin Avatar" 
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white rounded-full p-1">
                  <Shield className="h-3 w-3 text-white" />
                </div>
                
                {/* Image Upload Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="border border-slate-300 rounded-lg px-3 py-1 text-2xl font-bold"
                    />
                  ) : (
                    admin?.name || 'Admin User'
                  )}
                </h2>
                <p className="text-slate-600 flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  {formData.role}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Image Upload Controls */}
          {selectedImage && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-slate-800">New Profile Photo</p>
                    <p className="text-sm text-slate-600">{selectedImage.name}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleImageUpload}
                    disabled={isUploading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    className="flex items-center px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Mail className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Email Address</label>
                  <p className="text-slate-800 font-medium">{admin?.email || 'admin@rentyatra.com'}</p>
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed for security reasons</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full border border-slate-300 rounded-lg px-3 py-2 mt-1"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium">{admin?.phone || '+91 9876543210'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Member Since</label>
                  <p className="text-slate-800 font-medium">
                    {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'January 2024'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Admin Level</label>
                  <p className="text-slate-800 font-medium">{formData.role}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminProfileView;
