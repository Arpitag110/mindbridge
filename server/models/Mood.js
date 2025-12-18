const mongoose = require("mongoose");

const MoodSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    emotions: {
      type: Array,
      default: [],
    },
    note: {
      type: String,
      max: 500,
    },
    color: {
      type: String,
    },
    // NEW FIELD
    visibility: {
      type: String,
      enum: ["Private", "Circles", "Public"], // Only these 3 allowed
      default: "Private",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mood", MoodSchema);