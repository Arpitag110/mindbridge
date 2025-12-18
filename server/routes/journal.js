const router = require("express").Router();
const Journal = require("../models/Journal");

// --- CREATE ENTRY ---
router.post("/add", async (req, res) => {
  try {
    const newEntry = new Journal(req.body);
    const savedEntry = await newEntry.save();
    res.status(200).json(savedEntry);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- GET ALL ENTRIES (By User) ---
router.get("/:userId", async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- DELETE ENTRY ---
router.delete("/delete/:id", async (req, res) => {
  try {
    await Journal.findByIdAndDelete(req.params.id);
    res.status(200).json("Entry deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;