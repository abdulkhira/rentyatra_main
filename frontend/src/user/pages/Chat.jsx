import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ChatWindow from '../../components/chat/ChatWindow';
import { messaging, getToken, onMessage } from '../../firebase';
import api from '../../services/api';
import { MessageSquare } from 'lucide-react';

const Chat = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Register notifications hooks unconditionally; guard with isAuthenticated inside
  useEffect(() => {
    if (!isAuthenticated) return;

    const registerFcmToken = async () => {
      try {
        if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

        // Request notification permission for desktop notifications
        let permission = Notification.permission;
        console.log('🔔 Current notification permission:', permission);

        if (permission === 'default') {
          console.log('🔔 Requesting notification permission...');
          permission = await Notification.requestPermission();
          console.log('🔔 Notification permission result:', permission);
        }

        if (permission === 'granted') {
          console.log('✅ Notification permission granted - desktop notifications enabled');

          // Test notification to verify it works
          try {
            const testNotification = new Notification('Notifications enabled', {
              body: 'You will receive desktop notifications for new messages',
              icon: '/favicon.png',
              tag: 'test',
              silent: false
            });
            setTimeout(() => testNotification.close(), 3000);
            console.log('✅ Test notification shown successfully');
          } catch (error) {
            console.error('❌ Error showing test notification:', error);
          }

          // Ensure the service worker is registered and ready
          const swRegistration = await navigator.serviceWorker.ready;
          const token = await getToken(messaging, {
            vapidKey: 'BAXnzclIUpol3ExXQV8JokW7plpWqSJhLIFrXlnNHueIylJFuC3TQ17wWRIspB4IOmi-NffJuWq2mz9C6sC1YlQ',
            serviceWorkerRegistration: swRegistration,
          });
          if (token) {
            await api.post('/users/save-fcm-token', { token });
            console.log('Token registered:', token);
          }
        } else if (permission === 'denied') {
          console.warn('⚠️ Notification permission denied');
        }
      } catch (error) {
        console.error('FCM registration failed', error);
      }
    };

    registerFcmToken();

    let unsubscribe = null;
    try {
      unsubscribe = onMessage(messaging, (payload) => {
        try {
          if (payload?.notification?.title && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(payload.notification.title, {
              body: payload.notification.body,
            });
          }
        } catch (err) {
          console.error('Foreground notification error', err);
        }
      });
    } catch (err) {
      console.error('onMessage registration error', err);
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAuthenticated]);

  // Swiggy-themed Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-[#f0f0f5] flex items-center justify-center px-4 pb-20 md:pb-0 font-sans">
        <Card className="p-8 md:p-10 text-center max-w-md w-full rounded-3xl shadow-sm border border-gray-100 bg-white">
          <div className="w-16 h-16 mx-auto mb-5 bg-orange-50 rounded-full flex items-center justify-center">
            <MessageSquare size={32} className="text-[#fc8019]" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">Login Required</h2>
          <p className="text-gray-500 mb-8 font-medium">Please login to view and reply to your messages</p>
          <Button
            onClick={() => navigate('/login')}
            className="w-full bg-[#fc8019] hover:bg-orange-600 border-none rounded-xl font-bold py-3 text-base text-white shadow-sm transition-colors"
          >
            Login to Continue
          </Button>
        </Card>
      </div>
    );
  }

  // Authenticated State
  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20 md:pb-0">
      <div className="max-w-[1200px] mx-auto h-full">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Chat;