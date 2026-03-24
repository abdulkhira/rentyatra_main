import api from './api';

const chatService = {
  // Get user's conversations
  getConversations: async (userId, page = 1, limit = 20) => {
    const response = await api.get(`/chat/conversations/${userId}?page=${page}&limit=${limit}`);
    return response;
  },

  // Get conversation between two users
  getConversation: async (userId1, userId2, page = 1, limit = 50) => {
    const response = await api.get(`/chat/conversation/${userId1}/${userId2}?page=${page}&limit=${limit}`);
    return response;
  },

  // Send a message (REST API fallback)
  sendMessage: async (messageData) => {
    const response = await api.post('/chat/send', messageData);
    return response;
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    const response = await api.patch(`/chat/message/${messageId}/read`);
    return response;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/chat/unread-count');
    return response;
  },

  // Search conversations
  searchConversations: async (query) => {
    const response = await api.get(`/chat/search?query=${encodeURIComponent(query)}`);
    return response;
  }
};

export default chatService;
