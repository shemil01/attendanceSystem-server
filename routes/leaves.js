const express = require('express');
const { body, query } = require('express-validator');
const leaveController = require('../controllers/leaveController');
const auth = require('../middleware/auth');
const restrictTo = require('../middleware/roles');
// const validate = require('../middleware/validation');

const router = express.Router();

// All routes protected
router.use(auth);

/**
 * @route   POST /api/leaves
 * @desc    Apply for leave
 * @access  Private (Employee)
 */
router.post(
  '/leaves',
  restrictTo('EMPLOYEE'),
  [
    body('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date')
      .custom((value, { req }) => {
        if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
          throw new Error('Start date cannot be in the past');
        }
        return true;
      }),
    body('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
          throw new Error('End date cannot be before start date');
        }
        return true;
      }),
    body('reason')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Reason must be between 10 and 1000 characters'),
    body('leaveType')
      .optional()
      .isIn(['SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'OTHER'])
      .withMessage('Invalid leave type'),
    body('document')
      .optional()
      .isURL()
      .withMessage('Document must be a valid URL')
  ],
//   validate,
  leaveController.applyForLeave
);

/**
 * @route   GET /api/leaves/my-leaves
 * @desc    Get my leaves
 * @access  Private (Employee)
 */
router.get(
  '/leaves/my-leaves',
  restrictTo('EMPLOYEE'),
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be a valid year')
  ],
//   validate,
  leaveController.getMyLeaves
);

/**
 * @route   GET /api/leaves
 * @desc    Get all leaves (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/leaves',
  restrictTo('ADMIN'),
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
      .withMessage('Invalid status'),
    query('employee')
      .optional()
      .isMongoId()
      .withMessage('Employee ID must be a valid MongoDB ID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('department')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Department cannot exceed 50 characters')
  ],
//   validate,
  leaveController.getAllLeaves
);

/**
 * @route   GET /api/leaves/stats
 * @desc    Get leave statistics
 * @access  Private
 */
router.get(
  '/stats',
  [
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be a valid year'),
    query('employeeId')
      .optional()
      .isMongoId()
      .withMessage('Employee ID must be a valid MongoDB ID')
  ],
//   validate,
  leaveController.getLeaveStats
);

/**
 * @route   GET /api/leaves/:id
 * @desc    Get specific leave request
 * @access  Private
 */
// router.get(
//   '/:id',
//   [
//     query('include')
//       .optional()
//       .isIn(['employee', 'approvedBy', 'all'])
//       .withMessage('Include must be one of: employee, approvedBy, all')
//   ],
// //   validate,
//   leaveController.getLeave
// );

/**
 * @route   PATCH /api/leaves/:id
 * @desc    Update leave status (Admin only)
 * @access  Private (Admin)
 */
router.patch(
  '/leaves/:id',
  restrictTo('ADMIN'),
  [
    body('status')
      .isIn(['APPROVED', 'REJECTED', 'CANCELLED'])
      .withMessage('Status can only be APPROVED, REJECTED, or CANCELLED'),
    body('adminNote')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Admin note cannot exceed 500 characters')
  ],
//   validate,
  leaveController.updateLeaveStatus
);

/**
 * @route   DELETE /api/leaves/:id
 * @desc    Cancel leave request (Employee only)
 * @access  Private (Employee)
 */
// router.delete(
//   '/:id',
//   restrictTo('EMPLOYEE'),
//   leaveController.cancelLeave
// );

/**
 * @route   GET /api/leaves/types
 * @desc    Get available leave types and balances
 * @access  Private
 */
// router.get(
//   '/types',
//   leaveController.getLeaveTypes
// );

/**
 * @route   POST /api/leaves/:id/comment
 * @desc    Add comment to leave request
 * @access  Private
 */
// router.post(
//   '/:id/comment',
//   [
//     body('comment')
//       .trim()
//       .isLength({ min: 1, max: 500 })
//       .withMessage('Comment must be between 1 and 500 characters'),
//     body('isInternal')
//       .optional()
//       .isBoolean()
//       .withMessage('isInternal must be a boolean')
//   ],
// //   validate,
//   leaveController.addComment
// );

module.exports = router;