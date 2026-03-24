import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Zap, 
  Users, 
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Eye,
  Download
} from 'lucide-react';
import adminPaymentService from '../../../services/adminPaymentService';

const PaymentCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-xs font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
};

const PaymentManagementView = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminPaymentService.getAllPayments();
        setPayments(response.data.payments);
        setStats(response.data.stats);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError(err.message || 'Error loading payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Helper function to format user ID
  const formatUserId = (userId) => {
    if (!userId) return 'N/A';
    return `USR${String(userId).slice(-4).padStart(4, '0')}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not Available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', {
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

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || payment.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Payment Management</h1>
          <p className="text-slate-600 mt-2">Loading payment details...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 border border-slate-200 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-slate-200 rounded w-12 mb-2"></div>
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Payment Management</h1>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Payment Management</h1>
          <p className="text-slate-600 mt-2">No payment data available</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Payments',
      value: stats.totalPayments.toLocaleString(),
      change: `₹${stats.monthlyRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: `₹${stats.monthlyRevenue.toLocaleString()} this month`,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Boost Payments',
      value: stats.boostPayments.count.toLocaleString(),
      change: `₹${stats.boostPayments.monthlyRevenue.toLocaleString()} this month`,
      icon: Zap,
      color: 'orange'
    },
    {
      title: 'Subscription Payments',
      value: stats.subscriptionPayments.count.toLocaleString(),
      change: `₹${stats.subscriptionPayments.monthlyRevenue.toLocaleString()} this month`,
      icon: CreditCard,
      color: 'green'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Payment Management</h1>
        <p className="text-slate-600 mt-2">Manage all subscription and boost payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <PaymentCard key={index} {...stat} />
        ))}
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">All Payments</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="boost">Boost Payments</option>
                <option value="subscription">Subscription Payments</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Package</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Payment ID</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {payment.user.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {payment.user.email}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ID: {formatUserId(payment.user._id)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        payment.type === 'boost' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.type === 'boost' ? 'Boost' : 'Subscription'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-slate-900">{payment.packageName}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-semibold text-green-600">₹{payment.amount}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs font-mono text-slate-500">
                        {payment.paymentId || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-slate-600">
                        {formatDate(payment.paymentDate)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No payments found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagementView;
