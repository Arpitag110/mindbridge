const mongoose = require("mongoose");

const JournalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true, 
      default: "Untitled Entry"
    },
    content: {
      type: String,
      required: true,
    },
    moodTag: {
      type: String, 
      default: "Neutral"
    },
    visibility: {
      type: String,
      enum: ["Private", "Circles", "Public"], 
      default: "Private",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Journal", JournalSchema);