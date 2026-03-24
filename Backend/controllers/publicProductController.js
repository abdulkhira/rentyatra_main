const Product = require('../models/Product');

// @desc    Get all public products (for regular users)
// @route   GET /api/products
// @access  Public
const getPublicProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - only show active and verified products
    const query = {
      status: 'active',
      isVerified: true
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(query)
      .populate('addedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-verifiedBy -verifiedAt'); // Exclude admin-specific fields

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          hasNext: skip + products.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single public product (for regular users)
// @route   GET /api/products/:id
// @access  Public
const getPublicProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: 'active',
      isVerified: true
    })
      .populate('addedBy', 'name email')
      .select('-verifiedBy -verifiedAt'); // Exclude admin-specific fields

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Error fetching public product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get featured products (for homepage)
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  // Check MongoDB connection before proceeding
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected, cannot fetch featured products');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again later.',
      error: 'MongoDB connection not established'
    });
  }

  try {
    const { limit = 8 } = req.query;

    // Get recent active and verified products
    const products = await Product.find({
      status: 'active',
      isVerified: true
    })
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-verifiedBy -verifiedAt'); // Exclude admin-specific fields

    res.status(200).json({
      success: true,
      data: {
        products
      }
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getPublicProducts,
  getPublicProduct,
  getFeaturedProducts
};
