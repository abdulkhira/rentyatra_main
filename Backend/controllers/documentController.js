const User = require('../models/User');
const { uploadAadhar, uploadPAN, uploadProfile, deleteImage, extractPublicId } = require('../config/cloudinary');
const ocrService = require('../services/ocrService');

// @desc    Upload Aadhar card images
// @route   POST /api/documents/upload-aadhar
// @access  Private
const uploadAadharCard = async (req, res) => {
  const userId = req.user.userId;
  const { aadharNumber } = req.body;

  try {
    // If no Aadhar number provided, we'll extract it from the image
    let extractedAadharNumber = aadharNumber;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload Aadhar card images (front and back)'
      });
    }

    // Check if exactly 2 files are uploaded
    if (req.files.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Please upload exactly 2 images (front and back of Aadhar card)'
      });
    }

    // Delete old images if they exist
    if (user.rentalProfile.documents.aadhar.frontImage.publicId) {
      try {
        await deleteImage(user.rentalProfile.documents.aadhar.frontImage.publicId);
      } catch (error) {
        console.error('Error deleting old front image:', error);
      }
    }

    if (user.rentalProfile.documents.aadhar.backImage.publicId) {
      try {
        await deleteImage(user.rentalProfile.documents.aadhar.backImage.publicId);
      } catch (error) {
        console.error('Error deleting old back image:', error);
      }
    }

    // Extract Aadhar number from front image if not provided
    if (!extractedAadharNumber && req.files[0]) {
      try {
        extractedAadharNumber = await ocrService.extractAadharNumber(req.files[0].path);
        console.log('Extracted Aadhar number:', extractedAadharNumber);
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError);
        // Continue without Aadhar number extraction
      }
    }

    // Update user document information
    user.rentalProfile.documents.aadhar.number = extractedAadharNumber || null;
    user.rentalProfile.documents.aadhar.frontImage = {
      url: req.files[0].path,
      publicId: req.files[0].filename,
      uploadedAt: new Date()
    };
    user.rentalProfile.documents.aadhar.backImage = {
      url: req.files[1].path,
      publicId: req.files[1].filename,
      uploadedAt: new Date()
    };
    user.rentalProfile.documents.aadhar.verificationStatus = 'pending';
    user.rentalProfile.documents.aadhar.verified = false;
    user.rentalProfile.documents.aadhar.verifiedAt = null;
    user.rentalProfile.documents.aadhar.rejectionReason = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Aadhar card images uploaded successfully',
      data: {
        aadhar: {
          number: user.rentalProfile.documents.aadhar.number,
          frontImage: user.rentalProfile.documents.aadhar.frontImage.url,
          backImage: user.rentalProfile.documents.aadhar.backImage.url,
          verificationStatus: user.rentalProfile.documents.aadhar.verificationStatus,
          uploadedAt: user.rentalProfile.documents.aadhar.frontImage.uploadedAt,
          extractedNumber: extractedAadharNumber ? true : false
        }
      }
    });

  } catch (error) {
    console.error('Upload Aadhar Card Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload Aadhar card images. Please try again.'
    });
  }
};

// @desc    Upload PAN card images
// @route   POST /api/documents/upload-pan
// @access  Private
const uploadPANCard = async (req, res) => {
  const userId = req.user.userId;
  const { panNumber } = req.body;

  try {
    // Validate PAN number
    if (!panNumber) {
      return res.status(400).json({
        success: false,
        message: 'PAN number is required'
      });
    }

    // Validate PAN number format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid PAN number (e.g., ABCDE1234F)'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload PAN card images (front and back)'
      });
    }

    // Check if exactly 2 files are uploaded
    if (req.files.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Please upload exactly 2 images (front and back of PAN card)'
      });
    }

    // Delete old images if they exist
    if (user.rentalProfile.documents.pan.frontImage.publicId) {
      try {
        await deleteImage(user.rentalProfile.documents.pan.frontImage.publicId);
      } catch (error) {
        console.error('Error deleting old front image:', error);
      }
    }

    if (user.rentalProfile.documents.pan.backImage.publicId) {
      try {
        await deleteImage(user.rentalProfile.documents.pan.backImage.publicId);
      } catch (error) {
        console.error('Error deleting old back image:', error);
      }
    }

    // Update user document information
    user.rentalProfile.documents.pan.number = panNumber;
    user.rentalProfile.documents.pan.frontImage = {
      url: req.files[0].path,
      publicId: req.files[0].filename,
      uploadedAt: new Date()
    };
    user.rentalProfile.documents.pan.backImage = {
      url: req.files[1].path,
      publicId: req.files[1].filename,
      uploadedAt: new Date()
    };
    user.rentalProfile.documents.pan.verificationStatus = 'pending';
    user.rentalProfile.documents.pan.verified = false;
    user.rentalProfile.documents.pan.verifiedAt = null;
    user.rentalProfile.documents.pan.rejectionReason = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'PAN card images uploaded successfully',
      data: {
        pan: {
          number: user.rentalProfile.documents.pan.number,
          frontImage: user.rentalProfile.documents.pan.frontImage.url,
          backImage: user.rentalProfile.documents.pan.backImage.url,
          verificationStatus: user.rentalProfile.documents.pan.verificationStatus,
          uploadedAt: user.rentalProfile.documents.pan.frontImage.uploadedAt
        }
      }
    });

  } catch (error) {
    console.error('Upload PAN Card Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload PAN card images. Please try again.'
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/documents/upload-profile
// @access  Private
const uploadProfileImage = async (req, res) => {
  const userId = req.user.userId;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile image if exists
    if (user.profileImage) {
      try {
        const oldPublicId = extractPublicId(user.profileImage);
        if (oldPublicId) {
          await deleteImage(oldPublicId);
        }
      } catch (error) {
        console.error('Error deleting old profile image:', error);
      }
    }

    // Update user profile image
    user.profileImage = req.file.path;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Upload Profile Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image. Please try again.'
    });
  }
};

