const Leave = require("../models/Leave");
const User = require("../models/User");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { validateLeaveRequest } = require("../validators/leaveValidator");
const Notification = require("../models/Notification");

// .....leave appliacation controller
exports.applyForLeave = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = validateLeaveRequest(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { startDate, endDate, reason, leaveType } = req.body;
  const employeeId = req.user.id;

  // Check if dates are valid
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return next(new AppError("Start date cannot be after end date", 400));
  }

  if (start < new Date().setHours(0, 0, 0, 0)) {
    return next(new AppError("Cannot apply for leave in the past", 400));
  }

  // Check for overlapping leave requests
  const overlappingLeave = await Leave.findOne({
    employee: employeeId,
    status: { $in: ["PENDING", "APPROVED"] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } },
      { startDate: { $gte: start, $lte: end } },
    ],
  });

  if (overlappingLeave) {
    return next(
      new AppError("You already have a leave request for this period", 400)
    );
  }

  const leave = await Leave.create({
    employee: employeeId,
    startDate: start,
    endDate: end,
    reason,
    leaveType,
  });

  await leave.populate("employee", "name email");

  res.status(201).json({
    status: "success",
    data: {
      leave,
    },
  });
});

// ...get own leaves
exports.getMyLeaves = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = { employee: employeeId };
  if (status) {
    filter.status = status;
  }

  // Execute query with pagination
  const leaves = await Leave.find(filter)
    .populate("employee", "name email")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get total count for pagination
  const total = await Leave.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: leaves.length,
    data: {
      leaves,
    },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});

// ..Get all leaves (Admin only)

exports.getAllLeaves = catchAsync(async (req, res, next) => {
  const { status, employee, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (employee) {
    filter.employee = employee;
  }

  // Execute query with pagination
  const leaves = await Leave.find(filter)
    .populate("employee", "name email")
    .populate("approvedBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get total count for pagination
  const total = await Leave.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: leaves.length,
    data: {
      leaves,
    },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});

//  ...get todayss leaves
exports.getTodayLeaves = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, department } = req.query;

  // Today's date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Base filter for approved leaves overlapping today
  const filter = {
    status: "APPROVED",
    startDate: { $lt: todayEnd },
    endDate: { $gte: todayStart },
  };

  // Department filter
  if (department) {
    const employees = await User.find(
      { department: new RegExp(department, "i") },
      "_id"
    );
    filter.employee = { $in: employees.map((emp) => emp._id) };
  }

  // Query leaves with pagination
  const leaves = await Leave.find(filter)
    .populate({
      path: "employee",
      select: "name email department position",
      match: department ? { department: new RegExp(department, "i") } : {},
    })
    .populate("approvedBy", "name")
    .sort({ startDate: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Remove null employees if department filter applied
  const filteredLeaves = department
    ? leaves.filter((l) => l.employee !== null)
    : leaves;

  // Total leaves count
  const total = await Leave.countDocuments(filter);

  // Today's stats by department
  const todayStats = await Leave.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "employee",
        foreignField: "_id",
        as: "employeeData",
      },
    },
    { $unwind: "$employeeData" },
    {
      $group: {
        _id: "$employeeData.department",
        count: { $sum: 1 },
        employees: { $addToSet: "$employee" },
      },
    },
    {
      $project: {
        department: "$_id",
        count: 1,
        employeeCount: { $size: "$employees" },
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: filteredLeaves.length,
    data: {
      leaves: filteredLeaves,
      stats: {
        totalLeaves: total,
        departmentBreakdown: todayStats,
      },
    },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  });
});

// Update leave status (Admin only)
exports.updateLeaveStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const adminId = req.user.id;
  const io = req.app.get("io");

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return next(new AppError("Status can only be APPROVED or REJECTED", 400));
  }

  const leave = await Leave.findById(req.params.id).populate(
    "employee",
    "name email"
  );

  if (!leave) {
    return next(new AppError("No leave found with that ID", 404));
  }

  if (leave.status !== "PENDING") {
    return next(new AppError("Leave request has already been processed", 400));
  }

  leave.status = status;
  leave.approvedBy = adminId;
  await leave.save();

  // Create notification in database
  const notificationMessage =
    status === "APPROVED"
      ? `Your leave request from ${new Date(
          leave.startDate
        ).toLocaleDateString()} to ${new Date(
          leave.endDate
        ).toLocaleDateString()} has been approved.`
      : `Your leave request from ${new Date(
          leave.startDate
        ).toLocaleDateString()} to ${new Date(
          leave.endDate
        ).toLocaleDateString()} has been rejected.`;

  const notification = await Notification.create({
    user: leave.employee._id,
    title: status === "APPROVED" ? "Leave Approved" : "Leave Rejected",
    message: notificationMessage,
    type: status === "APPROVED" ? "LEAVE_APPROVAL" : "LEAVE_REJECTION",
    relatedId: leave._id,
    metadata: {
      leaveId: leave._id,
      startDate: leave.startDate,
      endDate: leave.endDate,
      leaveType: leave.leaveType,
      status: status,
    },
  });

  // Emit real-time notification via Socket.io
  if (io) {
    io.to(`user-${leave.employee._id}`).emit("new-notification", {
      ...notification.toObject(),
      employee: {
        name: leave.employee.name,
        email: leave.employee.email,
      },
    });

    console.log(`Notification sent to user ${leave.employee._id}`);
  }
  await leave.populate("employee", "name email");
  await leave.populate("approvedBy", "name");

  // TODO: Send notification to employee about leave status update

  res.status(200).json({
    status: "success",
    data: {
      leave,
    },
  });
});

exports.getLeaveStats = catchAsync(async (req, res, next) => {
  const employeeId = req.user.id;
  const currentYear = new Date().getFullYear();

  const stats = await Leave.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        startDate: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalDays: {
          $sum: {
            $ceil: {
              $divide: [
                { $subtract: ["$endDate", "$startDate"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
    },
  ]);

  // Format the response
  const result = {
    PENDING: { count: 0, totalDays: 0 },
    APPROVED: { count: 0, totalDays: 0 },
    REJECTED: { count: 0, totalDays: 0 },
  };

  stats.forEach((stat) => {
    result[stat._id] = { count: stat.count, totalDays: stat.totalDays + 1 };
  });

  res.status(200).json({
    status: "success",
    data: {
      stats: result,
    },
  });
});
