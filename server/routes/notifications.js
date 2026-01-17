const router = require("express").Router();
const notificationController = require("../controllers/notificationController");

// Get notifications
router.get("/:userId", notificationController.getNotifications.bind(notificationController));

// Mark notification as read
router.put("/mark-read/:notificationId", notificationController.markNotificationRead.bind(notificationController));

// Mark all notifications as read
router.put("/mark-all-read/:userId", notificationController.markAllNotificationsRead.bind(notificationController));

module.exports = router;
