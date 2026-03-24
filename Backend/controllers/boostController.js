const User = require('../models/User');
const BoostPackage = require('../models/BoostPackage');
const BoostPurchase = require('../models/BoostPurchase');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Initialize Razorpay
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('⚠️  RAZORPAY ENVIRONMENT VARIABLES NOT CONFIGURED!');
    console.error('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');
    console.error('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay initialized for boost payments');
    console.log('🔑 Razorpay Key ID:', process.env.RAZORPAY_KEY_ID.substring(0, 8) + '...');
  }
} catch (error) {
  console.error('❌ Failed to initialize Razorpay for boost payments:', error.message);
  console.error('Error details:', error);
  razorpay = null;
}

// Get user boost credits
const getUserBoostCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('boostCredits');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize boost credits if not exists
    if (!user.boostCredits) {
      user.boostCredits = {
        freeBoosts: 2,
        purchasedBoosts: 0,
        usedBoosts: 0,
        remainingBoosts: 2
      };
      await user.save();
    } else {
      // CRITICAL: Recalculate remainingBoosts to ensure it's correct
      // This fixes any data inconsistencies
      const calculatedRemaining = (user.boostCredits.freeBoosts || 0) + 
                                  (user.boostCredits.purchasedBoosts || 0) - 
                                  (user.boostCredits.usedBoosts || 0);
      
      // If there's a mismatch, fix it
      if (user.boostCredits.remainingBoosts !== calculatedRemaining) {
        console.log('🔧 Fixing boost credits calculation:', {
          oldRemaining: user.boostCredits.remainingBoosts,
          calculatedRemaining: calculatedRemaining,
          freeBoosts: user.boostCredits.freeBoosts,
          purchasedBoosts: user.boostCredits.purchasedBoosts,
          usedBoosts: user.boostCredits.usedBoosts
        });
        user.boostCredits.remainingBoosts = calculatedRemaining;
        await user.save();
      }
      
      // CRITICAL: Ensure values are not corrupted (e.g., NaN, negative, or extremely high)
      if (isNaN(user.boostCredits.remainingBoosts) || 
          user.boostCredits.remainingBoosts < 0 || 
          user.boostCredits.remainingBoosts > 10000) {
        console.warn('⚠️ Invalid boost credits detected, resetting to defaults:', user.boostCredits);
        user.boostCredits = {
          freeBoosts: 2,
          purchasedBoosts: 0,
          usedBoosts: 0,
          remainingBoosts: 2
        };
        await user.save();
      }
    }

    // Removed verbose logging - only log in development or on errors
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Returning boost credits:', {
        freeBoosts: user.boostCredits.freeBoosts,
        purchasedBoosts: user.boostCredits.purchasedBoosts,
        usedBoosts: user.boostCredits.usedBoosts,
        remainingBoosts: user.boostCredits.remainingBoosts
      });
    }

    res.status(200).json({
      success: true,
      boostCredits: user.boostCredits
    });
  } catch (error) {
    console.error('Error getting user boost credits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get boost credits',
      error: error.message
    });
  }
};

// Get boost packages
const getBoostPackages = async (req, res) => {
  try {
    // Import BoostPackageTemplate model (we'll create this)
    const BoostPackageTemplate = require('../models/BoostPackageTemplate');
    
    // Try to fetch from database first
    try {
      const packages = await BoostPackageTemplate.find({ isActive: true }).sort({ price: 1 });
      
      if (packages.length > 0) {
        return res.status(200).json({
          success: true,
          data: packages
        });
      }
    } catch (error) {
      console.log('BoostPackageTemplate model not found, using fallback packages');
    }
    
    // Fallback to hardcoded packages if database is not set up
    const packages = [
      {
        id: 'boost-1',
        name: 'Quick Boost',
        price: 99,
        features: [
          'Top placement in search results',
          'Increased visibility',
          'Priority in category listings',
          'Email notifications',
          '4 boosts included'
        ],
        icon: 'Zap',
        color: 'yellow',
        popular: false,
        boostCount: 4
      },
      {
        id: 'boost-3',
        name: 'Power Boost',
        price: 249,
        features: [
          'Premium placement in search results',
          'Maximum visibility',
          'Featured in category listings',
          'Priority customer support',
          'Email notifications',
          '8 boosts included'
        ],
        icon: 'Rocket',
        color: 'orange',
        popular: true,
        boostCount: 8
      },
      {
        id: 'boost-7',
        name: 'Mega Boost',
        price: 499,
        features: [
          'Ultimate placement in search results',
          'Maximum visibility across platform',
          'Priority customer support',
          'Email notifications',
          '12 boosts included'
        ],
        icon: 'Crown',
        color: 'purple',
        popular: false,
        boostCount: 12
      }
    ];

    res.status(200).json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error getting boost packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get boost packages',
      error: error.message
    });
  }
};

