const admin = require('firebase-admin');
const User = require('../models/User');

// Ensure Firebase Admin is initialized by requiring the service
// This will trigger the initialization if not already done
require('../services/firebaseAdmin');

// @desc    Send notification to a device
// @route   POST /api/notifications/send-notification
// @access  Public/Private (adjust based on your needs)
const sendNotification = async (req, res) => {
  try {
    const { token, title, body } = req.body;

    // Validate required fields
    if (!token || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'token, title, and body are required!',
      });
    }

    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin not initialized. Please check Firebase credentials.');
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin is not initialized. Please check server configuration.',
        error: {
          code: 'firebase/not-initialized',
          message: 'Firebase Admin SDK not properly initialized. Check Firebase credentials and server time sync.'
        }
      });
    }

    // Create message payload
    const message = {
      token,
      notification: {
        title,
        body,
      },
    };

    // Send notification
    const response = await admin.messaging().send(message);
    
    console.log('✅ Successfully sent notification:', response);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully!',
      response,
    });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific Firebase errors
    let errorMessage = 'Error sending notification';
    let statusCode = 500;
    
    if (error.code === 'app/invalid-credential') {
      errorMessage = 'Firebase credentials are invalid or expired. Please check Firebase service account configuration.';
      statusCode = 500;
    } else if (error.code === 'messaging/invalid-registration-token') {
      errorMessage = 'Invalid FCM token. Please check the token.';
      statusCode = 400;
    } else if (error.code === 'messaging/registration-token-not-registered') {
      errorMessage = 'Token is not registered. User may have uninstalled the app.';
      statusCode = 400;
    } else if (error.code === 'messaging/invalid-argument') {
      errorMessage = 'Invalid notification payload. Please check title and body.';
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          hint: error.code === 'app/invalid-credential' 
            ? 'Check: 1) Server time sync, 2) Firebase service account key validity, 3) Key ID in Firebase Console'
            : undefined
        }),
      },
    });
  }
};

// @desc    Update FCM token for notifications
// @route   PUT /api/notifications/update-token
// @access  Private
const updateNotificationToken = async (req, res) => {
  try {
    const { oldToken, newToken, platform } = req.body;
    const userId = req.user?.userId || req.user?._id;

    // Validate required fields
    if (!newToken || typeof newToken !== 'string' || newToken.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'New token is required and must be a valid string',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('🔄 Updating FCM token:', {
      userId,
      hasOldToken: !!oldToken,
      platform: platform || 'unknown',
    });

    const MAX_TOKENS = 10; // Maximum tokens per user

    // Determine which token array to update based on platform
    let tokenArray = platform === 'mobile' ? user.fcmTokenMobile : user.fcmTokens;
    
    // Initialize array if it doesn't exist
    if (!tokenArray || !Array.isArray(tokenArray)) {
      tokenArray = [];
      if (platform === 'mobile') {
        user.fcmTokenMobile = [];
      } else {
        user.fcmTokens = [];
      }
    }

    // If oldToken is provided, remove it first
    if (oldToken) {
      if (platform === 'mobile') {
        user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== oldToken);
      } else {
        user.fcmTokens = user.fcmTokens.filter(t => t !== oldToken);
      }
      console.log('🗑️ Removed old token');
    }

    // Check if new token already exists
    const currentArray = platform === 'mobile' ? user.fcmTokenMobile : user.fcmTokens;
    const tokenExists = currentArray.includes(newToken);

    if (tokenExists) {
      console.log('ℹ️ New token already exists in database');
      return res.status(200).json({
        success: true,
        message: 'Token already exists in database',
        updated: false,
        tokenCount: currentArray.length,
        platform: platform || 'web',
      });
    }

    // Add new token
    if (platform === 'mobile') {
      // Remove oldest token if limit reached
      if (user.fcmTokenMobile.length >= MAX_TOKENS) {
        user.fcmTokenMobile.shift();
      }
      user.fcmTokenMobile.push(newToken);
    } else {
      // Remove oldest token if limit reached
      if (user.fcmTokens.length >= MAX_TOKENS) {
        user.fcmTokens.shift();
      }
      user.fcmTokens.push(newToken);
    }

    // Mark the field as modified
    if (platform === 'mobile') {
      user.markModified('fcmTokenMobile');
    } else {
      user.markModified('fcmTokens');
    }

    await user.save();

    const updatedArray = platform === 'mobile' ? user.fcmTokenMobile : user.fcmTokens;

    console.log('✅ FCM token updated successfully:', {
      platform: platform || 'web',
      tokenCount: updatedArray.length,
    });

    res.status(200).json({
      success: true,
      message: 'FCM token updated successfully',
      data: {
        platform: platform || 'web',
        tokenCount: updatedArray.length,
        maxTokens: MAX_TOKENS,
      },
    });
  } catch (error) {
    console.error('❌ Error updating FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
      error: {
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
    });
  }
};

module.exports = {
  sendNotification,
  updateNotificationToken,
};

