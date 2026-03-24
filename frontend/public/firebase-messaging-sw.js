importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCTybWX-zsRixTgZ9q6rabPJZr9srY9S9g",
  authDomain: "rentyatra-1e42a.firebaseapp.com",
  projectId: "rentyatra-1e42a",
  storageBucket: "rentyatra-1e42a.firebasestorage.app",
  messagingSenderId: "901085016313",
  appId: "1:901085016313:web:3cfbd9d8c46c732494f228",
  measurementId: "G-00QWLKBH8W",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("🔔 Received background message:", payload);
  const notification = payload.notification || {};
  const data = payload.data || {};
  
  const title = notification.title || data.title || 'New Message';
  const body = notification.body || data.body || '';
  const clickAction = notification.clickAction || data.handlerName || 'message';
  const link = payload.fcmOptions?.link || data.link || '/messages';
  
  console.log("🔔 Background notification details:", {
    title,
    body: body.substring(0, 50),
    clickAction,
    link,
    messageId: data.messageId,
    conversationId: data.conversationId
  });
  
  const notificationOptions = {
    body: body,
    icon: notification.icon || '/favicon.png',
    badge: '/favicon.png',
    data: {
      ...data,
      clickAction,
      link,
      title,
      body
    },
    requireInteraction: false,
    tag: data.messageId || data.conversationId || 'notification',
    timestamp: Date.now(),
    vibrate: [200, 100, 200],
    silent: false
  };
  
  // Add image if available
  if (notification.image) {
    notificationOptions.image = notification.image;
  }
  
  console.log("🔔 Showing background notification...");
  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked:', event.notification);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const link = data.link || '/messages';
  const handlerName = data.clickAction || 'message';
  
  console.log('🔔 Notification click details:', {
    handlerName,
    link,
    conversationId: data.conversationId,
    productId: data.productId,
    messageId: data.messageId
  });
  
  // Handle based on handlerName
  if (handlerName === 'handleNotificationClick' || handlerName === 'message') {
    // Handle message notifications - prefer senderId for direct chat link
    let messageLink = link;
    
    // Priority: senderId > conversationId > productId
    if (data.senderId) {
      // Direct chat link with sender ID - best option
      messageLink = `/chat/${data.senderId}`;
      console.log('🔔 Using senderId for chat link:', messageLink);
    } else if (data.conversationId && !link.includes('conversation=')) {
      messageLink = `/messages?conversation=${data.conversationId}`;
      console.log('🔔 Using conversationId for chat link:', messageLink);
    } else if (data.productId && !link.includes('product=')) {
      // If productId exists, link to product chat
      messageLink = `/messages?product=${data.productId}`;
      console.log('🔔 Using productId for chat link:', messageLink);
    } else {
      console.log('🔔 Using default link:', messageLink);
    }
    
    console.log('🔔 Opening message link:', messageLink);
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(messageLink) || client.url.includes('/messages') || client.url.includes('/chat')) {
            console.log('🔔 Found existing window, focusing it:', client.url);
            return client.focus().then(() => {
              // Navigate to the specific conversation if needed
              if (client.url !== messageLink && messageLink) {
                return client.navigate(messageLink);
              }
            });
          }
        }
        // If no existing window found, open a new one
        console.log('🔔 No existing window found, opening new window:', messageLink);
        return clients.openWindow(messageLink);
      })
    );
  } else if (handlerName === 'product') {
    // Open product page if productId is in data
    const productLink = data.productId ? `/rental/${data.productId}` : '/listings';
    console.log('🔔 Opening product link:', productLink);
    event.waitUntil(
      clients.openWindow(productLink)
    );
  } else {
    // Default: open the link
    console.log('🔔 Opening default link:', link);
    event.waitUntil(
      clients.openWindow(link)
    );
  }
});
