const express = require("express");
const { body, query } = require("express-validator");
const leaveController = require("../controllers/leaveController");
const auth = require("../middleware/auth");
const restrictTo = require("../middleware/roles");
// const validate = require('../middleware/validation');

const router = express.Router();

// All routes protected
router.use(auth);

//  apply for leave
router.post(
  "/leaves",
  restrictTo("EMPLOYEE", "ADMIN"),
  [
    body("startDate")
      .isISO8601()
      .withMessage("Start date must be a valid date")
      .custom((value, { req }) => {
        if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
          throw new Error("Start date cannot be in the past");
        }
        return true;
      }),
    body("endDate")
      .isISO8601()
      .withMessage("End date must be a valid date")
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.startDate)) {
          throw new Error("End date cannot be before start date");
        }
        return true;
      }),
    body("reason")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Reason must be between 10 and 1000 characters"),
    body("leaveType")
      .optional()
      .isIn([
        "SICK_LEAVE",
        "CASUAL_LEAVE",
        "EARNED_LEAVE",
        "MATERNITY_LEAVE",
        "PATERNITY_LEAVE",
        "OTHER",
      ])
      .withMessage("Invalid leave type"),
    body("document")
      .optional()
      .isURL()
      .withMessage("Document must be a valid URL"),
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
  "/leaves/my-leaves",
  restrictTo("EMPLOYEE"),
  [
    query("status")
      .optional()
      .isIn(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
      .withMessage("Invalid status"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("Year must be a valid year"),
  ],
  //   validate,
  leaveController.getMyLeaves
);

//  Get all leaves (Admin only)
router.get(
  "/leaves",
  restrictTo("ADMIN"),
  [
    query("status")
      .optional()
      .isIn(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
      .withMessage("Invalid status"),
    query("employee")
      .optional()
      .isMongoId()
      .withMessage("Employee ID must be a valid MongoDB ID"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid date"),
    query("department")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Department cannot exceed 50 characters"),
  ],
  //   validate,
  leaveController.getAllLeaves
);

//  Get Today leaves (Admin only)

router.get(
  "/today/leaves",
  restrictTo("ADMIN"),
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("department")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Department cannot exceed 50 characters"),
  ],
  leaveController.getTodayLeaves
);

// leave stat
router.get(
  "/stats",
  [
    query("year")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("Year must be a valid year"),
    query("employeeId")
      .optional()
      .isMongoId()
      .withMessage("Employee ID must be a valid MongoDB ID"),
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
  "/leaves/:id",
  restrictTo("ADMIN"),
  [
    body("status")
      .isIn(["APPROVED", "REJECTED", "CANCELLED"])
      .withMessage("Status can only be APPROVED, REJECTED, or CANCELLED"),
    body("adminNote")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Admin note cannot exceed 500 characters"),
  ],
  //   validate,
  leaveController.updateLeaveStatus
);

module.exports = router;
