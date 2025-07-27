const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// These routes are needed by the UI components
router.get('/roles', userController.getRoles);
router.get('/departments', userController.getDepartments);  // Add this line

// Admin only routes
router.use(checkRole(['admin', 'super_admin'])); 
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/approve', userController.approveUser);

module.exports = router;
