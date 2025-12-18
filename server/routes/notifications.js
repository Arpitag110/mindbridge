const router = require("express").Router();
const Notification = require("../models/Notification");

// GET ALL NOTIFICATIONS FOR A USER
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.params.userId })
      .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
});

// OPTIONAL: MARK AS READ
router.put("/mark-read/:userId", async (req, res) => {
    try {
        await Notification.updateMany({ recipientId: req.params.userId }, { $set: { read: true } });
        res.status(200).json("Notifications marked as read");
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;