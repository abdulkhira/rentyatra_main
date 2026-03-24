const express = require('express');
const router = express.Router();
const {
  getAllBoostPackages,
  getBoostPackageById,
  createBoostPackage,
  updateBoostPackage,
  deleteBoostPackage,
  getUserBoostOrders,
  deleteUserBoostOrder,
  updateUserBoostOrder,
  initializeDefaultPackages
} = require('../controllers/adminBoostController');
const { adminAuth } = require('../middleware/adminAuth');

// Initialize default packages (one-time setup)
router.post('/initialize', adminAuth, initializeDefaultPackages);

// Get all boost packages
router.get('/', adminAuth, getAllBoostPackages);

// Get user boost orders
router.get('/user-boosts', (req, res, next) => {
  console.log('🚀 Admin user-boosts route hit');
  next();
}, adminAuth, getUserBoostOrders);

// Delete user boost order
router.delete('/user-boosts/:id', adminAuth, deleteUserBoostOrder);

// Update user boost order
router.put('/user-boosts/:id', adminAuth, updateUserBoostOrder);

// Get boost package by ID
router.get('/:id', adminAuth, getBoostPackageById);

// Create new boost package
router.post('/', adminAuth, createBoostPackage);

// Update boost package
router.put('/:id', adminAuth, updateBoostPackage);

// Delete boost package
router.delete('/:id', adminAuth, deleteBoostPackage);

module.exports = router;
