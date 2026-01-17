const Notification = require("../models/Notification");

class NotificationController {
  // Get all unread notifications for a user
  async getNotifications(req, res) {
    try {
      const notifications = await Notification.find({
        recipientId: req.params.userId,
        read: false
      }).sort({ createdAt: -1 });
      res.status(200).json(notifications);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Mark single notification as read
  async markNotificationRead(req, res) {
    try {
      await Notification.findByIdAndUpdate(req.params.notificationId, { $set: { read: true } });
      res.status(200).json("Notification marked as read");
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Mark all notifications as read for a user
  async markAllNotificationsRead(req, res) {
    try {
      await Notification.updateMany({ recipientId: req.params.userId }, { $set: { read: true } });
      res.status(200).json("All notifications marked as read");
    } catch (err) {
      res.status(500).json(err);
    }
  }
}

module.exports = new NotificationController();

