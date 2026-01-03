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

      // Re-fetch to return populated data
      const updatedQuestion = await Question.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("answers.userId", "username avatar");

      res.status(200).json(updatedQuestion);
    } else {
      // Remove upvote (toggle functionality)
      answer.upvotes = answer.upvotes.filter(id => id.toString() !== req.body.userId);
      await question.save();

      // Re-fetch to return populated data
      const updatedQuestion = await Question.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("answers.userId", "username avatar");

      res.status(200).json(updatedQuestion);
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- DELETE QUESTION ---
router.delete("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    // Check if user is the question owner
    if (question.userId.toString() !== req.body.userId) {
      return res.status(403).json("You can only delete your own questions");
    }

    await Question.findByIdAndDelete(req.params.id);
    res.status(200).json("Question deleted successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- UPDATE QUESTION ---
router.put("/:id", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    // Check if user is the question owner
    if (question.userId.toString() !== req.body.userId) {
      return res.status(403).json("You can only update your own questions");
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title, body: req.body.body },
      { new: true }
    )
      .populate("userId", "username avatar")
      .populate("answers.userId", "username avatar");

    res.status(200).json(updatedQuestion);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- DELETE ANSWER ---
router.put("/:id/answer/:ansId/delete", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    // Find the answer by ID
    const answer = question.answers.find(a => a._id.toString() === req.params.ansId);

    if (!answer) {
      return res.status(404).json("Answer not found");
    }

    // Check if user is the answer owner or question owner
    const answerOwnerId = answer.userId.toString();
    const questionOwnerId = question.userId.toString();
    const requestUserId = req.body.userId;


    if (answerOwnerId !== requestUserId && questionOwnerId !== requestUserId) {
      return res.status(403).json("You can only delete your own answers or answers to your questions");
    }

    // Remove the answer
    question.answers.pull(answer._id);
    await question.save();

    // Re-fetch to return populated data
    const updatedQuestion = await Question.findById(req.params.id)
      .populate("userId", "username avatar")
      .populate("answers.userId", "username avatar");

    res.status(200).json(updatedQuestion);
  } catch (err) {
    console.error("Delete answer error:", err);
    res.status(500).json(err);
  }
});

module.exports = router;