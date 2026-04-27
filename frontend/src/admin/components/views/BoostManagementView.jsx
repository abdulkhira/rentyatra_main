import { useState, useEffect } from 'react';
import EditBoostModal from '../modals/EditBoostModal';
import EditBoostOrderModal from '../modals/EditBoostOrderModal';
import boostService from '../../../services/boostService';
import adminBoostService from '../../../services/adminBoostService';
import {
  Users, CreditCard, TrendingUp, Calendar, DollarSign,
  CheckCircle, XCircle, Clock, Edit, Trash2, Eye,
  Search, Filter, Download, X, Zap, Rocket, Crown, IndianRupee,
  ShieldCheck, Copy
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

  const iconMap = {
    'Zap': Zap,
    'Rocket': Rocket,
    'Crown': Crown
  };

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

  const loadUserBoosts = async () => {
    setBoostsLoading(true);
    try {
      const response = await fetch('/api/admin/boost-packages/user-boosts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserBoosts(data.data || []);
      }
    } catch (error) {
      console.error('Error loading user boosts:', error);
    } finally {
      setBoostsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'user-boosts') {
      loadUserBoosts();
    }
  }, [activeTab]);

  const stats = {
    totalBoosts: userBoosts.length,
    activeBoosts: userBoosts.filter(boost => boost.status === 'active').length,
    totalRevenue: userBoosts.reduce((sum, boost) => sum + (boost.totalAmount || boost.price || 0), 0),
    monthlyRevenue: userBoosts.filter(boost => {
      const startDate = new Date(boost.createdAt || boost.startDate);
      const currentMonth = new Date();
      return startDate.getMonth() === currentMonth.getMonth() && startDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, boost) => sum + (boost.totalAmount || boost.price || 0), 0)
  };

  const filteredBoosts = userBoosts.filter(boost => {
    const userName = boost.userId?.name || 'Unknown User';
    const userEmail = boost.userId?.email || 'No Email';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (boost.packageName && boost.packageName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || boost.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleEditPackage = (packageData) => {
    setSelectedPackage(packageData);
    setIsEditModalOpen(true);
  };

  const handleSavePackage = async (updatedPackage) => {
    try {
      await adminBoostService.updateBoostPackage(selectedPackage.id, updatedPackage);
      const packages = await adminBoostService.getAllBoostPackages();
      setBoostPackages(packages);
      alert('Boost package updated successfully!');
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Failed to update boost package.');
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
      loadUserBoosts();
      alert('Boost order updated successfully!');
    } catch (error) {
      alert('Failed to update boost order.');
    }
  };

  const handleDeleteBoost = async (boost) => {
    if (window.confirm(`Delete boost order for ${boost.userId?.name || 'User'}?`)) {
      try {
        await adminBoostService.deleteBoostOrder(boost._id);
        loadUserBoosts();
      } catch (error) {
        alert('Failed to delete boost order.');
      }
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      yellow: 'from-amber-400 to-orange-500',
      orange: 'from-orange-500 to-rose-500',
      purple: 'from-indigo-500 to-purple-600',
      blue: 'from-blue-500 to-indigo-600'
    };
    return colors[color] || colors.yellow;
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { style: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      expired: { style: 'bg-rose-100 text-rose-700 border-rose-200' },
      cancelled: { style: 'bg-slate-100 text-slate-700 border-slate-200' },
      pending: { style: 'bg-amber-100 text-amber-700 border-amber-200' }
    }[status] || { style: 'bg-slate-100 text-slate-700' };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${config.style}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return 'Invalid Date'; }
  };

  const formatUserId = (userId) => {
    if (!userId) return 'N/A';
    return `USR${String(userId).slice(-4).padStart(4, '0')}`;
  };

  const getPlanDisplayName = (packageName) => {
    if (!packageName) return 'Unknown Plan';
    if (packageName.includes('Quick')) return 'Quick Boost';
    if (packageName.includes('Power')) return 'Power Boost';
    if (packageName.includes('Mega')) return 'Mega Boost';
    return packageName;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Boost Management</h1>
          <p className="text-slate-500 font-medium">Manage visibility packages and user boost orders</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', val: stats.totalBoosts, color: 'blue', icon: Rocket },
          { label: 'Active Boosts', val: stats.activeBoosts, color: 'emerald', icon: Zap },
          { label: 'Total Revenue', val: `₹${stats.totalRevenue.toLocaleString()}`, color: 'indigo', icon: IndianRupee },
          { label: 'Monthly Revenue', val: `₹${stats.monthlyRevenue.toLocaleString()}`, color: 'orange', icon: TrendingUp },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-2xl bg-${s.color}-50 text-${s.color}-600`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-widest text-slate-600">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Segmented Control (Tabs) */}
      <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'packages' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Boost Packages
        </button>
        <button
          onClick={() => setActiveTab('user-boosts')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'user-boosts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          User Orders
        </button>
      </div>

      {/* Tab Content: Packages */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {boostPackages.map((pkg) => {
            const IconComponent = iconMap[pkg.icon] || Zap;
            return (
              <div key={pkg.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all relative flex flex-col">
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getColorClasses(pkg.color)} flex items-center justify-center shadow-lg shadow-slate-200 mx-auto mb-6`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800">{pkg.name}</h3>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-400 self-start mt-2">₹</span>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{pkg.price}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">One-Time Payment</p>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleEditPackage(pkg)}
                  className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit Package
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content: User Boosts */}
      {activeTab === 'user-boosts' && (
        <div className="space-y-6">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user or package name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full md:w-auto bg-slate-50 border-none rounded-xl text-sm px-6 py-2.5 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Boost Tier</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {boostsLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredBoosts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center">
                        <Rocket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No boost orders found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBoosts.map((boost) => (
                      <tr key={boost._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
                              {boost.userId?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{boost.userId?.name || 'Unknown'}</p>
                              <p
                                className="text-[10px] font-black text-indigo-500 tracking-widest cursor-pointer hover:underline mt-0.5 flex items-center gap-1"
                                onClick={() => copyToClipboard(boost.userId?._id)}
                                title="Click to copy full ID"
                              >
                                {formatUserId(boost.userId?._id)} <Copy className="w-3 h-3" />
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" /> {getPlanDisplayName(boost.packageName)}
                          </p>
                          <p className="text-xs font-black text-indigo-600 tracking-tight mt-0.5">₹{boost.totalAmount || boost.price || 0}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(((boost.usedBoosts || 0) / (boost.boostCount || 1)) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                              {boost.usedBoosts || 0}/{boost.boostCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(boost.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {boost.duration || (boost.validFrom && boost.validUntil ? `${Math.ceil((new Date(boost.validUntil) - new Date(boost.validFrom)) / (1000 * 60 * 60 * 24))} days` : 'N/A')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleViewBoost(boost)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleEditBoost(boost)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteBoost(boost)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
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

      {/* Edit Modals remain functionally identical */}
      <EditBoostModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} package={selectedPackage} onSave={handleSavePackage} />
      <EditBoostOrderModal isOpen={isEditBoostModalOpen} onClose={() => setIsEditBoostModalOpen(false)} boostOrder={selectedBoost} onSave={handleSaveBoostOrder} />

      {/* Upgraded View Details Modal */}
      {isBoostDetailsOpen && selectedBoost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Boost Order Details</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    Order ID: {selectedBoost.orderId || selectedBoost._id?.slice(-8) || 'N/A'}
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    {formatDate(selectedBoost.createdAt)}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBoostDetailsOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 bg-slate-50/50 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Customer Info Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Customer</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Name</p>
                      <p className="text-sm font-bold text-slate-900">{selectedBoost.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Email</p>
                      <p className="text-sm font-bold text-slate-900">{selectedBoost.userId?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">System ID</p>
                      <p className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg inline-block mt-1">{selectedBoost.userId?._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Package Info Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Package Acquired</p>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500">Tier</p>
                        <p className="text-sm font-bold text-slate-900">{getPlanDisplayName(selectedBoost.packageName)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedBoost.status)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-indigo-600 tracking-tighter">₹{selectedBoost.totalAmount || selectedBoost.price || 0}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedBoost.paymentStatus === 'paid' || selectedBoost.paymentStatus === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {selectedBoost.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                  {selectedBoost.paymentId && (
                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-xs font-bold text-slate-500">Payment ID</p>
                      <p className="text-xs font-mono text-slate-600 mt-1">{selectedBoost.paymentId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage & Timeline Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Usage & Allocation</p>

                <div className="mb-8">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">Boosts Consumed</span>
                    <span className="text-indigo-600">{selectedBoost.usedBoosts || 0} / {selectedBoost.boostCount || 0}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(((selectedBoost.usedBoosts || 0) / (selectedBoost.boostCount || 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid From</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(selectedBoost.validFrom)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid Until</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(selectedBoost.validUntil)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</p>
                    <p className="text-sm font-bold text-slate-800">{selectedBoost.duration || 'N/A'}</p>
                  </div>
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