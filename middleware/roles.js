const AppError = require("../utils/appError");

const restrictTo = (...allowedRoles) => {
  console.log(allowedRoles)
  // Return the actual middleware function that will be called for each request
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError("User authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

module.exports = restrictTo;
