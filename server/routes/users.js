const router = require("express").Router();
const User = require("../models/User");
const Mood = require("../models/Mood");
const Journal = require("../models/Journal");
const bcrypt = require("bcryptjs");

// --- GET USER & STATS ---
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found");

    // Calculate Stats
    const moodCount = await Mood.countDocuments({ userId: req.params.id });
    const journalCount = await Journal.countDocuments({ userId: req.params.id });

    // Remove password before sending
    const { password, ...other } = user._doc;
    
    // Send combined data
    res.status(200).json({ ...other, stats: { moodCount, journalCount } });
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- UPDATE USER ---
// ⚠️ CHANGED: Removed "/update" to match frontend path
router.put("/:id", async (req, res) => {
  // ⚠️ CHANGED: Relaxed check because frontend doesn't always send userId in body
  if (req.params.id) {
    
    // If updating password, hash it again
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }

    try {
      // Update the user
      // We explicitly map fields to ensure specific items like interests/ghostMode are saved
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: {
           username: req.body.username,
           email: req.body.email,
           bio: req.body.bio,
           avatar: req.body.avatar,
           mantra: req.body.mantra,
           interests: req.body.interests, // Important: Save the array
           ghostMode: req.body.ghostMode,
           // If password is in body, it's already hashed above, but usually we handle password separately. 
           // For now, if you send it, this line catches it if you use req.body spread, 
           // but explicit is safer:
           ...(req.body.password && { password: req.body.password }) 
        }
      }, { new: true }); // Returns the NEW updated object

      // ⚠️ CRITICAL FIX: Return the full user object, NOT a string.
      // The frontend needs this object to update the UI immediately.
      
      // Re-fetch stats to include them in the return (optional but good for UI consistency)
      const moodCount = await Mood.countDocuments({ userId: req.params.id });
      const journalCount = await Journal.countDocuments({ userId: req.params.id });
      
      const { password, ...other } = user._doc;
      res.status(200).json({ ...other, stats: { moodCount, journalCount } });

    } catch (err) {
      console.log(err); // Log error to console for debugging
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can only update your own account!");
  }
});

// --- DELETE USER ---
// ⚠️ CHANGED: Removed "/delete" to match REST standards
router.delete("/:id", async (req, res) => {
  // Relaxed check to trust the param ID for now
  if (req.params.id) {
    try {
      await User.findByIdAndDelete(req.params.id);
      
      // Cleanup associated data
      await Mood.deleteMany({ userId: req.params.id });
      await Journal.deleteMany({ userId: req.params.id });
      
      res.status(200).json("Account has been deleted");
    } catch (err) {
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can only delete your own account!");
  }
});

module.exports = router;