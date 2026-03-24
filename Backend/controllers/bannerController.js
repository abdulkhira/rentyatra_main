const Banner = require('../models/Banner');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for full quality images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Add banner
const addBanner = async (req, res) => {
  try {
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Banner image is required'
        });
      }

      const { title } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Banner title is required'
        });
      }

      // Upload image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'rentyatra/banners',
            quality: 'auto'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      // Create banner
      const banner = new Banner({
        title,
        banner: result.secure_url
      });

      await banner.save();

      res.status(201).json({
        success: true,
        message: 'Banner added successfully',
        data: banner
      });
    });
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all banners
const getAllBanners = async (req, res) => {
  // Check MongoDB connection before proceeding
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.error('❌ MongoDB not connected, cannot fetch banners');
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again later.',
      error: 'MongoDB connection not established'
    });
  }

  try {
    const { page = 1, limit = 10 } = req.query;
    const query = {};

    const banners = await Banner.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Banner.countDocuments(query);

    res.json({
      success: true,
      data: {
        banners,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalBanners: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get banner by ID
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update banner
const updateBanner = async (req, res) => {
  try {
    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      const { title } = req.body;
      const banner = await Banner.findById(req.params.id);

      if (!banner) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }

      // Update fields
      if (title) banner.title = title;

      // Handle new image upload
      if (req.file) {
        // Upload new image
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: 'rentyatra/banners',
              quality: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });

        banner.banner = result.secure_url;
      }

      await banner.save();

      res.json({
        success: true,
        message: 'Banner updated successfully',
        data: banner
      });
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete banner
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


module.exports = {
  addBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
};
