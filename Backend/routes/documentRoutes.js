const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadAadhar, uploadPAN, uploadProfile } = require('../config/cloudinary');
const {
  uploadAadharCard,
  uploadPANCard,
  uploadProfileImage,
  getDocumentStatus,
  deleteDocument
} = require('../controllers/documentController');

// @route   POST /api/documents/upload-aadhar
// @desc    Upload Aadhar card images
// @access  Private
router.post('/upload-aadhar', protect, uploadAadhar.array('images', 2), uploadAadharCard);

// @route   POST /api/documents/upload-pan
// @desc    Upload PAN card images
// @access  Private
router.post('/upload-pan', protect, uploadPAN.array('images', 2), uploadPANCard);

// @route   POST /api/documents/upload-profile
// @desc    Upload profile image
// @access  Private
router.post('/upload-profile', protect, uploadProfile.single('image'), uploadProfileImage);

// @route   GET /api/documents/status
// @desc    Get document verification status
// @access  Private
router.get('/status', protect, getDocumentStatus);

// @route   DELETE /api/documents/delete/:type
// @desc    Delete document images (aadhar or pan)
// @access  Private
router.delete('/delete/:type', protect, deleteDocument);

module.exports = router;
