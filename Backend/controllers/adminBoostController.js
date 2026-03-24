const BoostPackageTemplate = require('../models/BoostPackageTemplate');
const BoostPackage = require('../models/BoostPackage');
const User = require('../models/User');

// Get all boost packages
const getAllBoostPackages = async (req, res) => {
  try {
    console.log('🔍 getAllBoostPackages called');
    console.log('🔍 BoostPackageTemplate model:', BoostPackageTemplate);
    
    const packages = await BoostPackageTemplate.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
    
    console.log('📦 Found packages:', packages.length);
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('❌ Error fetching boost packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boost packages',
      error: error.message
    });
  }
};

// Get boost package by ID
const getBoostPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const package = await BoostPackage.findOne({ id, isActive: true });
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Boost package not found'
      });
    }
    
    res.json({
      success: true,
      data: package
    });
  } catch (error) {
    console.error('Error fetching boost package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boost package',
      error: error.message
    });
  }
};

// Create new boost package
const createBoostPackage = async (req, res) => {
  try {
    const packageData = req.body;
    
    // Check if package with same ID already exists
    const existingPackage = await BoostPackageTemplate.findOne({ id: packageData.id });
    if (existingPackage) {
      return res.status(400).json({
        success: false,
        message: 'Boost package with this ID already exists'
      });
    }
    
    const newPackage = new BoostPackageTemplate(packageData);
    await newPackage.save();
    
    res.status(201).json({
      success: true,
      message: 'Boost package created successfully',
      data: newPackage
    });
  } catch (error) {
    console.error('Error creating boost package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create boost package',
      error: error.message
    });
  }
};

// Update boost package
const updateBoostPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const package = await BoostPackageTemplate.findOneAndUpdate(
      { id },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Boost package not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Boost package updated successfully',
      data: package
    });
  } catch (error) {
    console.error('Error updating boost package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update boost package',
      error: error.message
    });
  }
};

// Delete boost package (soft delete)
const deleteBoostPackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const package = await BoostPackageTemplate.findOneAndUpdate(
      { id },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Boost package not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Boost package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting boost package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete boost package',
      error: error.message
    });
  }
};