// Get user's boost orders
const getUserBoosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query - fetch from BoostPurchase model
    const query = { user: userId };
    if (status) {
      query.status = status;
    }
    
    // Get boost purchases with pagination
    const skip = (page - 1) * limit;
    const boostPurchases = await BoostPurchase.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email phone')
      .lean();
    
    // Get total count for pagination
    const totalCount = await BoostPurchase.countDocuments(query);
    
    // Transform data to match frontend expectations
    const transformedBoosts = boostPurchases.map(purchase => ({
      id: purchase._id,
      _id: purchase._id,
      packageId: purchase.packageId,
      packageName: purchase.packageName,
      boostName: purchase.packageName, // For compatibility
      boostCount: purchase.boostCount,
      price: purchase.price,
      totalAmount: purchase.totalAmount,
      currency: purchase.currency,
      status: purchase.status === 'completed' ? 'active' : purchase.status, // Map 'completed' to 'active' for frontend
      paymentStatus: purchase.paymentStatus,
      paymentId: purchase.razorpayPaymentId,
      orderId: purchase.razorpayOrderId,
      paymentDetails: {
        razorpayOrderId: purchase.razorpayOrderId,
        razorpayPaymentId: purchase.razorpayPaymentId,
        razorpaySignature: purchase.razorpaySignature,
        paymentMethod: purchase.paymentMethod,
        paymentDate: purchase.paymentDate
      },
      creditsAdded: purchase.creditsAdded,
      usedBoosts: purchase.usedBoosts || 0,
      remainingBoosts: (purchase.boostCount || 0) - (purchase.usedBoosts || 0),
      validFrom: purchase.createdAt,
      validUntil: purchase.createdAt ? new Date(new Date(purchase.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000) : null, // 1 year validity
      startDate: purchase.createdAt,
      endDate: purchase.createdAt ? new Date(new Date(purchase.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000) : null,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: transformedBoosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalBoosts: totalCount,
        hasNextPage: skip + parseInt(limit) < totalCount,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting user boosts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user boosts',
      error: error.message
    });
  }
};

// Get boost statistics
const getBoostStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const user = await User.findById(userId).select('boostCredits');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize boost credits if not exists
    if (!user.boostCredits) {
      user.boostCredits = {
        freeBoosts: 2,
        purchasedBoosts: 0,
        usedBoosts: 0,
        remainingBoosts: 2
      };
      await user.save();
    }

    // Calculate statistics from BoostPackage model
    const totalPackages = await BoostPackage.countDocuments({ user: userId });
    const activePackages = await BoostPackage.countDocuments({ 
      user: userId, 
      status: 'active',
      validUntil: { $gt: new Date() }
    });
    
    const totalPurchasedBoosts = await BoostPackage.aggregate([
      { $match: { user: userId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$boostCount' } } }
    ]);
    
    const totalUsedBoosts = await BoostPackage.aggregate([
      { $match: { user: userId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$usedBoosts' } } }
    ]);
    
    const totalRemainingBoosts = await BoostPackage.aggregate([
      { $match: { 
        user: userId, 
        paymentStatus: 'paid',
        status: 'active',
        validUntil: { $gt: new Date() }
      }},
      { $group: { _id: null, total: { $sum: '$remainingBoosts' } } }
    ]);
    
    const totalSpent = await BoostPackage.aggregate([
      { $match: { user: userId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const stats = {
      totalBoosts: user.boostCredits.freeBoosts + user.boostCredits.purchasedBoosts,
      freeBoosts: user.boostCredits.freeBoosts,
      purchasedBoosts: user.boostCredits.purchasedBoosts,
      usedBoosts: user.boostCredits.usedBoosts,
      remainingBoosts: user.boostCredits.remainingBoosts,
      boostUtilizationRate: user.boostCredits.usedBoosts > 0 
        ? Math.round((user.boostCredits.usedBoosts / (user.boostCredits.freeBoosts + user.boostCredits.purchasedBoosts)) * 100)
        : 0,
      // Additional stats from BoostPackage model
      totalPackages: totalPackages,
      activePackages: activePackages,
      totalPurchasedBoostsFromPackages: totalPurchasedBoosts[0]?.total || 0,
      totalUsedBoostsFromPackages: totalUsedBoosts[0]?.total || 0,
      totalRemainingBoostsFromPackages: totalRemainingBoosts[0]?.total || 0,
      totalSpentOnBoosts: totalSpent[0]?.total || 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting boost stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get boost statistics',
      error: error.message
    });
  }
};

// Create boost order
const createBoostOrder = async (req, res) => {
  try {
    const { rentalRequestId, boostType } = req.body;
    const userId = req.user.userId;

    // For now, return a mock response since we don't have a Boost model
    // In a real implementation, you'd create a Boost document
    const mockBoost = {
      id: `boost_${Date.now()}`,
      userId: userId,
      rentalRequestId: rentalRequestId,
      boostType: boostType,
      status: 'pending',
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Boost order created successfully',
      data: mockBoost
    });
  } catch (error) {
    console.error('Error creating boost order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create boost order',
      error: error.message
    });
  }
};

// Get boosts for a specific rental request
const getRentalRequestBoosts = async (req, res) => {
  try {
    const { rentalRequestId } = req.params;
    
    // For now, return mock data
    const mockBoosts = [
      {
        id: 'boost-1',
        rentalRequestId: rentalRequestId,
        boostType: 'boost-1',
        boostName: 'Quick Boost',
        price: 99,
        duration: '1 month',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus: 'paid'
      }
    ];

    res.status(200).json({
      success: true,
      data: mockBoosts
    });
  } catch (error) {
    console.error('Error getting rental request boosts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get boosts for rental request',
      error: error.message
    });
  }
};

// Update boost payment status
const updateBoostPayment = async (req, res) => {
  try {
    const { boostId } = req.params;
    const { paymentStatus, paymentDetails } = req.body;

    // For now, return a mock response
    res.status(200).json({
      success: true,
      message: 'Boost payment status updated successfully',
      data: {
        boostId: boostId,
        paymentStatus: paymentStatus,
        paymentDetails: paymentDetails
      }
    });
  } catch (error) {
    console.error('Error updating boost payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update boost payment',
      error: error.message
    });
  }
};

// Cancel boost order
const cancelBoostOrder = async (req, res) => {
  try {
    const { boostId } = req.params;
    const userId = req.user.userId;

    // For now, return a mock response
    res.status(200).json({
      success: true,
      message: 'Boost order cancelled successfully',
      data: {
        boostId: boostId,
        userId: userId,
        status: 'cancelled'
      }
    });
  } catch (error) {
    console.error('Error cancelling boost order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel boost order',
      error: error.message
    });
  }
};

// Sync boost usage between User.boostCredits and BoostPackage
const syncBoostUsage = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's boost credits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all active boost packages
    const activePackages = await BoostPackage.find({
      user: userId,
      status: 'active',
      validUntil: { $gt: new Date() }
    });

    console.log('🔄 Syncing boost usage for user:', userId);
    console.log('👤 User boost credits:', user.boostCredits);
    console.log('📦 Active packages:', activePackages.map(pkg => ({
      id: pkg._id,
      packageName: pkg.packageName,
      usedBoosts: pkg.usedBoosts,
      remainingBoosts: pkg.remainingBoosts,
      boostCount: pkg.boostCount
    })));

    // Calculate total used boosts from packages
    const totalUsedFromPackages = activePackages.reduce((total, pkg) => total + pkg.usedBoosts, 0);
    const totalRemainingFromPackages = activePackages.reduce((total, pkg) => total + pkg.remainingBoosts, 0);

    console.log('📊 Package totals:', {
      totalUsedFromPackages,
      totalRemainingFromPackages,
      userUsedBoosts: user.boostCredits.usedBoosts
    });

    // If user has used more boosts than packages show, update packages
    if (user.boostCredits.usedBoosts > totalUsedFromPackages) {
      const difference = user.boostCredits.usedBoosts - totalUsedFromPackages;
      console.log('🔧 Need to update packages by:', difference);

      // Update the most recent active package
      const mostRecentPackage = activePackages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      
      if (mostRecentPackage) {
        mostRecentPackage.usedBoosts += difference;
        mostRecentPackage.remainingBoosts = mostRecentPackage.boostCount - mostRecentPackage.usedBoosts;
        await mostRecentPackage.save();
        
        console.log('✅ Updated package:', {
          id: mostRecentPackage._id,
          newUsedBoosts: mostRecentPackage.usedBoosts,
          newRemainingBoosts: mostRecentPackage.remainingBoosts
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Boost usage synced successfully',
      data: {
        userBoostCredits: user.boostCredits,
        activePackages: activePackages.map(pkg => ({
          id: pkg._id,
          packageName: pkg.packageName,
          usedBoosts: pkg.usedBoosts,
          remainingBoosts: pkg.remainingBoosts,
          boostCount: pkg.boostCount
        }))
      }
    });
  } catch (error) {
    console.error('Error syncing boost usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync boost usage',
      error: error.message
    });
  }
};

