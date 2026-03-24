import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Clock } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import chatService from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ChatList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  
  // Add error handling for useSocket
  let socketContext;
  try {
    socketContext = useSocket();
  } catch (error) {
    console.error('Socket context not available:', error);
    socketContext = { socket: null, isConnected: false };
  }
  
  const { socket, isConnected } = socketContext;
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // Check if user is authenticated and token exists
    const token = localStorage.getItem('token');
    if (user && token && isAuthenticated) {
      loadConversations();
    } else if (!token && user) {
      console.warn('⚠️ User exists but no token found, redirecting to login');
      // User object exists but token is missing - might be expired
      window.location.href = '/login';
    } else if (!isAuthenticated && !authLoading) {
      // Auth finished loading but user is not authenticated
      console.warn('⚠️ User not authenticated, redirecting to login');
      window.location.href = '/login';
    }
  }, [user, authLoading, isAuthenticated]);

  // Helper function to show desktop notification
  const showDesktopNotification = useCallback((message) => {
    console.log('🔔 ChatList: Attempting to show desktop notification:', {
      messageId: message._id,
      sender: message.sender?.name,
      conversationId: message.conversationId,
      windowFocused: document.hasFocus(),
      notificationSupported: typeof Notification !== 'undefined',
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'N/A'
    });
    
    // Check if notifications are supported and permitted
    if (typeof Notification === 'undefined') {
      console.log('🔔 Desktop notifications not supported in this browser');
      return;
    }
    
    // Request permission if not granted
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission result:', permission);
        if (permission === 'granted') {
          // Retry showing notification after permission granted
          showDesktopNotification(message);
        }
      });
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('🔔 Notification permission not granted:', Notification.permission);
      return;
    }
    
    // Don't show notification if user is actively viewing the chat list and window is focused
    if (document.hasFocus()) {
      // Still show notification if it's a new conversation
      const isNewConversation = !conversations.some(
        conv => conv.conversationId === message.conversationId
      );
      if (!isNewConversation) {
        console.log('🔔 Skipping notification - user is viewing chat list');
        return; // User is viewing chat list, don't show notification
      }
    }
    
    const currentUserId = (user?._id || user?.id)?.toString();
    const messageReceiverId = message.receiver?._id?.toString() || message.receiver?.toString();
    
    // Only show notification if message is for current user
    if (messageReceiverId !== currentUserId) {
      console.log('🔔 Skipping notification - message not for current user');
      return;
    }
    
    const senderName = message.sender?.name || 'Someone';
    const messageContent = message.content || 'New message';
    const truncatedContent = messageContent.length > 50 
      ? messageContent.substring(0, 50) + '...' 
      : messageContent;
    
    try {
      console.log('🔔 Creating desktop notification in ChatList...');
      const notification = new Notification(`${senderName} sent a message`, {
        body: truncatedContent,
        icon: message.sender?.profilePicture || '/favicon.png',
        badge: '/favicon.png',
        tag: `chat_${message.conversationId}`,
        requireInteraction: false,
        silent: false
      });
      
      // Handle notification click - navigate to chat
      notification.onclick = () => {
        console.log('🔔 Notification clicked, navigating to chat');
        window.focus();
        navigate(`/chat/${message.sender._id}`);
        notification.close();
      };
      
      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      console.log('✅ Desktop notification shown for chat list:', senderName);
    } catch (error) {
      console.error('❌ Error showing desktop notification:', error);
    }
  }, [conversations, user, navigate]);

  // Define callback functions first
  const handleNewMessage = useCallback((message) => {
    console.log('📨 New message received in chat list:', message);
    
    // Update conversations list with new message
    setConversations(prev => {
      const updated = [...prev];
      const conversationIndex = updated.findIndex(
        conv => conv.conversationId === message.conversationId
      );
      
      if (conversationIndex !== -1) {
        console.log('✅ Updating existing conversation');
        updated[conversationIndex].lastMessage = message;
        updated[conversationIndex].unreadCount += 1;
        // Move to top
        const [movedConv] = updated.splice(conversationIndex, 1);
        updated.unshift(movedConv);
      } else {
        console.log('✅ Creating new conversation');
        // New conversation
        updated.unshift({
          conversationId: message.conversationId,
          lastMessage: message,
          unreadCount: 1,
          sender: message.sender,
          receiver: message.receiver
        });
      }
      
      return updated;
    });
    
    // Show desktop notification for new messages
    showDesktopNotification(message);
  }, [showDesktopNotification]);

  const handleMessageNotification = useCallback((data) => {
    // Update unread count for the conversation
    setConversations(prev => {
      const updated = [...prev];
      const conversationIndex = updated.findIndex(
        conv => conv.conversationId === data.message.conversationId
      );
      
      if (conversationIndex !== -1) {
        updated[conversationIndex].unreadCount = data.unreadCount;
      }
      
      return updated;
    });
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      console.log('🔌 Setting up Socket.io listeners for chat list');
      
      // Enhanced message_notification handler that also shows desktop notification
      const handleMessageNotificationWithDesktop = (data) => {
        console.log('🔔 message_notification event received:', data);
        handleMessageNotification(data); // Update unread count
        if (data.message) {
          showDesktopNotification(data.message); // Show desktop notification
        }
      };
      
      // Listen for new messages
      socket.on('new_message', handleNewMessage);
      socket.on('message_notification', handleMessageNotificationWithDesktop);

      return () => {
        console.log('🔌 Cleaning up Socket.io listeners for chat list');
        socket.off('new_message');
        socket.off('message_notification');
      };
    } else if (!isConnected && user?.id) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token available for polling');
        return;
      }
      
      console.log('🔌 Socket not connected, starting polling for conversations');
      // Poll for new conversations when Socket.io is not available
      const pollInterval = setInterval(async () => {
        // Check token before each poll
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          console.warn('⚠️ Token expired during polling, stopping');
          clearInterval(pollInterval);
          return;
        }
        
        try {
          const response = await chatService.getConversations(user.id);
          setConversations(response.data.conversations);
        } catch (error) {
          console.error('Error polling for conversations:', error);
          if (error.message.includes('Unauthorized') || 
              error.message.includes('Not authorized') || 
              error.message.includes('no token')) {
            console.warn('⚠️ Authentication failed during polling, stopping');
            clearInterval(pollInterval);
          }
        }
      }, 5000); // Poll every 5 seconds

      return () => {
        console.log('🔌 Stopping conversation polling');
        clearInterval(pollInterval);
      };
    }
  }, [socket, isConnected, user?._id, user?.id, handleNewMessage, handleMessageNotification]);

  const loadConversations = async () => {
    const currentUserId = user?._id || user?.id;
    const token = localStorage.getItem('token');
    
    if (!currentUserId) {
      console.error('User not authenticated - no user ID');
      setLoading(false);
      return;
    }
    
    if (!token) {
      console.error('User not authenticated - no token');
      setLoading(false);
      // Redirect to login if no token
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      const response = await chatService.getConversations(currentUserId);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (error.message.includes('Unauthorized') || 
          error.message.includes('Not authorized') || 
          error.message.includes('no token')) {
        // DON'T automatically logout - let API service handle token refresh
        // Only redirect if user is actually logged out (no stored session)
        console.warn('⚠️ Authentication failed, checking for stored session...');
        const hasStoredUser = localStorage.getItem('user');
        if (!hasStoredUser) {
          // Only redirect if no stored session exists
          console.warn('⚠️ No stored session found, redirecting to login');
          window.location.href = '/login';
        } else {
          console.log('✅ Stored session exists, keeping user logged in');
          // Don't remove token - let API service handle refresh
          // localStorage.removeItem('token'); // REMOVED - don't clear token automatically
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await chatService.searchConversations(query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching conversations:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherUser = (conversation) => {
    console.log('🔍 Getting other user for conversation:', conversation);
    const currentUserId = (user?._id || user?.id)?.toString();
    console.log('👤 Current user ID:', currentUserId);
    console.log('👤 Current user name:', user.name);
    console.log('📤 Sender ID:', conversation.sender?._id);
    console.log('📤 Sender name:', conversation.sender?.name);
    console.log('📥 Receiver ID:', conversation.receiver?._id);
    console.log('📥 Receiver name:', conversation.receiver?.name);
    
    // Convert IDs to strings for comparison
    const senderId = conversation.sender?._id?.toString();
    const receiverId = conversation.receiver?._id?.toString();
    
    console.log('🔄 After conversion:');
    console.log('Current user ID:', currentUserId);
    console.log('Sender ID:', senderId);
    console.log('Receiver ID:', receiverId);
    
    // DIRECT FIX: Always return the user who is NOT the current user
    if (senderId === currentUserId) {
      console.log('✅ Current user is sender, returning receiver:', conversation.receiver);
      return conversation.receiver || { _id: 'unknown', name: 'User' };
    } else if (receiverId === currentUserId) {
      console.log('✅ Current user is receiver, returning sender:', conversation.sender);
      return conversation.sender || { _id: 'unknown', name: 'User' };
    }

    // Fallbacks when one side is missing (deleted user etc.)
    if (conversation.sender?.name) return conversation.sender;
    if (conversation.receiver?.name) return conversation.receiver;
    console.log('⚠️ Both participants missing, returning placeholder user');
    return { _id: 'unknown', name: 'User' };
  };

  const openChat = (conversation) => {
    console.log('🔍 Opening chat for conversation:', conversation);
    console.log('👤 Current user:', user);
    console.log('📤 Conversation sender:', conversation.sender);
    console.log('📥 Conversation receiver:', conversation.receiver);
    
    const otherUser = getOtherUser(conversation);
    console.log('🎯 Other user determined:', otherUser);
    console.log('🚀 Navigating to:', `/chat/${otherUser._id}`);
    
    navigate(`/chat/${otherUser._id}`);
  };

  // Show loading state if auth is loading or conversations are loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated && !authLoading) {
    return null; // Will redirect in useEffect
  }

  const displayData = isSearching ? searchResults : conversations;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Sticky Header with Messages and Search */}
        <div className="sticky top-0 z-10 bg-gray-50 pt-6 pb-4 px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="px-4 pt-4">
          {displayData.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {isSearching ? 'No conversations found' : 'No messages yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isSearching 
                  ? 'Try a different search term'
                  : 'Your conversations with renters and owners will appear here'
                }
              </p>
              {!isSearching && (
                <Button onClick={() => navigate('/listings')}>Browse Listings</Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {displayData.map((conversation) => {
                const otherUser = getOtherUser(conversation) || { _id: 'unknown', name: 'User' };
                const lastMessage = conversation.lastMessage;
                
                return (
                  <Card
                    key={conversation.conversationId}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openChat(conversation)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {(otherUser?.name || 'User').charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {otherUser?.name || 'Unknown User'}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {lastMessage && lastMessage.createdAt ? formatTime(lastMessage.createdAt) : ''}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 truncate">
                          {lastMessage ? lastMessage.content : 'No messages yet'}
                        </p>
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
