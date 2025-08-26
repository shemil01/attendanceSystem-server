const express = require("express");
const { getNotifications, markAsRead } = require("../controllers/notificationController");

const router = express.Router();

router.get("/notification", getNotifications);
router.patch("/:id/read", markAsRead);

module.exports = router;