// @desc    Create boost payment order
// @route   POST /api/boost/create-payment-order
// @access  Private
const createBoostPaymentOrder = asyncHandler(async (req, res) => {
  try {
    console.log('📥 Boost payment order request received:', {
      body: req.body,
      userId: req.user?.userId,
      hasRazorpay: !!razorpay
    });

    if (!razorpay) {
      console.error('❌ Razorpay not initialized');
      return res.status(500).json({
        success: false,
        message: 'Razorpay service not configured'
      });
    }

    const { packageId, packageName, boostCount, price } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      console.error('❌ User ID not found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!packageId || !packageName || !boostCount || !price) {
      console.error('❌ Missing required fields:', { packageId, packageName, boostCount, price });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: packageId, packageName, boostCount, price'
      });
    }

    // Calculate GST (18%)
    const gstAmount = Math.round(price * 0.18);
    const totalAmount = price + gstAmount;

    // Convert to paise for Razorpay
    const amountInPaise = Math.round(totalAmount * 100);

    // Validate amount (minimum 100 paise = 1 rupee)
    if (amountInPaise < 100) {
      console.error('❌ Amount too small:', amountInPaise);
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1.00'
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      notes: {
        payment_type: 'boost_payment',
        package_id: packageId,
        package_name: packageName,
        boost_count: boostCount.toString(),
        user_id: userId.toString(),
        price: price.toString(),
        gst_amount: gstAmount.toString(),
        total_amount: totalAmount.toString()
      },
      payment_capture: 1
    };

    console.log('💳 Creating Razorpay order with options:', orderOptions);
    
    let razorpayOrder;
    try {
      // Verify Razorpay is initialized before making API call
      if (!razorpay) {
        console.error('❌ Razorpay not initialized before order creation');
        return res.status(500).json({
          success: false,
          message: 'Payment service not configured. Please contact support.',
          error: 'Razorpay not initialized'
        });
      }

      razorpayOrder = await razorpay.orders.create(orderOptions);
      console.log('✅ Razorpay order created:', razorpayOrder.id);
    } catch (razorpayError) {
      console.error('❌ Razorpay API Error:', razorpayError);
      console.error('Razorpay Error Type:', typeof razorpayError);
      console.error('Razorpay Error Constructor:', razorpayError?.constructor?.name);
      console.error('Razorpay Error Keys:', Object.keys(razorpayError || {}));
      
      // Log all possible error properties
      console.error('Razorpay Error Details:', {
        name: razorpayError?.name,
        message: razorpayError?.message,
        statusCode: razorpayError?.statusCode,
        status: razorpayError?.status,
        error: razorpayError?.error,
        description: razorpayError?.description,
        field: razorpayError?.field,
        source: razorpayError?.source,
        step: razorpayError?.step,
        reason: razorpayError?.reason,
        metadata: razorpayError?.metadata,
        code: razorpayError?.code,
        httpStatusCode: razorpayError?.httpStatusCode
      });
      
      // Try to stringify the error for full visibility
      try {
        console.error('Full Razorpay Error (stringified):', JSON.stringify(razorpayError, Object.getOwnPropertyNames(razorpayError)));
      } catch (stringifyError) {
        console.error('Could not stringify error:', stringifyError);
      }
      
      // Extract meaningful error message from Razorpay error
      let errorMessage = 'Failed to create Razorpay order';
      
      // Try different error structures
      if (razorpayError?.error?.description) {
        errorMessage = razorpayError.error.description;
      } else if (razorpayError?.error?.message) {
        errorMessage = razorpayError.error.message;
      } else if (razorpayError?.description) {
        errorMessage = razorpayError.description;
      } else if (razorpayError?.message) {
        errorMessage = razorpayError.message;
      } else if (typeof razorpayError === 'string') {
        errorMessage = razorpayError;
      } else if (razorpayError?.error && typeof razorpayError.error === 'string') {
        errorMessage = razorpayError.error;
      }
      
      // Check for common Razorpay errors
      if (errorMessage.includes('authentication') || errorMessage.includes('key')) {
        errorMessage = 'Payment service configuration error. Please contact support.';
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorMessage,
        errorType: 'RazorpayError',
        details: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production' ? {
          errorName: razorpayError?.name,
          errorMessage: razorpayError?.message,
          statusCode: razorpayError?.statusCode || razorpayError?.status,
          hasErrorObject: !!razorpayError?.error
        } : undefined
      });
    }

    // Create boost purchase record in database
    console.log('💾 Creating boost purchase record in database...');
    
    // Ensure userId is a valid ObjectId
    let userObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } else {
        throw new Error(`Invalid user ID format: ${userId}`);
      }
    } catch (idError) {
      console.error('❌ Invalid user ID:', idError);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        error: idError.message
      });
    }

    const boostPurchaseData = {
      user: userObjectId,
      packageId: String(packageId),
      packageName: String(packageName),
      boostCount: Number(boostCount),
      price: Number(price),
      gstAmount: Number(gstAmount),
      totalAmount: Number(totalAmount),
      currency: 'INR',
      razorpayOrderId: String(razorpayOrder.id),
      paymentStatus: 'pending',
      status: 'pending',
      source: req.headers['user-agent']?.includes('wv') || req.headers['user-agent']?.includes('WebView') ? 'mobile_apk' : 'web',
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection.remoteAddress || ''
    };

    console.log('💾 Boost purchase data:', boostPurchaseData);

    const boostPurchase = new BoostPurchase(boostPurchaseData);

    console.log('💾 Saving boost purchase to database...');
    try {
      await boostPurchase.save();
      console.log('✅ Boost purchase saved:', boostPurchase._id);
    } catch (saveError) {
      console.error('❌ Error saving boost purchase:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Validation errors:', saveError.errors);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: saveError.message,
          validationErrors: Object.keys(saveError.errors || {}).map(key => ({
            field: key,
            message: saveError.errors[key].message
          }))
        });
      }
      throw saveError;
    }

    console.log('✅ Boost payment order created:', {
      orderId: razorpayOrder.id,
      purchaseId: boostPurchase._id,
      userId,
      packageId,
      amount: totalAmount
    });

    res.json({
      success: true,
      message: 'Boost payment order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        currency: razorpayOrder.currency,
        purchaseId: boostPurchase._id,
        packageId,
        packageName,
        boostCount,
        price,
        gstAmount,
        totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error creating boost payment order:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Extract meaningful error message
    let errorMessage = 'Failed to create boost payment order';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error && error.error.description) {
      errorMessage = error.error.description;
    } else if (error.description) {
      errorMessage = error.description;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorMessage,
      errorType: error.name || 'UnknownError',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        fullError: error.toString()
      } : undefined
    });
  }
});

