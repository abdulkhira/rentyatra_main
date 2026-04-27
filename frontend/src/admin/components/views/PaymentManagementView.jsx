import { useState, useEffect } from 'react';
import {
  DollarSign, CreditCard, Zap, Users, TrendingUp,
  Calendar, Search, Filter, Eye, Download,
  IndianRupee, Copy, ShieldCheck, ArrowUpRight, CheckCircle
} from 'lucide-react';
import adminPaymentService from '../../../services/adminPaymentService';

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

  const formatUserId = (userId) => {
    if (!userId) return 'N/A';
    return `USR${String(userId).slice(-4).padStart(4, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Optional: You could add a small toast notification state here
  };

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
      <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-[2rem] border border-slate-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-white rounded-[2rem] border border-slate-100 shadow-sm animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen">
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2rem] text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-rose-900 mb-2">Failed to load payments</h2>
          <p className="text-rose-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: `+₹${stats.monthlyRevenue.toLocaleString()} this month`,
      icon: DollarSign,
      color: 'indigo'
    },
    {
      title: 'Total Transactions',
      value: stats.totalPayments.toLocaleString(),
      change: 'Lifetime processed',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Boost Revenue',
      value: `₹${(stats.boostPayments?.monthlyRevenue || 0).toLocaleString()}`,
      change: `${stats.boostPayments?.count || 0} orders this month`,
      icon: Zap,
      color: 'amber'
    },
    {
      title: 'Subscription Revenue',
      value: `₹${(stats.subscriptionPayments?.monthlyRevenue || 0).toLocaleString()}`,
      change: `${stats.subscriptionPayments?.count || 0} plans this month`,
      icon: ShieldCheck,
      color: 'emerald'
    }
  ];

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Hub</h1>
          <p className="text-slate-500 font-medium">Monitor all platform transactions and revenue streams</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
          <Download className="w-4 h-4" />
          Export Ledger
        </button>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.title}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                {stat.change.includes('+') && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                {stat.change.replace('+', '')}
              </p>
            </div>
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, email, package or TxID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full md:w-auto bg-slate-50 border-none rounded-xl text-sm px-6 py-2.5 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="all">All Payment Types</option>
          <option value="boost">Boosts Only</option>
          <option value="subscription">Subscriptions Only</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-800">Transaction Ledger</h2>
          <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
            {filteredPayments.length} Records
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Info</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Type</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment ID & Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-lg">No transactions found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                          {payment.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{payment.user.name}</p>
                          <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{payment.user.email}</p>
                          <p
                            className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5 cursor-pointer hover:text-indigo-600 flex items-center gap-1"
                            onClick={() => copyToClipboard(payment.user._id)}
                            title="Copy User ID"
                          >
                            {formatUserId(payment.user._id)} <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {payment.type === 'boost' ? (
                          <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 w-max">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Boost</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 w-max">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Sub</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-700 mt-2">{payment.packageName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-black text-indigo-600 tracking-tight flex items-center">
                        <IndianRupee className="w-4 h-4 opacity-70" /> {payment.amount}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded w-max cursor-pointer hover:bg-slate-200 transition-colors flex items-center gap-1"
                        onClick={() => copyToClipboard(payment.paymentId)}
                        title="Copy Payment ID"
                      >
                        {payment.paymentId || 'Manual/No ID'}
                        {payment.paymentId && <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" /> {formatDate(payment.paymentDate)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border shadow-sm ${payment.status === 'active' || payment.status === 'completed' || payment.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                          {payment.status === 'active' || payment.status === 'completed' || payment.status === 'paid' ? <CheckCircle className="w-3 h-3" /> : null}
                          {payment.status}
                        </span>
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
  );
};

export default PaymentManagementView;