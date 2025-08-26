const express = require('express');
const { body, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const restrictTo = require('../middleware/roles');

const router = express.Router();

// All routes protected
router.use(auth);

// check in
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

// checkout
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

// start breake
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

// end brake
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

// toaday attandance record/stat
router.get(
  '/attendance/today',
  restrictTo('EMPLOYEE','ADMIN'),
  attendanceController.getTodayAttendance
);
// toaday attandance record of single employee

router.get(
  '/attendance-one/today',
  restrictTo('EMPLOYEE','ADMIN'),
  attendanceController.getTodayAttendanceAemployee
);

// get own attandance history
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

// Get all employees attendance (Admin only)
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

// get a employee attandance by id
router.get(
  '/attendance/employee/:employeeId',
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
  attendanceController.getEmployeeAttendance
);

module.exports = router;