import { useState, useEffect } from 'react';
import {
  Eye, CheckCircle, XCircle, Clock, Search, Filter,
  Calendar, User, MapPin, Phone, Mail, FileText,
  AlertCircle, ChevronRight, IndianRupee, Map as MapIcon, Layers,
  ChevronLeft, MoreHorizontal, Download
} from 'lucide-react';
import apiService from '../../../services/api';

const RentalListingManagementView = () => {
  const [rentalRequests, setRentalRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals & Selection
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0
  });

  // Fetch initial data (Categories)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.getAllCategories();
        if (response.data && response.data.categories) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Rental Requests on filter/page change
  useEffect(() => {
    fetchRentalRequests(pagination.currentPage);
  }, [searchTerm, statusFilter, categoryFilter, pagination.currentPage]);

  const fetchRentalRequests = async (page = 1) => {
    setLoading(true);
    try {
      // Assuming apiService.getAllRentalRequests accepts category as the 5th parameter
      const response = await apiService.getAllRentalRequests(
        page,
        50, // Limit
        statusFilter === 'all' ? '' : statusFilter,
        searchTerm,
        categoryFilter === 'all' ? '' : categoryFilter
      );

      if (response.success) {
        setRentalRequests(response.data.requests || []);
        setPagination({
          currentPage: response.data.pagination?.currentPage || page,
          totalPages: response.data.pagination?.totalPages || 1,
          totalResults: response.data.pagination?.totalResults || response.data.requests.length
        });
      }
    } catch (error) {
      console.error('Error fetching rental requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm, statusFilter, categoryFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const response = await apiService.updateRentalRequestStatus(requestId, newStatus);
      if (response.success) fetchRentalRequests(pagination.currentPage);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // CSV Export Functionality
  const exportToCSV = () => {
    const headers = ['Title', 'Owner Name', 'Owner Phone', 'Price', 'Period', 'City', 'Status', 'Category'];

    const csvData = rentalRequests.map(request => [
      request.title || '',
      request.user?.name || '',
      request.user?.phone || '',
      request.price?.amount || 0,
      request.price?.period || '',
      request.location?.city || '',
      request.status || '',
      request.category?.name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `rental_requests_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const stats = {
    total: pagination.totalResults,
    pending: rentalRequests.filter(r => r.status === 'pending').length,
    approved: rentalRequests.filter(r => r.status === 'approved').length,
    rejected: rentalRequests.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="p-4 md:p-6 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Rental Requests</h1>
          <p className="text-slate-500 font-medium">Reviewing {pagination.totalResults} total submissions</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={rentalRequests.length === 0}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Listings', val: stats.total, color: 'blue', icon: FileText },
          { label: 'Pending Page', val: stats.pending, color: 'amber', icon: Clock },
          { label: 'Approved Page', val: stats.approved, color: 'emerald', icon: CheckCircle },
          { label: 'Rejected Page', val: stats.rejected, color: 'rose', icon: XCircle },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-2xl bg-${s.color}-50 text-${s.color}-600`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-widest text-slate-600">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings by title..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm px-4 py-2.5 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer outline-none w-full sm:w-48"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm px-4 py-2.5 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer outline-none w-full sm:w-40"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-[2rem] animate-pulse border border-slate-100 shadow-sm" />
          ))
        ) : rentalRequests.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">No requests found</h3>
            <p className="text-slate-500 mt-2 font-medium">Try adjusting your search or filters.</p>
          </div>
        ) : (
          rentalRequests.map((request) => (
            <div key={request._id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all overflow-hidden flex flex-col sm:flex-row">
              <div className="w-full sm:w-48 h-48 relative overflow-hidden bg-slate-100">
                <img src={request.images?.[0]?.url || 'https://via.placeholder.com/200?text=No+Image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border shadow-sm backdrop-blur-md bg-opacity-90 ${getStatusStyle(request.status)}`}>
                  {request.status}
                </div>
              </div>

              <div className="flex-1 p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{request.title}</h3>
                      <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-1 uppercase tracking-wider">
                        <User className="w-3 h-3" /> {request.user?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-xl font-black text-indigo-600 tracking-tight flex items-center justify-end gap-0.5">
                        <IndianRupee className="w-4 h-4" />{request.price?.amount || 0}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">per {request.price?.period || 'day'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> {request.location?.city || 'Not specified'}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl text-xs font-bold text-indigo-600 border border-indigo-100">
                      <Layers className="w-3.5 h-3.5" /> {request.category?.name || 'General'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <button onClick={() => { setSelectedRequest(request); setShowModal(true); }} className="flex items-center gap-1.5 text-xs font-black uppercase text-indigo-600 hover:tracking-widest transition-all">
                    Review Details <ChevronRight className="w-4 h-4" />
                  </button>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusChange(request._id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => handleStatusChange(request._id, 'rejected')} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><XCircle className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Pagination Navigation */}
      {pagination.totalPages > 1 && (
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

      {/* High-End Detail Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`p-3 md:p-4 rounded-2xl border hidden sm:block ${getStatusStyle(selectedRequest.status)}`}>
                  {selectedRequest.status === 'approved' ? <CheckCircle className="w-6 h-6" /> : selectedRequest.status === 'rejected' ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{selectedRequest.title}</h2>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 mt-1">
                    ID: {selectedRequest._id?.slice(-6) || 'N/A'} • {new Date(selectedRequest.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle className="w-8 h-8 text-slate-300" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Side: Images & Info */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-1">Media Gallery</label>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRequest.images?.map((img, i) => (
                        <div key={i} className={`rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm bg-slate-50 ${i === 0 ? 'col-span-2 h-48 md:h-64' : 'h-32'}`}>
                          <img src={img.url} className="w-full h-full object-cover" alt={`Listing view ${i + 1}`} />
                        </div>
                      ))}
                      {!selectedRequest.images?.length && (
                        <div className="col-span-2 h-48 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <p className="text-slate-400 font-bold">No images provided</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Description</h4>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">{selectedRequest.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Right Side: Details & Actions */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Owner Info</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-inner">
                          {selectedRequest.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{selectedRequest.user?.name || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-slate-400">{selectedRequest.user?.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Location</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                          <MapIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{selectedRequest.location?.city || 'Not set'}</p>
                          <p className="text-[10px] font-bold text-slate-400">{selectedRequest.location?.serviceRadius || 0}km radius</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 border border-indigo-500">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Requested Pricing</p>
                        <h4 className="text-4xl font-black flex items-center gap-1">
                          <IndianRupee className="w-7 h-7 opacity-80" />
                          {selectedRequest.price?.amount || 0}
                          <span className="text-sm font-bold text-indigo-200 mt-2">/{selectedRequest.price?.period || 'day'}</span>
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Context Data */}
                  <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Categorization</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500">Product</p>
                        <p className="text-sm font-bold text-slate-800">{selectedRequest.product?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">Category</p>
                        <p className="text-sm font-bold text-slate-800">{selectedRequest.category?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">Condition</p>
                        <p className="text-sm font-bold text-slate-800 capitalize">{selectedRequest.condition || 'Good'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedRequest.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <button
                        onClick={() => { handleStatusChange(selectedRequest._id, 'approved'); setShowModal(false); }}
                        className="py-4 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-600 hover:-translate-y-1 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" /> Approve
                      </button>
                      <button
                        onClick={() => { handleStatusChange(selectedRequest._id, 'rejected'); setShowModal(false); }}
                        className="py-4 bg-white border-2 border-rose-100 text-rose-500 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-rose-50 hover:border-rose-200 hover:-translate-y-1 shadow-lg shadow-rose-50 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" /> Reject
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
};

export default RentalListingManagementView;