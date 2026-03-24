const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserConversations,
  getConversation,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
  searchConversations
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// Get user's conversations
router.get('/conversations/:userId', getUserConversations);

// Get conversation between two users
router.get('/conversation/:userId1/:userId2', getConversation);

// Send a message
router.post('/send', sendMessage);

// Mark message as read
router.patch('/message/:messageId/read', markMessageAsRead);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Search conversations
router.get('/search', searchConversations);

module.exports = router;
