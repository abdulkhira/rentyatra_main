const express = require('express');
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getProductStats
} = require('../controllers/productController');

const { adminAuth, checkAdminPermission } = require('../middleware/adminAuth');
const { uploadProduct } = require('../config/cloudinary');

// @route   POST /api/admin/products
// @desc    Add new product (Admin only)
// @access  Private (Admin)
router.post('/', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  uploadProduct.array('images', 10),
  addProduct
);

// @route   GET /api/admin/products
// @desc    Get all products (Admin)
// @access  Private (Admin)
router.get('/', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  getAllProducts
);

// @route   GET /api/admin/products/stats
// @desc    Get product statistics (Admin)
// @access  Private (Admin)
router.get('/stats', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  getProductStats
);

// @route   GET /api/admin/products/:id
// @desc    Get single product (Admin)
// @access  Private (Admin)
router.get('/:id', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  getProduct
);

// @route   PUT /api/admin/products/:id
// @desc    Update product (Admin)
// @access  Private (Admin)
router.put('/:id', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  uploadProduct.array('images', 10),
  updateProduct
);

// @route   PUT /api/admin/products/:id/status
// @desc    Update product status (Admin)
// @access  Private (Admin)
router.put('/:id/status', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  updateProductStatus
);

// @route   DELETE /api/admin/products/:id
// @desc    Delete product (Admin)
// @access  Private (Admin)
router.delete('/:id', 
  adminAuth, 
  checkAdminPermission('productManagement'),
  deleteProduct
);

module.exports = router;
