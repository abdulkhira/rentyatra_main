import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, HandCoins } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import chatService from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ChatWindow = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  
  // Add error handling for useSocket
  let socketContext;
  try {
    socketContext = useSocket();
  } catch (error) {
    console.error('Socket context not available:', error);
    socketContext = { 
      socket: null, 
      isConnected: false, 
      joinConversation: () => {}, 
      leaveConversation: () => {}, 
      sendMessage: () => {}, 
      markMessageAsRead: () => {}, 
      startTyping: () => {}, 
      stopTyping: () => {} 
    };
  }
  
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage, markMessageAsRead, startTyping, stopTyping } = socketContext;
  
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const handlersRef = useRef({});

  useEffect(() => {
    if (user && userId) {
      console.log('ChatWindow: User authenticated, loading conversation');
      console.log('Current user ID:', currentUserId);
      console.log('Other user ID (from URL):', userId);
      loadConversation();
    } else {
      console.log('ChatWindow: User not authenticated or no userId');
      if (!user) {
        console.log('ChatWindow: No user found, redirecting to login');
        navigate('/login');
      }
    }
  }, [user, userId]);

  useEffect(() => {
    if (socket && isConnected && conversationId) {
      console.log('🔌 Setting up Socket.io listeners for conversation:', conversationId);
      joinConversation(conversationId);
      
      // Define handlers inline to avoid dependency issues
      const handleNewMessage = (message) => {
        console.log('📨 New message received:', message);
        console.log('Current conversation ID:', conversationId);
        console.log('Message conversation ID:', message.conversationId);
        
        if (message.conversationId === conversationId) {
          console.log('✅ Message belongs to current conversation, adding to UI');
          
          // Remove any temporary messages with the same content
          setMessages(prev => {
            const filtered = prev.filter(msg => 
              !(msg._id.startsWith('temp_') && msg.content === message.content)
            );
            return [...filtered, message];
          });
          
          // Mark as read if it's for current user
          if (message.receiver._id === currentUserId) {
            console.log('📖 Marking message as read');
            markMessageAsRead(message._id, currentUserId);
          }
        } else {
          console.log('❌ Message does not belong to current conversation');
        }
        
        // Show desktop notification if message is for current user (not sent by current user)
        const messageReceiverId = message.receiver?._id?.toString() || message.receiver?.toString();
        const messageSenderId = message.sender?._id?.toString() || message.sender?.toString();
        const currentUserIdStr = currentUserId?.toString();
        
        console.log('🔔 Notification check:', {
          messageReceiverId,
          messageSenderId,
          currentUserIdStr,
          isForCurrentUser: messageReceiverId === currentUserIdStr,
          isFromCurrentUser: messageSenderId === currentUserIdStr,
          shouldNotify: messageReceiverId === currentUserIdStr && messageSenderId !== currentUserIdStr
        });
        
        // Show notification if message is for current user AND not sent by current user
        if (messageReceiverId === currentUserIdStr && messageSenderId !== currentUserIdStr) {
          const isWindowFocused = document.hasFocus();
          const isCurrentConversation = message.conversationId === conversationId;
          
          console.log('🔔 Notification conditions:', {
            isWindowFocused,
            isCurrentConversation,
            willShow: !isWindowFocused || !isCurrentConversation
          });
          
          // Show notification if:
          // 1. Window is not focused, OR
          // 2. It's not the current conversation (user is chatting with someone else)
          if (!isWindowFocused || !isCurrentConversation) {
            console.log('🔔 Triggering desktop notification...');
            showDesktopNotification(message);
          } else {
            console.log('🔔 Notification skipped - user is viewing this conversation and window is focused');
          }
        } else {
          console.log('🔔 Notification skipped - message not for current user or sent by current user');
        }
      };
      
      // Helper function to show desktop notification
      const showDesktopNotification = (message) => {
        console.log('🔔 Attempting to show desktop notification:', {
          messageId: message._id,
          sender: message.sender?.name,
          conversationId: message.conversationId,
          currentConversationId: conversationId,
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
          console.log('💡 User needs to grant notification permission in browser settings');
          return;
        }
        
        // Don't show notification if user is viewing the same conversation and window is focused
        if (message.conversationId === conversationId && document.hasFocus()) {
          console.log('🔔 Skipping notification - user is viewing this conversation');
          return;
        }
        
        const senderName = message.sender?.name || 'Someone';
        const messageContent = message.content || 'New message';
        const truncatedContent = messageContent.length > 50 
          ? messageContent.substring(0, 50) + '...' 
          : messageContent;
        
        try {
          console.log('🔔 Creating desktop notification...');
          const notification = new Notification(`${senderName} sent a message`, {
            body: truncatedContent,
            icon: message.sender?.profilePicture || '/favicon.png',
            badge: '/favicon.png',
            tag: `chat_${message.conversationId}`,
            requireInteraction: false,
            silent: false
          });
          
          // Handle notification click - focus/redirect to chat
          notification.onclick = () => {
            console.log('🔔 Notification clicked, navigating to chat');
            window.focus();
            // Navigate to the chat if not already there
            if (message.conversationId !== conversationId) {
              navigate(`/chat/${message.sender._id}`);
            }
            notification.close();
          };
          
          // Auto-close notification after 5 seconds
          setTimeout(() => {
            notification.close();
          }, 5000);
          
          console.log('✅ Desktop notification shown successfully:', senderName);
        } catch (error) {
          console.error('❌ Error showing desktop notification:', error);
        }
      };

      const handleUserTyping = (data) => {
        if (data.userId !== currentUserId) {
          setOtherUserTyping(data.isTyping);
        }
      };

      const handleMessageRead = (data) => {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, isRead: true, readAt: data.readAt }
              : msg
          )
        );
      };

      
      // Listen for new messages
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('message_read', handleMessageRead);
      socket.on('message_error', (error) => {
        console.error('Socket message error:', error);
        alert('Failed to send message. Please try again.');
      });
      
      // Also listen to message_notification for notifications
      socket.on('message_notification', (data) => {
        console.log('🔔 message_notification event received in ChatWindow:', data);
        if (data.message) {
          const messageReceiverId = data.message.receiver?._id?.toString() || data.message.receiver?.toString();
          const currentUserIdStr = currentUserId?.toString();
          
          // Only show notification if message is for current user
          if (messageReceiverId === currentUserIdStr) {
            const isWindowFocused = document.hasFocus();
            const isCurrentConversation = data.message.conversationId === conversationId;
            
            // Show notification if window not focused or different conversation
            if (!isWindowFocused || !isCurrentConversation) {
              showDesktopNotification(data.message);
            }
          }
        }
      });

      return () => {
        console.log('🔌 Cleaning up Socket.io listeners');
        leaveConversation(conversationId);
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('message_read');
        socket.off('message_error');
        socket.off('message_notification');
      };
    } else if (!isConnected && conversationId) {
      console.log('🔌 Socket not connected, starting polling for messages');
      // Poll for new messages when Socket.io is not available
      const pollForMessages = async () => {
        try {
          const response = await chatService.getConversation(currentUserId, userId, 1, 50);
          const newMessages = response.data.messages;
          
          // Check if there are new messages
          setMessages(prev => {
            if (newMessages.length > prev.length) {
              console.log('📨 New messages found via polling:', newMessages.length - prev.length);
              return newMessages;
            }
            return prev;
          });
        } catch (error) {
          console.error('Error polling for messages:', error);
        }
      };
      
      const pollInterval = setInterval(pollForMessages, 3000); // Poll every 3 seconds

      return () => {
        console.log('🔌 Stopping message polling');
        clearInterval(pollInterval);
      };
    }
  }, [socket, isConnected, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    if (!user || !currentUserId) {
      console.error('User not authenticated');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading conversation between:', user.id, 'and', userId);
      const response = await chatService.getConversation(currentUserId, userId);
      console.log('📨 API Response:', response.data);
      console.log('👤 Other User from API:', response.data.otherUser);
      console.log('👤 Current User:', user);
      
      setMessages(response.data.messages);
      console.log('🔧 Setting otherUser:', response.data.otherUser);
      console.log('🔧 Current user:', user);
      console.log('🔧 Expected: otherUser should be different from current user');
      
      // VERIFICATION: Check if otherUser is actually different from current user
      if (response.data.otherUser && response.data.otherUser._id === currentUserId) {
        console.log('❌ BUG DETECTED: otherUser is same as current user!');
        console.log('🔧 This means backend is returning wrong otherUser');
        
        // FALLBACK: If backend returns wrong user, we need to find the correct one
        console.log('🔧 Attempting to find correct other user from messages...');
        
        // Look at the messages to find the other participant
        const messages = response.data.messages || [];
        let correctOtherUser = null;
        
        for (const message of messages) {
          if (message.sender && message.sender._id !== currentUserId) {
            correctOtherUser = message.sender;
            break;
          }
          if (message.receiver && message.receiver._id !== currentUserId) {
            correctOtherUser = message.receiver;
            break;
          }
        }
        
        if (correctOtherUser) {
          console.log('✅ Found correct other user from messages:', correctOtherUser);
          setOtherUser(correctOtherUser);
        } else {
          console.log('❌ Could not find correct other user, using fallback');
          setOtherUser(response.data.otherUser);
        }
      } else {
        console.log('✅ otherUser is different from current user - this is correct');
        setOtherUser(response.data.otherUser);
      }
      
      setConversationId(response.data.conversationId);
      
      // Force refresh to clear any cached references
      console.log('✅ Conversation loaded successfully');
    } catch (error) {
      console.error('Error loading conversation:', error);
      if (error.message.includes('Unauthorized')) {
        navigate('/login');
      } else {
        navigate('/messages');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageData = {
      senderId: currentUserId,
      receiverId: userId,
      content: newMessage.trim()
    };

    try {
      setSending(true);
      
      // Send via Socket.io for real-time
      if (socket && isConnected) {
        console.log('📤 Sending message via Socket.io:', messageData);
        sendMessage(messageData);
        
        // Optimistically add message to UI (will be replaced by server response)
        const optimisticMessage = {
          _id: `temp_${Date.now()}`,
          sender: { _id: currentUserId, name: user.name },
          receiver: { _id: userId, name: otherUser?.name },
          content: newMessage.trim(),
          createdAt: new Date(),
          isRead: false,
          conversationId: conversationId
        };
        setMessages(prev => [...prev, optimisticMessage]);
      } else {
        // Fallback to REST API
        console.log('📤 Socket not connected, using REST API fallback');
        const response = await chatService.sendMessage(messageData);
        // Add the message to the local state since it won't come through socket
        setMessages(prev => [...prev, response.data]);
      }
      
      setNewMessage('');
      stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (conversationId) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(conversationId, currentUserId);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(conversationId, currentUserId);
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMakeOffer = () => {
    setShowOfferModal(true);
  };

  const handleSendOffer = async () => {
    if (!offerAmount.trim() || sending) return;

    const offerMessage = `💰 Offer: ₹${offerAmount}`;
    
    const messageData = {
      senderId: currentUserId,
      receiverId: userId,
      content: offerMessage,
      type: 'offer',
      amount: parseFloat(offerAmount)
    };

    try {
      setSending(true);
      
      // Send via Socket.io for real-time
      if (socket && isConnected) {
        console.log('📤 Sending offer via Socket.io:', messageData);
        sendMessage(messageData);
        
        // Optimistically add message to UI
        const optimisticMessage = {
          _id: `temp_${Date.now()}`,
          sender: { _id: currentUserId, name: user.name },
          receiver: { _id: userId, name: otherUser?.name },
          content: offerMessage,
          type: 'offer',
          amount: parseFloat(offerAmount),
          createdAt: new Date(),
          isRead: false,
          conversationId: conversationId
        };
        setMessages(prev => [...prev, optimisticMessage]);
      } else {
        // Fallback to REST API
        console.log('📤 Socket not connected, using REST API fallback for offer');
        const response = await chatService.sendMessage(messageData);
        setMessages(prev => [...prev, response.data]);
      }
      
      setOfferAmount('');
      setShowOfferModal(false);
      stopTyping();
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">User not found</h2>
          <Button onClick={() => navigate('/messages')}>Back to Messages</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/messages')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{otherUser.name}</h2>
              {otherUserTyping && (
                <span className="text-xs text-blue-500 italic">
                  typing...
                </span>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((message) => {
          const isOwn = message.sender._id === currentUserId;
          const isOffer = message.type === 'offer' || message.content.includes('💰 Offer:');
          
          return (
            <div
              key={message._id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOffer
                    ? isOwn
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-800 border border-green-200'
                    : isOwn
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className={`flex items-center justify-between mt-1 text-xs ${
                  isOffer
                    ? isOwn ? 'text-green-100' : 'text-green-600'
                    : isOwn ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span>{formatTime(message.createdAt)}</span>
                  {isOwn && (
                    <span className="ml-2">
                      {message.isRead ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <>
        {/* Background extension below input */}
        <div className="fixed bottom-0 left-0 right-0 z-10 h-10 bg-white rounded-t-2xl"></div>
        <div className="fixed bottom-10 left-0 right-0 z-20 bg-white border-t border-gray-200 p-4 shadow-lg rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              onClick={handleMakeOffer}
              disabled={sending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Make an Offer"
            >
              <HandCoins className="w-5 h-5" />
            </button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        </div>
      </>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Make an Offer</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Amount (₹)
              </label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowOfferModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendOffer}
                disabled={!offerAmount.trim() || sending}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {sending ? 'Sending...' : 'Send Offer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
