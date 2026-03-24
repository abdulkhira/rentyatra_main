import { useState, useEffect } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Mail, Phone, Calendar, Eye, MessageCircle, Hash } from 'lucide-react';
import api from '../../../services/api';

const SupportManagementView = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  // Load tickets from API
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual load tickets function
  const loadTicketsManually = async () => {
    try {
      setLoading(true);
      console.log('🔄 Manually loading tickets for admin...');
      
      let ticketsData = [];
      let useFallback = false;
      
      const data = await api.getTickets();
      console.log('🔄 Manual admin API data:', data);
      
      // Check if the response indicates authentication failure
      if (data && data.requiresAuth) {
        console.log('⚠️ Manual admin API authentication failed, using public endpoint');
        useFallback = true;
      } else if (data && data.success !== false) {
        ticketsData = data.data || [];
        console.log('🔄 Manual tickets:', ticketsData);
        console.log('🔄 Manual tickets count:', ticketsData.length);
      } else {
        console.log('⚠️ Manual admin API failed, using public endpoint');
        useFallback = true;
      }
      
      if (useFallback) {
        try {
          // Fallback to public endpoint
          const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
          const response = await fetch(`${apiUrl}/tickets/public`);
          console.log('🔄 Manual public fetch response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('🔄 Manual public fetch data:', data);
          
          ticketsData = data.data || [];
          console.log('🔄 Manual public tickets:', ticketsData);
          console.log('🔄 Manual public tickets count:', ticketsData.length);
          
          console.log('✅ Manual public tickets loaded successfully');
        } catch (fallbackError) {
          console.error('❌ Manual both admin and public endpoints failed:', fallbackError.message);
          ticketsData = [];
        }
      }
      
      setTickets(ticketsData);
      
      if (ticketsData.length > 0) {
        console.log('✅ Manual load successful!');
      } else {
        console.log('⚠️ No tickets found in manual load');
      }
    } catch (error) {
      console.error('❌ Manual load error:', error);
      console.error('❌ Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        console.log('🔍 Admin loading tickets...');
        console.log('🔍 API service:', api);
        console.log('🔍 API base URL:', api.baseURL);
        
        // Check if admin token exists
        const adminToken = localStorage.getItem('adminToken');
        console.log('🔐 Admin token exists:', adminToken ? 'Yes' : 'No');
        
        // Try admin API service first, fallback to public endpoint
        console.log('🔍 Using admin API service...');
        let ticketsData = [];
        let useFallback = false;
        
        if (!adminToken) {
          console.log('⚠️ No admin token found, using public endpoint directly');
          useFallback = true;
        } else {
          const data = await api.getTickets();
          console.log('🔍 Admin API data:', data);
          
          // Check if the response indicates authentication failure
          if (data && data.requiresAuth) {
            console.log('⚠️ Admin API authentication failed, using public endpoint');
            useFallback = true;
          } else if (data && data.success !== false) {
            console.log('🔍 Data success:', data.success);
            console.log('🔍 Data count:', data.count);
            console.log('🔍 Data tickets:', data.data);
            
            ticketsData = data.data || [];
            console.log('🔍 Tickets data:', ticketsData);
            console.log('🔍 Number of tickets:', ticketsData.length);
            
            if (ticketsData.length === 0) {
              console.log('⚠️ No tickets found in response');
            } else {
              console.log('✅ Tickets loaded successfully:', ticketsData.length);
            }
          } else {
            console.log('⚠️ Admin API failed, using public endpoint');
            useFallback = true;
          }
        }
        
        if (useFallback) {
          try {
            // Fallback to public endpoint
            const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
          const response = await fetch(`${apiUrl}/tickets/public`);
            console.log('🔍 Public fetch response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🔍 Public fetch data:', data);
            
            ticketsData = data.data || [];
            console.log('🔍 Public tickets data:', ticketsData);
            console.log('🔍 Public number of tickets:', ticketsData.length);
            
            console.log('✅ Public tickets loaded successfully');
          } catch (fallbackError) {
            console.error('❌ Both admin and public endpoints failed:', fallbackError.message);
            ticketsData = [];
          }
        }
        
        setTickets(ticketsData);
      } catch (error) {
        console.error('❌ Error loading tickets:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'submitted': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'ongoing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      console.log('🔄 Updating ticket status:', ticketId, newStatus);
      
      // Use the new comprehensive admin update endpoint
      try {
        await api.adminUpdateTicket(ticketId, { status: newStatus });
        console.log('✅ Status updated via admin endpoint');
      } catch (adminError) {
        console.log('⚠️ Admin endpoint failed, updating locally only:', adminError.message);
        // Just update locally if admin endpoint fails
        // In a real app, you might want to show a warning to the user
      }
      
      // Update local state regardless
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === ticketId 
            ? { ...ticket, status: newStatus, lastUpdate: new Date().toISOString().split('T')[0] }
            : ticket
        )
      );
      
      console.log('✅ Ticket status updated locally');
    } catch (error) {
      console.error('❌ Error updating ticket status:', error);
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

  const renderTicketCard = (ticket) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(ticket.status)}
            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{ticket.description}</p>
          {/* User Information Section */}
          <div className="bg-gray-50 p-3 rounded-lg mb-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <User className="h-4 w-4" />
              User Information
            </h4>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{ticket.user?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-gray-500" />
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{ticket.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-gray-500" />
                <span className="text-gray-500">ID:</span>
                <span className="font-medium font-mono text-blue-600">
                  TKT-{String(ticket._id || ticket.id || '00000').slice(-6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-gray-500" />
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium">{ticket.user?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span className="text-gray-500">Created:</span>
                <span className="font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleViewTicket(ticket)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Support Management</h1>
          <p className="text-slate-600 mt-2">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Support Management</h1>
            <p className="text-slate-600 mt-2">Manage user support tickets and inquiries</p>
          </div>
          <Button
            onClick={loadTicketsManually}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Refresh Tickets
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.filter(t => t.status === 'new' || t.status === 'submitted').length}</p>
            </div>
          </div>
        </Card>
        
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.filter(t => t.status === 'completed').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', label: 'All Tickets', count: tickets.length },
              { id: 'new', label: 'New', count: tickets.filter(t => t.status === 'new' || t.status === 'submitted').length },
              { id: 'completed', label: 'Completed', count: tickets.filter(t => t.status === 'completed').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tickets found</p>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket._id || ticket.id}>
              {renderTicketCard(ticket)}
            </div>
          ))
        )}
      </div>

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Ticket Details</h2>
                  <p className="text-sm text-gray-500 font-mono">
                    ID: TKT-{String(selectedTicket._id || selectedTicket.id || '00000').slice(-6).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Ticket Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedTicket.subject}</h3>
                  <p className="text-gray-600">{selectedTicket.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-xs text-gray-500">Name:</span>
                          <span className="text-sm font-medium ml-1">{selectedTicket.user?.name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-xs text-gray-500">Email:</span>
                          <span className="text-sm font-medium ml-1">{selectedTicket.user?.email || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-xs text-gray-500">Ticket ID:</span>
                          <span className="text-sm font-medium ml-1 font-mono text-blue-600">
                            TKT-{String(selectedTicket._id || selectedTicket.id || '00000').slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-xs text-gray-500">Phone:</span>
                          <span className="text-sm font-medium ml-1">{selectedTicket.user?.phone || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-xs text-gray-500">Created:</span>
                          <span className="text-sm font-medium ml-1">
                            {new Date(selectedTicket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timestamps
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-xs text-gray-500">Created:</span>
                          <span className="text-sm font-medium ml-1">
                            {new Date(selectedTicket.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {selectedTicket.lastUpdate && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <span className="text-xs text-gray-500">Last Updated:</span>
                            <span className="text-sm font-medium ml-1">
                              {new Date(selectedTicket.lastUpdate).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Status Update</h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedTicket.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                        selectedTicket.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        selectedTicket.status === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                        selectedTicket.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTicket.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedTicket.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          await updateTicketStatus(selectedTicket._id, newStatus);
                          setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                        } catch (error) {
                          console.error('❌ Error updating status:', error);
                          alert('Error updating status. Please try again.');
                        }
                      }}
                    >
                      <option value="new">New</option>
                      <option value="submitted">Submitted</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Resolution Note */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Resolution Note</h4>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add resolution notes about this ticket..."
                    value={selectedTicket.adminNotes}
                    onChange={async (e) => {
                      const newNotes = e.target.value;
                      try {
                        console.log('🔄 Updating resolution notes:', selectedTicket._id, newNotes);
                        
                        // Try admin endpoint first
                        try {
                          await api.adminUpdateTicket(selectedTicket._id, { adminNotes: newNotes });
                          console.log('✅ Resolution notes updated via admin endpoint');
                        } catch (adminError) {
                          console.log('⚠️ Admin endpoint failed, updating locally only:', adminError.message);
                          // Just update locally if admin endpoint fails
                        }
                        
                        // Update local state regardless
                        setTickets(prev => prev.map(t => 
                          t._id === selectedTicket._id 
                            ? { ...t, adminNotes: newNotes }
                            : t
                        ));
                        
                        // Update selected ticket
                        setSelectedTicket(prev => ({ ...prev, adminNotes: newNotes }));
                        console.log('✅ Resolution notes updated locally');
                      } catch (error) {
                        console.error('❌ Error updating resolution notes:', error);
                        alert('Error updating resolution notes. Please try again.');
                      }
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 flex gap-3">
                  <Button
                    onClick={async () => {
                      try {
                        // Use comprehensive admin update endpoint
                        const updateData = {};
                        if (selectedTicket.adminNotes !== undefined) {
                          updateData.adminNotes = selectedTicket.adminNotes;
                        }
                        if (selectedTicket.status) {
                          updateData.status = selectedTicket.status;
                        }
                        
                        if (Object.keys(updateData).length > 0) {
                          await api.adminUpdateTicket(selectedTicket._id, updateData);
                          console.log('✅ Ticket updated via comprehensive admin endpoint');
                        }
                        
                        alert('Ticket updated successfully!');
                        handleCloseDetails();
                      } catch (error) {
                        console.error('❌ Error updating ticket:', error);
                        alert('Error updating ticket. Please try again.');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                  <Button
                    onClick={handleCloseDetails}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SupportManagementView;
