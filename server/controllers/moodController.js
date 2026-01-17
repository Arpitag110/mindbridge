const Mood = require("../models/Mood");

class MoodController {
  // Create or update mood entry (one per day)
  async addMood(req, res) {
    try {
      const { userId, score, emotions, note, color, visibility } = req.body;

      // Get Start and End of TODAY
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      // Check if an entry exists for this user today
      const existingEntry = await Mood.findOne({
        userId: userId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });

      if (existingEntry) {
        // Update existing
        const updatedMood = await Mood.findByIdAndUpdate(
          existingEntry._id,
          {
            $set: {
              score,
              emotions,
              note,
              color,
              visibility,
            },
          },
          { new: true }
        );
        return res.status(200).json(updatedMood);
      } else {
        // Create new
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
  }

  // Get all moods for a user
  async getMoodsByUser(req, res) {
    try {
      const moods = await Mood.find({ userId: req.params.userId }).sort({ createdAt: -1 });
      res.status(200).json(moods);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Delete mood entry
  async deleteMood(req, res) {
    try {
      await Mood.findByIdAndDelete(req.params.id);
      res.status(200).json("Mood has been deleted");
    } catch (err) {
      res.status(500).json(err);
    }
  }
}

module.exports = new MoodController();

