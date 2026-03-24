const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const smsService = require('../services/smsService');
const consoleSmsService = require('../services/consoleSmsService');

const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '365', 10);

const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');
const getRefreshTokenExpiry = () => new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
const sanitizeUserAgent = (userAgent) => {
  if (!userAgent) return null;
  return `${userAgent}`.substring(0, 500);
};

const buildUserResponse = (user) => ({
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
});

// Generate JWT Token
const generateToken = (userId) => {
  // Ensure userId is converted to string
  const userIdString = userId ? userId.toString() : userId;
  const secret = process.env.JWT_SECRET || 'rentyatra-secret-key';
  const expiresIn = process.env.USER_JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '30d';

  const token = jwt.sign({ userId: userIdString }, secret, {
    expiresIn,
  });

  // CRITICAL: Log token generation details
  console.log('🔐 JWT TOKEN GENERATED:', {
    userId: userIdString,
    expiresIn: expiresIn,
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 30) + '...' : 'MISSING',
    expiryTime: expiresIn
  });

  return token;
};

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  const { phone, context } = req.body;

  // Validate phone number
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  // Validate Indian phone number format
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian phone number'
    });
  }

  try {
    console.log('Starting OTP send process for phone:', cleanPhone);
    
    // Check if this is a test number with default OTP
    const DEFAULT_OTP_PHONES = ['6261096283', '7610416911'];
    const DEFAULT_OTP = '110211';
    const isTestNumber = DEFAULT_OTP_PHONES.includes(cleanPhone);
    
    const requestContext = (context || 'login').toLowerCase();
    
    // Check if user exists
    let user = await User.findByPhoneOrEmail(cleanPhone);

    if (requestContext === 'signup') {
      if (user) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered. Please login instead.'
        });
      }

      console.log('Creating new user for OTP (signup flow)');
      user = new User({
        phone: cleanPhone,
        role: 'user',
        isPhoneVerified: false
      });
    } else {
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Account not found. Please sign up to continue.'
        });
      }

      console.log('Existing user found for login OTP:', user._id);
    }

    // Generate OTP - use default OTP for test number, otherwise generate random
    let otp;
    if (isTestNumber) {
      console.log('🔧 Test number detected, using default OTP:', DEFAULT_OTP);
      otp = DEFAULT_OTP;
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };
    } else {
      console.log('Generating OTP');
      otp = user.generateOTP();
    }
    
    await user.save();
    
    console.log('OTP generated and user saved');
    
    // Send OTP via SMS - skip for test number
    let smsResult;
    
    if (isTestNumber) {
      console.log('🔧 Test number - skipping SMS sending');
      smsResult = {
        success: true,
        messageId: 'test-default-' + Date.now(),
        message: 'Default OTP set for test number (SMS not sent)',
        provider: 'Test Number'
      };
    } else {
      console.log('Attempting to send SMS via SMS India Hub');
      
      try {
        smsResult = await smsService.sendOTP(cleanPhone, otp);
        console.log('SMS sending result:', smsResult);
        
        if (!smsResult.success) {
          console.error('SMS sending failed:', smsResult.error);
          throw new Error('SMS India Hub failed');
        }
      } catch (smsError) {
        console.error('SMS India Hub error:', smsError.message);
        console.log('🔄 Falling back to Console SMS Service...');
        
        // Use console SMS service as fallback
        try {
          smsResult = await consoleSmsService.sendOTP(cleanPhone, otp);
          console.log('Console SMS result:', smsResult);
        } catch (consoleError) {
          console.error('Console SMS error:', consoleError.message);
          smsResult = {
            success: true,
            messageId: 'fallback-' + Date.now(),
            message: 'SMS service unavailable. Check console for OTP.',
            provider: 'Fallback'
          };
        }
      }
    }

    // Enhanced response with debugging info
    const responseData = {
      phone: user.formattedPhone,
      messageId: smsResult.messageId,
      provider: smsResult.provider || 'SMS India Hub',
      smsStatus: smsResult.status || 'pending'
    };

    // Don't include OTP in response for security
    // responseData.otp = otp;
    // responseData.developmentMode = true;
    // responseData.note = 'SMS India Hub template approval pending. OTP available in response for testing.';

    // Special handling for template approval issues
    if (smsResult.error && smsResult.error.includes('Template needs approval')) {
      responseData.smsStatus = 'template_approval_pending';
      responseData.smsNote = 'SMS template needs approval from SMS India Hub';
    }

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${user.formattedPhone}`,
      data: responseData
    });

  } catch (error) {
    console.error('Send OTP Error:', error);
    
    // Check if it's a template approval issue
    if (error.message && error.message.includes('Template needs approval')) {
      // Generate and store OTP anyway for testing purposes
      console.log('SMS template approval needed, proceeding with fallback OTP');
      
      const cleanPhone = req.body.phone.replace(/\D/g, '');
      const DEFAULT_OTP_PHONES = ['6261096283', '7610416911'];
      const DEFAULT_OTP = '110211';
      const isTestNumber = DEFAULT_OTP_PHONES.includes(cleanPhone);
      
      // Use default OTP for test number, otherwise generate random
      const otp = isTestNumber ? DEFAULT_OTP : Math.floor(100000 + Math.random() * 900000).toString();
      
      try {
        // Find or create user and store OTP
        let user = await User.findByPhoneOrEmail(cleanPhone);
        if (!user) {
          user = new User({
            phone: cleanPhone,
            role: 'user',
            isPhoneVerified: false
          });
        }
        
        user.otp = {
          code: otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        };
        await user.save();
        
        if (isTestNumber) {
          console.log(`🔧 Fallback OTP - Test Number - Phone: ${cleanPhone}, OTP: ${otp}`);
        } else {
          console.log(`🔧 Fallback OTP Generated - Phone: ${cleanPhone}, OTP: ${otp}`);
        }
        
         res.status(200).json({
           success: true,
           message: `OTP sent successfully to ${user.formattedPhone}`,
           data: {
             phone: user.formattedPhone,
             messageId: isTestNumber ? 'test-default-' + Date.now() : 'fallback-' + Date.now(),
             provider: isTestNumber ? 'Test Number' : 'SMS India Hub',
             smsStatus: 'sent'
           }
         });
        return;
      } catch (dbError) {
        console.error('Database error during fallback OTP generation:', dbError);
      }
    }
    
    // Generic error response for other issues
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify OTP and login/signup user
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { phone, otp, name, email } = req.body;

  // Validate required fields
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required'
    });
  }

  // Validate OTP format
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 6-digit OTP'
    });
  }

  try {
    // Find user by phone
    const cleanPhone = phone.replace(/\D/g, '');
    let user = await User.findByPhoneOrEmail(cleanPhone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please request OTP first.'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    // Clear OTP after successful verification
    user.clearOTP();
    user.isPhoneVerified = true;

    // Track if this is a signup (user completing registration with name and email)
    let isSignup = false;
    
    // If this is a signup (name and email provided), update user info
    if (name && email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already registered'
        });
      }

      // Check if user already has name and email (existing user)
      const wasIncomplete = !user.name || !user.email;
      isSignup = wasIncomplete;

      user.name = name.trim();
      user.email = email.toLowerCase();
      user.isEmailVerified = false; // Email verification can be done later
    } else if (!user.name || !user.email) {
      // If user doesn't have complete profile, require name and email for signup
      return res.status(400).json({
        success: false,
        message: 'Name and email are required for account creation'
      });
    }

    // Ensure default subscription exists for new users (2 free post ads)
    // Create subscription only on signup (when user completes registration with name and email)
    if (isSignup) {
      try {
        const Subscription = require('../models/Subscription');
        // Check if user already has an active subscription
        const existingActiveSub = await Subscription.findOne({ 
          userId: user._id, 
          status: 'active',
          endDate: { $gt: new Date() }
        });
        
        // Check if user already has default subscription (even if expired)
        const existingDefaultSub = await Subscription.findOne({ 
          userId: user._id, 
          planId: 'new_user_default' 
        });
        
        // Only create subscription if user doesn't have any active subscription
        // and hasn't received the default subscription before
        if (!existingActiveSub && !existingDefaultSub) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 365);
          const defaultSubscription = new Subscription({
            userId: user._id,
            planId: 'new_user_default',
            planName: 'New User Default',
            status: 'active',
            startDate,
            endDate,
            price: 0,
            paymentStatus: 'paid',
            paymentCompletedAt: new Date(),
            currentListings: 0,
            totalViews: 0,
            totalRevenue: 0,
            maxListings: 2, // 2 free post ads for new users
            maxPhotos: 10
          });
          await defaultSubscription.save();
          console.log('✅ Default subscription created for new user on signup:', user._id, 'with 2 free post ads');
        } else if (existingActiveSub) {
          console.log('User already has active subscription, skipping default subscription creation');
        } else if (existingDefaultSub) {
          console.log('User already received default subscription, skipping');
        }
      } catch (subErr) {
        console.error('❌ Error creating default subscription on verifyOTP:', subErr);
        // Don't fail the signup if subscription creation fails, but log it
      }
    }

    // Update last login and create persistent auth session
    user = await user.updateLastLogin();
    user.cleanupExpiredSessions();

    const refreshTokenValue = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();
    const deviceInfo = sanitizeUserAgent(req.headers['user-agent']);

    user.addAuthSession(refreshTokenValue, refreshTokenExpiry, deviceInfo);
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = buildUserResponse(user);

    // Determine if this is login or signup
    // Use isSignup if it was set, otherwise check if user profile is incomplete
    const isNewUser = isSignup || (!user.name || !user.email);
    const message = isNewUser ? 'Account created and verified successfully!' : 'Login successful!';

    res.status(200).json({
      success: true,
      message: message,
      data: {
        user: userData,
        token,
        refreshToken: refreshTokenValue,
        refreshTokenExpiresAt: refreshTokenExpiry,
        isNewUser: isNewUser,
        redirectTo: isNewUser ? '/profile' : '/' // Redirect new users to profile, existing to home
      }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

// @desc    Register new user with complete information
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, phone, address } = req.body;

  // Validate required fields
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and phone number are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }

  // Validate phone number
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 10-digit Indian phone number'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: cleanPhone }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Create new user with complete data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      phone: cleanPhone,
      role: 'user',
      isPhoneVerified: false,
      isEmailVerified: false
    };

    // Add address if provided
    if (address) {
      userData.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        landmark: address.landmark || ''
      };
    }

    const user = new User(userData);
    await user.save();

    // Create default subscription for new users (2 free post ads)
    try {
      const Subscription = require('../models/Subscription');
      
      // Check if user already has a subscription (shouldn't happen for new user, but safety check)
      const existingSub = await Subscription.findOne({ 
        userId: user._id, 
        planId: 'new_user_default' 
      });
      
      if (!existingSub) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 365); // 1 year default
        
        const defaultSubscription = new Subscription({
          userId: user._id,
          planId: 'new_user_default',
          planName: 'New User Default',
          status: 'active',
          startDate: startDate,
          endDate: endDate,
          price: 0, // Free for new users
          paymentStatus: 'paid',
          paymentCompletedAt: new Date(),
          currentListings: 0,
          totalViews: 0,
          totalRevenue: 0,
          maxListings: 2, // 2 free post ads for new users
          maxPhotos: 10
        });
        
        await defaultSubscription.save();
        console.log('✅ Default subscription created for new user on register:', user._id, 'with 2 free post ads');
      } else {
        console.log('User already has default subscription, skipping');
      }
    } catch (subscriptionError) {
      console.error('❌ Error creating default subscription:', subscriptionError);
      // Continue without failing user registration
    }

    // Generate OTP - use default OTP for test number, otherwise generate random
    const DEFAULT_OTP_PHONES = ['6261096283', '7610416911'];
    const DEFAULT_OTP = '110211';
    const isTestNumber = DEFAULT_OTP_PHONES.includes(cleanPhone);
    
    let otp;
    if (isTestNumber) {
      console.log('🔧 Test number detected in register, using default OTP:', DEFAULT_OTP);
      otp = DEFAULT_OTP;
      user.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      };
    } else {
      otp = user.generateOTP();
    }
    
    await user.save();

    // Send OTP via SMS - skip for test number
    let smsResult;
    
    if (isTestNumber) {
      console.log('🔧 Test number - skipping SMS sending in register');
      smsResult = {
        success: true,
        messageId: 'test-default-' + Date.now(),
        message: 'Default OTP set for test number (SMS not sent)',
        provider: 'Test Number'
      };
    } else {
      try {
        smsResult = await smsService.sendOTP(cleanPhone, otp);
        
        if (!smsResult.success) {
          console.error('SMS sending failed:', smsResult.error);
        }
      } catch (smsError) {
        console.error('SMS service error:', smsError.message);
        smsResult = {
          success: true,
          messageId: 'fallback-' + Date.now(),
          message: 'SMS service temporarily unavailable, using fallback mechanism'
        };
      }
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please verify your phone number with the OTP sent.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.formattedPhone,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          address: user.address
        },
         messageId: smsResult.messageId
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    
    // Handle validation errors
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
      message: 'Registration failed. Please try again.'
    });
  }
};

// @desc    Login user with phone and OTP
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { phone, otp } = req.body;

  // Validate required fields
  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required'
    });
  }

  try {
    // Find user by phone
    const cleanPhone = phone.replace(/\D/g, '');
    let user = await User.findByPhoneOrEmail(cleanPhone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact support.'
      });
    }

    // Verify OTP
    const isValidOTP = user.verifyOTP(otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please try again.'
      });
    }

    // Clear OTP, update login info, and persist session
    user.clearOTP();
    user = await user.updateLastLogin();
    user.cleanupExpiredSessions();

    const refreshTokenValue = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();
    const deviceInfo = sanitizeUserAgent(req.headers['user-agent']);

    user.addAuthSession(refreshTokenValue, refreshTokenExpiry, deviceInfo);
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = buildUserResponse(user);

    // CRITICAL: Log token generation for debugging
    console.log('🔐 LOGIN SUCCESS - Token Generated:', {
      userId: user._id.toString(),
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'MISSING',
      refreshTokenLength: refreshTokenValue?.length || 0,
      refreshTokenPreview: refreshTokenValue ? refreshTokenValue.substring(0, 30) + '...' : 'MISSING',
      refreshTokenExpiresAt: refreshTokenExpiry,
      userPhone: user.formattedPhone || user.phone
    });

    const responseData = {
      success: true,
      message: 'Login successful! Welcome back to RentYatra.',
      data: {
        user: userData,
        token,
        refreshToken: refreshTokenValue,
        refreshTokenExpiresAt: refreshTokenExpiry,
        redirectTo: '/' // Redirect to home page after login
      }
    };

    // CRITICAL: Verify tokens are in response before sending
    if (!responseData.data.token) {
      console.error('❌ ERROR: Token missing in login response!');
    }
    if (!responseData.data.refreshToken) {
      console.error('❌ ERROR: RefreshToken missing in login response!');
    }

    console.log('📤 SENDING LOGIN RESPONSE:', {
      success: responseData.success,
      hasToken: !!responseData.data.token,
      hasRefreshToken: !!responseData.data.refreshToken,
      hasUser: !!responseData.data.user
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// @desc    Refresh JWT token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAuthToken = async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Missing refresh token'
    });
  }

  try {
    const user = await User.findOne({ 'authSessions.refreshToken': refreshToken });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please login again.'
      });
    }

    const session = (user.authSessions || []).find(
      (authSession) => authSession.refreshToken === refreshToken
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session not found. Please login again.'
      });
    }

    const now = new Date();
    if (!session.expiresAt || session.expiresAt <= now) {
      user.removeAuthSession(refreshToken);
      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.'
      });
    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshExpiry = getRefreshTokenExpiry();

    session.refreshToken = newRefreshToken;
    session.expiresAt = newRefreshExpiry;
    session.lastUsedAt = now;

    const deviceInfo = sanitizeUserAgent(req.headers['user-agent']);
    if (deviceInfo) {
      session.deviceInfo = deviceInfo;
    }

    user.markModified('authSessions');
    await user.save();

    const token = generateToken(user._id);
    const userData = buildUserResponse(user);

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        token,
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: newRefreshExpiry,
        user: userData
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to refresh session. Please try again.'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    
    // Try to find user by userId from token (if available) or by refreshToken
    let user = null;
    
    if (req.user?.userId) {
      // User authenticated via token
      user = await User.findById(req.user.userId);
    } else if (refreshToken) {
      // Try to find user by refreshToken if no token available
      user = await User.findOne({ 
        'authSessions.refreshToken': refreshToken 
      });
    }
    
    // Remove the refresh token session if user found
    if (user && refreshToken) {
      user.removeAuthSession(refreshToken);
      user.cleanupExpiredSessions();
      await user.save();
    }
  } catch (error) {
    console.error('Logout cleanup error:', error);
    // Don't fail logout even if cleanup fails
  } finally {
    // Always return success to allow client-side cleanup
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user.userId).select('-otp');

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
};

module.exports = {
  sendOTP,
  verifyOTP,
  register,
  login,
  refreshAuthToken,
  logout,
  getMe
};
