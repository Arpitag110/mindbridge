const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      require: true,
      min: 3,
      max: 20,
      unique: true, 
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    avatar: {
      type: String,
      default: "felix",
    },
    bio: {
      type: String,
      default: "",
      max: 500, 
    },
    mantra: {
      type: String,
      default: "One day at a time",
    },
    interests: {
      type: Array,
      default: [],
    },
    ghostMode: {
      type: Boolean,
      default: false,
    },
    stats: {
      moodCount: { type: Number, default: 0 },
      journalCount: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);