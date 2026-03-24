const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin email
    const adminEmail = 'panchalajay717@gmail.com';
    
    // New password (you can change this)
    const newPassword = 'Admin@123'; // Change this to your desired password
    
    // Find admin by email
    const admin = await Admin.findOne({ email: adminEmail }).select('+password');
    
    if (!admin) {
      console.error('❌ Admin user not found with email:', adminEmail);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('📋 Found admin user:');
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);

    // Set new password (will be hashed automatically by pre-save middleware)
    admin.password = newPassword;
    await admin.save();

    console.log('\n✅ Password reset successfully!');
    console.log('📝 New Password:', newPassword);
    console.log('\n⚠️  IMPORTANT: Please change this password after first login!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', newPassword);

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
resetAdminPassword();

