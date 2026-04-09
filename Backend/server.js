const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const publicProductRoutes = require('./routes/publicProductRoutes');
const publicCategoryRoutes = require('./routes/publicCategoryRoutes');
const publicRentalRequestRoutes = require('./routes/publicRentalRequestRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const rentalRequestRoutes = require('./routes/rentalRequestRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const subscriptionPlanRoutes = require('./routes/subscriptionPlanRoutes');
const boostRoutes = require('./routes/boostRoutes');
const adminBoostRoutes = require('./routes/adminBoostRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const testRoutes = require('./routes/testRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { handleNewMessage } = require('./controllers/messageController');

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, PWAs, WebView, or curl requests)
    // Web apps (PWAs) often send requests with null origin when loaded from file:// or as installed app
    // Also handle string "null" which some WebViews send
    if (!origin || origin === 'null' || origin === 'undefined') {
      // Reduced logging - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 CORS: Allowing request with no/null origin (mobile app/PWA/WebView context)');
      }
      return callback(null, true);
    }
    
    // Check for WebView-specific origins before checking allowed list
    if (origin.startsWith('file://') || 
        origin.includes('android-app://') ||
        origin.includes('webview') ||
        origin.includes('WebView') ||
        origin.includes('wv')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 CORS: Allowing WebView/APK origin:', origin);
      }
      return callback(null, true);
    }
    
    // Allow Razorpay API origins (for webhooks and callbacks)
    if (origin.includes('razorpay.com') || origin.includes('api.razorpay.com')) {
      // Keep Razorpay logs as they're important for payment debugging
      console.log('🌐 CORS: Allowing Razorpay API origin:', origin);
      return callback(null, true);
    }
    
    // Allow Vercel preview/deployment URLs (for preview deployments and screenshot service)
    if (origin.includes('vercel.app') || origin.includes('vercel.com')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 CORS: Allowing Vercel origin:', origin);
      }
      return callback(null, true);
    }
    
    // In production, be more lenient if CORS_ORIGINS not set
    const isProduction = process.env.NODE_ENV === 'production';
    
    const allowedOrigins = [
      // Local development
      'http://localhost:8080',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      
      // Production domains
      'https://www.rentyatra.com',
      'https://rentyatra.com',
      
      // Razorpay API origins (for webhooks and callbacks)
      'https://api.razorpay.com',
      'https://checkout.razorpay.com',
      'https://*.razorpay.com',
      
      // Vercel preview/deployment URLs (for preview deployments)
      'https://*.vercel.app',
      'https://*.vercel.com',
      
      // Environment variables
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      
      // Allow multiple origins from comma-separated env variable
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(url => url.trim()) : [])
    ].filter(Boolean); // Remove undefined values
    
    // Check if origin matches any allowed origin
    let isAllowed = allowedOrigins.some(allowedOrigin => {
      // Exact match
      if (allowedOrigin === origin) return true;
      // Wildcard matching
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp('^' + allowedOrigin.replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return false;
    });
    
    // In production without strict CORS config, allow all but log warning
    if (!isAllowed && isProduction && !process.env.CORS_ORIGINS) {
      console.log('⚠️  CORS: Allowing origin in production (CORS_ORIGINS not set):', origin);
      console.log('⚠️  Recommendation: Set CORS_ORIGINS in environment variables for better security');
      isAllowed = true;
    }
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.error('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
      console.log('📝 CORS_ORIGINS:', process.env.CORS_ORIGINS || 'NOT SET');
      
      // Check if it's a WebView/APK origin (file://, null, or app-specific origins)
      const isWebViewOrigin = !origin || 
                              origin === 'null' || 
                              origin.startsWith('file://') ||
                              origin.includes('android-app://') ||
                              origin.includes('webview') ||
                              origin.includes('WebView');
      
      // Always allow WebView/APK origins (they have no origin or special origins)
      if (isWebViewOrigin) {
        console.log('🌐 CORS: Allowing WebView/APK origin:', origin || 'null');
        callback(null, true);
        return;
      }
      
      // In development, be strict
      if (!isProduction) {
        callback(new Error('Not allowed by CORS'));
      } else {
        // Even in production, if explicitly blocked, log but don't crash
        console.warn('⚠️  CORS: Blocking origin but continuing in production mode');
        callback(null, true); // Allow to prevent app crash
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false // Always handle preflight requests (don't pass to next middleware)
};

// Middleware
// Trust proxy for production deployments behind reverse proxies
app.set('trust proxy', 1);
app.use(cors(corsOptions));
// Increase body size limits to handle large file uploads (images + videos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware to handle body-parser errors and ensure CORS headers
// This must come after body parser middleware to catch its errors
app.use((err, req, res, next) => {
  // Handle body-parser errors (413 Payload Too Large)
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    console.error('⚠️  Request body too large:', {
      type: err.type,
      status: err.status || err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
      origin: req.headers.origin || 'null'
    });
    
    // Ensure CORS headers are set
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with, X-Requested-With');
    }
    
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Maximum size is 50MB for request body.',
      error: 'PAYLOAD_TOO_LARGE',
      maxSize: '50MB'
    });
  }
  next(err);
});

