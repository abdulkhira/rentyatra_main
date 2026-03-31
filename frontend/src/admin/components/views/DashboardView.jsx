import { useState, useEffect } from 'react';
import {
  Users,
  Package,
  CreditCard,
  DollarSign,
  Activity,
  Star,
  Eye,
  CheckCircle,
  Clock,
  Zap,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import adminDashboardService from '../../../services/adminDashboardService';

const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => {
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

const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminDashboardService.getDashboardStats();
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-600 mt-2">Loading dashboard statistics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-600 mt-2">No data available</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: `+${stats.users.newThisMonth} this month`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Total categories',
      value: stats.products.total.toLocaleString(),
      change: `${stats.products.active} active`,
      icon: Package,
      color: 'indigo'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.revenue.total.toLocaleString()}`,
      change: `₹${stats.revenue.monthly.toLocaleString()} this month`,
      icon: DollarSign,
      color: 'purple'
    },
    {
      title: 'Boost Revenue',
      value: `₹${stats.revenue.boost.total.toLocaleString()}`,
      change: `₹${stats.revenue.boost.monthly.toLocaleString()} this month`,
      icon: Zap,
      color: 'orange'
    },
    {
      title: 'Subscription Revenue',
      value: `₹${stats.revenue.subscription.total.toLocaleString()}`,
      change: `₹${stats.revenue.subscription.monthly.toLocaleString()} this month`,
      icon: CreditCard,
      color: 'green'
    },
    {
      title: 'Boost Orders',
      value: stats.boosts.total.toLocaleString(),
      change: `${stats.boosts.active} active`,
      icon: Activity,
      color: 'red'
    },
    {
      title: 'Rental Requests',
      value: stats.rentals.pending.toLocaleString(),
      change: `${stats.rentals.pending} pending, ${stats.rentals.completed} completed`,
      icon: ShoppingCart,
      color: 'red'
    },
    {
      title: 'Boosts This Month',
      value: stats.boosts.soldThisMonth.toLocaleString(),
      change: `₹${stats.revenue.boost.monthly.toLocaleString()} revenue`,
      icon: Calendar,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-600 mt-2">Welcome back! Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activities */}
      {stats.recentActivities && stats.recentActivities.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {stats.recentActivities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(activity.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">₹{activity.amount}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${activity.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;