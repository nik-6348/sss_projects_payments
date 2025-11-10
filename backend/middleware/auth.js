const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          error: 'Not authorized, user not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          error: 'Not authorized, account deactivated'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        error: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Not authorized, no token'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authorized, please login first'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional authentication - doesn't require token but adds user if present
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) { 
      // Token is invalid, but we don't fail the request
      req.user = null;
    }
  }

  next();
};

// Check if user owns the resource or is admin/manager
const resourceOwnerOrAdmin = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authorized, please login first'
      });
    }

    // Admin and managers can access any resource
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Resource user ID not found'
      });
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        error: 'Not authorized to access this resource'
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  resourceOwnerOrAdmin
};
