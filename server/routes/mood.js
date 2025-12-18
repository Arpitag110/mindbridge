const router = require("express").Router();
const Mood = require("../models/Mood");

// --- CREATE OR UPDATE MOOD ENTRY (One per day) ---
router.post("/add", async (req, res) => {
  try {
    const { userId, score, emotions, note, color, visibility } = req.body;

    // 1. Get Start and End of TODAY
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // 2. Check if an entry exists for this user today
    const existingEntry = await Mood.findOne({
      userId: userId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingEntry) {
      // --- UPDATE EXISTING ---
      const updatedMood = await Mood.findByIdAndUpdate(
        existingEntry._id,
        {
          $set: {
            score,
            emotions,
            note,
            color,
            visibility, // Update visibility too
          },
        },
        { new: true } // Return the updated document
      );
      return res.status(200).json(updatedMood);
    } else {
      // --- CREATE NEW ---
      const newMood = new Mood({
        userId,
        score,
        emotions,
        note,
        color,
        visibility,
      });
      const savedMood = await newMood.save();
      return res.status(200).json(savedMood);
    }

  } catch (err) {
    res.status(500).json(err);
  }
});

// ... keep your GET and DELETE routes as they are ...
// (Just copy/paste the previous get/delete code below if needed, or leave it be)
router.get("/:userId", async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(moods);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    await Mood.findByIdAndDelete(req.params.id);
    res.status(200).json("Mood has been deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;