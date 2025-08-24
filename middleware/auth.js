const { verifyToken } = require('../utils/auth');
const User = require('../models/User');
const AppError = require('../utils/appError');

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }
    
    const decoded = verifyToken(token);
    
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated.', 401));
    }
    
    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
};

module.exports = protect;