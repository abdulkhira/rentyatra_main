const Product = require('../models/Product');
const { cloudinary, deleteImage, extractPublicId } = require('../config/cloudinary');
const emailService = require('../services/emailService');

// @desc    Add new product (Admin only)
// @route   POST /api/admin/products
// @access  Private (Admin)
const addProduct = async (req, res) => {
  try {
    console.log('=== Add Product Request ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Admin info:', req.admin);

    const { name } = req.body;

    // Validate required fields
    if (!name) {
      console.log('Validation failed: Product name is required');
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
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

    // Create product data
    const productData = {
      name: name.trim(),
      images,
      addedBy: req.admin._id,
      isVerified: true, // Admin added products are auto-verified
      verifiedAt: new Date(),
      verifiedBy: req.admin._id
    };

    console.log('Product data to save:', productData);

    // Create the product
    const product = new Product(productData);
    await product.save();
    console.log('Product saved successfully:', product._id);

    // Populate addedBy field for response
    await product.populate([
      { path: 'addedBy', select: 'name email' }
    ]);

    console.log('Product populated successfully');

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('=== Error adding product ===');
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
      message: 'Error adding product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private (Admin)
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
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
    const products = await Product.find(query)
      .populate('addedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single product (Admin)
// @route   GET /api/admin/products/:id
// @access  Private (Admin)
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('addedBy', 'name email')
      .populate('verifiedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res) => {
  try {
    console.log('=== Update Product Request ===');
    console.log('Product ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { name, status } = req.body;

    // Update fields
    if (name) product.name = name.trim();
    if (status) product.status = status;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      console.log('Processing', req.files.length, 'new uploaded files');
      
      // Delete old images from Cloudinary
      if (product.images && product.images.length > 0) {
        try {
          for (const image of product.images) {
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
      
      product.images = newImages;
    }

    await product.save();
    console.log('Product updated successfully:', product._id);

    // Populate fields for response
    await product.populate([
      { path: 'addedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('=== Error updating product ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      try {
        for (const image of product.images) {
          await deleteImage(image.publicId);
        }
      } catch (imageError) {
        console.error('Error deleting images from Cloudinary:', imageError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // Delete the product
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update product status (Admin)
// @route   PUT /api/admin/products/:id/status
// @access  Private (Admin)
const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product was previously not verified (to detect approval)
    const wasNotVerified = !product.isVerified;
    
    // Update status using the model method
    await product.updateStatus(status, req.admin._id);

    // Populate fields for response
    await product.populate([
      { path: 'addedBy', select: 'name email' }
    ]);

    // Send approval notification email if product was just approved
    if (status === 'active' && wasNotVerified && product.isVerified) {
      try {
        const User = require('../models/User');
        const user = await User.findById(product.addedBy);
        
        if (user && user.email) {
          await emailService.sendRentalApprovalNotification(
            {
              title: product.name,
              category: product.tags && product.tags.length > 0 ? product.tags[0] : 'General',
              location: 'Online', // You might want to add location field to Product model
              rentalId: product._id
            },
            {
              name: user.name,
              email: user.email
            }
          );
        }
      } catch (emailError) {
        console.error('Failed to send rental approval notification email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product status updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get product statistics (Admin)
// @route   GET /api/admin/products/stats
// @access  Private (Admin)
const getProductStats = async (req, res) => {
  try {
    const stats = await Product.getProductStats();

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || {
          totalProducts: 0,
          activeProducts: 0,
          availableProducts: 0,
          verifiedProducts: 0,
          totalViews: 0,
          totalBookings: 0,
          totalEarnings: 0,
          averageRating: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getProductStats
};
