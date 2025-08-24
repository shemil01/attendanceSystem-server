const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth");
const auth = require("../middleware/auth");

const router = express.Router();



router.post(
  "/register",

  authController.register
);


/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  "/login",

  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get("/me", auth, authController.getMe);

/**
 * @route   PATCH /api/auth/update-password
 * @desc    Update user password
 * @access  Private
 */
router.patch(
  "/update-password",
  auth,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  authController.updatePassword
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
// router.post(
//   '/refresh-token',
//   [
//     body('refreshToken')
//       .notEmpty()
//       .withMessage('Refresh token is required')
//   ],
//   validate,
//   authController.refreshToken
// );

// /**
//  * @route   POST /api/auth/forgot-password
//  * @desc    Request password reset
//  * @access  Public
//  */
// router.post(
//   '/forgot-password',
//   [
//     body('email')
//       .isEmail()
//       .normalizeEmail()
//       .withMessage('Please provide a valid email address')
//   ],
//   validate,
//   authController.forgotPassword
// );

// /**
//  * @route   PATCH /api/auth/reset-password/:token
//  * @desc    Reset password with token
//  * @access  Public
//  */
// router.patch(
//   '/reset-password/:token',
//   [
//     body('password')
//       .isLength({ min: 6 })
//       .withMessage('Password must be at least 6 characters long')
//   ],
//   validate,
//   authController.resetPassword
// );

module.exports = router;
