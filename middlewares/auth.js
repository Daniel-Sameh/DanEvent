const jwt = require('jsonwebtoken');
const config = require('config');
const APIError = require('../shared/APIError');

module.exports = (roles = []) => {
  return async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ title:'Unauthorized', message: 'No authentication token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || config.get('jwtPrivateKey'));
      req.user = decoded;

      // Role-based access control
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ title:'Forbidden', message: 'Access denied' });
      }

      next();
    } catch (err) {
      res.status(401).json({ title:'Unauthorized', message: 'Invalid token' });
    }
  };
};