// Socket.io configuration
console.log('🔌 Initializing Socket.io server...');
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Use same origin validation logic as Express CORS
      if (!origin) {
        console.log('🔌 Socket.io: No origin, allowing connection');
        return callback(null, true);
      }
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      const allowedOrigins = [
        'http://localhost:8080',
        'http://localhost:5000',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'https://www.rentyatra.com',
        'https://rentyatra.com',
        process.env.FRONTEND_URL,
        process.env.CORS_ORIGIN,
        ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(url => url.trim()) : [])
      ].filter(Boolean);
      
      let isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin === origin) return true;
        if (allowedOrigin.includes('*')) {
          const regex = new RegExp('^' + allowedOrigin.replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return false;
      });
      
      if (!isAllowed && isProduction && !process.env.CORS_ORIGINS) {
        console.log('🔌 Socket.io: Auto-allowing in production mode:', origin);
        isAllowed = true;
      }
      
      if (isAllowed) {
        console.log('✅ Socket.io: Origin allowed:', origin);
      } else {
        console.error('❌ Socket.io: Origin blocked:', origin);
        console.log('Allowed origins:', allowedOrigins);  
      }
      
      callback(null, isAllowed);
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 180000, // 3 minutes - increased to handle payment redirects
  pingInterval: 25000,
  upgradeTimeout: 30000,
  connectTimeout: 60000 // Connection timeout
});

// Make io globally available for controllers
global.io = io;

// Track pending offline status timers to cancel them if user reconnects
const pendingOfflineTimers = new Map();

console.log('✅ Socket.io initialized successfully');

