const router = require("express").Router();
const journalController = require("../controllers/journalController");

// Create journal entry
router.post("/add", journalController.addEntry.bind(journalController));

// Get entries by user
router.get("/:userId", journalController.getEntriesByUser.bind(journalController));

// Delete entry
router.delete("/delete/:id", journalController.deleteEntry.bind(journalController));

module.exports = router;
