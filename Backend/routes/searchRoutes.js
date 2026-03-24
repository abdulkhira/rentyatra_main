const express = require('express');
const router = express.Router();
const { searchProducts, getSearchSuggestions, handleSearchRedirect } = require('../controllers/searchController');

// Search routes
router.get('/products', searchProducts);
router.get('/suggestions', getSearchSuggestions);
router.get('/redirect', handleSearchRedirect);

module.exports = router;
