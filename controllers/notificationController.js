const Notification = require("../models/Notification");

// Get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; 

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20); 
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
