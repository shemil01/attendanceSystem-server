const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    return next(new AppError('Validation failed', 400, errorMessages));
  }
  
  next();
};

module.exports = validate;