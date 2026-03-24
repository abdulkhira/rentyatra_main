import { useState, useEffect } from 'react';
import EditBoostModal from '../modals/EditBoostModal';
import EditBoostOrderModal from '../modals/EditBoostOrderModal';
import boostService from '../../../services/boostService';
import adminBoostService from '../../../services/adminBoostService';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  X,
  Zap,
  Rocket,
  Crown
} from 'lucide-react';

function BoostManagementView() {
  const [boostPackages, setBoostPackages] = useState([]);
  const [activeTab, setActiveTab] = useState('packages');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userBoosts, setUserBoosts] = useState([]);
  const [boostsLoading, setBoostsLoading] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [isBoostDetailsOpen, setIsBoostDetailsOpen] = useState(false);
  const [isEditBoostModalOpen, setIsEditBoostModalOpen] = useState(false);

  // Map icon strings to actual components
  const iconMap = {
    'Zap': Zap,
    'Rocket': Rocket,
    'Crown': Crown
  };

  // Load packages on component mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const packages = await adminBoostService.getAllBoostPackages();
        setBoostPackages(packages);
      } catch (error) {
        console.error('Error loading boost packages:', error);
      }
    };
    loadPackages();
  }, []);

  // Load user boosts
  const loadUserBoosts = async () => {
    setBoostsLoading(true);
    try {
      const response = await fetch('/api/admin/boost-packages/user-boosts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('User boost orders loaded:', data);
        setUserBoosts(data.data || []);
      } else {
        console.error('Failed to load user boosts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading user boosts:', error);
    } finally {
      setBoostsLoading(false);
    }
  };

  // Load user boosts when tab changes
  useEffect(() => {
    if (activeTab === 'user-boosts') {
      loadUserBoosts();
    }
  }, [activeTab]);

  // Stats (will come from API)
  const stats = {
    totalBoosts: userBoosts.length,
    activeBoosts: userBoosts.filter(boost => boost.status === 'active').length,
    totalRevenue: userBoosts.reduce((sum, boost) => sum + (boost.totalAmount || boost.price || 0), 0),
    monthlyRevenue: userBoosts.filter(boost => {
      const startDate = new Date(boost.createdAt || boost.startDate);
      const currentMonth = new Date();
      return startDate.getMonth() === currentMonth.getMonth() && 
             startDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, boost) => sum + (boost.totalAmount || boost.price || 0), 0)
  };

  const filteredBoosts = userBoosts.filter(boost => {
    const userName = boost.userId?.name || 'Unknown User';
    const userEmail = boost.userId?.email || 'No Email';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         boost.boostName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || boost.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleEditPackage = (packageData) => {
    setSelectedPackage(packageData);
    setIsEditModalOpen(true);
  };

  const handleSavePackage = async (updatedPackage) => {
    try {
      // Update the package using the service
      await adminBoostService.updateBoostPackage(selectedPackage.id, updatedPackage);
      
      // Reload packages to reflect changes
      const packages = await adminBoostService.getAllBoostPackages();
      setBoostPackages(packages);
      
      // Trigger multiple events for instant updates across all tabs/windows
      // 1. Custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('boostPackagesUpdated', { 
        detail: { packageId: selectedPackage.id, timestamp: Date.now() }
      }));
      
      // 2. BroadcastChannel for cross-tab communication
      try {
        const channel = new BroadcastChannel('boost-packages-updates');
        channel.postMessage({ 
          type: 'boostPackagesUpdated', 
          packageId: selectedPackage.id,
          timestamp: Date.now()
        });
        channel.close();
      } catch (broadcastError) {
        // BroadcastChannel not supported, fallback to localStorage
        localStorage.setItem('boostPackagesUpdated', Date.now().toString());
        localStorage.removeItem('boostPackagesUpdated'); // Trigger storage event
      }
      
      // 3. Storage event as additional fallback
      localStorage.setItem('boostPackagesUpdatedData', JSON.stringify({
        packageId: selectedPackage.id,
        timestamp: Date.now()
      }));
      
      alert('Boost package updated successfully! Changes are now live on the user side.');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating boost package:', error);
      alert('Failed to update boost package. Please try again.');
    }
  };

  const handleViewBoost = (boost) => {
    setSelectedBoost(boost);
    setIsBoostDetailsOpen(true);
  };

  const handleEditBoost = (boost) => {
    setSelectedBoost(boost);
    setIsEditBoostModalOpen(true);
  };

  const handleSaveBoostOrder = async (boostId, formData) => {
    try {
      await adminBoostService.updateBoostOrder(boostId, formData);
      // Reload the data
      loadUserBoosts();
      alert('Boost order updated successfully!');
    } catch (error) {
      console.error('Error updating boost order:', error);
      alert('Failed to update boost order. Please try again.');
      throw error;
    }
  };

  const handleDeleteBoost = async (boost) => {
    if (window.confirm(`Are you sure you want to delete this boost order for ${boost.userId?.name || 'Unknown User'}?`)) {
      try {
        await adminBoostService.deleteBoostOrder(boost._id);
        // Reload the data
        loadUserBoosts();
        alert('Boost order deleted successfully!');
      } catch (error) {
        console.error('Error deleting boost order:', error);
        alert('Failed to delete boost order. Please try again.');
      }
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      yellow: 'from-yellow-400 to-orange-500',
      orange: 'from-orange-400 to-red-500',
      purple: 'from-purple-400 to-pink-500'
    };
    return colors[color] || colors.yellow;
  };

  // Helper function to format dates safely
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to format dates with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not Available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to format user ID (same as user account section)
  const formatUserId = (userId) => {
    if (!userId) return 'N/A';
    // Format: USR + last 4 characters (same as user account section)
    return `USR${String(userId).slice(-4).padStart(4, '0')}`;
  };

  // Helper function to get plan display name
  const getPlanDisplayName = (packageName) => {
    if (!packageName) return 'Unknown Plan';
    
    // Extract plan type from package name
    if (packageName.includes('Quick')) return 'Quick Boost';
    if (packageName.includes('Power')) return 'Power Boost';
    if (packageName.includes('Mega')) return 'Mega Boost';
    
    return packageName;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold text-slate-800">Boost Management</h1>
              <p className="text-slate-600 mt-1">Manage boost packages and user boosts</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Boosts</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalBoosts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Active Boosts</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.activeBoosts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">₹{stats.monthlyRevenue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('packages')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'packages'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Boost Packages
                  </button>
                  <button
                    onClick={() => setActiveTab('user-boosts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'user-boosts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    User Boosts
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'packages' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-slate-800">Available Boost Packages</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {boostPackages.map((packageData) => {
                        const IconComponent = iconMap[packageData.icon] || Zap;
                        
                        return (
                          <div key={packageData.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <div className={`bg-gradient-to-br ${getColorClasses(packageData.color)} text-white p-4 rounded-lg mb-4`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-bold">{packageData.name}</h3>
                                  <p className="text-2xl font-bold">₹{packageData.price}</p>
                                </div>
                                {packageData.popular && (
                                  <span className="bg-white text-orange-600 px-2 py-1 rounded-full text-xs font-bold">
                                    POPULAR
                                  </span>
                                )}
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                  <IconComponent className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 mb-6">
                              {packageData.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm text-slate-600">{feature}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditPackage(packageData)}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <Edit size={16} />
                                Edit
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'user-boosts' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-slate-800">User Boost Orders</h2>
                      <div className="flex gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search boosts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Boost Package
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Usage
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Duration
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {boostsLoading ? (
                              <tr>
                                <td colSpan="7" className="px-6 py-12 text-center">
                                  <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                  </div>
                                </td>
                              </tr>
                            ) : filteredBoosts.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                  No boost orders found
                                </td>
                              </tr>
                            ) : (
                              filteredBoosts.map((boost) => (
                                <tr key={boost._id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">
                                        {boost.userId?.name || 'Unknown User'}
                                      </div>
                                      <div className="text-sm text-slate-500">
                                        {boost.userId?.email || 'No Email'}
                                      </div>
                                      <div 
                                        className="text-xs text-slate-400 font-mono cursor-pointer hover:text-slate-600 transition-colors"
                                        title={`Click to copy full User ID: ${boost.userId?._id || 'N/A'}`}
                                        onClick={() => {
                                          if (boost.userId?._id) {
                                            navigator.clipboard.writeText(boost.userId._id);
                                            alert('User ID copied to clipboard!');
                                          }
                                        }}
                                      >
                                        ID: {formatUserId(boost.userId?._id)}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-900 font-medium">{getPlanDisplayName(boost.packageName)}</div>
                                    <div className="text-sm text-slate-500">{boost.boostCount} boosts</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-900">
                                      {boost.usedBoosts || 0}/{boost.boostCount || 0} used
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      {boost.remainingBoosts || 0} remaining
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    ₹{boost.totalAmount || boost.price || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      boost.status === 'active' 
                                        ? 'bg-green-100 text-green-800'
                                        : boost.status === 'expired'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {boost.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {boost.duration || (boost.validFrom && boost.validUntil ? `${Math.ceil((new Date(boost.validUntil) - new Date(boost.validFrom)) / (1000 * 60 * 60 * 24))} days` : 'N/A')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleViewBoost(boost)}
                                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                        title="View Details"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleEditBoost(boost)}
                                        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                        title="Edit"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteBoost(boost)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                        title="Delete"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Boost Package Modal */}
      <EditBoostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        package={selectedPackage}
        onSave={handleSavePackage}
      />

      {/* Edit Boost Order Modal */}
      <EditBoostOrderModal
        isOpen={isEditBoostModalOpen}
        onClose={() => setIsEditBoostModalOpen(false)}
        boostOrder={selectedBoost}
        onSave={handleSaveBoostOrder}
      />

      {/* Boost Details Modal */}
      {isBoostDetailsOpen && selectedBoost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Boost Details</h3>
                <button
                  onClick={() => setIsBoostDetailsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBoost.userId?.name || 'Unknown User'}</p>
                  <p className="mt-1 text-xs text-gray-500">{selectedBoost.userId?.email || 'No Email'}</p>
                  <p 
                    className="mt-1 text-xs text-gray-400 font-mono cursor-pointer hover:text-gray-600 transition-colors"
                    title={`Click to copy full User ID: ${selectedBoost.userId?._id || 'N/A'}`}
                    onClick={() => {
                      if (selectedBoost.userId?._id) {
                        navigator.clipboard.writeText(selectedBoost.userId._id);
                        alert('User ID copied to clipboard!');
                      }
                    }}
                  >
                    ID: {formatUserId(selectedBoost.userId?._id)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Boost Package</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{getPlanDisplayName(selectedBoost.packageName)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Boost Count</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBoost.boostCount} boosts</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usage</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBoost.usedBoosts || 0}/{selectedBoost.boostCount || 0} used</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remaining</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBoost.remainingBoosts || 0} boosts</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedBoost.totalAmount || selectedBoost.price || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBoost.paymentStatus}</p>
                </div>
                {selectedBoost.paymentId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBoost.paymentId}</p>
                  </div>
                )}
                {selectedBoost.orderId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBoost.orderId}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBoost.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBoost.duration}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedBoost.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedBoost.validFrom)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedBoost.validUntil)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoostManagementView;
