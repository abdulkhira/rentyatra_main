// Backend/services/firebaseAdmin.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function initializeFirebase() {
  if (admin.apps.length) {
    console.log('✅ Firebase Admin already initialized');
    return;
  }

  // Prefer JSON credentials from FIREBASE_CONFIG for security
  const firebaseConfigJson = process.env.FIREBASE_CONFIG;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  // Default service account path if file exists
  const resolvedDefaultPath = (() => {
    const configDir = path.join(__dirname, '../config');
    try {
      const files = fs.readdirSync(configDir);
      const match = files
        .filter((file) => /^rentyatra-1e42a-firebase-adminsdk-.*\.json$/.test(file))
        // sort so newest (lexicographically) comes last, then pick last
        .sort()
        .pop();
      if (match) {
        return path.join(configDir, match);
      }
    } catch (err) {
      console.warn('⚠️ Unable to scan config directory for Firebase service account files:', err.message);
    }
    return null;
  })();

  try {
    if (firebaseConfigJson) {
      console.log('📦 Initializing Firebase Admin from FIREBASE_CONFIG env variable...');
      const serviceAccount = JSON.parse(firebaseConfigJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized from FIREBASE_CONFIG');
      return;
    }

    if (serviceAccountPath) {
      const resolvedPath = path.resolve(serviceAccountPath);
      if (require('fs').existsSync(resolvedPath)) {
        console.log('📦 Initializing Firebase Admin from FIREBASE_SERVICE_ACCOUNT_PATH:', serviceAccountPath);
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const serviceAccount = require(resolvedPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized from service account path');
        return;
      } else {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH file not found:', resolvedPath);
        console.warn('⚠️ Falling back to default service account file...');
      }
    }

    // Try default service account file
    if (resolvedDefaultPath) {
      try {
        if (fs.existsSync(resolvedDefaultPath)) {
          console.log('📦 Initializing Firebase Admin from default service account file:', path.basename(resolvedDefaultPath));
          // eslint-disable-next-line import/no-dynamic-require, global-require
          const serviceAccount = require(resolvedDefaultPath);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('✅ Firebase Admin initialized from default service account file');
          return;
        }
      } catch (fileError) {
        console.warn('⚠️ Failed to load default service account file:', fileError.message);
      }
    } else {
      console.warn('⚠️ No default Firebase service account file found in config directory.');
    }

    // Final fallback: use application default credentials (for GCP environments)
    console.log('📦 Initializing Firebase Admin using application default credentials...');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('✅ Firebase Admin initialized using application default credentials');
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin:", err.message);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    throw err;
  }
}

initializeFirebase();

const messaging = admin.messaging();

async function sendPushNotification(tokens, payload) {
  if (!tokens || tokens.length === 0) {
    console.log('⚠️ No FCM tokens provided, skipping push notification');
    return { success: false, message: 'No tokens provided' };
  }

  if (!payload || !payload.title || !payload.body) {
    console.error('❌ Invalid payload: title and body are required');
    return { success: false, message: 'Invalid payload' };
  }

  console.log('📤 Sending push notification...', {
    tokenCount: tokens.length,
    title: payload.title,
    body: payload.body.substring(0, 50) + '...',
    hasData: !!payload.data
  });

  const messages = tokens.map((token) => ({
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      ...payload.data,
      link: payload.link || '/messages', // Include link in data for service worker
      handlerName: payload.handlerName || 'handleNotificationClick', // Include handlerName in data
    },
    webpush: {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon.png',
        badge: '/favicon.png',
        clickAction: payload.handlerName || 'message',
        requireInteraction: false,
        // Use messageId as tag - same messageId will replace previous notification
        // This prevents duplicate notifications for same message
        tag: payload.data?.messageId 
          ? `msg_${payload.data.messageId}` 
          : payload.data?.conversationId 
            ? `conv_${payload.data.conversationId}`
            : `notif_${Date.now()}`,
        vibrate: [200, 100, 200],
        silent: false,
      },
      fcmOptions: {
        link: payload.link || '/messages',
      },
      headers: {
        Urgency: 'normal',
      },
    },
  }));

  try {
    const response = await messaging.sendEach(messages);
    
    console.log('✅ Push notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length
    });

    // Log failed tokens if any
    if (response.failureCount > 0) {
      console.warn('⚠️ Some push notifications failed:');
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Token ${idx + 1} failed:`, resp.error?.message || 'Unknown error');
        }
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length
    };
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

module.exports = { sendPushNotification };
