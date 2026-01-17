const Journal = require("../models/Journal");

class JournalController {
  // Create journal entry
  async addEntry(req, res) {
    try {
      const newEntry = new Journal(req.body);
      const savedEntry = await newEntry.save();
      res.status(200).json(savedEntry);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Get all entries by user
  async getEntriesByUser(req, res) {
    try {
      const entries = await Journal.find({ userId: req.params.userId }).sort({ createdAt: -1 });
      res.status(200).json(entries);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Delete journal entry
  async deleteEntry(req, res) {
    try {
      await Journal.findByIdAndDelete(req.params.id);
      res.status(200).json("Entry deleted");
    } catch (err) {
      res.status(500).json(err);
    }
  }
}

module.exports = new JournalController();

