const express = require('express');
const router = express.Router();
const {
  getPublicCategories,
  getCategoriesByProduct,
  getPublicCategory
} = require('../controllers/publicCategoryController');

// @route   GET /api/categories
// @desc    Get all public categories
// @access  Public
router.get('/', getPublicCategories);

// @route   GET /api/categories/product/:productId
// @desc    Get categories by product
// @access  Public
router.get('/product/:productId', getCategoriesByProduct);

// @route   GET /api/categories/:id
// @desc    Get single public category
// @access  Public
router.get('/:id', getPublicCategory);

module.exports = router;
