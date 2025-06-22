const jwt = require('jsonwebtoken');
const config = require('config');
const { Users } = require('../models/user');
const APIError = require('../shared/APIError');

/**
 * Authentication and Authorization Middleware
 * Validates JWT tokens and handles role-based access control
 * @param {Array} roles - Array of allowed roles for the route
 * @returns {Function} Express middleware function
 */
module.exports = (roles = []) => {
  /**
   * Middleware function to validate JWT and check user roles
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  return async (req, res, next) => {
    // Extract JWT token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ status:'Unauthorized', message: 'No authentication token provided' });
    }

    try {
      // Verify and decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || config.get('jwtPrivateKey'));
      req.user = decoded;

      // Role-based access control check
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ status:'Forbidden', message: 'Access denied' });
      }

      // Double-check admin status if required
      if(roles.includes('admin')){
        const userAdminData = await Users.findById(req.user._id).select('isAdmin');
        if (!userAdminData || !userAdminData.isAdmin) {
          return res.status(403).json({ status:'Forbidden', message: 'Access denied' });
        }
      }

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          status: 'error',
          message: 'Invalid authentication token' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          status: 'error',
          message: 'Authentication token expired' 
        });
      }
      
      next(error);
    }
  };
};