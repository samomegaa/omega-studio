const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Studio and booking routes
router.get('/studios', bookingController.getAllStudios);
router.get('/', bookingController.getBookings);
router.get('/available-slots', bookingController.getAvailableSlots);
router.post('/', bookingController.createBooking);
router.put('/:id', bookingController.updateBooking);
router.put('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
