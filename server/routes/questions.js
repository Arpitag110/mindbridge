const router = require("express").Router();
const questionController = require("../controllers/questionController");

// Get questions for a circle
router.get("/:circleId", questionController.getQuestionsByCircle.bind(questionController));

// Create question
router.post("/", questionController.createQuestion.bind(questionController));

// Add answer
router.put("/:id/answer", questionController.addAnswer.bind(questionController));

// Upvote answer
router.put("/:id/answer/:ansId/upvote", questionController.upvoteAnswer.bind(questionController));

// Delete question
router.delete("/:id", questionController.deleteQuestion.bind(questionController));

// Update question
router.put("/:id", questionController.updateQuestion.bind(questionController));

// Delete answer
router.put("/:id/answer/:ansId/delete", questionController.deleteAnswer.bind(questionController));

module.exports = router;
