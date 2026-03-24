const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    // Validate MONGODB_URI
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Log connection attempt (without sensitive data)
    const uriPreview = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    console.log('📍 Connection URI:', uriPreview);
    
    // Validate connection string format
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
    }
    
    // Extract and log connection details (without password)
    try {
      // Parse connection string - handle query parameters
      const uriWithoutQuery = process.env.MONGODB_URI.split('?')[0];
      const uriMatch = uriWithoutQuery.match(/mongodb\+?srv?:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
      if (uriMatch) {
        const [, username, , host, database] = uriMatch;
        console.log('🔍 Connection Details:');
        console.log('   Username:', username);
        console.log('   Host:', host);
        console.log('   Database:', database || 'default');
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse connection string:', parseError.message);
    }

    // MongoDB Atlas connection with optimized settings for production
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for production
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Wait 30 seconds before timing out initial connection
      bufferCommands: false, // Disable buffering - fail fast if not connected
      retryWrites: true,
      w: 'majority',
    });
    
    console.log(`🎉 MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔌 Connection State: ${conn.connection.readyState}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('🎉 Mongoose connected to MongoDB Atlas');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB Atlas');
      // Don't exit the process, just log the disconnection
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      // Don't exit the process, just log the error
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      // Don't exit the process, just log the error
    });
    
  } catch (err) {
    console.error('❌ MongoDB Atlas connection error:', err.message);
    console.error('❌ Error Type:', err.name || 'Unknown');
    
    // Provide specific error messages
    if (err.message && err.message.includes('IP') && err.message.includes('whitelist')) {
      console.error('❌ IP WHITELIST ERROR:');
      console.error('   Your server IP is not whitelisted in MongoDB Atlas.');
      console.error('   Please add your server IP to MongoDB Atlas Network Access:');
      console.error('   https://www.mongodb.com/docs/atlas/security-whitelist/');
      console.error('   Or allow all IPs (0.0.0.0/0) for testing (NOT RECOMMENDED for production)');
    } else if (err.message && err.message.includes('authentication') || err.message && err.message.includes('bad auth')) {
      console.error('❌ AUTHENTICATION ERROR:');
      console.error('   Check your MongoDB Atlas username and password in MONGODB_URI');
      console.error('   Verify credentials in MongoDB Atlas → Database Access');
    } else if (err.message && err.message.includes('ReplicaSetNoPrimary') || err.reason?.type === 'ReplicaSetNoPrimary') {
      console.error('❌ REPLICA SET ERROR:');
      console.error('   Cannot find primary server in replica set.');
      console.error('   Possible causes:');
      console.error('   1. Network connectivity issues');
      console.error('   2. MongoDB Atlas cluster is down or restarting');
      console.error('   3. DNS resolution issues');
      console.error('   4. Firewall blocking connection');
      console.error('   5. Authentication failed (wrong username/password)');
      console.error('   6. Database user does not have proper permissions');
      console.error('   Check MongoDB Atlas dashboard for cluster status');
      console.error('   Verify username and password in Database Access');
      console.error('   Ensure user has "Atlas Admin" or "Read/Write" permissions');
    } else if (err.message && err.message.includes('ENOTFOUND') || err.message && err.message.includes('DNS')) {
      console.error('❌ DNS RESOLUTION ERROR:');
      console.error('   Cannot resolve MongoDB Atlas hostname.');
      console.error('   Check your internet connection and DNS settings');
    } else if (err.message && err.message.includes('timeout')) {
      console.error('❌ CONNECTION TIMEOUT:');
      console.error('   Connection to MongoDB Atlas timed out.');
      console.error('   Possible causes:');
      console.error('   1. Network latency');
      console.error('   2. Firewall blocking connection');
      console.error('   3. MongoDB Atlas cluster is overloaded');
    } else {
      console.error('❌ Error Details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        reason: err.reason?.message || err.reason
      });
    }
    
    // Log connection string preview (without password)
    if (process.env.MONGODB_URI) {
      const uriPreview = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
      console.error('📍 Connection String:', uriPreview);
    }
    
    // Retry connection after 10 seconds (increased for production)
    console.log('🔄 Retrying connection in 10 seconds...');
    setTimeout(() => {
      connectDB();
    }, 10000);
  }
};


module.exports = connectDB;
