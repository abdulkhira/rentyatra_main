const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// @desc    Verify admin JWT token
// @access  Private
const adminAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (alternative method)
    if (!token && req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    }

    // Make sure token exists
    if (!token) {
      console.log('No admin token provided in request');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    console.log('Admin token found:', token.substring(0, 20) + '...');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

    try {
      // Verify token
      console.log('Verifying admin token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rentyatra-secret-key');
      console.log('Token decoded successfully:', decoded);
      console.log('Decoded adminId type:', typeof decoded.adminId);
      console.log('Decoded adminId value:', decoded.adminId);
      
      // Get admin from token
      console.log('Looking for admin with ID:', decoded.adminId);
      console.log('Admin model:', Admin);
      console.log('Database connection state:', Admin.db.readyState);
      
      // Test database connection with a simple query
      try {
        const adminCount = await Admin.countDocuments();
        console.log('Total admins in database:', adminCount);
      } catch (dbError) {
        console.error('Database query error:', dbError);
      }
      
      const admin = await Admin.findById(decoded.adminId);
      console.log('Admin found:', admin ? 'Yes' : 'No');
      console.log('Admin details:', admin ? { id: admin._id, name: admin.name, email: admin.email } : 'null');
      
      if (!admin) {
        console.log('Admin not found in database');
        return res.status(401).json({
          success: false,
          message: 'Access denied. Admin not found.'
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin account is deactivated.'
        });
      }

      // Add admin to request object
      req.admin = {
        _id: admin._id,
        adminId: admin._id,
        role: admin.role,
        permissions: admin.permissions
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
  } catch (error) {
    console.error('Admin Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// @desc    Check admin role permissions
// @access  Private
const checkAdminRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// @desc    Check specific admin permissions
// @access  Private
const checkAdminPermission = (permission) => {
  return (req, res, next) => {
    console.log('=== Checking Admin Permission ===');
    console.log('Required permission:', permission);
    console.log('Admin object:', req.admin);
    console.log('Admin permissions:', req.admin?.permissions);
    
    if (!req.admin) {
      console.log('❌ No admin object in request');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      console.log('✅ Super admin - granting all permissions');
      return next();
    }

    // Check specific permission
    if (!req.admin.permissions || !req.admin.permissions[permission]) {
      console.log(`❌ Permission denied: ${permission}`);
      console.log('Available permissions:', req.admin.permissions);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permission}`
      });
    }

    console.log(`✅ Permission granted: ${permission}`);
    next();
  };
};

// @desc    Optional admin authentication (doesn't fail if no token)
// @access  Optional
const optionalAdminAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies && req.cookies.adminToken) {
      token = req.cookies.adminToken;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rentyatra-secret-key');
        
        // Get admin from token
        const admin = await Admin.findById(decoded.adminId);
        
        if (admin && admin.isActive) {
          req.admin = {
            adminId: admin._id,
            role: admin.role,
            permissions: admin.permissions
          };
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Optional admin auth: Invalid token');
      }
    }

    next();
  } catch (error) {
    console.error('Optional Admin Auth Middleware Error:', error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  adminAuth,
  checkAdminRole,
  checkAdminPermission,
  optionalAdminAuth
};
