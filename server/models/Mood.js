const mongoose = require("mongoose");

const MoodSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    score: {
      type: Number, // 1 to 5
      required: true,
    },
    emotions: {
      type: Array, // e.g., ["Anxious", "Work"]
      default: [],
    },
    note: {
      type: String,
      max: 500,
    },
    color: {
      type: String, // We'll save the background color too for fun visualizations later
    }
  },
  { timestamps: true } // Automatically adds 'createdAt' and 'updatedAt'
);

module.exports = mongoose.model("Mood", MoodSchema);