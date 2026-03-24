const Category = require('../models/Category');
const Product = require('../models/Product');
const { cloudinary, deleteImage, extractPublicId } = require('../config/cloudinary');

// @desc    Add new category (Admin only)
// @route   POST /api/admin/categories
// @access  Private (Admin)
const addCategory = async (req, res) => {
  try {
    console.log('=== Add Category Request ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Admin info:', req.admin);
    console.log('Request headers:', req.headers);

    const { productId, name } = req.body;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product selection is required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if product exists
    console.log('Looking for product with ID:', productId);
    const product = await Product.findById(productId);
    console.log('Found product:', product);
    if (!product) {
      console.log('Product not found');
      return res.status(404).json({
        success: false,
        message: 'Selected product not found'
      });
    }

    // Check if category with same name already exists for this product
    console.log('Checking for existing category with name:', name.trim());
    const existingCategory = await Category.findOne({
      product: productId,
      name: name.trim(),
      status: { $ne: 'deleted' }
    });
    console.log('Existing category found:', existingCategory);

    if (existingCategory) {
      console.log('Category already exists');
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists for the selected product'
      });
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      console.log('Processing', req.files.length, 'uploaded files');
      req.files.forEach((file, index) => {
        console.log(`File ${index}:`, {
          originalname: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        });
        images.push({
          url: file.path,
          publicId: file.filename,
          isPrimary: index === 0, // First image is primary
          uploadedAt: new Date()
        });
      });
    } else {
      console.log('No files uploaded');
    }

    // Create category data
    const categoryData = {
      product: productId,
      name: name.trim(),
      images,
      addedBy: req.admin._id,
      isVerified: true, // Admin added categories are auto-verified
      verifiedAt: new Date(),
      verifiedBy: req.admin._id
    };

    console.log('Category data to save:', categoryData);

    // Create the category
    console.log('Creating new Category instance...');
    const category = new Category(categoryData);
    console.log('Category instance created:', category);
    
    console.log('Saving category to database...');
    await category.save();
    console.log('Category saved successfully:', category._id);

    // Populate fields for response
    await category.populate([
      { path: 'product', select: 'name images' },
      { path: 'addedBy', select: 'name email' }
    ]);

    console.log('Category populated successfully');

    res.status(201).json({
      success: true,
      message: 'Category added successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('=== Error adding category ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // If there's an error and images were uploaded, clean them up
    if (req.files && req.files.length > 0) {
      try {
        console.log('Cleaning up uploaded images...');
        for (const file of req.files) {
          await deleteImage(file.filename);
        }
        console.log('Images cleaned up successfully');
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded images:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error adding category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all categories (Admin)
// @route   GET /api/admin/categories
// @access  Private (Admin)
const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      status,
      search,
      productId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (productId) {
      query.product = productId;
    }

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
      .populate('product', 'name images')
      .populate('addedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single category (Admin)
// @route   GET /api/admin/categories/:id
// @access  Private (Admin)
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('product', 'name images')
      .populate('addedBy', 'name email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update category (Admin)
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
  try {
    console.log('=== Update Category Request ===');
    console.log('Category ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, status } = req.body;

    // Update fields
    if (name) category.name = name.trim();
    if (status) category.status = status;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      console.log('Processing', req.files.length, 'new uploaded files');
      
      // Delete old images from Cloudinary
      if (category.images && category.images.length > 0) {
        try {
          for (const image of category.images) {
            await deleteImage(image.publicId);
          }
          console.log('Old images deleted from Cloudinary');
        } catch (cleanupError) {
          console.error('Error deleting old images:', cleanupError);
        }
      }

      // Add new images
      const newImages = [];
      req.files.forEach((file, index) => {
        console.log(`New file ${index}:`, {
          originalname: file.originalname,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype
        });
        newImages.push({
          url: file.path,
          publicId: file.filename,
          isPrimary: index === 0, // First image is primary
          uploadedAt: new Date()
        });
      });
      
      category.images = newImages;
    }

    await category.save();
    console.log('Category updated successfully:', category._id);

    // Populate fields for response
    await category.populate([
      { path: 'product', select: 'name images' },
      { path: 'addedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('=== Error updating category ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete category (Admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Delete images from Cloudinary
    if (category.images && category.images.length > 0) {
      try {
        for (const image of category.images) {
          await deleteImage(image.publicId);
        }
      } catch (cleanupError) {
        console.error('Error deleting images from Cloudinary:', cleanupError);
      }
    }

    // Delete category from database
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update category status (Admin)
// @route   PUT /api/admin/categories/:id/status
// @access  Private (Admin)
const updateCategoryStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Update status using the model method
    await category.updateStatus(status, req.admin._id);

    // Populate fields for response
    await category.populate([
      { path: 'product', select: 'name images' },
      { path: 'addedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Category status updated successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Error updating category status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get category statistics (Admin)
// @route   GET /api/admin/categories/stats
// @access  Private (Admin)
const getCategoryStats = async (req, res) => {
  try {
    const stats = await Category.getCategoryStats();

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || {
          totalCategories: 0,
          activeCategories: 0,
          verifiedCategories: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  addCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  getCategoryStats
};
