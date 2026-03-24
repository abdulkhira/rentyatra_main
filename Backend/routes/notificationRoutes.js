const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendNotification, updateNotificationToken } = require('../controllers/notificationController');

// @route   POST /api/notifications/send-notification
// @desc    Send push notification to a device
// @access  Public (adjust middleware as needed)
router.post('/send-notification', sendNotification);

// @route   PUT /api/notifications/update-token
// @desc    Update FCM token for notifications
// @access  Private
router.put('/update-token', protect, updateNotificationToken);

module.exports = router;