// @desc    Verify boost payment
// @route   POST /api/boost/verify-payment
// @access  Private
const verifyBoostPayment = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.userId;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: razorpay_order_id, razorpay_payment_id'
      });
    }

    // Find boost purchase by order ID
    const boostPurchase = await BoostPurchase.findOne({
      razorpayOrderId: razorpay_order_id,
      user: userId
    });

    if (!boostPurchase) {
      return res.status(404).json({
        success: false,
        message: 'Boost purchase order not found'
      });
    }

    // Check if already processed
    if (boostPurchase.paymentStatus === 'paid' && boostPurchase.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        data: {
          purchaseId: boostPurchase._id,
          boostCount: boostPurchase.creditsAdded,
          paymentStatus: boostPurchase.paymentStatus
        }
      });
    }

    // Verify signature if provided
    if (razorpay_signature) {
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.error('❌ Signature verification failed');
        boostPurchase.paymentStatus = 'failed';
        boostPurchase.status = 'failed';
        await boostPurchase.save();

        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed'
        });
      }
    }

    // OPTIMIZED: Verify payment with Razorpay API (single fetch, no retries)
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        boostPurchase.paymentStatus = 'failed';
        boostPurchase.status = 'failed';
        await boostPurchase.save();

        return res.status(400).json({
          success: false,
          message: `Payment not successful. Status: ${payment.status}`
        });
      }

      // Update boost purchase with payment details
      boostPurchase.razorpayPaymentId = razorpay_payment_id;
      boostPurchase.razorpaySignature = razorpay_signature || '';
      boostPurchase.paymentStatus = 'paid';
      boostPurchase.paymentMethod = payment.method || 'unknown';
      boostPurchase.paymentDate = new Date();
      boostPurchase.status = 'completed';

      // Add boost credits to user account
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Initialize boost credits if not exists
      if (!user.boostCredits) {
        user.boostCredits = {
          freeBoosts: 0,
          purchasedBoosts: 0,
          usedBoosts: 0,
          remainingBoosts: 0
        };
      }

      // Add purchased boosts
      const previousPurchased = user.boostCredits.purchasedBoosts || 0;
      user.boostCredits.purchasedBoosts = previousPurchased + boostPurchase.boostCount;
      user.boostCredits.remainingBoosts = (user.boostCredits.freeBoosts || 0) + 
                                         user.boostCredits.purchasedBoosts - 
                                         (user.boostCredits.usedBoosts || 0);

      boostPurchase.creditsAdded = boostPurchase.boostCount;

      // Save both in transaction
      await Promise.all([
        user.save(),
        boostPurchase.save()
      ]);

      console.log('✅ Boost payment verified and credits added:', {
        purchaseId: boostPurchase._id,
        userId,
        boostCount: boostPurchase.boostCount,
        totalPurchased: user.boostCredits.purchasedBoosts,
        remaining: user.boostCredits.remainingBoosts
      });

      res.json({
        success: true,
        message: 'Boost payment verified successfully',
        data: {
          purchaseId: boostPurchase._id,
          boostCount: boostPurchase.boostCount,
          creditsAdded: boostPurchase.creditsAdded,
          totalPurchased: user.boostCredits.purchasedBoosts,
          remainingBoosts: user.boostCredits.remainingBoosts,
          paymentStatus: boostPurchase.paymentStatus
        }
      });

    } catch (razorpayError) {
      console.error('❌ Razorpay API error:', razorpayError);
      
      // If payment exists in Razorpay but verification fails, mark as failed
      boostPurchase.paymentStatus = 'failed';
      boostPurchase.status = 'failed';
      await boostPurchase.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment with Razorpay',
        error: razorpayError.message
      });
    }

  } catch (error) {
    console.error('❌ Error verifying boost payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify boost payment',
      error: error.message
    });
  }
});

module.exports = {
  getUserBoostCredits,
  getBoostPackages,
  getUserBoosts,
  getBoostStats,
  createBoostOrder,
  getRentalRequestBoosts,
  updateBoostPayment,
  cancelBoostOrder,
  syncBoostUsage,
  createBoostPaymentOrder,
  verifyBoostPayment
};