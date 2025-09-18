const { verifyToken } = require("../utils/auth");
const User = require("../models/User");
const AppError = require("../utils/appError");

// Middleware to protect routes (only logged-in users can access)
const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract token (remove "Bearer ")
      token = req.headers.authorization.split(" ")[1];
    }
    // if no token found  user not logged in
    if (!token) {
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }
    // Verify token (decode user id from JWT)
    const decoded = verifyToken(token);
    // Find user from decoded token id
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    if (!currentUser.isActive) {
      return next(new AppError("Your account has been deactivated.", 401));
    }
    // Attach user info to request (so other routes can use req.user
    req.user = currentUser;
    next();
  } catch (error) {
    return next(
      new AppError("Invalid or expired token. Please log in again.", 401)
    );
  }
};

module.exports = protect;
