import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  UserX,
  Download,
  X,
  Package,
  ShoppingCart,
  Loader2,
  ZoomIn
} from 'lucide-react';

// Image Modal Component
const ImageModal = ({ imageUrl, title, isOpen, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          </div>
          <div className="p-4">
            <img 
              src={imageUrl} 
              alt={title}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', title: '' });

  const openImageModal = (imageUrl, title) => {
    setImageModal({ isOpen: true, imageUrl, title });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: '', title: '' });
  };

  console.log('Modal render - isOpen:', isOpen, 'user:', user);
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal panel */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">User Details</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-4 py-4">
          <div className="space-y-4">
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">{user.name || 'Unknown User'}</h2>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                <Phone className="h-3 w-3 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-600">Phone</p>
                  <p className="text-xs text-slate-800">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                <Calendar className="h-3 w-3 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-600">Join Date</p>
                  <p className="text-xs text-slate-800">{user.joinedDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                <Package className="h-3 w-3 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-600">Plan</p>
                  <p className="text-xs text-slate-800">{user.plan || 'Basic'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                <UserCheck className="h-3 w-3 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-600">Phone Verified</p>
                  <p className="text-xs text-slate-800">{user.isPhoneVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                <UserCheck className="h-3 w-3 text-slate-400" />
                <div>
                  <p className="text-xs font-medium text-slate-600">Status</p>
                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                    user.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : user.status === 'Blocked'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Details */}
            {user?.address && (user.address.street || user.address.city || user.address.state || user.address.pincode || user.address.landmark) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 border-b border-slate-200 pb-1">Address</h4>
                <div className="grid grid-cols-1 gap-2">
                  {user.address.street && (
                    <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Street</p>
                        <p className="text-xs text-slate-800">{user.address.street}</p>
                      </div>
                    </div>
                  )}
                  {user.address.landmark && (
                    <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Landmark</p>
                        <p className="text-xs text-slate-800">{user.address.landmark}</p>
                      </div>
                    </div>
                  )}
                  {(user.address.city || user.address.state) && (
                    <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">City / State</p>
                        <p className="text-xs text-slate-800">{[user.address.city, user.address.state].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  )}
                  {user.address.pincode && (
                    <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-md">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Pincode</p>
                        <p className="text-xs text-slate-800">{user.address.pincode}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aadhar Card Documents */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 border-b border-slate-200 pb-1">Aadhar Card Documents</h4>
             {/* Aadhar Card Images */}
              {console.log('Checking Aadhar images for user:', user.name, {
                front: user.aadharCardFront,
                back: user.aadharCardBack,
                hasFront: !!user.aadharCardFront,
                hasBack: !!user.aadharCardBack
              })}
              
              

              {/* Aadhar Card Images - Show if URLs exist */}
              {(user.aadharCardFront || user.aadharCardBack) ? (
                <div className="grid grid-cols-1 gap-3">
                  {user.aadharCardFront && (
                    <div className="p-2 bg-slate-50 rounded-md">
                      <p className="text-xs font-medium text-slate-600 mb-2">Front Side</p>
                      <div className="relative group cursor-pointer" onClick={() => openImageModal(user.aadharCardFront, 'Aadhar Card Front')}>
                        <img 
                          src={user.aadharCardFront} 
                          alt="Aadhar Card Front"
                          className="w-full h-32 object-cover rounded-md border border-slate-200 group-hover:opacity-80 transition-opacity"
                          onError={(e) => {
                            console.error('Front image failed to load:', user.aadharCardFront);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                          onLoad={() => console.log('Front image loaded successfully:', user.aadharCardFront)}
                        />
                        <div className="w-full h-32 bg-slate-200 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-500" style={{display: 'none'}}>
                          Image not available
                        </div>
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {user.aadharCardBack && (
                    <div className="p-2 bg-slate-50 rounded-md">
                      <p className="text-xs font-medium text-slate-600 mb-2">Back Side</p>
                      <div className="relative group cursor-pointer" onClick={() => openImageModal(user.aadharCardBack, 'Aadhar Card Back')}>
                        <img 
                          src={user.aadharCardBack} 
                          alt="Aadhar Card Back"
                          className="w-full h-32 object-cover rounded-md border border-slate-200 group-hover:opacity-80 transition-opacity"
                          onError={(e) => {
                            console.error('Back image failed to load:', user.aadharCardBack);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                          onLoad={() => console.log('Back image loaded successfully:', user.aadharCardBack)}
                        />
                        <div className="w-full h-32 bg-slate-200 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-500" style={{display: 'none'}}>
                          Image not available
                        </div>
                        {/* Zoom overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-md text-center">
                  <Package className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No Aadhar documents uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Image Modal */}
      <ImageModal
        imageUrl={imageModal.imageUrl}
        title={imageModal.title}
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
      />
    </div>
  );
};

const UserListItem = ({ user, onView, onEdit, onDelete, onToggleStatus }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{user.name || 'Unknown User'}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-slate-600">{user.plan || 'Basic'}</span>
                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                    user.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : user.status === 'Blocked'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.status || 'Active'}
                  </span>
                </div>
              </div>
              <div className="hidden md:block text-xs text-slate-600">
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {user.phone || 'Not provided'}
                </div>
              </div>
              <div className="hidden lg:block text-xs text-slate-600">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {user.joinedDate}
                </div>
              </div>
              <div className="hidden lg:block text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Package className="h-3 w-3 mr-1" />
                    {user.plan || 'Basic'}
                  </div>
                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                    user.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : user.status === 'Blocked'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <button 
              onClick={() => onView(user)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Details"
            >
              <Eye className="h-3 w-3" />
            </button>
            <button 
              onClick={() => onToggleStatus(user)}
              className={`p-1.5 rounded-md transition-colors ${
                user.status === 'Active'
                  ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                  : 'text-slate-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title={user.status === 'Active' ? 'Block User' : 'Unblock User'}
            >
              {user.status === 'Active' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
            </button>
            <button 
              onClick={() => onDelete(user)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete User"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagementView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin token not found');
      }

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '50', // Get more users per page
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter
      });

      // Use proper API URL (works in both dev and production)
      const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const apiUrl = `${apiBaseUrl}/admin/users?${params}`;
      console.log('Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ Non-JSON Response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          url: apiUrl,
          preview: responseText.substring(0, 500)
        });
        
        // Check if it's an HTML error page
        if (responseText.includes('<!doctype html>') || responseText.includes('<html>')) {
          throw new Error(`Backend server returned HTML instead of JSON. This usually means:
1. Backend server is not running or not accessible
2. API endpoint does not exist: ${apiUrl}
3. Wrong base URL configured

Please check:
- Backend server status on Contabo VPS: pm2 status
- Backend logs: pm2 logs myapp
- API endpoint exists in backend routes`);
        }
        
        throw new Error(`Server returned non-JSON response (${contentType || 'unknown'}). Check if backend is running and API endpoint is correct.`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('API Response received:', data);
        console.log('Total users received:', data.data.users.length);
        console.log('First user data:', data.data.users[0]);
        if (data.data.users[0]) {
          console.log('First user Aadhar data:', {
            front: data.data.users[0].aadharCardFront,
            back: data.data.users[0].aadharCardBack,
            verified: data.data.users[0].aadharVerified
          });
          console.log('First user full object:', JSON.stringify(data.data.users[0], null, 2));
        }
        
        setUsers(data.data.users || []);
        setPagination(data.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
          hasNext: false,
          hasPrev: false
        });
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, searchTerm, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.currentPage !== 1) {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      } else {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredUsers = users; // API already handles filtering

  const handleViewUser = async (user) => {
    try {
      console.log('Opening modal for user:', user);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Admin token not found');

      // Fetch full details to include address and latest documents
      const res = await fetch(`/api/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        console.warn('Failed to fetch full user details, using list data');
        setSelectedUser(user);
        setIsModalOpen(true);
        return;
      }

      const data = await res.json();
      const detailedUser = data?.data?.user || user;

      // Backward compatibility: flatten aadhar fields if present in documents
      if (detailedUser.documents) {
        detailedUser.aadharCardFront = detailedUser.documents.aadharCardFront || detailedUser.documents?.aadhar?.frontImage?.url;
        detailedUser.aadharCardBack = detailedUser.documents.aadharCardBack || detailedUser.documents?.aadhar?.backImage?.url;
        detailedUser.aadharVerified = detailedUser.documents.aadharVerified ?? detailedUser.documents?.aadhar?.verified;
      }

      setSelectedUser(detailedUser);
      setIsModalOpen(true);
    } catch (e) {
      console.error('Error opening user details:', e);
      setSelectedUser(user);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user) => {
    console.log('Edit user:', user);
    // Implement edit user modal
  };

  const handleDeleteUser = async (user) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.name || user.email || 'Unknown User'}"?\n\nThis action cannot be undone and will permanently remove the user and all their data.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      console.log('Deleting user:', user);
      
      // Use the API service to delete the user
      const apiService = (await import('../../../services/api')).default;
      await apiService.deleteUser(user.id);

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      
      // Show success message
      alert(`User "${user.name || user.email || 'Unknown User'}" has been successfully deleted.`);
      
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error.message}`);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin token not found');
      }

      const action = user.status === 'Active' ? 'block' : 'unblock';
      
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id 
              ? { ...u, status: data.data.user.status }
              : u
          )
        );
        
        console.log(`User ${action}ed successfully`);
      } else {
        throw new Error(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError(error.message);
    }
  };

  const handleExportUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Admin token not found');

      // Fetch a large page to include all rows with current filters
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error('Failed to fetch users for export');
      const data = await res.json();
      const exportUsers = data?.data?.users || users;

      // Prepare CSV rows
      const headers = [
        'Name',
        'Email',
        'Phone',
        'Plan',
        'Status',
        'Joined Date',
        'Address',
        'Phone Verified',
        'Email Verified',
        'Aadhar Verified',
        'Aadhar Front URL',
        'Aadhar Back URL'
      ];

      const escapeCsv = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        const needsQuotes = /[",\n]/.test(str);
        const escaped = str.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      };

      const rows = exportUsers.map(u => [
        u.name,
        u.email,
        u.phone,
        u.plan || 'Basic',
        u.status,
        u.joinedDate,
        // Prefer addressString from API, else build quickly on client
        (u.addressString) || [u.address?.street, u.address?.landmark, u.address?.city, u.address?.state, u.address?.pincode].filter(Boolean).join(', '),
        u.isPhoneVerified ? 'Yes' : 'No',
        u.isEmailVerified ? 'Yes' : 'No',
        u.aadharVerified ? 'Yes' : 'No',
        u.aadharCardFront || '',
        u.aadharCardBack || ''
      ]);

      const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(',')).join('\n');

      // Trigger download as Excel-compatible CSV
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `rentyatra-users-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert(err.message || 'Failed to export users');
    }
  };

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage and monitor all registered users on your platform.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-slate-600">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage and monitor all registered users on your platform.</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-800">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">User Management</h1>
        <p className="text-sm text-slate-600 mt-1">Manage and monitor all registered users on your platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-medium">Total Users</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{pagination.totalUsers}</p>
            </div>
            <div className="p-1.5 rounded-md bg-blue-500">
              <UserCheck className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-medium">Blocked Users</p>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {users.filter(u => u.status === 'Blocked').length}
              </p>
            </div>
            <div className="p-1.5 rounded-md bg-purple-500">
              <UserX className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="products">Most Products</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExportUsers}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserListItem
              key={user.id}
              user={user}
              onView={handleViewUser}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleStatus}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 text-center">
            <UserCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Users Found</h3>
            <p className="text-slate-500">No users match your current search criteria.</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default UserManagementView;
