const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  breaks: [{
    start: Date,
    end: Date,
    duration: Number, 
  }],
  totalBreakTime: {
    type: Number,
    default: 0, 
  },
  workingTime: {
    type: Number,
    default: 0, 
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'ON_LEAVE'],
    default: 'ABSENT',
  },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);