const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 */
const protect = async (req, res, next) => {
  console.log('\n========== AUTH MIDDLEWARE ==========');
  
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('🔑 Token found in Authorization header');
  }

  // Check if token exists
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    // Verify token
    console.log('🔐 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user ID:', decoded.id);

    // Get user from token
    console.log('🔍 Fetching user from database...');
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.'
      });
    }

    // Check if user is banned
    if (user.adminBanned) {
      console.log('🚫 User is banned');
      return res.status(403).json({
        success: false,
        message: 'Account has been banned. Please contact support.'
      });
    }

    // Check if user is locked
    if (user.adminLocked) {
      console.log('🔒 User is administratively locked');
      return res.status(403).json({
        success: false,
        message: 'Account is locked. Please contact support.'
      });
    }

    console.log('✅ User authenticated:', user.email);
    
    // Add user to request object
   req.user = {
        _id: user._id,        // Add this line
        id: user._id,         // Keep this for compatibility
        email: user.email,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname
    };

    console.log('========== AUTH SUCCESS ==========\n');
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Authorize roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('\n========== AUTHORIZATION CHECK ==========');
    console.log('👤 User role:', req.user.role);
    console.log('🔐 Required roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ Authorization failed');
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    console.log('✅ Authorization successful');
    console.log('========== AUTHORIZATION SUCCESS ==========\n');
    next();
  };
};

module.exports = { protect, authorize };