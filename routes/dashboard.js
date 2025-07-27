const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/quick-stats', dashboardController.getQuickStats);

module.exports = router;
