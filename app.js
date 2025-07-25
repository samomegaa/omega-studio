require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const profileRoutes = require('./routes/profile');
const { blockIPMiddleware, trackScanAttempt } = require('./utils/security');

const app = express();

// Trust proxy - needed for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Body parser FIRST - before any routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Debug middleware to check if body parser is working
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request to:', req.path);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);
  }
  next();
});

// Then other middleware
app.use(cors());
app.use(compression());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Apply IP blocking
app.use(blockIPMiddleware);

// Security middleware
app.use((req, res, next) => {
  const blockedPaths = [
    '.env', '.git', 'wp-admin', 'wp-login', 'phpmyadmin',
    '.php', 'config', 'backup', '.sql', 'admin.php',
    'xmlrpc', 'wp-content', 'wp-includes', '.zip',
    '.tar', '.gz', '.bak', 'vendor/', 'node_modules/',
    '.DS_Store', '.htaccess', '.htpasswd', '/.well-known/'
  ];
  
  const path = req.path.toLowerCase();
  const fullUrl = req.originalUrl.toLowerCase();
  
  if (blockedPaths.some(blocked => path.includes(blocked) || fullUrl.includes(blocked))) {
    const ip = req.ip || req.connection.remoteAddress;
    trackScanAttempt(ip);
    console.log(`Security scan blocked: ${ip} tried ${req.originalUrl}`);
    return res.status(404).send('Not found');
  }
  
  next();
});

// Import routes
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');

// Use routes - AFTER all middleware
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/financial', require('./routes/financial'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));
//app.use('/api/profile', profileRoutes);//

// Continue with the rest of your app.js...
// (static files, error handling, server setup, etc.)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Omega Studio API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, 'client', 'build');
  console.log('Build path:', buildPath); // Add this for debugging
  
  app.use(express.static(buildPath));
  
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    console.log('Looking for index.html at:', indexPath); // Add this for debugging
    res.sendFile(indexPath);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
