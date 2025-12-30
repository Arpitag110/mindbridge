const router = require("express").Router();
const Notification = require("../models/Notification");

// GET ALL UNREAD NOTIFICATIONS FOR A USER
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.params.userId,
      read: false
    }).sort({ createdAt: -1 }); // Newest first
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

// MARK SINGLE NOTIFICATION AS READ
router.put("/mark-read/:notificationId", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notificationId, { $set: { read: true } });
    res.status(200).json("Notification marked as read");
  } catch (err) {
    res.status(500).json(err);
  }
});

// MARK ALL NOTIFICATIONS AS READ (For a user)
router.put("/mark-all-read/:userId", async (req, res) => {
  try {
    await Notification.updateMany({ recipientId: req.params.userId }, { $set: { read: true } });
    res.status(200).json("All notifications marked as read");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;