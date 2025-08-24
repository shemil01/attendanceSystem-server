const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['LEAVE_APPROVAL', 'LEAVE_REJECTION', 'ATTENDANCE', 'SYSTEM'],
    default: 'SYSTEM'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, // For linking to leave request, etc.
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);