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
    
    // Set both formats for backward compatibility
    req.userId = user.id;
    req.userRoles = user.roles;
    req.userRole = user.roles.includes('admin') ? 'admin' : 
                   user.roles.includes('madmin') ? 'madmin' :
                   user.roles.includes('engineer') ? 'engineer' :  // Fixed: added closing quote and colon
                   user.roles.includes('client') ? 'client' : 'staff';
    
    // Set req.user for client controller
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      status: user.status,
      roles: user.roles,
      role: req.userRole
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

exports.madminMiddleware = (req, res, next) => {
  if (!['admin', 'madmin'].includes(req.userRole)) {
    return res.status(403).json({ message: 'Manager access required' });
  }
  next();
};
