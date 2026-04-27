import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FileText, User } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localProfileImage, setLocalProfileImage] = useState('');
  const [useDemoData, setUseDemoData] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [userDocuments, setUserDocuments] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Helper function to safely render values (prevent object rendering)
  const safeRender = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return '—';
    return String(value);
  };

  useEffect(() => {
    if (user) {
      // Handle address object structure
      let addressString = '';
      let city = '';
      let state = '';
      let pincode = '';

      if (typeof user.address === 'object' && user.address !== null) {
        // If address is an object, extract the street address
        addressString = user.address.street || user.address.address || '';
        city = user.address.city || user.city || '';
        state = user.address.state || user.state || '';
        pincode = user.address.pincode || user.pincode || '';
      } else {
        // If address is a string
        addressString = user.address || '';
        city = user.city || '';
        state = user.state || '';
        pincode = user.pincode || '';
      }

      // Use real user data from AuthContext
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: addressString,
        city: city,
        state: state,
        pincode: pincode,
        profileImage: user.profileImage || '',
        documents: user.documents || []
      });
      setLocalProfileImage(user.profileImage || '');
      setUseDemoData(false);
    } else {
      // If no user is logged in, do not show mock data; use empty placeholders
      setUseDemoData(true);
      setProfile({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        profileImage: '',
        documents: []
      });
    }
  }, [user]);

  // Fetch documents from backend
  useEffect(() => {
    const fetchDocuments = async () => {
      if (user) {
        try {
          setDocumentsLoading(true);
          const response = await api.getUserDocuments();

          if (response && response.success && response.data && response.data.documents) {
            setUserDocuments(response.data.documents);
          } else {
            setUserDocuments(null);
          }
        } catch (err) {
          console.error('Error fetching documents:', err);
          setUserDocuments(null);
        } finally {
          setDocumentsLoading(false);
        }
      }
    };

    fetchDocuments();
  }, [user]);

  // Initialize edit form data when entering edit mode
  useEffect(() => {
    if (editMode && profile) {
      setEditFormData({
        name: profile?.name || '',
        email: profile?.email || '',
        address: profile?.address || '',
        city: profile?.city || '',
        state: profile?.state || '',
        pincode: profile?.pincode || '',
      });
    }
  }, [editMode, profile]);

  // Handle edit form changes
  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');

    try {
      // Prepare data for backend API
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        address: {
          street: editFormData.address,
          city: editFormData.city,
          state: editFormData.state,
          pincode: editFormData.pincode,
          landmark: '' // Add landmark field if needed
        }
      };

      // Call backend API to update profile
      const response = await api.updateUserProfile(updateData);

      if (response.success) {
        const updatedProfile = {
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone,
          address: response.data.user.address?.street || '',
          city: response.data.user.address?.city || '',
          state: response.data.user.address?.state || '',
          pincode: response.data.user.address?.pincode || '',
          profileImage: response.data.user.profileImage || '',
          documents: userDocuments || []
        };

        setProfile(updatedProfile);
        updateUser(response.data.user);

        setSuccessMessage('Profile updated successfully!');
        setEditMode(false);

        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setError(response.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      // Optimistic preview
      const url = URL.createObjectURL(file);
      setLocalProfileImage(url);

      const uploadRes = await api.uploadProfileImage(file);
      if (!uploadRes.success) {
        throw new Error(uploadRes.message || 'Upload failed');
      }

      // Refresh user data
      const me = await api.getMe();
      if (me.success && me.data && me.data.user) {
        updateUser(me.data.user);
        setProfile(prev => ({
          ...prev,
          profileImage: me.data.user.profileImage || ''
        }));
        setLocalProfileImage(me.data.user.profileImage || '');
        setSuccessMessage('Profile photo updated successfully');
        setTimeout(() => setSuccessMessage(''), 2500);
      }
    } catch (err) {
      console.error('Profile image upload error:', err);
      setError(err.message || 'Failed to upload profile photo');
      setLocalProfileImage(profile?.profileImage || '');
    } finally {
      setUploadingImage(false);
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditFormData({});
    setError('');
    setSuccessMessage('');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f0f0f5] font-sans">
      <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-sm w-full">
        <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
        <p className="text-gray-500 font-bold">Loading profile...</p>
      </div>
    </div>
  );

  if (error && !useDemoData) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f0f0f5] font-sans">
      <Card className="p-8 text-center max-w-md rounded-3xl shadow-sm border border-gray-100 bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">Oops!</h2>
        <p className="text-gray-500 mb-8 font-medium">{error}</p>
        <Button onClick={() => navigate(-1)} className="w-full bg-[#fc8019] hover:bg-orange-600 rounded-xl font-bold py-3 text-base">Go Back</Button>
      </Card>
    </div>
  );

  const {
    name, email, phone, address, city, state, pincode, profileImage, documents
  } = profile || {};

  // Get Aadhar images from backend documents
  let aadharFront = null;
  let aadharBack = null;

  if (userDocuments && userDocuments.aadhar) {
    const frontUrl = userDocuments.aadhar.frontImage;
    const backUrl = userDocuments.aadhar.backImage;

    if (frontUrl && typeof frontUrl === 'string' && frontUrl.trim() !== '') {
      aadharFront = frontUrl;
    }
    if (backUrl && typeof backUrl === 'string' && backUrl.trim() !== '') {
      aadharBack = backUrl;
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-[1000px] mx-auto">

        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/account')}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
            {editMode ? 'Edit Profile' : 'My Profile'}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-500 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-green-800 text-sm font-bold">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-red-800 text-sm font-bold">{error}</p>
          </div>
        )}

        {editMode ? (
          /* Edit Form */
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name || ''}
                    onChange={handleEditChange}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email || ''}
                    onChange={handleEditChange}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    required
                  />
                </div>

                {/* Phone Number - Read Only */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Phone Number (Verified)
                  </label>
                  <input
                    type="tel"
                    value={profile?.phone || ''}
                    className="w-full p-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Street Address
                  </label>
                  <textarea
                    name="address"
                    value={editFormData.address || ''}
                    onChange={handleEditChange}
                    rows={2}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={editFormData.city || ''}
                    onChange={handleEditChange}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    required
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={editFormData.state || ''}
                    onChange={handleEditChange}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    required
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={editFormData.pincode || ''}
                    onChange={handleEditChange}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
                <Button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm py-3 px-8 rounded-xl font-bold order-2 sm:order-1 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="bg-[#fc8019] hover:bg-orange-600 text-white text-sm py-3 px-8 rounded-xl font-bold border-none order-1 sm:order-2 shadow-sm"
                >
                  {editLoading ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Profile Overview */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Avatar Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center h-fit">
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-dashed border-gray-300 hover:border-[#fc8019] mb-5 cursor-pointer relative group transition-colors"
                onClick={() => !uploadingImage && fileInputRef.current && fileInputRef.current.click()}
                title="Click to change photo"
              >
                {localProfileImage || profileImage ? (
                  <img src={localProfileImage || profileImage} alt="Profile image" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-orange-50 rounded-full flex items-center justify-center text-3xl font-extrabold text-[#fc8019]">
                    {safeRender(name).charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    {uploadingImage ? 'Uploading...' : 'Change'}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) handleProfileImageUpload(f);
                  }}
                />
              </div>
              <h2 className="font-extrabold text-xl sm:text-2xl tracking-tight text-gray-900">{safeRender(name)}</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">{safeRender(email)}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                <span className="text-xs font-bold uppercase tracking-wider">Verified User</span>
              </div>
            </div>

            {/* Right Column: Details & Docs */}
            <div className="lg:col-span-2 space-y-6">

              {/* Contact & Address */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Contact & Address</h3>
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-[#fc8019] hover:text-orange-600 font-bold text-sm flex items-center gap-1 transition-colors"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Phone</p>
                    <p className="font-bold text-gray-800 text-base">{safeRender(phone)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Pincode</p>
                    <p className="font-bold text-gray-800 text-base">{safeRender(pincode)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Street Address</p>
                    <p className="font-medium text-gray-800 text-sm sm:text-base leading-relaxed">{safeRender(address)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">City</p>
                    <p className="font-bold text-gray-800 text-base">{safeRender(city)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">State</p>
                    <p className="font-bold text-gray-800 text-base">{safeRender(state)}</p>
                  </div>
                </div>
              </div>

              {/* Documents Card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight mb-6 pb-4 border-b border-gray-100">Verification Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Front Image */}
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-3">Aadhar Card Front</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-2 sm:p-3 flex items-center justify-center min-h-[140px] sm:min-h-[160px] bg-gray-50 relative overflow-hidden">
                      {documentsLoading ? (
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-3 border-2 border-[#fc8019] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Loading...</p>
                        </div>
                      ) : aadharFront ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                          <img
                            src={aadharFront}
                            alt="Aadhar front"
                            className="max-h-32 sm:max-h-40 object-cover rounded-xl shadow-sm border border-gray-200 w-full"
                            onError={(e) => {
                              if (e.target) e.target.style.display = 'none';
                              const parent = e.target?.parentElement;
                              if (parent) {
                                const errorDiv = parent.querySelector('.aadhar-error-container');
                                if (errorDiv) errorDiv.style.display = 'flex';
                              }
                            }}
                            loading="lazy"
                            crossOrigin="anonymous"
                          />
                          <div className="aadhar-error-container hidden flex-col items-center justify-center absolute inset-0 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <FileText size={18} className="text-gray-400" />
                            </div>
                            <p className="text-gray-400 font-bold text-xs">Image unavailable</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 bg-white shadow-sm rounded-full flex items-center justify-center">
                            <FileText size={20} className="text-gray-300" />
                          </div>
                          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Not Uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back Image */}
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-3">Aadhar Card Back</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-2 sm:p-3 flex items-center justify-center min-h-[140px] sm:min-h-[160px] bg-gray-50 relative overflow-hidden">
                      {documentsLoading ? (
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-3 border-2 border-[#fc8019] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Loading...</p>
                        </div>
                      ) : aadharBack ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                          <img
                            src={aadharBack}
                            alt="Aadhar back"
                            className="max-h-32 sm:max-h-40 object-cover rounded-xl shadow-sm border border-gray-200 w-full"
                            onError={(e) => {
                              if (e.target) e.target.style.display = 'none';
                              const parent = e.target?.parentElement;
                              if (parent) {
                                const errorDiv = parent.querySelector('.aadhar-error-container');
                                if (errorDiv) errorDiv.style.display = 'flex';
                              }
                            }}
                            loading="lazy"
                            crossOrigin="anonymous"
                          />
                          <div className="aadhar-error-container hidden flex-col items-center justify-center absolute inset-0 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <FileText size={18} className="text-gray-400" />
                            </div>
                            <p className="text-gray-400 font-bold text-xs">Image unavailable</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 bg-white shadow-sm rounded-full flex items-center justify-center">
                            <FileText size={20} className="text-gray-300" />
                          </div>
                          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Not Uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;