import { useState, useEffect } from 'react';
import {
  Plus, Search, Trash2, Edit, Image as ImageIcon,
  Calendar, AlertCircle, ChevronLeft, ChevronRight, MoreHorizontal
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

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setError('Admin authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const response = await apiService.getAllBanners(pagination.currentPage, 12); // Changed limit to 12 for better grid display

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
    setStats({ totalBanners: totalCount });
  }, [banners, pagination.totalBanners]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBannerAdded = (newBanner) => {
    setBanners(prev => [newBanner, ...prev]);
    setPagination(prev => ({
      ...prev,
      totalBanners: (prev.totalBanners || 0) + 1
    }));
  };

  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setIsEditModalOpen(true);
  };

  const handleBannerUpdated = (updatedBanner) => {
    setBanners(prev => prev.map(b => b._id === updatedBanner._id ? updatedBanner : b));
  };

  const handleDeleteBanner = async (banner) => {
    const confirmed = window.confirm(`Are you sure you want to delete banner "${banner.title}"?`);
    if (!confirmed) return;

    try {
      await apiService.deleteBanner(banner._id);
      setBanners(prev => prev.filter(b => b._id !== banner._id));
      setPagination(prev => ({
        ...prev,
        totalBanners: Math.max((prev.totalBanners || 0) - 1, 0)
      }));
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ad Banners</h1>
          <p className="text-slate-500 font-medium">Manage promotional hero banners across the platform</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          Add New Banner
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="flex-1">
            <p className="text-rose-700 font-bold text-sm">{error}</p>
            {error.includes('authentication') && (
              <p className="text-rose-500 text-xs font-medium mt-1">Please log in as an admin to access banner management.</p>
            )}
          </div>
          {!error.includes('authentication') && (
            <button onClick={fetchBanners} className="px-4 py-2 bg-white text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors shadow-sm">
              Retry
            </button>
          )}
        </div>
      )}

      {/* Top Controls: Stats + Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stat Card */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Banners</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalBanners}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="lg:col-span-2 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm flex items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search banners by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>
      </div>

      {/* Banners Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[340px]">
              <div className="w-full aspect-[21/9] bg-slate-100 animate-pulse"></div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-6 bg-slate-100 rounded-lg w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded-lg w-1/3 animate-pulse"></div>
                </div>
                <div className="flex gap-3 pt-4">
                  <div className="h-12 bg-slate-100 rounded-xl flex-1 animate-pulse"></div>
                  <div className="h-12 bg-slate-100 rounded-xl flex-1 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredBanners.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800">No Banners Found</h3>
            <p className="text-slate-500 font-medium mt-2 mb-6">
              {searchTerm ? 'No banners match your search criteria.' : 'Your platform is currently missing promotional banners.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-100 transition-colors"
              >
                Add Your First Banner
              </button>
            )}
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <div key={banner._id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
              {/* Banner Image Area */}
              <div className="w-full aspect-[21/9] bg-slate-100 relative overflow-hidden border-b border-slate-50">
                <img
                  src={banner.banner}
                  alt={banner.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Banner Info Area */}
              <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={banner.title}>
                    {banner.title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    Created: {new Date(banner.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-50">
                  <button
                    onClick={() => handleEditBanner(banner)}
                    className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner)}
                    className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Pagination Navigation */}
      {pagination.totalPages > 1 && !loading && (
        <div className="flex items-center justify-between bg-white px-6 py-5 rounded-[2rem] border border-slate-100 shadow-sm mt-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-500">
              Page <span className="text-slate-900">{pagination.currentPage}</span> of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden md:flex gap-2">
            {[...Array(pagination.totalPages)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === pagination.totalPages ||
                (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${pagination.currentPage === page
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                      }`}
                  >
                    {page}
                  </button>
                );
              }
              if (page === pagination.currentPage - 2 || page === pagination.currentPage + 2) {
                return <MoreHorizontal key={page} className="w-10 h-10 p-3 text-slate-300" />;
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddBannerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBannerAdded={handleBannerAdded}
      />

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