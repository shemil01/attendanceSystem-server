const express = require('express');
const { body, query } = require('express-validator');
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const restrictTo = require('../middleware/roles');
const validate = require('../middleware/validation');

const router = express.Router();

// All routes protected and admin only
router.use(auth, restrictTo('ADMIN'));

/**
 * @route   GET /api/employees
 * @desc    Get all employees
 * @access  Private (Admin)
 */
router.get(
  '/employees',
  [
    query('role')
      .optional()
      .isIn(['ADMIN', 'EMPLOYEE'])
      .withMessage('Role must be one of: ADMIN, EMPLOYEE, MANAGER'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('department')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Department cannot exceed 50 characters'),
    query('sort')
      .optional()
      .isIn(['name', 'email', 'createdAt', 'role', 'department'])
      .withMessage('Sort must be one of: name, email, createdAt, role, department'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be one of: asc, desc')
  ],
  validate,
  employeeController.getAllEmployees
);

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Admin)
 */
router.post(
  '/employees',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'EMPLOYEE'])
      .withMessage('Role must be one of: ADMIN, EMPLOYEE, MANAGER'),
    body('department')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Department cannot exceed 50 characters'),
    body('position')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Position cannot exceed 50 characters'),
    body('salary')
      .optional()
      .isNumeric()
      .withMessage('Salary must be a number'),
    body('joinDate')
      .optional()
      .isISO8601()
      .withMessage('Join date must be a valid date'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Phone must be a valid phone number'),
    body('address')
      .optional()
      .isObject()
      .withMessage('Address must be a valid object')
  ],
  validate,
  employeeController.createEmployee
);

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private (Admin)
 */
router.get(
  '/employees/:id',
  [
    query('include')
      .optional()
      .isIn(['attendance', 'leaves', 'all'])
      .withMessage('Include must be one of: attendance, leaves, all')
  ],
  validate,
  employeeController.getEmployee
);

/**
 * @route   PATCH /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin)
 */
router.patch(
  '/employees/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'EMPLOYEE'])
      .withMessage('Role must be one of: ADMIN, EMPLOYEE, MANAGER'),
    body('department')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Department cannot exceed 50 characters'),
    body('position')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Position cannot exceed 50 characters'),
    body('salary')
      .optional()
      .isNumeric()
      .withMessage('Salary must be a number'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Phone must be a valid phone number'),
    body('address')
      .optional()
      .isObject()
      .withMessage('Address must be a valid object')
  ],
  validate,
  employeeController.updateEmployee
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/employees/:id',
  employeeController.deleteEmployee
);

/**
 * @route   GET /api/employees/:id/stats
 * @desc    Get employee dashboard stats
 * @access  Private (Admin)
 */
router.get(
  '/:id/stats',
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
  ],
  validate,
  employeeController.getEmployeeStats
);

/**
 * @route   GET /api/employees/:id/attendance
 * @desc    Get employee attendance history
 * @access  Private (Admin)
 */
// router.get(
//   '/:id/attendance',
//   [
//     query('startDate')
//       .optional()
//       .isISO8601()
//       .withMessage('Start date must be a valid date'),
//     query('endDate')
//       .optional()
//       .isISO8601()
//       .withMessage('End date must be a valid date'),
//     query('page')
//       .optional()
//       .isInt({ min: 1 })
//       .withMessage('Page must be a positive integer'),
//     query('limit')
//       .optional()
//       .isInt({ min: 1, max: 100 })
//       .withMessage('Limit must be between 1 and 100')
//   ],
//   validate,
//   employeeController.getEmployeeAttendance
// );

/**
 * @route   GET /api/employees/:id/leaves
 * @desc    Get employee leave history
 * @access  Private (Admin)
 */
// router.get(
//   '/:id/leaves',
//   [
//     query('status')
//       .optional()
//       .isIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
//       .withMessage('Invalid status'),
//     query('page')
//       .optional()
//       .isInt({ min: 1 })
//       .withMessage('Page must be a positive integer'),
//     query('limit')
//       .optional()
//       .isInt({ min: 1, max: 100 })
//       .withMessage('Limit must be between 1 and 100'),
//     query('year')
//       .optional()
//       .isInt({ min: 2000, max: 2100 })
//       .withMessage('Year must be a valid year')
//   ],
//   validate,
//   employeeController.getEmployeeLeaves
// );

/**
 * @route   POST /api/employees/bulk
 * @desc    Bulk create employees
 * @access  Private (Admin)
 */
// router.post(
//   '/bulk',
//   [
//     body().isArray().withMessage('Request body must be an array'),
//     body('*.name')
//       .trim()
//       .isLength({ min: 2, max: 50 })
//       .withMessage('Name must be between 2 and 50 characters'),
//     body('*.email')
//       .isEmail()
//       .normalizeEmail()
//       .withMessage('Please provide a valid email address'),
//     body('*.password')
//       .isLength({ min: 6 })
//       .withMessage('Password must be at least 6 characters long'),
//     body('*.role')
//       .optional()
//       .isIn(['ADMIN', 'EMPLOYEE'])
//       .withMessage('Role must be one of: ADMIN, EMPLOYEE, MANAGER'),
//     body('*.department')
//       .optional()
//       .trim()
//       .isLength({ max: 50 })
//       .withMessage('Department cannot exceed 50 characters')
//   ],
//   validate,
//   employeeController.bulkCreateEmployees
// );

/**
 * @route   POST /api/employees/:id/reset-password
 * @desc    Reset employee password (Admin only)
 * @access  Private (Admin)
 */
// router.post(
//   '/:id/reset-password',
//   [
//     body('newPassword')
//       .isLength({ min: 6 })
//       .withMessage('New password must be at least 6 characters long')
//   ],
//   validate,
//   employeeController.resetEmployeePassword
// );

module.exports = router;