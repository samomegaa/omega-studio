const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // Check if token is blacklisted
    const blacklisted = await pool.query(
      'SELECT 1 FROM blacklisted_tokens WHERE token = $1',
      [token]
    );
    
    if (blacklisted.rows.length > 0) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user and verify they're still active
    const userResult = await pool.query(`
      SELECT u.id, u.username, u.email, u.full_name, u.status, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.status = 'active'
      GROUP BY u.id
    `, [decoded.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    
    const user = userResult.rows[0];
    user.roles = user.roles.filter(r => r !== null);
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

exports.checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Make sure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user has any of the allowed roles
    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(' or ')}`,
        userRoles: userRoles
      });
    }

    next();
  };
};
