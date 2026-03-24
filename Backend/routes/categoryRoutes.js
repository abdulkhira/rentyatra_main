const express = require('express');
const router = express.Router();
const {
  addCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  getCategoryStats
} = require('../controllers/categoryController');

const { adminAuth, checkAdminPermission } = require('../middleware/adminAuth');
const { uploadCategory } = require('../config/cloudinary');

// @route   POST /api/admin/categories
// @desc    Add new category (Admin only)
// @access  Private (Admin)
router.post('/', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  uploadCategory.array('images', 10),
  addCategory
);

// @route   GET /api/admin/categories
// @desc    Get all categories (Admin)
// @access  Private (Admin)
router.get('/', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  getAllCategories
);

// @route   GET /api/admin/categories/stats
// @desc    Get category statistics (Admin)
// @access  Private (Admin)
router.get('/stats', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  getCategoryStats
);

// @route   GET /api/admin/categories/:id
// @desc    Get single category (Admin)
// @access  Private (Admin)
router.get('/:id', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  getCategory
);

// @route   PUT /api/admin/categories/:id
// @desc    Update category (Admin)
// @access  Private (Admin)
router.put('/:id', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  uploadCategory.array('images', 10),
  updateCategory
);

// @route   PUT /api/admin/categories/:id/status
// @desc    Update category status (Admin)
// @access  Private (Admin)
router.put('/:id/status', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  updateCategoryStatus
);

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category (Admin)
// @access  Private (Admin)
router.delete('/:id', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  deleteCategory
);

module.exports = router;
