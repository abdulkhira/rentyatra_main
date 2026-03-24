import { useState, useEffect } from 'react';
import EditPlanModal from '../modals/EditPlanModal';
import EditSubscriptionModal from '../modals/EditSubscriptionModal';
import planService from '../../../services/planService';
import subscriptionService from '../../../services/subscriptionService';
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
  X
} from 'lucide-react';

function SubscriptionManagementView() {
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('plans');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isSubscriptionDetailsOpen, setIsSubscriptionDetailsOpen] = useState(false);
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false);

  // Load plans on component mount
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

  // Load user subscriptions
  const loadUserSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')}/subscription/all`;
      console.log('Loading subscriptions from:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Subscription data received:', data);
      
      if (data.success) {
        console.log('Setting user subscriptions:', data.data);
        setUserSubscriptions(data.data);
      } else {
        console.error('Failed to load subscriptions:', data.message);
        setUserSubscriptions([]);
      }
    } catch (error) {
      console.error('Error loading user subscriptions:', error);
      setUserSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  // Load subscriptions when switching to users tab
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    if (activeTab === 'users') {
      console.log('Loading user subscriptions...');
      loadUserSubscriptions();
    }
  }, [activeTab]);

  // Load subscriptions on component mount
  useEffect(() => {
    console.log('Component mounted, loading subscriptions...');
    loadUserSubscriptions();
  }, []);

  // Auto-refresh subscription data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadUserSubscriptions();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Stats (will come from API)
  const stats = {
    totalSubscriptions: userSubscriptions.length,
    activeSubscriptions: userSubscriptions.filter(sub => sub.status === 'active').length,
    totalRevenue: userSubscriptions.reduce((sum, sub) => sum + sub.price, 0),
    monthlyRevenue: userSubscriptions.filter(sub => {
      const startDate = new Date(sub.startDate);
      const currentMonth = new Date();
      return startDate.getMonth() === currentMonth.getMonth() && 
             startDate.getFullYear() === currentMonth.getFullYear();
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

  console.log('User subscriptions:', userSubscriptions);
  console.log('Filtered subscriptions:', filteredSubscriptions);

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleSavePlan = async (updatedPlan) => {
    try {
      // Update the plan using the service
      await planService.updatePlan(selectedPlan.id, updatedPlan);
      
      // Reload plans to reflect changes
      const plans = await planService.getAllPlans();
      setSubscriptionPlans(plans);
      
      // Trigger multiple events for instant updates across all tabs/windows
      // 1. Custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('plansUpdated', { 
        detail: { planId: selectedPlan.id, timestamp: Date.now() }
      }));
      
      // 2. BroadcastChannel for cross-tab communication
      try {
        const channel = new BroadcastChannel('subscription-plans-updates');
        channel.postMessage({ 
          type: 'plansUpdated', 
          planId: selectedPlan.id,
          timestamp: Date.now()
        });
        channel.close();
      } catch (broadcastError) {
        // BroadcastChannel not supported, fallback to localStorage
        localStorage.setItem('plansUpdated', Date.now().toString());
        localStorage.removeItem('plansUpdated'); // Trigger storage event
      }
      
      // 3. Storage event as additional fallback
      localStorage.setItem('subscriptionPlansUpdated', JSON.stringify({
        planId: selectedPlan.id,
        timestamp: Date.now()
      }));
      
      alert('Plan updated successfully! Changes are now live on the user side.');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan. Please try again.');
    }
  };

  const handleViewSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsSubscriptionDetailsOpen(true);
  };

  const handleEditSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsEditSubscriptionOpen(true);
  };

  const handleSaveSubscription = async (updatedSubscription) => {
    try {
      // Make API call to update the subscription
      const response = await subscriptionService.updateSubscription(
        updatedSubscription._id, 
        {
          maxListings: updatedSubscription.maxListings,
          currentListings: updatedSubscription.currentListings,
          status: updatedSubscription.status,
          endDate: updatedSubscription.endDate
        }
      );
      
      if (response.success) {
        // Update the subscription in the local state
        setUserSubscriptions(prev => 
          prev.map(sub => 
            sub._id === updatedSubscription._id 
              ? { ...sub, ...response.data }
              : sub
          )
        );
        
        alert('Subscription updated successfully! Changes are now live.');
        setIsEditSubscriptionOpen(false);
        
        // Trigger event to notify user side of subscription changes
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
          detail: { userId: response.data.userId._id }
        }));
      } else {
        throw new Error(response.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert(`Failed to update subscription: ${error.message}`);
    }
  };

  const handleDeleteSubscription = async (subscriptionId) => {
    const confirmed = window.confirm('Are you sure you want to delete this subscription? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')}/subscription/${subscriptionId}`;
      const res = await fetch(apiUrl, { method: 'DELETE' });
      const data = await res.json().catch(() => ({ success: res.ok }));
      if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to delete');

      setUserSubscriptions(prev => prev.filter(sub => (sub._id || sub.id) !== subscriptionId));
      alert('Subscription deleted successfully');
    } catch (error) {
      console.error('Delete subscription error:', error);
      alert(error.message || 'Failed to delete subscription');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Subscription Management</h1>
        <p className="text-slate-600 mt-2">Manage subscription plans and user subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalSubscriptions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">This Month</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.monthlyRevenue}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Subscription Plans
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              User Subscriptions
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">Available Plans</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className={`bg-gradient-to-br ${plan.gradient} text-white p-4 rounded-lg mb-4`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">{plan.name}</h3>
                          <p className="text-2xl font-bold">₹{plan.price}</p>
                          <p className="text-sm opacity-90">one-time</p>
                        </div>
                        {plan.popular && (
                          <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
                            POPULAR
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-slate-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button className="bg-slate-50 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">User Subscriptions</h2>
                <div className="flex gap-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search users, plans..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Subscriptions Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          End Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <Users size={48} className="text-slate-400 mb-4" />
                              <h3 className="text-lg font-medium text-slate-900 mb-2">No User Subscriptions</h3>
                              <p className="text-slate-500">No user subscriptions found. User subscriptions will appear here once users start subscribing to plans.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredSubscriptions.map((subscription) => (
                          <tr key={subscription._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-slate-900">{subscription.userId?.name || 'Unknown User'}</div>
                                <div className="text-sm text-slate-500">{subscription.userId?.email || 'No Email'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{subscription.planName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(subscription.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">₹{subscription.price}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{formatDate(subscription.startDate)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900">{formatDate(subscription.endDate)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleViewSubscription(subscription)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => handleEditSubscription(subscription)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteSubscription(subscription._id || subscription.id)}
                                  className="text-red-600 hover:text-red-800"
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

      {/* Edit Plan Modal */}
      <EditPlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        isOpen={isEditSubscriptionOpen}
        onClose={() => setIsEditSubscriptionOpen(false)}
        subscription={selectedSubscription}
        onSave={handleSaveSubscription}
      />

      {/* Subscription Details Modal */}
      {isSubscriptionDetailsOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSubscriptionDetailsOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-4xl mx-4 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Subscription Details</h2>
                  <p className="text-blue-100 mt-1">Complete subscription information</p>
                </div>
                <button
                  onClick={() => setIsSubscriptionDetailsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900 font-medium">{selectedSubscription.userId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedSubscription.userId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedSubscription.userId?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">User ID</label>
                    <p className="text-gray-900 font-mono text-sm text-green-600 font-semibold">USR{String(selectedSubscription.userId?._id || selectedSubscription.userId?.id || '00000').slice(-4).padStart(4, '0')}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-green-600" />
                  Subscription Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Subscription ID</label>
                    <p className="text-gray-900 font-mono text-sm text-blue-600 font-semibold">RNTY{String(selectedSubscription._id || selectedSubscription.id || '00000').slice(-5).padStart(5, '0')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Plan Name</label>
                    <p className="text-gray-900 font-medium">{selectedSubscription.planName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Plan ID</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedSubscription.planId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedSubscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedSubscription.status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : selectedSubscription.status === 'cancelled'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedSubscription.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-purple-600" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-gray-900 font-bold text-lg">₹{selectedSubscription.price}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedSubscription.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedSubscription.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment ID</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedSubscription.paymentId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Completed At</label>
                    <p className="text-gray-900">{selectedSubscription.paymentCompletedAt ? new Date(selectedSubscription.paymentCompletedAt).toLocaleString('en-IN') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-orange-600" />
                  Subscription Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-gray-900">{new Date(selectedSubscription.startDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-gray-900">{new Date(selectedSubscription.endDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Time</label>
                    <p className="text-gray-900">{new Date(selectedSubscription.startDate).toLocaleString('en-IN', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Time of Subscription</label>
                    <p className="text-gray-900">{new Date(selectedSubscription.endDate).toLocaleString('en-IN', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-gray-900">{new Date(selectedSubscription.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Updated At</label>
                    <p className="text-gray-900">{new Date(selectedSubscription.updatedAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Plan Limits */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" />
                  Plan Limits & Usage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Max Listings</label>
                    <p className="text-gray-900">{selectedSubscription.maxListings === -1 ? 'Unlimited' : selectedSubscription.maxListings}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Listings</label>
                    <p className="text-gray-900">{selectedSubscription.currentListings}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-teal-600" />
                  Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Days Remaining</label>
                    <p className="text-gray-900 font-bold">
                      {Math.ceil((new Date(selectedSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsSubscriptionDetailsOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManagementView;
