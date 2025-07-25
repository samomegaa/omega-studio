const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Placeholder route
router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Reports module coming soon' });
});

module.exports = router;
