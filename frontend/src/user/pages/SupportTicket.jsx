import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Send, ChevronRight, LifeBuoy, X, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';

const SupportTicket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listenForTicketUpdates, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('new');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [tickets, setTickets] = useState({
    new: [],
    completed: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Handle viewing ticket details
  const handleViewTicket = (ticket) => {
    if (backendStatus === 'online') {
      loadTickets().then(() => {
        const updatedTickets = tickets.new.concat(tickets.completed);
        const updatedTicket = updatedTickets.find(t =>
          (t._id || t.id) === (ticket._id || ticket.id)
        );
        setSelectedTicket(updatedTicket || ticket);
        setShowTicketDetails(true);
      });
    } else {
      setSelectedTicket(ticket);
      setShowTicketDetails(true);
    }
  };

  // Close ticket details modal
  const handleCloseTicketDetails = () => {
    setShowTicketDetails(false);
    setSelectedTicket(null);
    if (backendStatus === 'online') {
      loadTickets();
    }
  };

  // Check backend status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackendStatus();
  }, []);

  // Load tickets function that can be called manually
  const loadTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Use direct fetch to bypass API service issues with cache busting
      const timestamp = new Date().getTime();
      const url = `/api/tickets/my-tickets?t=${timestamp}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const userTickets = data.data || [];

      // Group tickets by status
      const groupedTickets = {
        new: userTickets.filter(ticket =>
          ticket.status === 'new' ||
          ticket.status === 'submitted' ||
          ticket.status === 'in-progress' ||
          ticket.status === 'ongoing'
        ),
        completed: userTickets.filter(ticket => ticket.status === 'completed')
      };

      setTickets(groupedTickets);
      setLastRefreshTime(new Date().toLocaleTimeString());
    } catch (error) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setTickets({ new: [], completed: [] });
        setLastRefreshTime('Backend Offline');
      } else {
        setTickets({ new: [], completed: [] });
        setLastRefreshTime('Error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load tickets from API on component mount
  useEffect(() => {
    if (backendStatus === 'online') {
      loadTickets();
    }
  }, [backendStatus]);

  // Refresh tickets when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && backendStatus === 'online') {
        loadTickets();
      }
    };

    const handleFocus = () => {
      if (backendStatus === 'online') {
        loadTickets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [backendStatus]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (isConnected) {
      const cleanup = listenForTicketUpdates((updateData) => {
        loadTickets();
      });
      return cleanup;
    }
  }, [isConnected, listenForTicketUpdates]);

  // Auto-refresh tickets every 10 seconds to check for status updates (fallback)
  useEffect(() => {
    if (backendStatus === 'online' && !isConnected) {
      const interval = setInterval(() => {
        loadTickets();
      }, 10 * 1000);
      return () => clearInterval(interval);
    }
  }, [backendStatus, isConnected]);

  const handleNewTicketSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!user || !user.id) {
      const shouldLogin = window.confirm(
        'You need to be logged in to create a support ticket. Would you like to go to the login page?'
      );
      if (shouldLogin) {
        window.location.href = '/login';
      }
      setSubmitting(false);
      return;
    }

    try {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
        await fetch(`${apiUrl}/health`);
      } catch (healthError) {
        alert('Backend server is not running. Please start the backend server and try again.');
        setSubmitting(false);
        return;
      }

      api.refreshToken();
      let response;

      try {
        const ticketData = {
          subject: newTicketData.subject,
          description: newTicketData.description,
          priority: newTicketData.priority,
          userName: user?.name,
          userEmail: user?.email,
          userPhone: user?.phone
        };
        response = await api.post('/tickets', ticketData);
      } catch (authError) {
        response = await api.post('/tickets/public', {
          subject: newTicketData.subject,
          description: newTicketData.description,
          priority: newTicketData.priority,
          userName: user?.name || 'Anonymous User',
          userEmail: user?.email || 'anonymous@example.com',
          userPhone: user?.phone || 'N/A'
        });
      }

      const newTicket = response.data.data;
      const submittedTicket = { ...newTicket, status: 'submitted' };

      setTickets(prevTickets => ({
        ...prevTickets,
        new: [submittedTicket, ...prevTickets.new]
      }));

      setNewTicketData({ subject: '', description: '', priority: 'medium' });
      setShowNewTicketForm(false);

      alert(`Ticket submitted successfully! \n\nThe ticket will appear in the admin panel with your information.`);

    } catch (error) {
      alert('Error submitting ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-600 border border-red-100';
      case 'medium': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
      case 'low': return 'bg-green-50 text-green-600 border border-green-100';
      default: return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
      case 'submitted': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
      case 'ongoing': return <Clock className="h-4 w-4 text-[#fc8019]" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
      case 'submitted': return 'Submitted';
      case 'in-progress':
      case 'ongoing': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Submitted';
    }
  };

  const renderTickets = (ticketsList) => {
    if (!ticketsList || ticketsList.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">No tickets found</h3>
          <p className="text-gray-500 font-medium">
            {lastRefreshTime === 'Backend Offline' ? 'Backend is offline. Please check your connection.' :
              lastRefreshTime === 'Error' ? 'Error loading tickets. Please try again.' :
                'You have no tickets in this category.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ticketsList.map((ticket, index) => {
          if (!ticket) return null;

          const ticketData = {
            id: ticket._id || ticket.id || `ticket-${index}`,
            status: ticket.status || 'new',
            subject: ticket.subject || 'No Subject',
            description: ticket.description || 'No Description',
            priority: ticket.priority || 'medium',
            createdAt: ticket.createdAt || ticket.created_at || 'Unknown Date',
            lastUpdate: ticket.lastUpdate || ticket.last_update,
            resolvedAt: ticket.resolvedAt || ticket.resolved_at
          };

          return (
            <div
              key={ticketData.id}
              onClick={() => handleViewTicket(ticketData)}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#fc8019]/30 transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${ticketData.status === 'in-progress' || ticketData.status === 'ongoing' ? 'bg-orange-50 text-[#fc8019] border border-orange-100' :
                        ticketData.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' :
                          'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                      {getStatusIcon(ticketData.status)}
                      {getStatusText(ticketData.status)}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${getPriorityColor(ticketData.priority)}`}>
                      {ticketData.priority}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      ID: {String(ticketData.id).slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-gray-900 mb-1.5 truncate group-hover:text-[#fc8019] transition-colors">
                    {ticketData.subject}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-1 font-medium">{ticketData.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Created: {new Date(ticketData.createdAt).toLocaleDateString()}</span>
                    {ticketData.lastUpdate && <span className="hidden sm:inline">•</span>}
                    {ticketData.lastUpdate && <span>Updated: {new Date(ticketData.lastUpdate).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex items-center shrink-0 w-full md:w-auto">
                  <Button
                    className="w-full md:w-auto bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold border-none rounded-xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewTicket(ticketData);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f0f0f5] flex items-center justify-center font-sans">
      <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="w-12 h-12 bg-gradient-to-br from-[#fc8019] to-[#ffc107] rounded-full mx-auto mb-4 animate-bounce shadow-sm"></div>
        <p className="text-gray-500 font-bold tracking-tight">Loading tickets...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20">

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/account')}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center hidden sm:flex">
                  <LifeBuoy size={20} className="text-[#fc8019]" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Support Tickets</h1>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Help & Support</p>
                </div>
              </div>
            </div>

            <div>
              <Button
                onClick={() => {
                  if (!user || !user.id) {
                    if (window.confirm('You need to be logged in to create a ticket. Go to login?')) {
                      window.location.href = '/login';
                    }
                  } else {
                    setShowNewTicketForm(true);
                  }
                }}
                className="bg-[#fc8019] hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm border-none flex items-center gap-2 py-2.5 px-4"
              >
                <Plus size={18} strokeWidth={3} />
                <span className="hidden sm:inline">New Ticket</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 py-6">

        {/* Tabs */}
        <div className="mb-6 flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 w-full sm:w-fit overflow-x-auto hide-scrollbar">
          {[
            { id: 'new', label: 'Active Tickets', count: tickets.new.length },
            { id: 'completed', label: 'Resolved', count: tickets.completed.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (backendStatus === 'online') loadTickets();
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-[#fc8019] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mb-8">
          {activeTab === 'new' && renderTickets(tickets.new)}
          {activeTab === 'completed' && renderTickets(tickets.completed)}
        </div>

      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center animate-fade-in p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col max-h-[90vh] animate-slide-up">

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 rounded-t-3xl">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <LifeBuoy size={20} className="text-[#fc8019]" />
                Create New Ticket
              </h2>
              <button
                onClick={() => setShowNewTicketForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleNewTicketSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTicketData.subject}
                    onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all text-gray-800"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Priority
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      value={newTicketData.priority}
                      onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all text-gray-800 appearance-none cursor-pointer"
                    >
                      <option value="low">Low (General Query)</option>
                      <option value="medium">Medium (Issue/Bug)</option>
                      <option value="high">High (Urgent/Payment Issue)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-gray-500 tracking-wider mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newTicketData.description}
                    onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fc8019]/20 focus:border-[#fc8019] transition-all text-gray-800 resize-none leading-relaxed"
                    placeholder="Please provide detailed information about your issue so our team can help you faster..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    onClick={() => setShowNewTicketForm(false)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold py-3.5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#fc8019] hover:bg-orange-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 rounded-xl font-bold py-3.5 border-none shadow-sm"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-fade-in">
          <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-xl flex flex-col max-h-[90vh] animate-slide-up">

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md">
                  ID: {String(selectedTicket._id || selectedTicket.id || '0000').slice(-6).toUpperCase()}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${selectedTicket.status === 'in-progress' || selectedTicket.status === 'ongoing' ? 'bg-orange-50 text-[#fc8019] border border-orange-100' :
                    selectedTicket.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-100' :
                      'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                  {getStatusText(selectedTicket.status)}
                </span>
              </div>
              <button
                onClick={handleCloseTicketDetails}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-snug mb-2">
                  {selectedTicket.subject}
                </h2>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>Created: {new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                  <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${getPriorityColor(selectedTicket.priority)}`}>
                    Priority: {selectedTicket.priority}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-2">Description</label>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Resolution Note */}
              {selectedTicket.adminNotes && (
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-green-600/70 tracking-wider mb-2">Resolution Note from Admin</label>
                  <div className="p-5 bg-green-50 rounded-2xl border border-green-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                    <p className="text-sm font-bold text-green-900 whitespace-pre-wrap leading-relaxed ml-2">{selectedTicket.adminNotes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {selectedTicket.lastUpdate && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="block text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Last Update</span>
                    <p className="text-sm font-bold text-gray-800">{new Date(selectedTicket.lastUpdate).toLocaleString()}</p>
                  </div>
                )}
                {selectedTicket.resolvedAt && (
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="block text-[10px] uppercase font-extrabold text-gray-400 tracking-wider mb-1">Resolved At</span>
                    <p className="text-sm font-bold text-gray-800">{new Date(selectedTicket.resolvedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <Button
                onClick={handleCloseTicketDetails}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold rounded-xl py-3.5 border-none"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicket;