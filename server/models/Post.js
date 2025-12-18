const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    circleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Circle",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    // For anonymity feature later
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    likes: {
      type: [String], // Array of User IDs who liked
      default: [],
    },
    // Simple comment structure for now
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
        ],
    reports: [
      {
        userId: { type: String },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);