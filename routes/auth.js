const express = require("express");
const authController = require("../controllers/auth");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// regstration
router.post(
  "/register",

  authController.register
);

// Authenticate user & get token
router.post(
  "/login",
  authLimiter,

  authController.login
);

// Get current logged in user

router.get("/me", auth, authController.getMe);



module.exports = router;
