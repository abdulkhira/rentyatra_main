const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes - verify JWT token
// @access  Private
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rentyatra-secret-key');

      // Get userId from token (handle both userId and id fields)
      const userId = decoded.userId || decoded.id;
      
      if (!userId) {
        console.error('❌ No userId found in decoded token:', decoded);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token structure'
        });
      }

      // Get user from token
      const user = await User.findById(userId).select('-otp');

      if (!user) {
        console.error('Auth middleware: User not found for userId:', userId);
        console.error('Token decoded successfully but user does not exist in database');
        console.error('Searched userId:', userId, 'Type:', typeof userId);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account is deactivated'
        });
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, account is blocked'
        });
      }

      req.user = {
        userId: user._id,
        role: user.role
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// @desc    Grant access to specific roles
// @access  Private
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// @desc    Optional auth - doesn't fail if no token
// @access  Public/Private
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rentyatra-secret-key');
      const user = await User.findById(decoded.userId).select('-otp');

      if (user && user.isActive && !user.isBlocked) {
        req.user = {
          userId: user._id,
          role: user.role
        };
      }
    } catch (error) {
      // Ignore token errors for optional auth
      console.log('Optional auth token error:', error.message);
    }
  }

  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};
