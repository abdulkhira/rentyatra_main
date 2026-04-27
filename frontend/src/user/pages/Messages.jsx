import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ChatList from '../../components/chat/ChatList';
import { MessageCircle } from 'lucide-react';

const Messages = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Swiggy-Themed Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-[#f0f0f5] flex items-center justify-center px-4 pb-20 md:pb-0 font-sans">
        <Card className="p-8 md:p-10 text-center max-w-md w-full rounded-3xl shadow-sm border border-gray-100 bg-white">
          <div className="w-16 h-16 mx-auto mb-5 bg-orange-50 rounded-full flex items-center justify-center">
            <MessageCircle size={32} className="text-[#fc8019]" />
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

  // Authenticated State wrapped in the theme's base container
  return (
    <div className="min-h-screen bg-[#f0f0f5] font-sans pb-20 md:pb-0">
      <div className="max-w-[1200px] mx-auto h-full">
        <ChatList />
      </div>
    </div>
  );
};

export default Messages;