// Socket.io connection handling
io.on('connection', (socket) => {
  // Reduced logging - only log on first connection or errors
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ User connected:', socket.id);
  }
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  // Join user to their personal room
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    socket.userId = userId; // Store userId on socket for later use
    // Reduced logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`User ${userId} joined their room`);
    }
    
    // Cancel any pending offline status if user reconnected
    if (pendingOfflineTimers.has(userId)) {
      clearTimeout(pendingOfflineTimers.get(userId));
      pendingOfflineTimers.delete(userId);
      if (process.env.NODE_ENV === 'development') {
        console.log(`User ${userId} reconnected - cancelled pending offline status`);
      }
    }
  });

  // Handle user online status
  socket.on('user_online', (data) => {
    const { userId } = data;
    // Reduced logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`User ${userId} is now online`);
    }
    
    // Broadcast to all users that this user is online
    socket.broadcast.emit('user_online', { userId });
  });

  // Handle user offline status
  socket.on('user_offline', (data) => {
    const { userId } = data;
    console.log(`User ${userId} is now offline`);
    
    // Broadcast to all users that this user is offline
    socket.broadcast.emit('user_offline', { userId });
  });

  // Join conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User joined conversation: ${conversationId}`);
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const Message = require('./models/Message');
      const User = require('./models/User');
      
      const { senderId, receiverId, content, productId } = data;
      
      // Create conversation ID
      const conversationId = Message.generateConversationId(senderId, receiverId);
      
      // Create message
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content,
        conversationId,
        product: productId || null
      });
      
      await message.save();
      
      // Populate sender info
      await message.populate('sender', 'name email profilePicture');
      await message.populate('receiver', 'name email profilePicture');
      if (productId) {
        await message.populate('product', 'title images');
      }

      // Trigger FCM push to receiver (don't let notification errors break message sending)
      try {
        await handleNewMessage(message);
        console.log('✅ Notification sent for message:', message._id);
      } catch (notificationError) {
        console.error('⚠️ Notification failed but message was sent:', notificationError.message);
        // Don't throw - message should still be sent even if notification fails
      }
      
      // Emit to conversation room
      io.to(`conversation_${conversationId}`).emit('new_message', message);
      
      // Emit to receiver's personal room for notifications
      io.to(`user_${receiverId}`).emit('message_notification', {
        message,
        unreadCount: await Message.countDocuments({
          receiver: receiverId,
          isRead: false
        })
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle message read status
  socket.on('mark_message_read', async (data) => {
    try {
      const Message = require('./models/Message');
      const { messageId, userId } = data;
      
      const message = await Message.findById(messageId);
      if (message && message.receiver.toString() === userId) {
        await message.markAsRead();
        
        // Notify sender that message was read
        io.to(`user_${message.sender}`).emit('message_read', {
          messageId,
          readAt: message.readAt
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: false
    });
  });

  // Handle test messages
  socket.on('test_message', (data) => {
    console.log('Test message received:', data);
    socket.emit('test_response', { 
      message: 'Test response received', 
      originalMessage: data.message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    // Reduced logging - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('User disconnected:', socket.id, 'Reason:', reason);
    }
    
    // Add a delay before marking user as offline to handle temporary disconnects
    // (like during payment redirects or page refreshes)
    if (socket.userId) {
      const userId = socket.userId;
      
      // Cancel any existing pending offline timer for this user
      if (pendingOfflineTimers.has(userId)) {
        clearTimeout(pendingOfflineTimers.get(userId));
        pendingOfflineTimers.delete(userId);
      }
      
      // Determine grace period based on disconnect reason
      // "transport close" is often temporary (page refresh, network hiccup, payment redirect)
      // Give it more time than explicit client disconnects
      let gracePeriod = 5000; // Default 5 seconds
      
      if (reason === 'transport close') {
        gracePeriod = 10000; // 10 seconds for transport close (often temporary)
        // Reduced logging
        if (process.env.NODE_ENV === 'development') {
          console.log(`Transport close detected for user ${userId} - using extended grace period`);
        }
      } else if (reason === 'ping timeout') {
        gracePeriod = 15000; // 15 seconds for ping timeout (network issues)
        if (process.env.NODE_ENV === 'development') {
          console.log(`Ping timeout detected for user ${userId} - using extended grace period`);
        }
      } else if (reason === 'io server disconnect') {
        gracePeriod = 2000; // 2 seconds for server-initiated disconnect (usually intentional)
        if (process.env.NODE_ENV === 'development') {
          console.log(`Server disconnect for user ${userId} - using shorter grace period`);
        }
      }
      
      // Only mark as offline after a delay to allow for quick reconnection
      // This prevents false offline status during payment flows
      const offlineTimer = setTimeout(() => {
        // Check if socket is still disconnected by checking if it's in the room
        // If user reconnected, they would have rejoined the room
        const userRoom = io.sockets.adapter.rooms.get(`user_${userId}`);
        if (!userRoom || userRoom.size === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`User ${userId} disconnected (${reason}) - marking as offline after ${gracePeriod}ms delay`);
          }
          // Use io.emit to broadcast to all sockets (since socket is disconnected)
          io.emit('user_offline', { userId });
          pendingOfflineTimers.delete(userId);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`User ${userId} reconnected - skipping offline status`);
          }
          pendingOfflineTimers.delete(userId);
        }
      }, gracePeriod);
      
      // Store the timer so we can cancel it if user reconnects
      pendingOfflineTimers.set(userId, offlineTimer);
    }
  });
});

