const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true }, 
    senderName: { type: String, required: true }, 
    type: { type: String, required: true },        
    message: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);