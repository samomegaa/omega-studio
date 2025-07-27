const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

// Public routes (no auth required)
router.post('/public', bookingController.createPublicBooking);
router.get('/available-slots', bookingController.getAvailableSlots);

// All routes below require authentication
router.use(authMiddleware);

// Studio and booking routes
router.get('/studios', bookingController.getAllStudios);
router.get('/', bookingController.getBookings);
router.post('/', bookingController.createBooking);
router.put('/:id', bookingController.updateBooking);
router.put('/:id/cancel', bookingController.cancelBooking);

// Delete booking - admin only (move it here)
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
