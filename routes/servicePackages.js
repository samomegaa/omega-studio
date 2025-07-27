const express = require('express');
const router = express.Router();
const servicePackageController = require('../controllers/servicePackageController');
const { authMiddleware, checkRole } = require('../middleware/auth');

// Admin only routes
router.use(authMiddleware);
router.use(checkRole(['admin', 'madmin']));

router.get('/', servicePackageController.getAllPackages);
router.post('/', servicePackageController.createPackage);
router.put('/:id', servicePackageController.updatePackage);
router.delete('/:id', servicePackageController.deletePackage);
router.put('/:id/sort', servicePackageController.updateSortOrder);

module.exports = router;