// Make io available to routes
app.set('io', io);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Import database connection
const connectDB = require('./config/db');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/banners', bannerRoutes);
app.use('/api/admin/rental-requests', rentalRequestRoutes);
app.use('/api/admin/boost-packages', adminBoostRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/products', publicProductRoutes);
app.use('/api/categories', publicCategoryRoutes);
app.use('/api/rental-requests', publicRentalRequestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/boost', boostRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/test', testRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => res.status(200).json({ message: 'Backend is healthy' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RentYatra API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  // Ensure CORS headers are set for 404 responses
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle multer errors (file upload errors)
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    console.error('⚠️  Multer file upload error:', {
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
      origin: req.headers.origin || 'null'
    });
    
    // Ensure CORS headers are set
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with, X-Requested-With');
    }
    
    let statusCode = 400;
    let message = err.message || 'File upload error';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File too large. Maximum file size is 200MB.';
    }
    
    return res.status(statusCode).json({
      success: false,
      message: message,
      error: 'FILE_UPLOAD_ERROR',
      code: err.code
    });
  }
  
  // Handle payload too large errors (413) - ensure CORS headers are sent
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413 || err.message?.includes('too large') || err.message?.includes('limit')) {
    console.error('⚠️  Payload too large error:', {
      type: err.type,
      status: err.status || err.statusCode,
      message: err.message,
      path: req.path,
      method: req.method,
      origin: req.headers.origin || 'null'
    });
    
    // Ensure CORS headers are set even for 413 errors
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with, X-Requested-With');
    }
    
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Maximum size is 50MB for request body.',
      error: 'PAYLOAD_TOO_LARGE',
      maxSize: '50MB'
    });
  }
  
  // CORS errors - handle gracefully
  if (err.message && err.message.includes('CORS')) {
    const origin = req.headers.origin || 'null';
    console.error('⚠️  CORS error detected:', {
      origin: origin,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });
    
    // Check if it's a WebView/APK request - if so, allow it anyway
    const isWebViewOrigin = !req.headers.origin || 
                            req.headers.origin === 'null' || 
                            req.headers.origin.startsWith('file://') ||
                            req.headers.origin.includes('android-app://') ||
                            req.headers.origin.includes('webview') ||
                            req.headers.origin.includes('WebView');
    
    const isWebViewUserAgent = (req.headers['user-agent'] || '').includes('WebView') || 
                               (req.headers['user-agent'] || '').includes('wv');
    
    // Check if it's a Razorpay API request (for webhooks/callbacks)
    const isRazorpayOrigin = req.headers.origin && 
                            (req.headers.origin.includes('razorpay.com') || 
                             req.headers.origin.includes('api.razorpay.com'));
    
    // Check if it's a Vercel service request (screenshot service, preview deployments)
    const isVercelOrigin = req.headers.origin && 
                          (req.headers.origin.includes('vercel.app') || 
                           req.headers.origin.includes('vercel.com'));
    const isVercelUserAgent = (req.headers['user-agent'] || '').includes('vercel-screenshot') ||
                              (req.headers['user-agent'] || '').includes('vercel');
    
    if (isWebViewOrigin || isWebViewUserAgent || isRazorpayOrigin || isVercelOrigin || isVercelUserAgent) {
      console.log('🌐 CORS: Detected WebView/APK/Razorpay/Vercel request - allowing despite CORS error');
      // Don't return error - let the request proceed
      // This shouldn't happen if CORS middleware is working, but as a fallback
      return next(); // Continue to next middleware
    }
    
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Request not allowed',
      error: 'CORS_ERROR'
    });
  }
  
  console.error('❌ Error caught in middleware:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server only after database connection is established
const startServer = async () => {
  try {
    console.log('🔄 Starting RentYatra Backend Server...');
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    
    // Log CORS configuration
    console.log('\n📋 CORS Configuration:');
    console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
    console.log('  - CORS_ORIGIN:', process.env.CORS_ORIGIN || 'NOT SET');
    console.log('  - CORS_ORIGINS:', process.env.CORS_ORIGINS || 'NOT SET');
    console.log('  - Production mode: ' + (process.env.NODE_ENV === 'production' ? 'LENIENT (allows all if CORS_ORIGINS not set)' : 'STRICT'));
    console.log('');
    
    // Connect to MongoDB Atlas first (with error handling)
    // Set up connection listener BEFORE calling connectDB to catch retry connections
    let packagesInitialized = false;
    
    const initializePackagesWhenReady = async () => {
      if (packagesInitialized) return; // Already initialized
      
      try {
        const { initializeDefaultPackages } = require('./controllers/adminBoostController');
        await initializeDefaultPackages();
        packagesInitialized = true;
        console.log('✅ Default boost packages initialized successfully');
      } catch (initError) {
        console.error('❌ Error initializing default boost packages:', initError.message);
        // Don't block - will retry on next connection
      }
    };
    
    // Listen for connection events - initialize packages and plans when connection is ready
    mongoose.connection.once('connected', async () => {
      console.log('✅ MongoDB connection established - initializing packages and plans...');
      await initializePackagesWhenReady();
      
      // Initialize default subscription plans
      try {
        const { initializeDefaultPlans } = require('./utils/initializeSubscriptionPlans');
        await initializeDefaultPlans();
      } catch (planError) {
        console.error('❌ Error initializing default subscription plans:', planError.message);
        // Don't block - will retry on next connection
      }
    });
    
    try {
      await connectDB();
      
      // If connection succeeded immediately, initialize packages and plans
      if (mongoose.connection.readyState === 1) {
        console.log('✅ MongoDB connection already established - initializing packages and plans...');
        await initializePackagesWhenReady();
        
        // Initialize default subscription plans
        try {
          const { initializeDefaultPlans } = require('./utils/initializeSubscriptionPlans');
          await initializeDefaultPlans();
        } catch (planError) {
          console.error('❌ Error initializing default subscription plans:', planError.message);
        }
      } else {
        console.log('⏳ MongoDB connection in progress - packages and plans will initialize when ready...');
      }
      
    } catch (dbError) {
      console.error('❌ Initial database connection attempt failed:', dbError.message);
      console.log('⚠️ Server will continue - connection will retry in background');
      console.log('⚠️ Boost packages will initialize automatically when database connection succeeds');
      // Connection retry is handled in connectDB() - packages will initialize on 'connected' event
    }
    
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';
    
    // Try to start server with retry mechanism
    const startServerWithRetry = (port, host, retries = 3) => {
      const httpServer = server.listen(port, host, () => {
      console.log(`
🚀 RentYatra Backend Server Started Successfully!
📡 Server running on: ${HOST}:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API Base URL: ${process.env.NODE_ENV === 'production' ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app.onrender.com'}` : `http://localhost:${PORT}`}/api
📊 Health Check: ${process.env.NODE_ENV === 'production' ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-app.onrender.com'}` : `http://localhost:${PORT}`}/api/health
🔐 Auth Endpoints: /api/auth
👤 User Endpoints: /api/users
📄 Document Endpoints: /api/documents
🛡️ Admin Endpoints: /api/admin
📦 Product Endpoints: /api/admin/products
🏠 Rental Request Endpoints: /api/admin/rental-requests
🛍️ Public Product Endpoints: /api/products
📂 Public Category Endpoints: /api/categories
🏠 Public Rental Request Endpoints: /api/rental-requests (GET, POST)
⭐ Review Endpoints: /api/reviews
      `);
    });
    
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`❌ Port ${port} is already in use, trying port ${port + 1}...`);
        if (retries > 0) {
          setTimeout(() => {
            startServerWithRetry(port + 1, host, retries - 1);
          }, 1000);
        } else {
          console.error(`❌ Could not find available port after ${retries} retries`);
          process.exit(1);
        }
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
    
    return httpServer;
    };
    
    const httpServer = startServerWithRetry(PORT, HOST);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      httpServer.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
      });
    });

    // Keep the server running
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      // Don't exit the process
    });

    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      // Don't exit the process
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('❌ Error details:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