// Get all user boost orders
const getUserBoostOrders = async (req, res) => {
  try {
    console.log('🔍 Admin getUserBoostOrders called');
    
    const BoostPackage = require('../models/BoostPackage');
    
    // Fetch all boost packages with user population
    const boostPackages = await BoostPackage.find({})
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log('📦 Found boost packages:', boostPackages.length);
    console.log('👥 User population results:', boostPackages.map(pkg => ({
      id: pkg._id,
      userId: pkg.user?._id,
      userName: pkg.user?.name,
      userEmail: pkg.user?.email
    })));

    // Helper function to get proper plan name
    const getPlanName = (packageId, packageName) => {
      const planMapping = {
        'boost-1': 'Quick Boost',
        'boost-3': 'Power Boost', 
        'boost-7': 'Mega Boost'
      };
      
      // If packageName already contains proper plan name, use it
      if (packageName && (packageName.includes('Quick') || packageName.includes('Power') || packageName.includes('Mega'))) {
        return packageName;
      }
      
      // Otherwise, map packageId to plan name
      return planMapping[packageId] || packageName || 'Unknown Plan';
    };

    // Transform data to match frontend expectations
    const transformedData = boostPackages.map(pkg => {
      // Handle cases where user is null or undefined
      let userData = {
        _id: pkg.user?._id || null,
        name: pkg.user?.name || 'Unknown User',
        email: pkg.user?.email || 'No Email',
        phone: pkg.user?.phone || 'No Phone'
      };

      // If user reference exists but user data is missing, try to fetch it
      if (pkg.user && !pkg.user.name) {
        console.log('⚠️ User reference exists but data is missing:', pkg.user);
        userData = {
          _id: pkg.user._id,
          name: 'User Data Missing',
          email: 'Data Missing',
          phone: 'Data Missing'
        };
      }

      return {
        _id: pkg._id,
        userId: userData,
        packageName: getPlanName(pkg.packageId, pkg.packageName),
        boostCount: pkg.boostCount,
        usedBoosts: pkg.usedBoosts || 0,
        remainingBoosts: pkg.remainingBoosts || 0,
        price: pkg.price,
        totalAmount: pkg.totalAmount,
        status: pkg.status,
        paymentStatus: pkg.paymentStatus,
        duration: '365 days', // Default duration
        createdAt: pkg.createdAt,
        validFrom: pkg.validFrom,
        validUntil: pkg.validUntil
      };
    });

    res.status(200).json({
      success: true,
      data: transformedData,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalOrders: transformedData.length,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user boost orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user boost orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete user boost order
const deleteUserBoostOrder = async (req, res) => {
  try {
    console.log('🗑️ Admin deleteUserBoostOrder called for ID:', req.params.id);
    
    const BoostPackage = require('../models/BoostPackage');
    
    const boostOrder = await BoostPackage.findById(req.params.id);
    
    if (!boostOrder) {
      return res.status(404).json({
        success: false,
        message: 'Boost order not found'
      });
    }

    await BoostPackage.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Boost order deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user boost order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting boost order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update user boost order
const updateUserBoostOrder = async (req, res) => {
  try {
    console.log('✏️ Admin updateUserBoostOrder called for ID:', req.params.id);
    
    const BoostPackage = require('../models/BoostPackage');
    const { status, usedBoosts, remainingBoosts } = req.body;
    
    // Helper function to get proper plan name
    const getPlanName = (packageId, packageName) => {
      const planMapping = {
        'boost-1': 'Quick Boost',
        'boost-3': 'Power Boost', 
        'boost-7': 'Mega Boost'
      };
      
      // If packageName already contains proper plan name, use it
      if (packageName && (packageName.includes('Quick') || packageName.includes('Power') || packageName.includes('Mega'))) {
        return packageName;
      }
      
      // Otherwise, map packageId to plan name
      return planMapping[packageId] || packageName || 'Unknown Plan';
    };
    
    const boostOrder = await BoostPackage.findById(req.params.id);
    
    if (!boostOrder) {
      return res.status(404).json({
        success: false,
        message: 'Boost order not found'
      });
    }

    // Update allowed fields
    if (status) boostOrder.status = status;
    if (usedBoosts !== undefined) boostOrder.usedBoosts = usedBoosts;
    if (remainingBoosts !== undefined) boostOrder.remainingBoosts = remainingBoosts;

    await boostOrder.save();

    // Populate user data for response
    await boostOrder.populate('user', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Boost order updated successfully',
      data: {
        _id: boostOrder._id,
        userId: {
          _id: boostOrder.user?._id,
          name: boostOrder.user?.name || 'Unknown User',
          email: boostOrder.user?.email || 'No Email',
          phone: boostOrder.user?.phone || 'No Phone'
        },
        packageName: getPlanName(boostOrder.packageId, boostOrder.packageName),
        boostCount: boostOrder.boostCount,
        usedBoosts: boostOrder.usedBoosts,
        remainingBoosts: boostOrder.remainingBoosts,
        price: boostOrder.price,
        totalAmount: boostOrder.totalAmount,
        status: boostOrder.status,
        paymentStatus: boostOrder.paymentStatus,
        duration: '365 days',
        createdAt: boostOrder.createdAt,
        validFrom: boostOrder.validFrom,
        validUntil: boostOrder.validUntil
      }
    });

  } catch (error) {
    console.error('❌ Error updating user boost order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating boost order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Initialize default boost packages
const initializeDefaultPackages = async () => {
  try {
    // CRITICAL: Check if MongoDB connection is ready before initializing
    const mongoose = require('mongoose');
    
    // Wait for connection to be ready (with timeout)
    const waitForConnection = () => {
      return new Promise((resolve, reject) => {
        // If already connected, resolve immediately
        if (mongoose.connection.readyState === 1) {
          resolve();
          return;
        }
        
        // Wait for connection event
        const timeout = setTimeout(() => {
          mongoose.connection.removeListener('connected', onConnected);
          reject(new Error('MongoDB connection not ready - cannot initialize packages'));
        }, 10000); // 10 second timeout
        
        const onConnected = () => {
          clearTimeout(timeout);
          mongoose.connection.removeListener('connected', onConnected);
          resolve();
        };
        
        mongoose.connection.once('connected', onConnected);
      });
    };
    
    // Wait for connection before proceeding
    await waitForConnection();
    
    // Now initialize packages
    await BoostPackageTemplate.initializeDefaults();
    console.log('✅ Default boost packages initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing default boost packages:', error.message);
    // Don't throw - let server continue without packages
    // Packages can be initialized later when database is connected
  }
};

module.exports = {
  getAllBoostPackages,
  getBoostPackageById,
  createBoostPackage,
  updateBoostPackage,
  deleteBoostPackage,
  getUserBoostOrders,
  deleteUserBoostOrder,
  updateUserBoostOrder,
  initializeDefaultPackages
};
