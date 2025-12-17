const mongoose = require("mongoose");

// This is the Blueprint for a User
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true, // They MUST have a username
      unique: true,   // No two users can have the same name
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Optional details for the Profile
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "", // We will add image uploading later
    },
  },
  { timestamps: true } // Automatically saves 'createdAt' and 'updatedAt' times
);

module.exports = mongoose.model("User", UserSchema);