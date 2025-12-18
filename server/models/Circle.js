const mongoose = require("mongoose");

const CircleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Admin array allows multiple admins later
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Members who have joined
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // For Private circles: people waiting to get in
    pendingMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    // To support your Anonymous Posting feature later
    allowsAnonymous: {
      type: Boolean,
      default: false,
    },
    // Optional cover image (we can use a placeholder or URL)
    coverImage: {
      type: String,
      default: "", 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Circle", CircleSchema);