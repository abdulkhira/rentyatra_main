import { useState, useEffect } from 'react';
import EditPlanModal from '../modals/EditPlanModal';
import EditSubscriptionModal from '../modals/EditSubscriptionModal';
import planService from '../../../services/planService';
import subscriptionService from '../../../services/subscriptionService';
import {
  Users, CreditCard, TrendingUp, Calendar, DollarSign,
  CheckCircle, XCircle, Clock, Edit, Trash2, Eye,
  Search, Filter, Download, X, IndianRupee, ShieldCheck
} from 'lucide-react';

function SubscriptionManagementView() {
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('plans');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isSubscriptionDetailsOpen, setIsSubscriptionDetailsOpen] = useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await planService.getAllPlans();
        setSubscriptionPlans(plans);
      } catch (error) {
        console.error('Error loading plans:', error);
      }
    };
    loadPlans();
  }, []);

  const loadUserSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')}/subscription/all`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.success) {
        setUserSubscriptions(data.data);
      } else {
        setUserSubscriptions([]);
      }
    } catch (error) {
      setUserSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  useEffect(() => {
    loadUserSubscriptions();
    const interval = setInterval(loadUserSubscriptions, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    totalSubscriptions: userSubscriptions.length,
    activeSubscriptions: userSubscriptions.filter(sub => sub.status === 'active').length,
    totalRevenue: userSubscriptions.reduce((sum, sub) => sum + sub.price, 0),
    monthlyRevenue: userSubscriptions.filter(sub => {
      const startDate = new Date(sub.startDate);
      const currentMonth = new Date();
      return startDate.getMonth() === currentMonth.getMonth() && startDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, sub) => sum + sub.price, 0)
  };

  const filteredSubscriptions = userSubscriptions.filter(sub => {
    const userName = sub.userId?.name || 'Unknown User';
    const userEmail = sub.userId?.email || 'No Email';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleSavePlan = async (updatedPlan) => {
    try {
      await planService.updatePlan(selectedPlan.id, updatedPlan);
      const plans = await planService.getAllPlans();
      setSubscriptionPlans(plans);
      alert('Plan updated successfully!');
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Failed to update plan. Please try again.');
    }
  };

  const handleSaveSubscription = async (updatedSubscription) => {
    try {
      const response = await subscriptionService.updateSubscription(updatedSubscription._id, {
        maxListings: updatedSubscription.maxListings,
        currentListings: updatedSubscription.currentListings,
        status: updatedSubscription.status,
        endDate: updatedSubscription.endDate
      });
      if (response.success) {
        setUserSubscriptions(prev => prev.map(sub => sub._id === updatedSubscription._id ? { ...sub, ...response.data } : sub));
        alert('Subscription updated successfully!');
        setIsEditSubscriptionOpen(false);
      } else {
        throw new Error(response.message || 'Failed to update subscription');
      }
    } catch (error) {
      alert(`Failed to update subscription: ${error.message}`);
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')}/subscription/${subscriptionId}`;
      const res = await fetch(apiUrl, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setUserSubscriptions(prev => prev.filter(sub => (sub._id || sub.id) !== subscriptionId));
    } catch (error) {
      alert('Failed to delete subscription');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      active: { style: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
      expired: { style: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Expired' },
      cancelled: { style: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Cancelled' },
      pending: { style: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending' }
    }[status] || { style: 'bg-slate-100 text-slate-700', label: status };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${config.style}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-slate-500 font-medium">Manage pricing tiers and user subscriptions</p>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Subscribers', val: stats.totalSubscriptions, color: 'blue', icon: Users },
          { label: 'Active Plans', val: stats.activeSubscriptions, color: 'emerald', icon: ShieldCheck },
          { label: 'Total Revenue', val: `₹${stats.totalRevenue.toLocaleString()}`, color: 'indigo', icon: CreditCard },
          { label: 'This Month', val: `₹${stats.monthlyRevenue.toLocaleString()}`, color: 'orange', icon: TrendingUp },
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
          onClick={() => setActiveTab('plans')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'plans' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Pricing Plans
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          User Subscriptions
        </button>
      </div>

      {/* Tab Content: Plans */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <div key={plan.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all relative flex flex-col">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-400 self-start mt-2">₹</span>
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">One-Time Payment</p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setSelectedPlan(plan); setIsEditModalOpen(true); }}
                className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" /> Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: User Subscriptions */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 md:flex-none bg-slate-50 border-none rounded-xl text-sm px-6 py-2.5 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-emerald-100">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subscriber</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Detail</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No subscriptions match your criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
                              {sub.userId?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{sub.userId?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400 font-medium">{sub.userId?.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800">{sub.planName}</p>
                          <p className="text-xs font-black text-indigo-600 tracking-tight mt-0.5">₹{sub.price}</p>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedSubscription(sub); setIsSubscriptionDetailsOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => { setSelectedSubscription(sub); setIsEditSubscriptionOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteSubscription(sub._id || sub.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
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

      {/* Modals remain mostly functionally identical, just styling updates for the Details modal */}
      <EditPlanModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} plan={selectedPlan} onSave={handleSavePlan} />
      <EditSubscriptionModal isOpen={isEditSubscriptionOpen} onClose={() => setIsEditSubscriptionOpen(false)} subscription={selectedSubscription} onSave={handleSaveSubscription} />

      {isSubscriptionDetailsOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Subscription Overview</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">ID: RNTY{String(selectedSubscription._id).slice(-5)}</p>
              </div>
              <button onClick={() => setIsSubscriptionDetailsOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-8 bg-slate-50/50 max-h-[70vh] overflow-y-auto space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Customer</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Name</p>
                      <p className="text-sm font-bold text-slate-900">{selectedSubscription.userId?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Email</p>
                      <p className="text-sm font-bold text-slate-900">{selectedSubscription.userId?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Plan Info Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Current Plan</p>
                  <div className="flex justify-between items-start">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500">Tier</p>
                        <p className="text-sm font-bold text-slate-900">{selectedSubscription.planName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedSubscription.status)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-indigo-600 tracking-tighter">₹{selectedSubscription.price}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedSubscription.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {selectedSubscription.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage & Timeline Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Listings Used</p>
                  <p className="text-xl font-black text-slate-800">
                    {selectedSubscription.currentListings} <span className="text-sm text-slate-400">/ {selectedSubscription.maxListings === -1 ? '∞' : selectedSubscription.maxListings}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Start Date</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(selectedSubscription.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">End Date</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(selectedSubscription.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManagementView;