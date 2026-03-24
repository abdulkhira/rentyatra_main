import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
// Removed demo user import to avoid showing mock data like "Rahul Sharma"

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
    if (value === null || value === undefined) return '—';
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
          console.log('Documents API response:', response);
          
          if (response && response.success && response.data && response.data.documents) {
            console.log('Setting user documents:', response.data.documents);
            setUserDocuments(response.data.documents);
          } else {
            console.warn('Invalid documents response structure:', response);
            setUserDocuments(null);
          }
        } catch (err) {
          console.error('Error fetching documents:', err);
          setUserDocuments(null);
          // Don't set error for documents, just log it
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
        // Update the profile state with the response data
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
        
        // Update the profile state
        setProfile(updatedProfile);
        
        // Update the user data in AuthContext
        updateUser(response.data.user);
        
        setSuccessMessage('Profile updated successfully!');
        setEditMode(false);
        
        // Clear success message after 3 seconds
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
      // revert preview on error
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 text-center">Loading profile...</Card>
    </div>
  );

  if (error && !useDemoData) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
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
    // API returns URLs directly as strings, not objects
    const frontUrl = userDocuments.aadhar.frontImage;
    const backUrl = userDocuments.aadhar.backImage;
    
    // Only set if URL exists and is a valid string
    if (frontUrl && typeof frontUrl === 'string' && frontUrl.trim() !== '') {
      aadharFront = frontUrl;
    }
    
    if (backUrl && typeof backUrl === 'string' && backUrl.trim() !== '') {
      aadharBack = backUrl;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-6">
          {/* Back Button - Show on all devices */}
          <div className="mb-4">
            <button
              onClick={() => {
                // Navigate to dashboard/account page
                navigate('/dashboard/account');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-center">{editMode ? 'Edit Profile' : 'My Profile'}</h1>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {editMode ? (
          /* Edit Form */
          <Card className="p-4 sm:p-6">
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={editFormData.address || ''}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={editFormData.city || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={editFormData.state || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={editFormData.pincode || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Phone Number - Read Only */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Cannot be changed)
                  </label>
                  <input
                    type="tel"
                    value={profile?.phone || ''}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pt-4 border-t">
                <Button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-sm py-2 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={editLoading}
                  className="bg-green-600 hover:bg-green-700 text-sm py-2 order-1 sm:order-2"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          /* Profile Overview */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <Card className="p-4 lg:p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-gray-100 mb-3 lg:mb-4 cursor-pointer relative group"
                  onClick={() => !uploadingImage && fileInputRef.current && fileInputRef.current.click()}
                  title="Click to change photo"
                >
                  {localProfileImage || profileImage ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={localProfileImage || profileImage} alt="Profile image" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl lg:text-3xl text-gray-500">{safeRender(name).charAt(0)}</div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">{uploadingImage ? 'Uploading...' : 'Change'}</div>
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
                <h2 className="font-bold text-base sm:text-lg">{safeRender(name)}</h2>
                <p className="text-xs sm:text-sm text-gray-500">{safeRender(email)}</p>
                <p className="mt-2 lg:mt-3 text-xs sm:text-sm text-gray-700">{safeRender(phone)}</p>
              </div>
            </Card>

            <Card className="p-4 lg:col-span-2 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact & Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Full name</p>
                  <p className="font-medium text-sm sm:text-base">{safeRender(name)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium text-sm sm:text-base">{safeRender(phone)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="font-medium text-sm sm:text-base">{safeRender(address)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">City</p>
                  <p className="font-medium text-sm sm:text-base">{safeRender(city)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">State</p>
                  <p className="font-medium text-sm sm:text-base">{safeRender(state)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pincode</p>
                  <p className="font-medium text-sm sm:text-base">{safeRender(pincode)}</p>
                </div>
              </div>

              <hr className="my-4 sm:my-6" />

               <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Aadhar Card</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                 <div className="border border-dashed border-gray-200 rounded p-2 sm:p-3 flex items-center justify-center min-h-[120px] sm:min-h-[160px]">
                   {documentsLoading ? (
                     <div className="text-center">
                       <div className="w-8 h-8 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-gray-400 text-xs sm:text-sm">Loading...</p>
                     </div>
                   ) : aadharFront ? (
                     <div className="w-full h-full flex flex-col items-center justify-center relative">
                       <img 
                         src={aadharFront} 
                         alt="Aadhar front" 
                         className="max-h-32 sm:max-h-40 object-contain rounded shadow-sm border border-gray-200" 
                         onError={(e) => {
                           console.error('Failed to load Aadhar front image:', aadharFront);
                           // Hide the broken image and show error message
                           if (e.target) {
                             e.target.style.display = 'none';
                           }
                           const parent = e.target?.parentElement;
                           if (parent) {
                             const errorDiv = parent.querySelector('.aadhar-error-container');
                             if (errorDiv) {
                               errorDiv.style.display = 'flex';
                             }
                           }
                         }}
                         onLoad={() => console.log('Aadhar front image loaded successfully:', aadharFront)}
                         loading="lazy"
                         crossOrigin="anonymous"
                       />
                       <div className="aadhar-error-container hidden flex-col items-center justify-center absolute inset-0 bg-gray-50 rounded">
                         <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                           <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                         </div>
                         <p className="text-gray-400 text-xs sm:text-sm text-center">Image not available</p>
                         <p className="text-gray-300 text-xs text-center mt-1">The image may have been deleted</p>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center">
                       <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                         <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                       </div>
                       <p className="text-gray-400 text-xs sm:text-sm">Front image not uploaded</p>
                     </div>
                   )}
                 </div>
                 <div className="border border-dashed border-gray-200 rounded p-2 sm:p-3 flex items-center justify-center min-h-[120px] sm:min-h-[160px]">
                   {documentsLoading ? (
                     <div className="text-center">
                       <div className="w-8 h-8 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-gray-400 text-xs sm:text-sm">Loading...</p>
                     </div>
                   ) : aadharBack ? (
                     <div className="w-full h-full flex flex-col items-center justify-center relative">
                       <img 
                         src={aadharBack} 
                         alt="Aadhar back" 
                         className="max-h-32 sm:max-h-40 object-contain rounded shadow-sm border border-gray-200" 
                         onError={(e) => {
                           console.error('Failed to load Aadhar back image:', aadharBack);
                           // Hide the broken image and show error message
                           if (e.target) {
                             e.target.style.display = 'none';
                           }
                           const parent = e.target?.parentElement;
                           if (parent) {
                             const errorDiv = parent.querySelector('.aadhar-error-container');
                             if (errorDiv) {
                               errorDiv.style.display = 'flex';
                             }
                           }
                         }}
                         onLoad={() => console.log('Aadhar back image loaded successfully:', aadharBack)}
                         loading="lazy"
                         crossOrigin="anonymous"
                       />
                       <div className="aadhar-error-container hidden flex-col items-center justify-center absolute inset-0 bg-gray-50 rounded">
                         <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                           <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                         </div>
                         <p className="text-gray-400 text-xs sm:text-sm text-center">Image not available</p>
                         <p className="text-gray-300 text-xs text-center mt-1">The image may have been deleted</p>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center">
                       <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                         <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                       </div>
                       <p className="text-gray-400 text-xs sm:text-sm">Back image not uploaded</p>
                     </div>
                   )}
                 </div>
             </div>
          </Card>
        </div>
        )}

        {/* Action Buttons - Bottom of Profile View */}
        {!editMode && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Button onClick={() => setEditMode(true)} className="bg-blue-600 hover:bg-blue-700 text-sm py-2">
              Edit Profile
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;

