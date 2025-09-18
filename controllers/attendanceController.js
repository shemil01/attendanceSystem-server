const Attendance = require("../models/Attendance");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { getTodayRange } = require("../utils/dateHelper");
const { validateBreak } = require("../validators/attendanceValidator");

// chekin controller
exports.checkIn = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { today, tomorrow } = getTodayRange();

  // Check if already checked in today
  const existingAttendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
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

//  Check out from work
exports.checkOut = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { today, tomorrow } = getTodayRange();

  // Find today's attendance record
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
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

//  Start a break
exports.startBreak = catchAsync(async (req, res, next) => {
  const { today, tomorrow } = getTodayRange();
  // Validate request body
  const { error } = validateBreak(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const employeeId = req.user.id;

  // Find today's attendance record
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
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

// End a break
exports.endBreak = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { today, tomorrow } = getTodayRange();

  // Find today's attendance record
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
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
  const durationMinutes = Math.round(
    (breakEndTime - breakStartTime) / (1000 * 60)
  );
  activeBreak.duration = durationMinutes;

  // Update total break time
  attendance.totalBreakTime = attendance.breaks.reduce(
    (total, breakItem) => total + (breakItem.duration || 0),
    0
  );

  await attendance.save();
  await attendance.populate("employee", "name email");

  const formatMinutes = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  res.status(200).json({
    status: "success",
    data: {
      attendance: {
        ...attendance.toObject(),
        totalBreakTimeFormatted: formatMinutes(attendance.totalBreakTime),
        lastBreakDurationFormatted: formatMinutes(durationMinutes),
      },
    },
  });
});

//  Get today's attendance record all employee
exports.getTodayAttendance = catchAsync(async (req, res) => {
  const { today, tomorrow } = getTodayRange();
  const attendance = await Attendance.find({
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).populate("employee", "name email");

  res.status(200).json({
    status: "success",
    data: {
      attendance: attendance || null,
    },
  });
});

//  Get today attandance of one employee
exports.getTodayAttendanceAemployee = catchAsync(async (req, res) => {
  const employeeId = req.user.id;
  const { today, tomorrow } = getTodayRange();

  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).populate("employee", "name email");

  if (!attendance || !attendance.checkIn) {
    return res.status(200).json({
      status: "reminder",
      message: "⚠️ You have not checked in today. Please check in.",
      attendance: null,
    });
  }
  res.status(200).json({
    status: "success",
    data: {
      attendance: attendance || null,
    },
  });
});

// Get own attendance history
exports.getAttendanceHistory = catchAsync(async (req, res) => {
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

// Get all employees attendance (Admin only)
exports.getAllEmployeesAttendance = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const attendance = await Attendance.find()
    .populate("employee", "name email role")
    .sort({ checkIn: 1 })
  

  const total = await Attendance.countDocuments();

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: { attendance },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});
// Get a employees attandance
exports.getEmployeeAttendance = catchAsync(async (req, res) => {
  const { id: employeeId } = req.params;
  const { date = new Date(), page = 1, limit = 10 } = req.query;

  // Filter by date
  const filterDate = new Date(date);
  filterDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(filterDate.getTime() + 24 * 60 * 60 * 1000);

  const filter = {
    employee: employeeId,
    date: { $gte: filterDate, $lt: nextDay },
  };

  // Fetch attendance with pagination
  const attendance = await Attendance.find(filter)
    .populate("employee", "name email role")
    .sort({ checkIn: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Attendance.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: attendance.length,
    data: { attendance },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});
