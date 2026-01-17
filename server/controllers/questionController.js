const Question = require("../models/Question");

class QuestionController {
  // Get questions for a circle
  async getQuestionsByCircle(req, res) {
    try {
      const questions = await Question.find({ circleId: req.params.circleId })
        .populate("userId", "username avatar")
        .populate("answers.userId", "username avatar")
        .sort({ createdAt: -1 });
      res.status(200).json(questions);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Create a question
  async createQuestion(req, res) {
    try {
      const newQuestion = new Question(req.body);
      const savedQuestion = await newQuestion.save();
      await savedQuestion.populate("userId", "username avatar");
      res.status(200).json(savedQuestion);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Post an answer
  async addAnswer(req, res) {
    try {
      const question = await Question.findById(req.params.id);
      const newAnswer = { userId: req.body.userId, text: req.body.text };
      question.answers.push(newAnswer);
      await question.save();

      const updatedQuestion = await Question.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("answers.userId", "username avatar");

      res.status(200).json(updatedQuestion);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Upvote answer
  async upvoteAnswer(req, res) {
    try {
      const question = await Question.findById(req.params.id);
      const answer = question.answers.id(req.params.ansId);

      if (!answer.upvotes.includes(req.body.userId)) {
        answer.upvotes.push(req.body.userId);
        await question.save();
      } else {
        answer.upvotes = answer.upvotes.filter(id => id.toString() !== req.body.userId);
        await question.save();
      }

      const updatedQuestion = await Question.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("answers.userId", "username avatar");

      res.status(200).json(updatedQuestion);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Delete question
  async deleteQuestion(req, res) {
    try {
      const question = await Question.findById(req.params.id);

      if (question.userId.toString() !== req.body.userId) {
        return res.status(403).json("You can only delete your own questions");
      }

      await Question.findByIdAndDelete(req.params.id);
      res.status(200).json("Question deleted successfully");
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Update question
  async updateQuestion(req, res) {
    try {
      const question = await Question.findById(req.params.id);

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
  }

  // Delete answer
  async deleteAnswer(req, res) {
    try {
      const question = await Question.findById(req.params.id);
      const answer = question.answers.find(a => a._id.toString() === req.params.ansId);

      if (!answer) {
        return res.status(404).json("Answer not found");
      }

      const answerOwnerId = answer.userId.toString();
      const questionOwnerId = question.userId.toString();
      const requestUserId = req.body.userId;

      if (answerOwnerId !== requestUserId && questionOwnerId !== requestUserId) {
        return res.status(403).json("You can only delete your own answers or answers to your questions");
      }

      question.answers.pull(answer._id);
      await question.save();

      const updatedQuestion = await Question.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("answers.userId", "username avatar");

      res.status(200).json(updatedQuestion);
    } catch (err) {
      console.error("Delete answer error:", err);
      res.status(500).json(err);
    }
  }
}

module.exports = new QuestionController();

