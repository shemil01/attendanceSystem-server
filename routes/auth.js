const express = require("express");
const authController = require("../controllers/auth");
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// login
router.post("/login", authLimiter, authController.login);

// Get current logged in user

router.get("/me", auth, authController.getMe);

module.exports = router;
