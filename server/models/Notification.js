const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true }, // Who receives it
    senderName: { type: String, required: true },  // Who sent it
    type: { type: String, required: true },        // 'post', 'like', 'comment', 'question'
    message: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);