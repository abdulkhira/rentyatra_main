const express = require('express');
const router = express.Router();
const {
  addBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');
const { adminAuth } = require('../middleware/adminAuth');

// Public routes (no authentication required)
router.get('/public', getAllBanners); // Get active banners for public display
router.get('/public/:id', getBannerById); // Get a single banner for public display

// Admin routes (require authentication)
router.use(adminAuth);

// Banner CRUD routes
router.post('/', addBanner);
router.get('/', getAllBanners);
router.get('/:id', getBannerById);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);

module.exports = router;
