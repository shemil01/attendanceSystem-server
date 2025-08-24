const express = require('express');
const { body, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const restrictTo = require('../middleware/roles');

const router = express.Router();

// All routes protected
router.use(auth);

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check in for work
 * @access  Private (Employee)
 */
router.post(
  '/attendance/check-in',
  restrictTo('EMPLOYEE','ADMIN'),
  [
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Note cannot exceed 500 characters'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be a valid object'),
    body('deviceInfo')
      .optional()
      .isObject()
      .withMessage('Device info must be a valid object')
  ],
  attendanceController.checkIn
);

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check out from work
 * @access  Private (Employee)
 */
router.post(
  '/attendance/check-out',
  restrictTo('EMPLOYEE','ADMIN'),
  [
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Note cannot exceed 500 characters')
  ],
  attendanceController.checkOut
);

/**
 * @route   POST /api/attendance/break/start
 * @desc    Start a break
 * @access  Private (Employee)
 */
router.post(
  '/attendance/break/start',
  restrictTo('EMPLOYEE','ADMIN'),
  [
    body('breakType')
      .optional()
      .isIn(['SHORT_BREAK', 'LUNCH_BREAK', 'COFFEE_BREAK'])
      .withMessage('Invalid break type'),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Note cannot exceed 500 characters')
  ],
  attendanceController.startBreak
);

/**
 * @route   POST /api/attendance/break/end
 * @desc    End a break
 * @access  Private (Employee)
 */
router.post(
  '/attendance/break/end',
  restrictTo('EMPLOYEE','ADMIN'),
  [
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Note cannot exceed 500 characters')
  ],
  attendanceController.endBreak
);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance record
 * @access  Private (Employee)
 */
router.get(
  '/attendance/today',
  restrictTo('EMPLOYEE','ADMIN'),
  attendanceController.getTodayAttendance
);

/**
 * @route   GET /api/attendance/history
 * @desc    Get attendance history
 * @access  Private (Employee)
 */
router.get(
  '/attendance/history',
  restrictTo('EMPLOYEE','ADMIN'),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  attendanceController.getAttendanceHistory
);

/**
 * @route   GET /api/attendance/employees
 * @desc    Get all employees attendance (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/attendance/employees',
  restrictTo('ADMIN'),
  [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be a valid date'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('employee')
      .optional()
      .isMongoId()
      .withMessage('Employee ID must be a valid MongoDB ID'),
    query('department')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Department cannot exceed 50 characters')
  ],
  attendanceController.getAllEmployeesAttendance
);

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private
 */
// router.get(
//   '/stats',
//   [
//     query('startDate')
//       .optional()
//       .isISO8601()
//       .withMessage('Start date must be a valid date'),
//     query('endDate')
//       .optional()
//       .isISO8601()
//       .withMessage('End date must be a valid date'),
//     query('employeeId')
//       .optional()
//       .isMongoId()
//       .withMessage('Employee ID must be a valid MongoDB ID')
//   ],
//   attendanceController.getAttendanceStats
// );

/**
 * @route   GET /api/attendance/:id
 * @desc    Get specific attendance record
 * @access  Private
 */
// router.get(
//   '/:id',
//   [
//     query('include')
//       .optional()
//       .isIn(['employee', 'breaks', 'all'])
//       .withMessage('Include must be one of: employee, breaks, all')
//   ],
//   attendanceController.getAttendance
// );

/**
 * @route   PATCH /api/attendance/:id
 * @desc    Update attendance record (Admin only)
 * @access  Private (Admin)
 */
// router.patch(
//   '/:id',
//   restrictTo('ADMIN'),
//   [
//     body('checkIn')
//       .optional()
//       .isISO8601()
//       .withMessage('Check-in time must be a valid date'),
//     body('checkOut')
//       .optional()
//       .isISO8601()
//       .withMessage('Check-out time must be a valid date'),
//     body('status')
//       .optional()
//       .isIn(['PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY'])
//       .withMessage('Invalid status'),
//     body('note')
//       .optional()
//       .trim()
//       .isLength({ max: 1000 })
//       .withMessage('Note cannot exceed 1000 characters')
//   ],
//   attendanceController.updateAttendance
// );

/**
 * @route   POST /api/attendance/bulk
 * @desc    Bulk create attendance records (Admin only)
 * @access  Private (Admin)
 */
// router.post(
//   '/bulk',
//   restrictTo('ADMIN'),
//   [
//     body().isArray().withMessage('Request body must be an array'),
//     body('*.employee')
//       .isMongoId()
//       .withMessage('Each record must have a valid employee ID'),
//     body('*.date')
//       .isISO8601()
//       .withMessage('Each record must have a valid date'),
//     body('*.checkIn')
//       .optional()
//       .isISO8601()
//       .withMessage('Check-in time must be a valid date'),
//     body('*.checkOut')
//       .optional()
//       .isISO8601()
//       .withMessage('Check-out time must be a valid date'),
//     body('*.status')
//       .isIn(['PRESENT', 'ABSENT', 'ON_LEAVE', 'HALF_DAY'])
//       .withMessage('Invalid status')
//   ],
//   attendanceController.bulkCreateAttendance
// );

module.exports = router;