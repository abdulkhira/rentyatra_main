const express = require('express');
const router = express.Router();
const {
  getPublicProducts,
  getPublicProduct,
  getFeaturedProducts
} = require('../controllers/publicProductController');

// @route   GET /api/products
// @desc    Get all public products
// @access  Public
router.get('/', getPublicProducts);

// @route   GET /api/products/featured
// @desc    Get featured products for homepage
// @access  Public
router.get('/featured', getFeaturedProducts);

// @route   GET /api/products/:id
// @desc    Get single public product
// @access  Public
router.get('/:id', getPublicProduct);

module.exports = router;
