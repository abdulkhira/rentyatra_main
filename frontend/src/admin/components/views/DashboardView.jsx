import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, Package, CreditCard, DollarSign, Activity, Zap,
  ShoppingCart, Calendar, Search, Bell, Info, Moon, User, MoreHorizontal, CheckCircle
} from 'lucide-react';
import adminDashboardService from '../../../services/adminDashboardService';

// --- Horizon Style Stat Card ---
const MiniStat = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 transition-all hover:shadow-md flex items-center gap-3">
    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col">
      <p className="text-zinc-600 text-[14px] font-medium uppercase tracking-wider mb-0.5">{title}</p>
      <h4 className="text-lg font-semibold text-zinc-900 tracking-tight">{value}</h4>
    </div>
  </div>
);

const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await adminDashboardService.getDashboardStats();
        setStats(response.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold text-indigo-500 animate-pulse">Syncing Horizon UI...</div>;

  // Pie Chart Data mapping
  const pieData = [
    { name: 'Boosts', value: stats.revenue.boost.total },
    { name: 'Subscriptions', value: stats.revenue.subscription.total },
  ];
  const COLORS = ['#4318FF', '#6AD2FF'];

  return (
    <div className="min-h-screen bg-[#F4F7FE] p-4 lg:p-8 font-sans text-[#1B2559]">
      {/* --- TOP NAVBAR --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-2">
        <div>
          <p className="text-sm font-medium text-slate-500">Pages / Dashboard</p>
          <h1 className="text-3xl font-bold mt-1">Main Dashboard</h1>
        </div>
      </header>

      {/* --- 8 STAT CARDS GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <MiniStat
          title="Earnings"
          value={`₹${stats?.revenue?.total?.toLocaleString() || '0'}`}
          icon={DollarSign}
          colorClass="bg-blue-50 text-blue-600"
        />
        <MiniStat
          title="Boost Sales"
          value={`₹${stats?.revenue?.boost?.total?.toLocaleString() || '0'}`}
          icon={Zap}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <MiniStat
          title="Total Users"
          value={stats?.users?.total || '0'}
          icon={Users}
          colorClass="bg-blue-50 text-blue-600"
        />
        <MiniStat
          title="Total Cats"
          value={stats?.products?.total || '0'}
          icon={Package}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <MiniStat
          title="Active Boosts"
          value={stats?.boosts?.active || '0'}
          icon={Activity}
          colorClass="bg-blue-50 text-blue-600"
        />
        <MiniStat
          title="Rentals"
          value={stats?.rentals?.pending || '0'}
          icon={ShoppingCart}
          colorClass="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* --- MIDDLE ROW: CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Total Spent Line Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center text-slate-800 gap-1 text-m font-medium">
                <Calendar size={14} /> This month
              </div>
              <h2 className="text-3xl font-bold mt-1">₹{stats.revenue.monthly.toLocaleString()}</h2>
              <p className="text-emerald-500 text-sm font-bold mt-1">Total Spent <span className="ml-1 text-xs">▲ +2.45%</span></p>
            </div>
            <div className="p-2 bg-[#F4F7FE] rounded-lg text-[#4318FF]"><Activity size={20} /></div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{ n: 'SEP', v: 40, v2: 20 }, { n: 'OCT', v: 30, v2: 40 }, { n: 'NOV', v: 65, v2: 30 }, { n: 'DEC', v: 45, v2: 55 }, { n: 'JAN', v: 80, v2: 50 }, { n: 'FEB', v: 70, v2: 65 }]}>
                <defs>
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4318FF" stopOpacity={0.1} /><stop offset="95%" stopColor="#4318FF" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#212121', fontSize: 12 }} dy={15} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="v" stroke="#4318FF" strokeWidth={4} fill="url(#colorV)" />
                <Area type="monotone" dataKey="v2" stroke="#6AD2FF" strokeWidth={4} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Revenue Bar Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Weekly Revenue</h3>
            <div className="p-2 bg-[#F4F7FE] rounded-lg text-[#4318FF]"><Activity size={20} /></div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ n: '17', v: 40, v2: 20, v3: 30 }, { n: '18', v: 30, v2: 40, v3: 20 }, { n: '19', v: 20, v2: 30, v3: 40 }, { n: '20', v: 50, v2: 20, v3: 30 }, { n: '21', v: 30, v2: 20, v3: 50 }, { n: '22', v: 40, v2: 30, v3: 20 }]}>
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#212121', fontSize: 14 }} />
                <Tooltip />
                <Bar dataKey="v" stackId="a" fill="#4318FF" radius={[0, 0, 0, 0]} barSize={12} />
                <Bar dataKey="v2" stackId="a" fill="#6AD2FF" radius={[0, 0, 0, 0]} />
                <Bar dataKey="v3" stackId="a" fill="#EFF4FB" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: TABLE & PIE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check Table */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Check Table</h3>
            <div className="p-2 bg-[#F4F7FE] rounded-xl text-slate-400 cursor-pointer"><MoreHorizontal size={20} /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="pb-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Name</th>
                  <th className="pb-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Status</th>
                  <th className="pb-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Quantity</th>
                  <th className="pb-4 text-xs font-bold text-slate-700 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentActivities?.map((activity, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 flex items-center">
                      <div className="mr-3 p-0.5 border-2 border-indigo-600 rounded text-indigo-600"><CheckCircle size={14} /></div>
                      <span className="font-bold text-[#1B2559]">{activity.description}</span>
                    </td>
                    <td className="py-4 font-bold text-[#1B2559]">{activity.status}</td>
                    <td className="py-4 font-bold text-[#1B2559]">{activity.amount}</td>
                    <td className="py-4 font-bold text-slate-400 text-sm">{new Date(activity.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Your Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col items-center">
          <div className="flex justify-between w-full mb-8">
            <h3 className="text-xl font-bold">Your Pie Chart</h3>
            {/* <select className="bg-transparent border-none text-xs font-bold text-slate-400 focus:ring-0">
              <option>Monthly</option>
            </select> */}
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-6 w-full shadow-xl shadow-slate-100 rounded-2xl p-4">
            <div className="text-center border-r border-slate-100">
              <p className="flex items-center justify-center text-xm text-slate-500 font-bold mb-1">
                <div className="w-2 h-2 rounded-full bg-[#4318FF] mr-2"></div> Boosts
              </p>
              <p className="text-xl font-bold">63%</p>
            </div>
            <div className="text-center">
              <p className="flex items-center justify-center text-xm text-slate-500 font-bold mb-1">
                <div className="w-2 h-2 rounded-full bg-[#6AD2FF] mr-2"></div> System
              </p>
              <p className="text-xl font-bold">25%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;