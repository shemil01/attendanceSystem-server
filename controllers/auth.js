const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { signToken } = require("../utils/auth");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Login user

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if user exists and password is correct
  const user = await User.findOne({ email, isActive: true }).select(
    "+password"
  );
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
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
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
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

//  Get current logged in user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

//  Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Please provide current and new password", 400));
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  user.password = newPassword;
  await user.save();

  // Remove password from output
  user.password = undefined;

  // Create new token
  const token = signToken(user._id, user.role);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});
