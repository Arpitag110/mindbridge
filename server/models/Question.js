const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    circleId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    upvotes: { type: Array, default: [] }, // Users who upvoted the question
    answers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        upvotes: { type: Array, default: [] }, // Users who upvoted this answer
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);