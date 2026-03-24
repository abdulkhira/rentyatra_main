import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Global component to handle chat notifications from anywhere in the app
 * This ensures notifications work even when user is not on chat pages
 */
const GlobalChatNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    if (!socket || !isConnected || !currentUserId) {
      console.log('🔔 GlobalChatNotifications: Socket not ready', {
        hasSocket: !!socket,
        isConnected,
        hasUserId: !!currentUserId,
        socketId: socket?.id
      });
      return;
    }

    console.log('🔔 Setting up global chat notification listener...');
    console.log('🔔 User ID:', currentUserId);
    console.log('🔔 Socket ID:', socket.id);
    console.log('🔔 User should be in room: user_' + currentUserId);

    const handleMessageNotification = (data) => {
      console.log('🔔 Global message_notification received:', data);
      console.log('🔔 Full data structure:', JSON.stringify(data, null, 2));
      
      if (!data || !data.message) {
        console.log('🔔 No message in notification data');
        console.log('🔔 Data keys:', data ? Object.keys(data) : 'no data');
        return;
      }

      const message = data.message;
      const messageReceiverId = message.receiver?._id?.toString() || message.receiver?.toString();
      const messageSenderId = message.sender?._id?.toString() || message.sender?.toString();
      const currentUserIdStr = currentUserId?.toString();

      console.log('🔔 Message notification check:', {
        messageReceiverId,
        messageSenderId,
        currentUserIdStr,
        isForCurrentUser: messageReceiverId === currentUserIdStr,
        isFromCurrentUser: messageSenderId === currentUserIdStr,
        shouldNotify: messageReceiverId === currentUserIdStr && messageSenderId !== currentUserIdStr
      });

      // Only show notification if message is for current user AND not sent by current user
      if (messageReceiverId !== currentUserIdStr) {
        console.log('🔔 Notification skipped - message not for current user');
        return;
      }
      
      if (messageSenderId === currentUserIdStr) {
        console.log('🔔 Notification skipped - message sent by current user');
        return;
      }

      // Check if notifications are supported
      if (typeof Notification === 'undefined') {
        console.log('🔔 Desktop notifications not supported');
        return;
      }

      // Request permission if needed
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission);
          if (permission === 'granted') {
            // Retry showing notification
            showNotification(message);
          }
        });
        return;
      }

      if (Notification.permission !== 'granted') {
        console.log('🔔 Notification permission not granted:', Notification.permission);
        return;
      }

      // Always show notification for new messages (user might be on different page)
      showNotification(message);
    };

    const showNotification = (message) => {
      const senderName = message.sender?.name || 'Someone';
      const messageContent = message.content || 'New message';
      const truncatedContent = messageContent.length > 50 
        ? messageContent.substring(0, 50) + '...' 
        : messageContent;

      try {
        console.log('🔔 Creating desktop notification:', senderName);
        const notification = new Notification(`${senderName} sent a message`, {
          body: truncatedContent,
          icon: message.sender?.profilePicture || '/favicon.png',
          badge: '/favicon.png',
          tag: `chat_${message.conversationId}`,
          requireInteraction: false,
          silent: false
        });

        // Handle notification click
        notification.onclick = () => {
          console.log('🔔 Notification clicked, navigating to chat');
          window.focus();
          navigate(`/chat/${message.sender._id}`);
          notification.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        console.log('✅ Desktop notification shown successfully');
      } catch (error) {
        console.error('❌ Error showing desktop notification:', error);
      }
    };

    // Listen for message_notification event
    socket.on('message_notification', handleMessageNotification);

    return () => {
      console.log('🔔 Cleaning up global chat notification listener');
      socket.off('message_notification', handleMessageNotification);
    };
  }, [socket, isConnected, currentUserId, navigate]);

  return null; // This component doesn't render anything
};

export default GlobalChatNotifications;

