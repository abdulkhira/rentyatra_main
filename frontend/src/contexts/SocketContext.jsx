import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const authContext = useAuth();
  
  // Handle case where AuthContext might not be available
  const { user, isAuthenticated } = authContext || { user: null, isAuthenticated: false };

  useEffect(() => {
    const enableSocketIO = true;
    const currentUserId = user?._id || user?.id;
    
    // CRITICAL: Check localStorage for user session even if isAuthenticated is false
    // This prevents socket disconnect during session restore
    const hasStoredUser = localStorage.getItem('user');
    const storedUserId = hasStoredUser ? (() => {
      try {
        const parsed = JSON.parse(hasStoredUser);
        return parsed._id || parsed.id;
      } catch {
        return null;
      }
    })() : null;
    
    // Use stored user ID if current user ID is not available (during session restore)
    const effectiveUserId = currentUserId || storedUserId;
    const effectiveIsAuthenticated = isAuthenticated || (hasStoredUser && effectiveUserId);
    
    if (enableSocketIO && effectiveIsAuthenticated && effectiveUserId) {
      // Enable Socket.io for real-time updates
      console.log('🔌 Connecting to Socket.io for real-time updates...');
      console.log('User ID:', effectiveUserId);
      console.log('Session restore in progress:', !isAuthenticated && hasStoredUser);
      
      // Derive socket URL from API URL if not explicitly set
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
      let socketUrl = import.meta.env.VITE_SOCKET_URL;
      
      if (!socketUrl) {
        // In production/APK, never use localhost
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          // Production - check if API URL is absolute (different domain) or relative (same domain)
          if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
            // Backend is on different domain - extract base URL from API URL
            socketUrl = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
            console.log('🔌 Backend on different domain, using Socket URL from API URL:', socketUrl);
          } else {
            // API URL is relative - backend is on same domain
            socketUrl = window.location.origin;
            console.log('🔌 Backend on same domain, using current origin:', socketUrl);
          }
        } else if (apiUrl.startsWith('/')) {
          // Development with relative API URL
          socketUrl = window.location.origin;
        } else if (apiUrl.startsWith('http://localhost:5000') || apiUrl.startsWith('http://127.0.0.1:5000')) {
          // Development with explicit localhost
          socketUrl = apiUrl.replace('/api', '').replace(/\/$/, '');
        } else {
          // Extract base URL from API URL (remove /api if present)
          socketUrl = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
        }
      }
      console.log('🔌 Attempting to connect to Socket.IO server:', socketUrl);
      console.log('📡 API URL:', apiUrl);
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: false,
        auth: {
          userId: effectiveUserId,
          token: localStorage.getItem('token')
        },
        timeout: 60000, // Increased to match server connectTimeout
        forceNew: false,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        reconnectionAttemptsDelay: 1000, // Time between reconnection attempts
        maxHttpBufferSize: 1e8,
        withCredentials: true,
        extraHeaders: {}
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket.io connected:', newSocket.id);
        setIsConnected(true);
        
        // Join user to their personal room
        newSocket.emit('join_user', effectiveUserId);
        console.log('Joined user room:', effectiveUserId);
        
        // Emit user online status
        newSocket.emit('user_online', { userId: effectiveUserId });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket.io disconnected:', reason);
        setIsConnected(false);
        
        // Log different disconnect reasons for debugging
        if (reason === 'transport close') {
          console.log('⚠️ Transport close - likely temporary (page refresh, network issue, or payment redirect)');
          console.log('💡 Socket will automatically attempt to reconnect');
        } else if (reason === 'ping timeout') {
          console.log('⚠️ Ping timeout - network connectivity issue');
        } else if (reason === 'io client disconnect') {
          console.log('Client-side disconnect - user explicitly disconnected');
          // Only emit offline for explicit client disconnects
          // But check if user is still authenticated before marking offline
          const stillHasUser = localStorage.getItem('user');
          if (!stillHasUser) {
            try {
              newSocket.emit('user_offline', { userId: effectiveUserId });
            } catch (e) {
              console.log('Could not emit offline status (socket already closed)');
            }
          } else {
            console.log('⏳ User session exists, not marking offline (likely page reload)');
          }
        } else {
          console.log('Server-side disconnect - server will handle offline status with grace period');
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error);
        console.error('Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type,
          socket_url: socketUrl,
          transport: newSocket.io?.engine?.transport?.name || 'unknown',
          transportState: newSocket.io?.engine?.readyState || 'unknown'
        });
        setIsConnected(false);
        
        // Provide more helpful error messages
        if (error.message.includes('websocket') || error.message.includes('WebSocket')) {
          console.warn('🔄 WebSocket connection failed, attempting to fallback to polling transport...');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
          console.error('❌ Cannot reach Socket.IO server. Check if backend is running and accessible at:', socketUrl);
        } else if (error.message.includes('timeout')) {
          console.error('⏱️ Connection timeout. The server may be slow or unreachable.');
        } else {
          console.error('❌ Unknown connection error:', error);
        }
        
        // In production, log but don't crash
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          console.warn('ℹ️ Socket connection failed in production - continuing without real-time updates');
          console.warn('💡 Verify:');
          console.warn('   1. Backend server is running and accessible');
          console.warn('   2. WebSocket connections are allowed (firewall/proxy settings)');
          console.warn('   3. CORS is properly configured for Socket.IO');
          console.warn('   4. Socket.IO path is correct (default: /socket.io/)');
        }
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket.io reconnection attempt #${attemptNumber}...`);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('✅ Socket.io reconnected successfully after', attemptNumber, 'attempt(s)');
        setIsConnected(true);
        
        // Immediately rejoin user room and emit online status
        // This cancels any pending offline status on the server
        const reconnectUserId = user?._id || user?.id || effectiveUserId;
        newSocket.emit('join_user', reconnectUserId);
        newSocket.emit('user_online', { userId: reconnectUserId });
        console.log('✅ User room rejoined and online status updated');
      });

      newSocket.on('reconnect_error', (error) => {
        console.log('❌ Socket.io reconnection error:', error);
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Socket.io cleanup - component unmounting');
        // Don't close socket on component unmount if user is still authenticated
        // This allows socket to reconnect when page reloads
        // Only close if explicitly needed (like logout)
        const hasStoredUser = localStorage.getItem('user');
        if (!hasStoredUser) {
          // User is actually logged out, close socket
          console.log('🔌 Closing Socket.io - user logged out');
          newSocket.close();
        } else {
          // User session exists, let socket try to reconnect
          console.log('⏳ Keeping Socket.io connection alive for reconnection');
        }
      };
    } else {
      // Only disconnect if we're sure user is logged out
      // Don't disconnect during initial mount or session restore
      // Check if we have user data in localStorage before disconnecting
      const hasStoredUser = localStorage.getItem('user');
      if (socket && !hasStoredUser) {
        // Only disconnect if there's no stored user (actual logout)
        console.log('🔌 Disconnecting Socket.io - user logged out (no stored session)');
        socket.close();
        setSocket(null);
        setIsConnected(false);
      } else if (socket && !isAuthenticated && hasStoredUser) {
        // User data exists but isAuthenticated is false - likely during session restore
        // Keep socket connected, it will reconnect when session is restored
        console.log('⏳ Socket.io: User session being restored, keeping connection...');
      }
    }
  }, [isAuthenticated, user?._id, user?.id]);

  const joinConversation = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send_message', messageData);
    } else {
      console.warn('Socket not connected, message will be sent via REST API');
    }
  };

  const markMessageAsRead = (messageId, userId) => {
    if (socket && isConnected) {
      socket.emit('mark_message_read', { messageId, userId });
    }
  };

  const startTyping = (conversationId, userId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId, userId });
    }
  };

  const stopTyping = (conversationId, userId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId, userId });
    }
  };

  const listenForTicketUpdates = (callback) => {
    if (socket && isConnected) {
      socket.on('ticketStatusUpdated', callback);
      return () => socket.off('ticketStatusUpdated', callback);
    }
    return () => {};
  };

  const value = {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    listenForTicketUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
