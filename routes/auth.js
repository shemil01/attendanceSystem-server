const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth");
const auth = require("../middleware/auth");

const router = express.Router();


// regstration
router.post(
  "/register",

  authController.register
);

// Authenticate user & get token
router.post(
  "/login",

  authController.login
);

// Get current logged in user

router.get("/me", auth, authController.getMe);

// Update user password
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

module.exports = router;
