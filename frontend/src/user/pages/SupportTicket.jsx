import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Send, ArrowLeft } from 'lucide-react';
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
    console.log('🎫 Viewing ticket:', ticket);
    // Refresh tickets before showing details to get latest status
    if (backendStatus === 'online') {
      console.log('🔄 Refreshing tickets before showing details to get latest status...');
      loadTickets().then(() => {
        // Find the updated ticket after refresh
        const updatedTickets = tickets.new.concat(tickets.completed);
        const updatedTicket = updatedTickets.find(t => 
          (t._id || t.id) === (ticket._id || ticket.id)
        );
        console.log('🔄 Latest ticket status:', updatedTicket?.status);
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
    // Refresh tickets to show any status updates from admin
    if (backendStatus === 'online') {
      console.log('🔄 Refreshing tickets after closing details to get latest status updates...');
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
          console.log('✅ Backend is online');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('Backend not reachable:', error);
        setBackendStatus('offline');
      }
    };

    checkBackendStatus();
  }, []);

  // Load tickets function that can be called manually
  const loadTickets = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting to load tickets...');
      
      // Use direct fetch to bypass API service issues with cache busting
      console.log('🔍 Using direct fetch with cache busting...');
      const timestamp = new Date().getTime();
      const url = `/api/tickets/public?t=${timestamp}`;
      console.log('🔍 Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      console.log('🔍 Fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 Direct fetch data:', data);
      
      const userTickets = data.data || [];
      console.log('🔍 User tickets:', userTickets);
      console.log('🔍 Number of tickets:', userTickets.length);
      
      // Debug each ticket's status
      userTickets.forEach((ticket, index) => {
        console.log(`🔍 Ticket ${index}:`, {
          id: ticket._id || ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          createdAt: ticket.createdAt
        });
      });
      
      // Group tickets by status - only three statuses: Submitted, In Progress, Completed
      const groupedTickets = {
        new: userTickets.filter(ticket => 
          ticket.status === 'new' || 
          ticket.status === 'submitted' || 
          ticket.status === 'in-progress' ||
          ticket.status === 'ongoing'
        ),
        completed: userTickets.filter(ticket => ticket.status === 'completed')
      };
      
      console.log('🔍 Grouped tickets:', groupedTickets);
      console.log('🔍 New tickets count:', groupedTickets.new.length);
      console.log('🔍 Completed tickets count:', groupedTickets.completed.length);
      
      // Debug the status of tickets in the new group
      groupedTickets.new.forEach((ticket, index) => {
        console.log(`🔍 New Ticket ${index} Status:`, ticket.status);
      });
      
      setTickets(groupedTickets);
      setLastRefreshTime(new Date().toLocaleTimeString());
      console.log('✅ Auto-loaded tickets successfully!');
    } catch (error) {
      console.error('❌ Error loading tickets:', error);
      console.error('❌ Error details:', error.message);
      
      // Check if it's a network error (backend down)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        console.log('⚠️ Network error detected - backend may be down');
        console.log('🔄 Backend appears to be offline');
        console.log('🔍 Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        setTickets({ new: [], completed: [] });
        setLastRefreshTime('Backend Offline');
      } else {
        // Other errors
        console.log('🔍 Other error:', error);
        setTickets({ new: [], completed: [] });
        setLastRefreshTime('Error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load tickets from API on component mount
  useEffect(() => {
    // Load tickets regardless of user authentication status
    if (backendStatus === 'online') {
      console.log('🔍 Backend is online, loading tickets...');
      loadTickets();
    } else {
      console.log('🔍 Backend status:', backendStatus);
    }
  }, [backendStatus]); // Removed user?.id dependency to prevent array size changes

  // Refresh tickets when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && backendStatus === 'online') {
        console.log('🔄 Page became visible, refreshing tickets...');
        loadTickets();
      }
    };

    const handleFocus = () => {
      if (backendStatus === 'online') {
        console.log('🔄 Window focused, refreshing tickets...');
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
      console.log('🔌 Setting up real-time ticket updates...');
      const cleanup = listenForTicketUpdates((updateData) => {
        console.log('📡 Real-time ticket update received:', updateData);
        console.log('🔄 Refreshing tickets due to real-time update...');
        loadTickets();
      });

      return cleanup;
    }
  }, [isConnected, listenForTicketUpdates]);

  // Auto-refresh tickets every 30 seconds to check for status updates (fallback)
  useEffect(() => {
    if (backendStatus === 'online' && !isConnected) {
      const interval = setInterval(() => {
          console.log('🔄 Auto-refreshing tickets for status updates (fallback)...');
          loadTickets();
        }, 10 * 1000); // 10 seconds for faster status updates

      return () => clearInterval(interval);
    }
  }, [backendStatus, isConnected]);

  const handleNewTicketSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Debug authentication
    console.log('User from context:', user);
    console.log('Is authenticated:', !!user);
    console.log('Token in localStorage:', localStorage.getItem('token'));
    console.log('User ID:', user?.id);
    console.log('User name:', user?.name);
    console.log('User email:', user?.email);
    
    // Check if user is authenticated
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
      // Test backend connectivity first
      console.log('🔍 Testing backend connectivity...');
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
        const healthCheck = await fetch(`${apiUrl}/health`);
        console.log('✅ Backend health check:', healthCheck.status);
      } catch (healthError) {
        console.error('❌ Backend not reachable:', healthError);
        alert('Backend server is not running. Please start the backend server and try again.');
        setSubmitting(false);
        return;
      }

      // Refresh token before API call
      api.refreshToken();
      
      let response;
      
      // Try authenticated endpoint first
      try {
        console.log('🔐 Trying authenticated endpoint...');
        console.log('🔐 User data:', { id: user?.id, name: user?.name, email: user?.email });
        
        const ticketData = {
          subject: newTicketData.subject,
          description: newTicketData.description,
          priority: newTicketData.priority,
          // Include user details to ensure they are captured
          userName: user?.name,
          userEmail: user?.email,
          userPhone: user?.phone
        };
        
        console.log('🔐 Sending ticket data with user details:', ticketData);
        response = await api.post('/tickets', ticketData);
        console.log('✅ Authenticated endpoint succeeded');
      } catch (authError) {
        console.log('⚠️ Authenticated endpoint failed, trying public endpoint:', authError.message);
        
        // Fallback to public endpoint with actual user data
        console.log('🌐 Trying public endpoint with user data...');
        console.log('🌐 User data for public endpoint:', { 
          name: user?.name, 
          email: user?.email, 
          phone: user?.phone 
        });
        
        response = await api.post('/tickets/public', {
          subject: newTicketData.subject,
          description: newTicketData.description,
          priority: newTicketData.priority,
          userName: user?.name || 'Anonymous User',
          userEmail: user?.email || 'anonymous@example.com',
          userPhone: user?.phone || 'N/A'
        });
        console.log('✅ Public endpoint succeeded');
      }

      const newTicket = response.data.data;

      // Add ticket to new tickets (treat as submitted)
      const submittedTicket = { ...newTicket, status: 'submitted' };
      setTickets(prevTickets => ({
        ...prevTickets,
        new: [submittedTicket, ...prevTickets.new]
      }));

      // Reset form and close modal
      setNewTicketData({ subject: '', description: '', priority: 'medium' });
      setShowNewTicketForm(false);
      
      // Show success message
      alert(`Ticket submitted successfully! 
      
Your details:
- Name: ${user?.name || 'N/A'}
- Email: ${user?.email || 'N/A'}
- Phone: ${user?.phone || 'N/A'}

The ticket will appear in the admin panel with your information.`);
      
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Error submitting ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'submitted': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'ongoing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Submitted';
      case 'submitted': return 'Submitted';
      case 'in-progress': return 'In Progress';
      case 'ongoing': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Submitted'; // Default to Submitted for any unknown status
    }
  };

  const renderTickets = (tickets) => {
    console.log('🎫 Rendering tickets:', tickets);
    
    if (!tickets || tickets.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {lastRefreshTime === 'Backend Offline' ? 'Backend is offline. Please check your connection.' : 
             lastRefreshTime === 'Error' ? 'Error loading tickets. Please try again.' : 
             'No tickets found'}
          </p>
          {lastRefreshTime === 'Backend Offline' && (
            <p className="text-sm text-gray-400 mt-2">
              Make sure the backend server is running on port 5000
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tickets.map((ticket, index) => {
          // Validate ticket data
          if (!ticket) {
            console.warn('Invalid ticket data at index:', index);
            return null;
          }

          console.log(`🎫 Ticket ${index}:`, ticket);

          // Ensure required fields exist with fallbacks
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

          console.log('🎫 Original ticket data:', ticket);
          console.log('🎫 Mapped ticket data:', ticketData);

          console.log(`🎫 Processed ticket ${index}:`, ticketData);
          console.log(`🎫 Ticket ${index} status:`, ticketData.status, '->', getStatusText(ticketData.status));

          return (
            <Card key={ticketData.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(ticketData.status)}
                    <h3 className="font-semibold text-gray-900">{ticketData.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticketData.priority)}`}>
                      {ticketData.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ticketData.status === 'in-progress' || ticketData.status === 'ongoing' ? 'bg-orange-100 text-orange-800' :
                      ticketData.status === 'submitted' || ticketData.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      ticketData.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800' // Default to Submitted (blue)
                    }`}>
                      {getStatusText(ticketData.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{ticketData.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Created: {ticketData.createdAt}</span>
                    {ticketData.lastUpdate && <span>Last update: {ticketData.lastUpdate}</span>}
                    {ticketData.resolvedAt && <span>Resolved: {ticketData.resolvedAt}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleViewTicket(ticketData)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 text-center">Loading tickets...</Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/account')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            </div>
            <div className="flex items-center gap-2">
              {user && user.id ? (
                <Button
                  onClick={() => setShowNewTicketForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Ticket
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Login to Create Ticket
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'new', label: 'New Tickets', count: tickets.new.length },
                { id: 'completed', label: 'Completed', count: tickets.completed.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Refresh tickets when switching tabs to get latest status
                    if (backendStatus === 'online') {
                      console.log('🔄 Refreshing tickets on tab switch to get latest status...');
                      loadTickets();
                    }
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
        {activeTab === 'new' && renderTickets(tickets.new)}
        {activeTab === 'completed' && renderTickets(tickets.completed)}
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate('/dashboard/account')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Back to Profile
          </Button>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <Card className="w-full max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create New Ticket</h2>
              <button
                onClick={() => setShowNewTicketForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleNewTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicketData.subject}
                  onChange={(e) => setNewTicketData({...newTicketData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTicketData.priority}
                  onChange={(e) => setNewTicketData({...newTicketData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData({...newTicketData, description: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide detailed information about your issue..."
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </Button>
                 <Button
                   type="submit"
                   disabled={submitting}
                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   <Send className="h-4 w-4" />
                   {submitting ? 'Submitting...' : 'Submit Ticket'}
                 </Button>
              </div>
            </form>
            </Card>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0">
          <div className="bg-white w-full h-full overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Ticket Details</h2>
                <button
                  onClick={handleCloseTicketDetails}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Ticket Information */}
              <div className="space-y-6">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.subject}</h3>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTicket.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTicket.status === 'in-progress' || selectedTicket.status === 'ongoing' ? 'bg-orange-100 text-orange-800' :
                        selectedTicket.status === 'submitted' || selectedTicket.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        selectedTicket.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800' // Default to Submitted (blue)
                      }`}>
                        {getStatusText(selectedTicket.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>


                {/* Timestamps */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timestamps</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Created:</span>
                        <p className="font-medium">{selectedTicket.createdAt}</p>
                      </div>
                      {selectedTicket.lastUpdate && (
                        <div>
                          <span className="text-sm text-gray-600">Last Update:</span>
                          <p className="font-medium">{selectedTicket.lastUpdate}</p>
                        </div>
                      )}
                      {selectedTicket.resolvedAt && (
                        <div>
                          <span className="text-sm text-gray-600">Resolved:</span>
                          <p className="font-medium">{selectedTicket.resolvedAt}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTicket.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTicket.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                        selectedTicket.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        selectedTicket.status === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                        selectedTicket.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusText(selectedTicket.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resolution Note */}
                {selectedTicket.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Note</label>
                    <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.adminNotes}</p>
                    </div>
                  </div>
                )}

                {/* Ticket ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticket ID</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-mono text-sm text-blue-600 font-semibold">
                      TKT-{String(selectedTicket._id || selectedTicket.id || '00000').slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
                <Button
                  onClick={handleCloseTicketDetails}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicket;
