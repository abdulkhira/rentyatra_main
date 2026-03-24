import { useState, useEffect } from 'react';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertCircle
} from 'lucide-react';
import apiService from '../../../services/api';

function RentalListingManagementView() {
  const [rentalRequests, setRentalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch rental requests from API
  useEffect(() => {
    fetchRentalRequests();
  }, [searchTerm, statusFilter]);

  const fetchRentalRequests = async () => {
    setLoading(true);
    try {
      console.log('Fetching rental requests with params:', { searchTerm, statusFilter });
      const response = await apiService.getAllRentalRequests(1, 50, statusFilter === 'all' ? '' : statusFilter, searchTerm);
      console.log('API Response:', response);
      if (response.success) {
        console.log('Rental requests data:', response.data.requests);
        setRentalRequests(response.data.requests || []);
      } else {
        console.error('API returned success: false', response);
      }
    } catch (error) {
      console.error('Error fetching rental requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = rentalRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.user?.name && request.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (request.location?.address && request.location.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (request.location?.city && request.location.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const response = await apiService.updateRentalRequestStatus(requestId, newStatus);
      if (response.success) {
        // Refresh the data
        fetchRentalRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const stats = {
    total: rentalRequests.length,
    pending: rentalRequests.filter(r => r.status === 'pending').length,
    approved: rentalRequests.filter(r => r.status === 'approved').length,
    rejected: rentalRequests.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Rental Listing Management</h1>
          <p className="text-slate-600 mt-2">Manage rental listing requests from users</p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading rental requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Rental Listing Management</h1>
        <p className="text-slate-600 mt-2">Manage rental listing requests from users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Requests</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, user, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            Rental Requests ({filteredRequests.length})
            {statusFilter !== 'all' && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)})
              </span>
            )}
          </h2>
        </div>
        
        <div className="divide-y divide-slate-200">
          {filteredRequests.map((request) => (
            <div key={request._id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Primary Image */}
                <div className="flex-shrink-0">
                  {request.images && request.images.length > 0 ? (
                    <div className="relative">
                      <img
                        src={request.images.find(img => img.isPrimary)?.url || request.images[0].url}
                        alt={request.title}
                        className="w-24 h-24 object-cover rounded-lg shadow-md"
                      />
                      {request.images.find(img => img.isPrimary) && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>

                {/* Request Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">{request.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 mb-3 line-clamp-2">{request.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.location?.address || request.location?.city || 'Location not specified'}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {request.user?.name || 'Unknown User'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        Service Radius: {request.location?.serviceRadius || 7} km
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-indigo-600">
                      ₹{request.price?.amount || 0}/{request.price?.period || 'day'}
                    </span>
                    
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(request._id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(request._id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Request Details */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Rental Request Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {/* User Information Section */}
              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <label className="text-sm font-medium text-slate-500">Full Name</label>
                    <p className="text-lg font-semibold text-slate-800">{selectedRequest.user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Phone Number</label>
                    <p className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedRequest.contactInfo?.phone || selectedRequest.user?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Email Address</label>
                    <p className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedRequest.contactInfo?.email || selectedRequest.user?.email || 'Not provided'}
                    </p>
                  </div>
                  </div>
                </div>
                
              {/* Post Information Section */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Post Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Post Title</label>
                    <p className="text-xl font-bold text-slate-800">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Post Description</label>
                    <p className="text-slate-700 leading-relaxed">{selectedRequest.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500">Posted Date</label>
                      <p className="text-lg font-semibold text-slate-800">
                        {new Date(selectedRequest.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500">Posted Time</label>
                      <p className="text-lg font-semibold text-slate-800">
                        {new Date(selectedRequest.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location & Service Area Section */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Service Area
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Post Location</label>
                    <p className="text-lg font-semibold text-slate-800">
                      {selectedRequest.location?.address || 'Address not provided'}
                    </p>
                    <div className="text-sm text-slate-600 mt-2 space-y-1">
                      <p><strong>Location Type:</strong> {selectedRequest.location?.locationType || 'residential'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Service Area Details</label>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full opacity-30"></div>
                        <span className="text-lg font-bold text-blue-600">
                          {selectedRequest.location?.serviceRadius || 7}km Service Area
                        </span>
                      </div>
                      {selectedRequest.location?.coordinates && (
                        <div className="text-sm text-slate-600 space-y-1">
                          <p><strong>Coordinates:</strong></p>
                          <p>Lat: {selectedRequest.location.coordinates.latitude?.toFixed(6) || 'N/A'}</p>
                          <p>Lng: {selectedRequest.location.coordinates.longitude?.toFixed(6) || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Details Section */}
              <div className="bg-indigo-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pricing Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <label className="text-sm font-medium text-slate-500">Price Per Day</label>
                    <p className="text-2xl font-bold text-indigo-600">
                      ₹{selectedRequest.price?.pricePerDay || selectedRequest.price?.amount || 0}/day
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <label className="text-sm font-medium text-slate-500">Rental Period</label>
                    <p className="text-lg font-semibold text-slate-800">
                      {selectedRequest.price?.period || 'daily'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <label className="text-sm font-medium text-slate-500">Currency</label>
                    <p className="text-lg font-semibold text-slate-800">
                      {selectedRequest.price?.currency || 'INR'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product & Category Section */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Product & Category Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Product</label>
                    <p className="text-lg font-semibold text-slate-800">
                      {selectedRequest.product?.name || 'Product not specified'}
                    </p>
                    {selectedRequest.product?.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedRequest.product.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Category</label>
                    <p className="text-lg font-semibold text-slate-800">
                      {selectedRequest.category?.name || 'Category not specified'}
                    </p>
                    {selectedRequest.category?.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedRequest.category.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Item Condition</label>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedRequest.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                        selectedRequest.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                        selectedRequest.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedRequest.condition?.charAt(0).toUpperCase() + selectedRequest.condition?.slice(1) || 'Good'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              

              {/* Availability Section */}
              <div className="bg-teal-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Availability & Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <label className="text-sm font-medium text-slate-500">Available From</label>
                    <p className="text-lg font-semibold text-slate-800">
                      {selectedRequest.availability?.startDate ? 
                        new Date(selectedRequest.availability.startDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <label className="text-sm font-medium text-slate-500">Currently Available</label>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedRequest.availability?.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedRequest.availability?.isAvailable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Media Content</h3>
                
                {/* Images */}
                {selectedRequest.images && selectedRequest.images.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium text-slate-500 mb-3 block">Images ({selectedRequest.images.length})</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedRequest.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={`${selectedRequest.title} - Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                          />
                          {image.isPrimary && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {selectedRequest.video && selectedRequest.video.url && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-3 block">Video</label>
                    <div className="relative">
                      <video
                        src={selectedRequest.video.url}
                        controls
                        className="w-full max-w-md rounded-lg shadow-md"
                        poster={selectedRequest.images && selectedRequest.images.length > 0 ? selectedRequest.images[0].url : undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}

                {(!selectedRequest.images || selectedRequest.images.length === 0) && (!selectedRequest.video || !selectedRequest.video.url) && (
                  <p className="text-slate-500">No media content available</p>
                )}
              </div>

              {/* Statistics Section */}

              {/* Status & Action Section */}
              <div className="bg-slate-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Current Status</label>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusIcon(selectedRequest.status)}
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </span>
                    </div>
                    {selectedRequest.reviewedBy && (
                      <div className="mt-2 text-sm text-slate-600">
                        <p><strong>Reviewed by:</strong> {selectedRequest.reviewedBy?.name || 'Admin'}</p>
                        <p><strong>Reviewed on:</strong> {selectedRequest.reviewedAt ? 
                          new Date(selectedRequest.reviewedAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                        {selectedRequest.rejectionReason && (
                          <p><strong>Rejection Reason:</strong> {selectedRequest.rejectionReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
              {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                          handleStatusChange(selectedRequest._id, 'approved');
                        setShowModal(false);
                      }}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        <CheckCircle className="h-5 w-5" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => {
                          handleStatusChange(selectedRequest._id, 'rejected');
                        setShowModal(false);
                      }}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        <XCircle className="h-5 w-5" />
                      Reject Request
                    </button>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentalListingManagementView;
