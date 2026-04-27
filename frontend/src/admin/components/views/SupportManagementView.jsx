import { useState, useEffect } from 'react';
import {
  MessageSquare, Clock, CheckCircle, AlertCircle, User,
  Mail, Phone, Calendar, Eye, Hash, RefreshCw, XCircle, ChevronRight, ShieldAlert, FileText, Send
} from 'lucide-react';
import api from '../../../services/api';

const SupportManagementView = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTicketsManually = async () => {
    try {
      setLoading(true);
      let ticketsData = [];
      let useFallback = false;

      const data = await api.getTickets();
      if (data && data.requiresAuth) {
        useFallback = true;
      } else if (data && data.success !== false) {
        ticketsData = data.data || [];
      } else {
        useFallback = true;
      }

      if (useFallback) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
          const response = await fetch(`${apiUrl}/tickets/public`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          ticketsData = data.data || [];
        } catch (fallbackError) {
          ticketsData = [];
        }
      }
      setTickets(ticketsData);
    } catch (error) {
      console.error('Manual load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const adminToken = localStorage.getItem('adminToken');
        let ticketsData = [];
        let useFallback = false;

        if (!adminToken) {
          useFallback = true;
        } else {
          const data = await api.getTickets();
          if (data && data.requiresAuth) {
            useFallback = true;
          } else if (data && data.success !== false) {
            ticketsData = data.data || [];
          } else {
            useFallback = true;
          }
        }

        if (useFallback) {
          try {
            const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
            const response = await fetch(`${apiUrl}/tickets/public`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            ticketsData = data.data || [];
          } catch (fallbackError) {
            ticketsData = [];
          }
        }
        setTickets(ticketsData);
      } catch (error) {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ongoing':
      case 'in-progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
      case 'submitted': return <AlertCircle className="h-5 w-5 text-indigo-500" />;
      case 'ongoing':
      case 'in-progress': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      default: return <MessageSquare className="h-5 w-5 text-slate-500" />;
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      try {
        await api.adminUpdateTicket(ticketId, { status: newStatus });
      } catch (adminError) {
        console.log('Admin endpoint failed, updating locally only');
      }

      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket._id === ticketId
            ? { ...ticket, status: newStatus, lastUpdate: new Date().toISOString().split('T')[0] }
            : ticket
        )
      );
    } catch (error) {
      alert('Error updating ticket status. Please try again.');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    if (activeTab === 'new') return ticket.status === 'new' || ticket.status === 'submitted';
    return ticket.status === activeTab;
  });

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const handleCloseDetails = () => {
    setShowTicketDetails(false);
    setSelectedTicket(null);
  };

  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'new' || t.status === 'submitted').length,
    completed: tickets.filter(t => t.status === 'completed').length
  };

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Desk</h1>
          <p className="text-slate-500 font-medium">Manage user inquiries, tickets, and platform support</p>
        </div>
        <button
          onClick={loadTicketsManually}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Tickets
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Tickets', val: stats.total, color: 'blue', icon: MessageSquare },
          { label: 'Action Required', val: stats.new, color: 'amber', icon: AlertCircle },
          { label: 'Resolved', val: stats.completed, color: 'emerald', icon: CheckCircle },
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
      <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl overflow-x-auto max-w-full">
        {[
          { id: 'all', label: 'All Tickets', count: stats.total },
          { id: 'new', label: 'New / Open', count: stats.new },
          { id: 'completed', label: 'Completed', count: stats.completed }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
              }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
              <div className="space-y-3 w-full">
                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[3rem] border border-slate-100 shadow-sm">
            <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-800">No tickets found</h3>
            <p className="text-slate-500 font-medium mt-1">You're all caught up in this queue.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket._id || ticket.id} className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col md:flex-row gap-5 md:items-center">

              {/* Avatar & Core Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                  {ticket.user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(ticket.status)}
                    <h3 className="font-bold text-slate-900 truncate pr-4">{ticket.subject}</h3>
                  </div>
                  <p className="text-sm font-medium text-slate-500 line-clamp-1 pr-4 mb-3">{ticket.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${getPriorityStyle(ticket.priority)}`}>
                      {ticket.priority || 'Normal'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusStyle(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 shadow-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="md:border-l md:border-slate-100 md:pl-5 pt-4 md:pt-0 border-t border-slate-50 md:border-t-0 flex justify-between md:justify-end items-center w-full md:w-auto">
                <div className="text-xs font-bold text-slate-400 md:hidden uppercase tracking-widest">Action</div>
                <button
                  onClick={() => handleViewTicket(ticket)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Review <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#F8FAFC] w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {getStatusIcon(selectedTicket.status)}
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ticket Overview</h2>
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  ID: TKT-{String(selectedTicket._id || selectedTicket.id || '00000').slice(-6).toUpperCase()}
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={handleCloseDetails} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                <XCircle className="w-8 h-8 text-slate-300" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto p-6 md:p-8 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: The Issue */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</p>
                        <h3 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h3>
                      </div>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Resolution Notes Section */}
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-indigo-500" /> Admin Resolution Notes
                      </h4>
                    </div>
                    <textarea
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700 placeholder:text-slate-400"
                      rows={4}
                      placeholder="Add private resolution notes or steps taken..."
                      value={selectedTicket.adminNotes || ''}
                      onChange={(e) => setSelectedTicket(prev => ({ ...prev, adminNotes: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Right Column: Meta & Actions */}
                <div className="space-y-6">

                  {/* User Profile Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" /> Customer Profile
                    </p>
                    <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-50">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        {selectedTicket.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{selectedTicket.user?.name || 'Unknown User'}</p>
                        <p className="text-[10px] font-black text-indigo-500 tracking-widest mt-0.5">USR{String(selectedTicket.user?._id || '0000').slice(-4).padStart(4, '0')}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 truncate">{selectedTicket.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{selectedTicket.user?.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" /> Ticket Management
                    </p>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Priority Level</label>
                        <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border shadow-sm ${getPriorityStyle(selectedTicket.priority)}`}>
                          {selectedTicket.priority || 'Normal'}
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Current Status</label>
                        <select
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 cursor-pointer transition-all"
                          value={selectedTicket.status || 'new'}
                          onChange={(e) => setSelectedTicket(prev => ({ ...prev, status: e.target.value }))}
                        >
                          <option value="new">New</option>
                          <option value="submitted">Submitted</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Commit Button */}
                    <button
                      onClick={async () => {
                        try {
                          const updateData = {};
                          if (selectedTicket.adminNotes !== undefined) updateData.adminNotes = selectedTicket.adminNotes;
                          if (selectedTicket.status) updateData.status = selectedTicket.status;

                          if (Object.keys(updateData).length > 0) {
                            await api.adminUpdateTicket(selectedTicket._id, updateData);
                            // Also update local list status so UI reflects immediately
                            setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, ...updateData } : t));
                          }

                          alert('Ticket updated successfully!');
                          handleCloseDetails();
                        } catch (error) {
                          alert('Error updating ticket. Please try again.');
                        }
                      }}
                      className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Save & Update Ticket
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportManagementView;