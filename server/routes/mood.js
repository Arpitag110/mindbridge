const router = require("express").Router();
const Mood = require("../models/Mood");

// --- CREATE A MOOD ENTRY ---
router.post("/add", async (req, res) => {
  try {
    // Create new mood from the data sent by frontend
    const newMood = new Mood({
      userId: req.body.userId,
      score: req.body.score,
      emotions: req.body.emotions,
      note: req.body.note,
      color: req.body.color,
    });

    // Save to DB
    const savedMood = await newMood.save();
    res.status(200).json(savedMood);
    
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- GET HISTORY (For a specific user) ---
router.get("/:userId", async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.params.userId }).sort({ createdAt: -1 }); // Newest first
    res.status(200).json(moods);
  } catch (err) {
    res.status(500).json(err);
  }
});
// ... existing code ...

// --- DELETE MOOD ENTRY ---
router.delete("/delete/:id", async (req, res) => {
  try {
    await Mood.findByIdAndDelete(req.params.id);
    res.status(200).json("Mood has been deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;