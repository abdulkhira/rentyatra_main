const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).select('-otp -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.formattedPhone,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      address: user.address,
      preferences: user.preferences,
      stats: user.stats,
      rentalProfile: user.rentalProfile,
      wallet: user.wallet,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile. Please try again.'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const userId = req.user.userId;
  const { name, email, address, preferences, profileImage } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic information
    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: userId }
        });
        
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email address is already registered'
          });
        }

        user.email = email.toLowerCase();
        user.isEmailVerified = false; // Reset email verification
      }
    }

    // Update address information
    if (address !== undefined) {
      user.address = {
        street: address.street || user.address?.street || '',
        city: address.city || user.address?.city || '',
        state: address.state || user.address?.state || '',
        pincode: address.pincode || user.address?.pincode || '',
        landmark: address.landmark || user.address?.landmark || ''
      };
    }

    // Update preferences
    if (preferences !== undefined) {
      user.preferences = {
        notifications: {
          email: preferences.notifications?.email ?? user.preferences?.notifications?.email ?? true,
          sms: preferences.notifications?.sms ?? user.preferences?.notifications?.sms ?? true,
          push: preferences.notifications?.push ?? user.preferences?.notifications?.push ?? true
        },
        language: preferences.language || user.preferences?.language || 'en'
      };
    }

    // Update profile image
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.formattedPhone,
      role: user.role,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
      address: user.address,
      preferences: user.preferences,
      stats: user.stats,
      rentalProfile: user.rentalProfile,
      wallet: user.wallet
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userData
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again.'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).select('stats rentalProfile');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: user.stats,
        rentalProfile: user.rentalProfile
      }
    });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics. Please try again.'
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = async (req, res) => {
  const userId = req.user.userId;
  const { notifications, language } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    if (notifications !== undefined) {
      user.preferences.notifications = {
        email: notifications.email ?? user.preferences.notifications.email,
        sms: notifications.sms ?? user.preferences.notifications.sms,
        push: notifications.push ?? user.preferences.notifications.push
      };
    }

    if (language !== undefined) {
      user.preferences.language = language;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update Preferences Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences. Please try again.'
    });
  }
};

// @desc    Deactivate user account
// @route   PUT /api/users/deactivate
// @access  Private
const deactivateAccount = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account. Please try again.'
    });
  }
};

// @desc    Reactivate user account
// @route   PUT /api/users/reactivate
// @access  Private
const reactivateAccount = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account reactivated successfully'
    });

  } catch (error) {
    console.error('Reactivate Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate account. Please try again.'
    });
  }
};

// @desc    Change phone number
// @route   POST /api/users/change-phone
// @access  Private
const changePhoneNumber = async (req, res) => {
  const userId = req.user.userId;
  const { newPhone, otp } = req.body;

  // Validate phone number
  if (!newPhone) {
    return res.status(400).json({
      success: false,
      message: 'New phone number is required'
    });
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = newPhone.replace(/\D/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian phone number'
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if new phone number is already taken
    const existingUser = await User.findOne({ 
      phone: `+91${cleanPhone}`,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already registered with another account'
      });
    }

    // Verify OTP if provided
    if (otp) {
      const isValidOTP = user.verifyOTP(otp);
      
      if (!isValidOTP) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please try again.'
        });
      }

      // Update phone number and clear OTP
      user.phone = `+91${cleanPhone}`;
      user.isPhoneVerified = true;
      user.clearOTP();
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Phone number changed successfully',
        data: {
          phone: user.formattedPhone
        }
      });
    } else {
      // Generate and send OTP for new phone number
      const otp = user.generateOTP();
      await user.save();

      // Here you would send OTP to the new phone number
      // For now, we'll just return the OTP in development
      res.status(200).json({
        success: true,
        message: 'OTP sent to new phone number',
        data: {
          phone: `+91 ${cleanPhone}`,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
      });
    }

  } catch (error) {
    console.error('Change Phone Number Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change phone number. Please try again.'
    });
  }
};

// @desc    Get user activity log
// @route   GET /api/users/activity
// @access  Private
const getUserActivity = async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10 } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For now, return basic activity info
    // In a real application, you would have a separate Activity model
    const activity = [
      {
        id: 1,
        type: 'login',
        description: 'Logged in successfully',
        timestamp: user.stats.lastLoginAt || user.updatedAt,
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      },
      {
        id: 2,
        type: 'profile_update',
        description: 'Profile updated',
        timestamp: user.updatedAt,
        metadata: {}
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        activity,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: activity.length
        }
      }
    });

  } catch (error) {
    console.error('Get User Activity Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity. Please try again.'
    });
  }
};

// @desc    Export user data
// @route   GET /api/users/export
// @access  Private
const exportUserData = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).select('-otp -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare user data for export
    const exportData = {
      personalInfo: {
        name: user.name,
        email: user.email,
        phone: user.formattedPhone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      address: user.address,
      preferences: user.preferences,
      stats: user.stats,
      rentalProfile: user.rentalProfile,
      wallet: user.wallet,
      exportDate: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'User data exported successfully',
      data: exportData
    });

  } catch (error) {
    console.error('Export User Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data. Please try again.'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  updateUserPreferences,
  deactivateAccount,
  reactivateAccount,
  changePhoneNumber,
  getUserActivity,
  exportUserData
};
