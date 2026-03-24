const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');

// Load environment variables
dotenv.config();

const addAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin user data
    const adminData = {
      _id: new mongoose.Types.ObjectId('69119240f89f6501885394c0'),
      name: 'Ajay Panchal',
      email: 'panchalajay717@gmail.com',
      password: '$2b$12$.e6PWtD71z0l1V6UjVMQS.GfsFpcaywGGEVsE9L8c6xppQ3KlA5lS',
      role: 'admin',
      permissions: {
        userManagement: true,
        productManagement: true,
        orderManagement: true,
        rentalManagement: true,
        analytics: true,
        settings: false,
        systemSettings: false
      },
      profileImage: null,
      isActive: true,
      isEmailVerified: true,
      lastLoginAt: null,
      loginAttempts: 0,
      createdBy: null,
      stats: {
        totalLogins: 8,
        lastLoginIP: '127.0.0.1',
        actionsPerformed: 80,
        lastActivity: new Date('2025-11-14T05:15:53.137Z')
      },
      createdAt: new Date('2025-11-10T07:20:32.557Z'),
      updatedAt: new Date('2025-11-14T05:15:53.138Z'),
      __v: 0
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findById(adminData._id);
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists with this _id');
      console.log('Updating existing admin...');
      
      // Update existing admin
      await Admin.findByIdAndUpdate(adminData._id, adminData, { 
        new: true, 
        runValidators: true,
        overwrite: true 
      });
      console.log('✅ Admin user updated successfully');
    } else {
      // Check if email already exists
      const existingEmail = await Admin.findOne({ email: adminData.email });
      if (existingEmail) {
        console.log('⚠️ Admin user already exists with this email');
        console.log('Updating existing admin...');
        
        await Admin.findByIdAndUpdate(existingEmail._id, adminData, { 
          new: true, 
          runValidators: true,
          overwrite: true 
        });
        console.log('✅ Admin user updated successfully');
      } else {
        // Create new admin
        const admin = new Admin(adminData);
        await admin.save();
        console.log('✅ Admin user created successfully');
      }
    }

    // Verify the admin was added
    const verifyAdmin = await Admin.findById(adminData._id).select('+password');
    if (verifyAdmin) {
      console.log('\n📋 Admin User Details:');
      console.log('   _id:', verifyAdmin._id);
      console.log('   Name:', verifyAdmin.name);
      console.log('   Email:', verifyAdmin.email);
      console.log('   Role:', verifyAdmin.role);
      console.log('   Is Active:', verifyAdmin.isActive);
      console.log('   Permissions:', verifyAdmin.permissions);
      console.log('\n✅ Admin user verified in database');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    if (error.code === 11000) {
      console.error('⚠️ Duplicate key error - Admin with this email or _id already exists');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
addAdminUser();

