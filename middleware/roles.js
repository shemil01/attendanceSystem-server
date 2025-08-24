// backend/middleware/roles.js
const AppError = require('../utils/appError');

const restrictTo = (...allowedRoles) => {
  // This function runs when the server starts
  // console.log("Creating middleware for roles:", allowedRoles);
   
  // Return the actual middleware function that will be called for each request
  return (req, res, next) => {
    // This function runs when a request is made
    // console.log("Checking role for request. User role:", req.user?.role, "Allowed roles:", allowedRoles);
    
    if (!req.user || !req.user.role) {
      // console.log("No user or role found in request");
      return next(new AppError('User authentication required', 401));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      // console.log(`Access denied. User role: ${req.user.role}, Required: ${allowedRoles.join(', ')}`);
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    // console.log("Access granted for role:", req.user.role);
    next();
  };
};

module.exports = restrictTo;