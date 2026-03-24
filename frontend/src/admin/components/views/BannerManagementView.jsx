import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';
import AddBannerModal from './AddBannerModal';
import EditBannerModal from './EditBannerModal';
import apiService from '../../../services/api';

const BannerManagementView = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBanners: 0
  });
  const [stats, setStats] = useState({
    totalBanners: 0
  });

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if admin token exists
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setError('Admin authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      const response = await apiService.getAllBanners(
        pagination.currentPage,
        10
      );
      
      setBanners(response.data.banners);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching banners:', error);
      if (error.message.includes('Access denied') || error.message.includes('No token')) {
        setError('Admin authentication required. Please log in.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Failed to fetch banners: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [pagination.currentPage]);

  useEffect(() => {
    const totalCount = typeof pagination.totalBanners === 'number'
      ? pagination.totalBanners
      : banners.length;

    setStats({
      totalBanners: totalCount
    });
  }, [banners, pagination.totalBanners]);

  // Handle banner added
  const handleBannerAdded = (newBanner) => {
    setBanners(prev => [newBanner, ...prev]);
    setPagination(prev => ({
      ...prev,
      totalBanners: (prev.totalBanners || 0) + 1
    }));
  };

  // Handle edit banner
  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setIsEditModalOpen(true);
  };

  // Handle banner updated
  const handleBannerUpdated = (updatedBanner) => {
    console.log('Banner updated in state:', updatedBanner);
    setBanners(prev => {
      const newBanners = prev.map(b => b._id === updatedBanner._id ? updatedBanner : b);
      console.log('Updated banners list:', newBanners);
      return newBanners;
    });
  };

  // Handle delete banner
  const handleDeleteBanner = async (banner) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete banner "${banner.title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await apiService.deleteBanner(banner._id);
      setBanners(prev => prev.filter(b => b._id !== banner._id));
      setPagination(prev => ({
        ...prev,
        totalBanners: Math.max((prev.totalBanners || 0) - 1, 0)
      }));
      alert('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };


  // Filter banners based on search term
  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Banners</h1>
          <p className="text-gray-600">Manage your advertisement banners</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ImageIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Banners</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBanners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search banners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Banners List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {error && (
          <div className="p-6 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 mb-2">{error}</p>
              {error.includes('authentication') ? (
                <p className="text-sm text-red-500">
                  Please log in as an admin to access banner management.
                </p>
              ) : (
                <button
                  onClick={fetchBanners}
                  className="mt-2 text-blue-600 hover:text-blue-700 underline"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {filteredBanners.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Banners Found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? 'No banners match your search.'
                : 'Get started by adding your first banner.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Your First Banner
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredBanners.map((banner) => (
              <div key={banner._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {/* Banner Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={banner.banner}
                      alt={banner.title}
                      className="w-20 h-12 object-cover rounded-lg border border-gray-200"
                    />
                  </div>

                  {/* Banner Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {banner.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(banner.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditBanner(banner)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Banner"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Banner"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * 10) + 1} to{' '}
                {Math.min(pagination.currentPage * 10, pagination.totalBanners)} of{' '}
                {pagination.totalBanners} banners
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Banner Modal */}
      <AddBannerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBannerAdded={handleBannerAdded}
      />

      {/* Edit Banner Modal */}
      <EditBannerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBanner(null);
        }}
        onBannerUpdated={handleBannerUpdated}
        banner={editingBanner}
      />
    </div>
  );
};

export default BannerManagementView;
