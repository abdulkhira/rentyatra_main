const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all public categories (for regular users)
// @route   GET /api/categories
// @access  Public
const getPublicCategories = async (req, res) => {
  // Check MongoDB connection before proceeding
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected, cannot fetch categories');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again later.',
      error: 'MongoDB connection not established'
    });
  }

  try {
    const {
      page = 1,
      limit = 50,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - only show active and verified categories
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
    const categories = await Category.find(query)
      .populate('product', 'name images status isVerified')
      .populate('addedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-verifiedBy -verifiedAt'); // Exclude admin-specific fields

    // Filter out categories where the product is not active or verified
    const filteredCategories = categories.filter(category => 
      category.product && 
      category.product.status === 'active' && 
      category.product.isVerified
    );

    const total = await Category.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        categories: filteredCategories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCategories: total,
          hasNext: skip + filteredCategories.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get categories by product (for regular users)
// @route   GET /api/categories/product/:productId
// @access  Public
const getCategoriesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query - only show active and verified categories for specific product
    const query = {
      product: productId,
      status: 'active',
      isVerified: true
    };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const categories = await Category.find(query)
      .populate('product', 'name images status isVerified')
      .populate('addedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-verifiedBy -verifiedAt'); // Exclude admin-specific fields

    const total = await Category.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCategories: total,
          hasNext: skip + categories.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching categories by product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single public category (for regular users)
// @route   GET /api/categories/:id
// @access  Public
const getPublicCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      status: 'active',
      isVerified: true
    })
      .populate('product', 'name images status isVerified')
      .populate('addedBy', 'name email')
      .select('-verifiedBy -verifiedAt'); // Exclude admin-specific fields

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or not available'
      });
    }

    // Check if the associated product is active and verified
    if (!category.product || category.product.status !== 'active' || !category.product.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or not available'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Error fetching public category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getPublicCategories,
  getCategoriesByProduct,
  getPublicCategory
};
