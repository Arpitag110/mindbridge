const router = require("express").Router();
const Question = require("../models/Question");

// --- GET QUESTIONS FOR A CIRCLE ---
router.get("/:circleId", async (req, res) => {
  try {
    const questions = await Question.find({ circleId: req.params.circleId })
      .populate("userId", "username avatar")
      .populate("answers.userId", "username avatar")
      .sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- CREATE A QUESTION ---
router.post("/", async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    const savedQuestion = await newQuestion.save();
    // Populate user details immediately for frontend display
    await savedQuestion.populate("userId", "username avatar");
    res.status(200).json(savedQuestion);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- POST AN ANSWER ---
router.put("/:id/answer", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    const newAnswer = { userId: req.body.userId, text: req.body.text };
    question.answers.push(newAnswer);
    await question.save();
    
    // Re-fetch to return populated data
    const updatedQuestion = await Question.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("answers.userId", "username avatar");
        
    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- UPVOTE ANSWER ---
router.put("/:id/answer/:ansId/upvote", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    const answer = question.answers.id(req.params.ansId);
    
    if (!answer.upvotes.includes(req.body.userId)) {
      answer.upvotes.push(req.body.userId);
      await question.save();
      res.status(200).json(question); // Return full updated question
    } else {
      res.status(403).json("Already upvoted");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;