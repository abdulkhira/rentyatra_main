const { sendPushNotification } = require('../services/firebaseAdmin');
const User = require('../models/User');

// In-memory cache to prevent duplicate notifications for same message
// Stores cacheKey and timestamp, expires after 10 seconds
const notificationCache = new Map();

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [cacheKey, timestamp] of notificationCache.entries()) {
    if (now - timestamp > 10000) { // 10 seconds expiry
      notificationCache.delete(cacheKey);
    }
  }
}, 10000); // Clean every 10 seconds

async function handleNewMessage(savedMessage) {
  try {
    const receiverId = savedMessage.receiver || savedMessage.receiverId;
    if (!receiverId) return;

    const messageId = savedMessage._id?.toString();
    const senderId = savedMessage.sender?._id?.toString() || savedMessage.sender?.toString() || '';
    const content = savedMessage.content || savedMessage.text || '';
    const conversationId = savedMessage.conversationId?.toString() || null;
    
    // Create a unique key for duplicate prevention
    // Priority: messageId > receiverId + senderId + contentHash
    let cacheKey;
    if (messageId) {
      cacheKey = `msg_${messageId}`;
    } else {
      // Fallback: use receiver + sender + content hash (first 30 chars)
      const contentHash = content.substring(0, 30).replace(/\s/g, '');
      cacheKey = `chat_${receiverId}_${senderId}_${contentHash}`;
    }
    
    // Prevent duplicate notifications for same message within 10 seconds
    if (notificationCache.has(cacheKey)) {
      const cachedTime = notificationCache.get(cacheKey);
      const timeDiff = Date.now() - cachedTime;
      if (timeDiff < 10000) { // 10 seconds
        console.log('⚠️ Duplicate notification prevented:', {
          cacheKey: cacheKey.substring(0, 60),
          messageId,
          timeDiff: `${timeDiff}ms`,
          reason: 'Same message detected within 10 seconds'
        });
        return;
      } else {
        // Remove old entry
        notificationCache.delete(cacheKey);
      }
    }
    
    // Mark this message as notified immediately (before async operations)
    notificationCache.set(cacheKey, Date.now());
    console.log('✅ Notification cache entry added:', {
      cacheKey: cacheKey.substring(0, 60),
      messageId,
      cacheSize: notificationCache.size,
      timestamp: new Date().toISOString()
    });

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      // Remove from cache if receiver not found
      notificationCache.delete(cacheKey);
      return;
    }

    const senderName = savedMessage.sender?.name || savedMessage.senderName || 'Someone';
    const text = content; // Use already extracted content
    
    // Extract productId (conversationId and senderId already extracted above)
    const productId = savedMessage.product?._id?.toString() || savedMessage.product?.toString() || null;
    
    // Build notification link - prefer direct chat link with senderId
    // senderId already extracted above
    let notificationLink = '/messages';
    
    if (senderId) {
      // Direct chat link with sender ID - best for opening chat
      notificationLink = `/chat/${senderId}`;
    } else if (conversationId) {
      // Fallback to conversation link
      notificationLink = `/messages?conversation=${conversationId}`;
    } else if (productId) {
      // Fallback to product chat link
      notificationLink = `/messages?product=${productId}`;
    }

    const payload = {
      title: `${senderName} sent a message`,
      body: text.length > 100 ? text.substring(0, 100) + '...' : text, // Truncate long messages
      data: { 
        messageId,
        type: 'message',
        conversationId: conversationId || '',
        productId: productId || '',
        senderId: senderId,
        handlerName: 'message', // Include in data for service worker
        link: notificationLink // Include link in data
      },
      handlerName: 'message', // Use 'message' handler for chat notifications
      link: notificationLink,
      icon: savedMessage.sender?.profilePicture || '/favicon.png', // Include sender profile picture
    };

    console.log('📤 Sending FCM push notification for chat message:', {
      receiverId: receiverId.toString(),
      senderId,
      messageId,
      conversationId,
      productId,
      handlerName: payload.handlerName,
      link: payload.link,
      title: payload.title,
      body: payload.body.substring(0, 50), // Log first 50 chars of body
      bodyLength: payload.body.length,
      hasIcon: !!payload.icon,
      payloadData: {
        messageId: payload.data.messageId,
        type: payload.data.type,
        conversationId: payload.data.conversationId
      }
    });

    // Combine web tokens (fcmTokens) and mobile tokens (fcmTokenMobile)
    // Remove duplicate tokens to prevent duplicate notifications
    const webTokens = receiver.fcmTokens || [];
    const mobileTokens = receiver.fcmTokenMobile || [];
    const allTokensSet = new Set([...webTokens, ...mobileTokens]);
    const allTokens = Array.from(allTokensSet);
    
    console.log('📱 FCM tokens before deduplication:', {
      webTokens: webTokens.length,
      mobileTokens: mobileTokens.length,
      totalBeforeDedup: webTokens.length + mobileTokens.length
    });
    console.log('📱 FCM tokens after deduplication:', {
      uniqueTokens: allTokens.length,
      duplicatesRemoved: (webTokens.length + mobileTokens.length) - allTokens.length
    });
    
    if (allTokens.length > 0) {
      console.log('📱 Sending FCM push notification to tokens:', {
        webTokens: receiver.fcmTokens?.length || 0,
        mobileTokens: receiver.fcmTokenMobile?.length || 0,
        totalTokens: allTokens.length,
        tokenPreviews: allTokens.map(t => t.substring(0, 20) + '...')
      });
      
      const result = await sendPushNotification(allTokens, payload);
      
      if (result.success) {
        console.log('✅ FCM push notification sent successfully:', {
          successCount: result.successCount,
          failureCount: result.failureCount
        });
      } else {
        console.error('❌ FCM push notification failed:', result.message);
      }
    } else {
      console.log('⚠️ Receiver has no FCM tokens (neither web nor mobile), skipping push notification');
      console.log('💡 User needs to grant notification permission and register FCM token');
    }
  } catch (error) {
    console.error('Error in handleNewMessage push notification:', error);
  }
}

module.exports = { handleNewMessage };


