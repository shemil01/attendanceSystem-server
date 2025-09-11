const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { validateEmployeeCreate } = require('../validators/employeeValidator');

// get all employes
exports.getAllEmployees = catchAsync(async (req, res) => {
  const { role, isActive, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};
  if (role) {
    filter.role = role;
  }
  if (isActive !== undefined ) {
    filter.isActive = isActive === 'true';
  }

  // Execute query with pagination
  const employees = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get total count for pagination
  const total = await User.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: {
      employees
    },
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});


//  create a employee
exports.createEmployee = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = validateEmployeeCreate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const { name, email, password, role ,department,position} = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  const employee = await User.create({
    name,
    email,
    password,
    role: role || 'EMPLOYEE',
    department,
    position
  });

  // Remove password from output
  employee.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      employee
    }
  });
});

// Get employee by ID

exports.getEmployee = catchAsync(async (req, res, next) => {
  const employee = await User.findById(req.params.id).select("-password");

  if (!employee) {
    return next(new AppError("No employee found with that ID", 404));
  }

  // Today’s date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Fetch today's attendance
  const todayAttendance = await Attendance.findOne({
    employee: employee._id,
    date: { $gte: today, $lt: tomorrow },
  });

  // Fetch last 7 days history
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const history = await Attendance.find({
    employee: employee._id,
    date: { $gte: startDate, $lt: tomorrow },
  }).sort({ date: -1 });

  // Calculate stats
  const presentDays = history.filter(
    (record) => record.status === "PRESENT" || (record.checkIn && record.checkOut)
  ).length;

const joinDate = new Date(employee.createdAt);
const todayMidnight = new Date();
todayMidnight.setHours(0, 0, 0, 0);

const diffTime = todayMidnight.getTime() - joinDate.getTime();
const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const stats = {
    totalDays,
    presentDays,
     attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
  };

  res.status(200).json({
    status: "success",
    data: {
      employee,
      todayAttendance,
      history,
      stats,
    },
  });
});


// Update employee
exports.updateEmployee = catchAsync(async (req, res, next) => {
  // Remove password from update fields if present
  if (req.body.password) {
    delete req.body.password;
  }

  const employee = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      employee
    }
  });
});

//  Delete employee 
exports.deleteEmployee = catchAsync(async (req, res, next) => {
  const employee = await User.findByIdAndDelete(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

//   Get employee dashboard stats
exports.getEmployeeStats = catchAsync(async (req, res, next) => {
  const employeeId = req.params.id;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Check if employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  // Get attendance stats for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalPresent: {
          $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] }
        },
        totalAbsent: {
          $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] }
        },
        avgWorkingHours: { $avg: '$workingTime' }
      }
    }
  ]);

  // Get leave stats for current year
  const leaveStats = await Leave.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        startDate: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        },
        status: 'APPROVED'
      }
    },
    {
      $group: {
        _id: null,
        totalLeaves: { $sum: 1 },
        totalLeaveDays: {
          $sum: {
            $ceil: {
              $divide: [
                { $subtract: ['$endDate', '$startDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      }
    }
  ]);

  const stats = {
    attendance: attendanceStats[0] || { totalPresent: 0, totalAbsent: 0, avgWorkingHours: 0 },
    leaves: leaveStats[0] || { totalLeaves: 0, totalLeaveDays: 0 }
  };

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});