// @desc    Get document verification status
// @route   GET /api/documents/status
// @access  Private
const getDocumentStatus = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).select('rentalProfile.documents profileImage');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Safely extract document URLs, handling null/undefined cases
    const aadharFrontUrl = user.rentalProfile?.documents?.aadhar?.frontImage?.url || null;
    const aadharBackUrl = user.rentalProfile?.documents?.aadhar?.backImage?.url || null;
    const panFrontUrl = user.rentalProfile?.documents?.pan?.frontImage?.url || null;
    const panBackUrl = user.rentalProfile?.documents?.pan?.backImage?.url || null;

    res.status(200).json({
      success: true,
      data: {
        documents: {
          aadhar: {
            number: user.rentalProfile?.documents?.aadhar?.number || null,
            frontImage: aadharFrontUrl,
            backImage: aadharBackUrl,
            verified: user.rentalProfile?.documents?.aadhar?.verified || false,
            verificationStatus: user.rentalProfile?.documents?.aadhar?.verificationStatus || 'pending',
            verifiedAt: user.rentalProfile?.documents?.aadhar?.verifiedAt || null,
            rejectionReason: user.rentalProfile?.documents?.aadhar?.rejectionReason || null
          },
          pan: {
            number: user.rentalProfile?.documents?.pan?.number || null,
            frontImage: panFrontUrl,
            backImage: panBackUrl,
            verified: user.rentalProfile?.documents?.pan?.verified || false,
            verificationStatus: user.rentalProfile?.documents?.pan?.verificationStatus || 'pending',
            verifiedAt: user.rentalProfile?.documents?.pan?.verifiedAt || null,
            rejectionReason: user.rentalProfile?.documents?.pan?.rejectionReason || null
          }
        },
        profileImage: user.profileImage || null
      }
    });

  } catch (error) {
    console.error('Get Document Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document status. Please try again.'
    });
  }
};

// @desc    Delete document images
// @route   DELETE /api/documents/delete/:type
// @access  Private
const deleteDocument = async (req, res) => {
  const userId = req.user.userId;
  const { type } = req.params; // 'aadhar' or 'pan'

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (type === 'aadhar') {
      // Delete Aadhar images
      if (user.rentalProfile.documents.aadhar.frontImage.publicId) {
        await deleteImage(user.rentalProfile.documents.aadhar.frontImage.publicId);
      }
      if (user.rentalProfile.documents.aadhar.backImage.publicId) {
        await deleteImage(user.rentalProfile.documents.aadhar.backImage.publicId);
      }

      // Reset Aadhar document data
      user.rentalProfile.documents.aadhar = {
        number: null,
        frontImage: { url: null, publicId: null, uploadedAt: null },
        backImage: { url: null, publicId: null, uploadedAt: null },
        verified: false,
        verifiedAt: null,
        verificationStatus: 'pending',
        rejectionReason: null
      };

    } else if (type === 'pan') {
      // Delete PAN images
      if (user.rentalProfile.documents.pan.frontImage.publicId) {
        await deleteImage(user.rentalProfile.documents.pan.frontImage.publicId);
      }
      if (user.rentalProfile.documents.pan.backImage.publicId) {
        await deleteImage(user.rentalProfile.documents.pan.backImage.publicId);
      }

      // Reset PAN document data
      user.rentalProfile.documents.pan = {
        number: null,
        frontImage: { url: null, publicId: null, uploadedAt: null },
        backImage: { url: null, publicId: null, uploadedAt: null },
        verified: false,
        verifiedAt: null,
        verificationStatus: 'pending',
        rejectionReason: null
      };

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Use "aadhar" or "pan"'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `${type.toUpperCase()} document deleted successfully`
    });

  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document. Please try again.'
    });
  }
};

module.exports = {
  uploadAadharCard,
  uploadPANCard,
  uploadProfileImage,
  getDocumentStatus,
  deleteDocument
};
