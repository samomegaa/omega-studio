const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Admin only routes
router.get('/', adminMiddleware, userController.getAllUsers);
router.post('/', adminMiddleware, userController.createUser);
router.put('/:id', adminMiddleware, userController.updateUser);
router.delete('/:id', adminMiddleware, userController.deleteUser);
router.put('/:id/approve', adminMiddleware, userController.approveUser);
router.get('/roles', adminMiddleware, userController.getRoles);
router.get('/departments', adminMiddleware, userController.getDepartments);


router.put('/:id/reset-password', adminMiddleware, userController.resetPassword);
module.exports = router;
