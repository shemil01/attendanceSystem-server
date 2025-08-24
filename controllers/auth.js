const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { signToken, verifyToken } = require('../utils/auth');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { validateLogin } = require('../validators/authValidator');


// register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // check if email already exists
  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('Email already registered', 400));
  }

  // create user (password is hashed in pre-save hook)
  const newUser = await User.create({
    name,
    email,
    password,
    role, 
  });

  // don’t return password
  newUser.password = undefined;

  // create token
  const token = signToken(newUser._id, newUser.role);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});



/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */

exports.login = catchAsync(async (req, res, next) => {
  // Validate request body
  // const { error } = validateLogin(req.body);
  // if (error) {
  //   return next(new AppError(error.details[0].message, 400));
  // }

  const { email, password } = req.body;

  // Check if user exists and password is correct
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // Remove password from output   
  user.password = undefined;

  // Create token
  const token = signToken(user._id, user.role);

  // Get today's attendance record if exists
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attendance = await Attendance.findOne({
    employee: user._id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

res.status(200).json({
  status: "success",
  token,
  data: {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    todayAttendance: attendance || null,
  },
});

});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * @desc    Update password
 * @route   PATCH /api/auth/update-password
 * @access  Private
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  user.password = newPassword;
  await user.save();

  // Remove password from output
  user.password = undefined;

  // Create new token
  const token = signToken(user._id, user.role);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
});