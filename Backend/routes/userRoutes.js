const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  updateUserPreferences,
  deactivateAccount,
  reactivateAccount,
  changePhoneNumber,
  getUserActivity,
  exportUserData
} = require('../controllers/userController');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateUserProfile);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', protect, getUserStats);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, updateUserPreferences);

// @route   PUT /api/users/deactivate
// @desc    Deactivate user account
// @access  Private
router.put('/deactivate', protect, deactivateAccount);

// @route   PUT /api/users/reactivate
// @desc    Reactivate user account
// @access  Private
router.put('/reactivate', protect, reactivateAccount);

// @route   POST /api/users/change-phone
// @desc    Change phone number
// @access  Private
router.post('/change-phone', protect, changePhoneNumber);

// @route   GET /api/users/activity
// @desc    Get user activity log
// @access  Private
router.get('/activity', protect, getUserActivity);

// @route   GET /api/users/export
// @desc    Export user data
// @access  Private
router.get('/export', protect, exportUserData);

// @route   POST /api/users/save-fcm-token
// @desc    Save FCM token for push notifications (Web & Mobile/APK)
// @access  Private
// @body    { token: string, platform?: 'web' | 'mobile' }
router.post('/save-fcm-token', protect, asyncHandler(async (req, res) => {
  // Check MongoDB connection before proceeding
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected, cannot save FCM token');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again later.',
      error: 'MongoDB connection not established'
    });
  }

  try {
    console.log('=== FCM TOKEN SAVE REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.userId);
    console.log('User Agent:', req.headers['user-agent'] || 'Unknown');
    console.log('Request from:', req.headers['origin'] || req.headers['referer'] || 'Unknown');
    
    const { token, platform } = req.body;
    
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.log('❌ Invalid token provided');
      return res.status(400).json({ 
        success: false,
        message: 'Token missing or invalid' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('❌ User not found:', req.user.userId);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('📊 Current FCM tokens before update:', user.fcmTokens);
    console.log('🆕 New FCM token:', token.substring(0, 30) + '...');
    console.log('📱 Platform:', platform || 'unknown');

    // Initialize fcmTokens array if it doesn't exist
    if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
      user.fcmTokens = [];
    }

    const oldTokens = [...user.fcmTokens]; // Copy for comparison
    const MAX_TOKENS = 10; // Maximum tokens per user (10 devices)
    
    // Check if token already exists
    const tokenExists = user.fcmTokens.includes(token);
    
    if (tokenExists) {
      console.log('ℹ️ FCM token already exists in database');
      const verifiedUser = await User.findById(req.user.userId).select('fcmTokens');
      console.log('✅ Verification check - tokens in DB:', verifiedUser.fcmTokens);
      console.log('✅ Token confirmed in database');
      
      return res.json({ 
        success: true,
        message: 'Token already exists in database',
        updated: false,
        tokenCount: verifiedUser.fcmTokens.length,
        tokenInDatabase: true,
        platform: platform || 'unknown'
      });
    }

    // Token doesn't exist - add it to the array
    console.log('🆕 New token detected for this device, adding to tokens array...');
    console.log(`📱 Platform: ${platform || 'unknown'}`);
    
    // Remove old/invalid tokens if we're at the limit
    if (user.fcmTokens.length >= MAX_TOKENS) {
      console.log(`⚠️ Token limit reached (${MAX_TOKENS}), removing oldest token...`);
      user.fcmTokens.shift();
    }
    
    // Add new token to the array
    user.fcmTokens.push(token);
    console.log(`📱 Added new token. Total tokens: ${user.fcmTokens.length}/${MAX_TOKENS}`);
    
    console.log('💾 Saving FCM tokens to database...');
    await user.save();
    console.log('✅ FCM tokens saved successfully');
    console.log('📊 Updated FCM tokens array:', user.fcmTokens);

    // Verify the save by fetching fresh from database
    const updatedUser = await User.findById(req.user.userId).select('fcmTokens');
    if (!updatedUser || !updatedUser.fcmTokens.includes(token)) {
      console.error('❌ Token save verification failed! Token not found in database after save');
      if (!updatedUser.fcmTokens.includes(token)) {
        if (updatedUser.fcmTokens.length >= MAX_TOKENS) {
          updatedUser.fcmTokens.shift();
        }
        updatedUser.fcmTokens.push(token);
        await updatedUser.save();
        console.log('🔄 Retried saving token');
      }
    } else {
      console.log('✅ Verified saved tokens:', updatedUser.fcmTokens);
      console.log(`✅ Total devices registered: ${updatedUser.fcmTokens.length}`);
    }

    return res.json({ 
      success: true,
      message: 'FCM token saved successfully for this device',
      updated: true,
      tokenCount: user.fcmTokens.length,
      previousTokenCount: oldTokens.length,
      maxTokens: MAX_TOKENS,
      devicesRegistered: user.fcmTokens.length,
      platform: platform || 'unknown'
    });
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      success: false,
      message: 'Failed to save FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

// @route   POST /api/users/save-fcm-token-mobile
// @desc    Save FCM token for APK/Mobile (works with phone number, no login required)
// @access  Public (but requires phone number)
// @body    { token: string, phone: string, platform?: 'mobile' | 'android' | 'ios' }
router.post('/save-fcm-token-mobile', asyncHandler(async (req, res) => {
  // Check MongoDB connection before proceeding
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected, cannot save FCM token');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again later.',
      error: 'MongoDB connection not established'
    });
  }

  try {
    console.log('=== MOBILE FCM TOKEN SAVE REQUEST ===');
    console.log('Request body:', { ...req.body, token: req.body.token ? req.body.token.substring(0, 30) + '...' : 'missing' });
    console.log('User Agent:', req.headers['user-agent'] || 'Unknown');
    
    const { token, phone, platform = 'mobile' } = req.body;
    
    // Validate token
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'FCM token is required' 
      });
    }

    // Validate phone number
    if (!phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }

    // Clean and format phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid 10-digit Indian phone number' 
      });
    }

    // Find user by phone number
    const formattedPhone = `+91${cleanPhone}`;
    const user = await User.findOne({ phone: formattedPhone });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found with this phone number. Please register first.' 
      });
    }

    // Ensure fcmTokenMobile field exists (for existing users who might not have this field)
    if (!user.fcmTokenMobile || !Array.isArray(user.fcmTokenMobile)) {
      user.fcmTokenMobile = [];
    }

    console.log('📊 Current FCM tokens before update:', {
      webTokens: user.fcmTokens?.length || 0,
      mobileTokens: user.fcmTokenMobile?.length || 0,
      mobileTokensArray: user.fcmTokenMobile
    });
    console.log('🆕 New FCM token:', token.substring(0, 30) + '...');
    console.log('📱 Platform:', platform);

    const oldTokens = [...user.fcmTokenMobile];
    const MAX_TOKENS = 10;
    
    // Check if token already exists in fcmTokenMobile (case-sensitive exact match)
    const tokenExists = user.fcmTokenMobile.some(existingToken => existingToken === token);
    
    if (tokenExists) {
      console.log('ℹ️ FCM token already exists in fcmTokenMobile database');
      console.log('📊 Current fcmTokenMobile array:', user.fcmTokenMobile);
      return res.json({ 
        success: true,
        message: 'Token already exists in database',
        updated: false,
        tokenCount: user.fcmTokenMobile.length,
        tokenInDatabase: true,
        platform: platform
      });
    }

    // Also check if token exists in old fcmTokens array (for migration)
    // If found there, move it to fcmTokenMobile
    const tokenInOldArray = user.fcmTokens && user.fcmTokens.includes(token);
    if (tokenInOldArray) {
      console.log('🔄 Token found in old fcmTokens array, moving to fcmTokenMobile...');
      user.fcmTokens = user.fcmTokens.filter(t => t !== token);
    }

    // Add new token to fcmTokenMobile
    console.log('🆕 New mobile token detected, adding to fcmTokenMobile array...');
    
    if (user.fcmTokenMobile.length >= MAX_TOKENS) {
      console.log(`⚠️ Token limit reached (${MAX_TOKENS}), removing oldest token...`);
      user.fcmTokenMobile.shift();
    }
    
    user.fcmTokenMobile.push(token);
    console.log(`📱 Added new mobile token to fcmTokenMobile. Total mobile tokens: ${user.fcmTokenMobile.length}/${MAX_TOKENS}`);
    
    // Mark fcmTokenMobile as modified to ensure save
    user.markModified('fcmTokenMobile');
    await user.save();
    
    // Verify the save by fetching fresh from database
    const updatedUser = await User.findById(user._id).select('fcmTokenMobile');
    console.log('✅ Verification - fcmTokenMobile in database:', updatedUser.fcmTokenMobile);
    console.log('✅ Mobile FCM token saved successfully to fcmTokenMobile');

    return res.json({ 
      success: true,
      message: 'FCM token saved successfully for mobile device',
      updated: true,
      tokenCount: user.fcmTokenMobile.length,
      previousTokenCount: oldTokens.length,
      maxTokens: MAX_TOKENS,
      devicesRegistered: user.fcmTokenMobile.length,
      platform: platform
    });
  } catch (error) {
    console.error('❌ Error saving mobile FCM token:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to save FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

// @route   DELETE /api/users/remove-fcm-token
// @desc    Remove FCM token (for logout or app uninstall)
// @access  Private
// @body    { token: string }
router.delete('/remove-fcm-token', protect, asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Token is required' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!user.fcmTokens || !Array.isArray(user.fcmTokens)) {
      return res.json({ 
        success: true,
        message: 'No tokens to remove',
        tokenCount: 0
      });
    }

    const initialCount = user.fcmTokens.length;
    user.fcmTokens = user.fcmTokens.filter(t => t !== token);
    const removed = initialCount > user.fcmTokens.length;

    if (removed) {
      await user.save();
      console.log(`✅ FCM token removed. Remaining tokens: ${user.fcmTokens.length}`);
    }

    return res.json({ 
      success: true,
      message: removed ? 'FCM token removed successfully' : 'Token not found in database',
      tokenRemoved: removed,
      tokenCount: user.fcmTokens.length,
      previousTokenCount: initialCount
    });
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to remove FCM token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

module.exports = router;
