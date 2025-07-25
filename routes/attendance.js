const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Clock in/out routes
router.get('/today', attendanceController.getTodayAttendance);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.post('/break-start', attendanceController.startBreak);
router.post('/break-end', attendanceController.endBreak);

// Reports
router.get('/report', attendanceController.getAttendanceReport);

// Leave requests
router.get('/leaves', attendanceController.getLeaveRequests);
router.post('/leaves', attendanceController.createLeaveRequest);
router.put('/leaves/:id', attendanceController.updateLeaveRequestStatus);

// Settings
router.get('/settings', attendanceController.getSettings);
router.put('/settings', attendanceController.updateSettings);

module.exports = router;
