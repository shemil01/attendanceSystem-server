const Attendance = require("../models/Attendance");
const User = require("../models/User");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  validateCheckIn,
  validateBreak,
} = require("../validators/attendanceValidator");


exports.checkIn = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = validateCheckIn(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const employeeId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already checked in today
  const existingAttendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (existingAttendance) {
    return next(new AppError("You have already checked in today", 400));
  }

  const attendance = await Attendance.create({
    employee: employeeId,
    date: new Date(),
    checkIn: new Date(),
    status: "PRESENT",
  });

  // Populate employee details
  await attendance.populate("employee", "name email");

  res.status(201).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

/**
 * @desc    Check out from work
 * @route   POST /api/attendance/check-out
 * @access  Private (Employee)
 */
exports.checkOut = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's attendance record
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance) {
    return next(new AppError("You have not checked in today", 400));
  }

  if (attendance.checkOut) {
    return next(new AppError("You have already checked out today", 400));
  }

  // Check if currently on break
  const activeBreak = attendance.breaks.find((b) => !b.end);
  if (activeBreak) {
    return next(new AppError("Please end your break before checking out", 400));
  }

  attendance.checkOut = new Date();

  // Calculate working time (in minutes)
  const checkInTime = new Date(attendance.checkIn).getTime();
  const checkOutTime = new Date(attendance.checkOut).getTime();
  attendance.workingTime =
    Math.round((checkOutTime - checkInTime) / (1000 * 60)) -
    attendance.totalBreakTime;

  await attendance.save();
  await attendance.populate("employee", "name email");

  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

/**
 * @desc    Start a break
 * @route   POST /api/attendance/break/start
 * @access  Private (Employee)
 */
exports.startBreak = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = validateBreak(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const employeeId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's attendance record
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance) {
    return next(new AppError("You have not checked in today", 400));
  }

  if (attendance.checkOut) {
    return next(new AppError("You have already checked out today", 400));
  }

  // Check if already on break
  const activeBreak = attendance.breaks.find((b) => !b.end);
  if (activeBreak) {
    return next(new AppError("You are already on a break", 400));
  }

  // Add new break
  attendance.breaks.push({
    start: new Date(),
    breakType: req.body.breakType || "SHORT_BREAK",
  });

  await attendance.save();
  await attendance.populate("employee", "name email");

  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

/**
 * @desc    End a break
 * @route   POST /api/attendance/break/end
 * @access  Private (Employee)
 */
exports.endBreak = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's attendance record
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  if (!attendance) {
    return next(new AppError("You have not checked in today", 400));
  }

  // Find active break
  const activeBreak = attendance.breaks.find((b) => !b.end);
  if (!activeBreak) {
    return next(new AppError("You are not currently on a break", 400));
  }

  // End the break and calculate duration
  activeBreak.end = new Date();
  const breakStartTime = new Date(activeBreak.start).getTime();
  const breakEndTime = new Date(activeBreak.end).getTime();
  activeBreak.duration = Math.round(
    (breakEndTime - breakStartTime) / (1000 * 60)
  );

  // Update total break time
  attendance.totalBreakTime = attendance.breaks.reduce(
    (total, breakItem) => total + (breakItem.duration || 0),
    0
  );

  await attendance.save();
  await attendance.populate("employee", "name email");

  res.status(200).json({
    status: "success",
    data: {
      attendance,
    },
  });
});

/**
 * @desc    Get today's attendance record
 * @route   GET /api/attendance/today
 * @access  Private (Employee)
 */
exports.getTodayAttendance = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  }).populate("employee", "name email");

  res.status(200).json({
    status: "success",
    data: {
      attendance: attendance || null,
    },
  });
});

/**
 * @desc    Get attendance history
 * @route   GET /api/attendance/history
 * @access  Private (Employee)
 */
exports.getAttendanceHistory = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  // Build filter object
  const filter = { employee: employeeId };

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  // Execute query with pagination
  const attendance = await Attendance.find(filter)
    .populate("employee", "name email")
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get total count for pagination
  const total = await Attendance.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: {
      attendance,
    },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});

/**
 * @desc    Get all employees attendance (Admin only)
 * @route   GET /api/attendance/employees
 * @access  Private (Admin)
 */
exports.getAllEmployeesAttendance = catchAsync(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { date = today, page = 1, limit = 10 } = req.query;
  const filterDate = new Date(date);
  filterDate.setHours(0, 0, 0, 0);

  // Build filter
  const filter = {
    date: {
      $gte: filterDate,
      $lt: new Date(filterDate.getTime() + 24 * 60 * 60 * 1000),
    },
  };

  // Execute query with pagination
  const attendance = await Attendance.find(filter)
    .populate("employee", "name email role")
    .sort({ checkIn: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get total count for pagination
  const total = await Attendance.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: {
      attendance,
    },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});
