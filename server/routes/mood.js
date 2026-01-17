const router = require("express").Router();
const moodController = require("../controllers/moodController");

// Create or update mood entry
router.post("/add", moodController.addMood.bind(moodController));

// Get moods by user
router.get("/:userId", moodController.getMoodsByUser.bind(moodController));

// Delete mood
router.delete("/delete/:id", moodController.deleteMood.bind(moodController));

module.exports = router;
