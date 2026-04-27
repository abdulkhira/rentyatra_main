import React, { useState, useEffect } from 'react';
import {
  Search, Eye, Trash2, UserCheck, UserX, Download, X,
  Loader2, ZoomIn, ChevronLeft, ChevronRight, Filter,
  MoreHorizontal, Mail, Phone, Calendar, MapPin, ArrowUpDown
} from 'lucide-react';

// --- INTERNAL IMAGE MODAL (Kept for completeness) ---
const ImageModal = ({ imageUrl, title, isOpen, onClose }) => {
  if (!isOpen || !imageUrl) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="relative max-w-4xl w-full">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors">
          <X className="h-8 w-8" />
        </button>
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800">{title}</h3>
          </div>
          <div className="p-2 bg-slate-100">
            <img src={imageUrl} alt={title} className="max-w-full max-h-[75vh] mx-auto object-contain rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- INTERNAL USER DETAILS MODAL (Kept for completeness) ---
const UserDetailsModal = ({ user, isOpen, onClose }) => {
  const [imgModal, setImgModal] = useState({ open: false, url: '', title: '' });
  if (!isOpen || !user) return null;

  const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="p-2 bg-white rounded-lg shadow-sm"><Icon className="w-4 h-4 text-blue-600" /></div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">User Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border border-white/30">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-blue-100 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailRow icon={Phone} label="Phone Number" value={user.phone} />
            <DetailRow icon={Calendar} label="Member Since" value={user.joinedDate} />
            <DetailRow icon={MapPin} label="Location" value={user.addressString || "No address saved"} />
            <DetailRow icon={UserCheck} label="Account Status" value={user.status} />
          </div>
        </div>
      </div>
      <ImageModal imageUrl={imgModal.url} title={imgModal.title} isOpen={imgModal.open} onClose={() => setImgModal({ ...imgModal, open: false })} />
    </div>
  );
};

// --- MAIN MANAGEMENT VIEW ---
const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all'); // NEW
  const [sortBy, setSortBy] = useState('newest'); // NEW
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        plan: planFilter === 'all' ? '' : planFilter, // NEW
        sort: sortBy // NEW
      });

      const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      const response = await fetch(`${apiBaseUrl}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Logic
  const handleExportCSV = () => {
    if (users.length === 0) return;

    const headers = ["Name", "Email", "Plan", "Status", "Joined Date", "Phone"];
    const csvContent = [
      headers.join(","),
      ...users.map(u => [
        `"${u.name}"`,
        `"${u.email}"`,
        `"${u.plan || 'Basic'}"`,
        `"${u.status}"`,
        `"${u.joinedDate}"`,
        `"${u.phone || 'N/A'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ACTION HANDLERS ---

  const handleToggleStatus = async (user) => {
    const action = user.status === 'Active' ? 'block' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

      // Assuming your backend expects { action: 'block' } or similar. Adjust payload if needed.
      const response = await fetch(`${apiBaseUrl}/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: action === 'block' ? 'block' : 'unblock' })
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Optimistically update the UI without doing a full re-fetch
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, status: user.status === 'Active' ? 'Blocked' : 'Active' } : u
      ));
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update user status.");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${user.name}?\nThis action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

      const response = await fetch(`${apiBaseUrl}/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete user');

      // Remove the user from the state
      setUsers(users.filter(u => u.id !== user.id));
      setPagination(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete user.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, planFilter, sortBy]); // Added new dependencies

  return (
    <div className="p-6 bg-[#fbfcfd] min-h-screen font-sans">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
            <p className="text-slate-500 text-sm font-medium">Manage and audit your platform users</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <div className="bg-blue-600 rounded-2xl px-4 py-2 shadow-md shadow-blue-200 flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-white">{pagination.totalUsers} Total Users</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* New Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            {/* <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer"
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="all">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div> */}

            {/* <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div> */}
          </div>
        </div>

        {/* Glass Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[14px] font-black text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[14px] font-black text-slate-500 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[14px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[14px] font-black text-slate-500 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-[14px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan="5" className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-xl text-slate-500 font-medium">No users found matching your criteria.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 border border-slate-200 shadow-sm group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xm font-bold text-slate-800">{user.name}</p>
                          <p className="text-m text-slate-500 ">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-m font-bold text-slate-600">{user.plan || 'Basic'}</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">{user.joinedDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg transition-all ${user.status === 'Active'
                            ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          title={user.status === 'Active' ? 'Block User' : 'Activate User'}
                        >
                          {user.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Page {pagination.currentPage} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() => fetchUsers(pagination.currentPage - 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => fetchUsers(pagination.currentPage + 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <UserDetailsModal user={selectedUser} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default UserManagementView;