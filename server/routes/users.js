const router = require("express").Router();
const User = require("../models/User");
const Mood = require("../models/Mood");
const Journal = require("../models/Journal");
const bcrypt = require("bcryptjs");

// ==============================
// 1. SEARCH USERS (ADD THIS NEW ROUTE HERE)
// ==============================
router.get("/", async (req, res) => {
  const query = req.query.search;

  // Prevent searching if query is empty or undefined
  if (!query) return res.status(200).json([]);

  try {
    const users = await User.find({
      username: { $regex: query, $options: "i" }, // Case-insensitive search
    }).select("username _id avatar"); // Only return what we need

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

// NEW: Visible entries for a viewer
router.get("/:id/visible-entries", async (req, res) => {
  try {
    const ownerId = req.params.id;
    const viewerId = req.query.viewerId || null; // if not provided, treated as guest
    const circleId = req.query.circleId || null;

    // If viewer is same as owner -> return all
    let allowCircles = false;
    if (viewerId && viewerId.toString() === ownerId.toString()) {
      allowCircles = true; // owner sees everything
    } else if (circleId) {
      // If circle context provided, check both are members of that circle
      const { bothInCircle } = require('../utils/permissions');
      if (await bothInCircle(circleId, ownerId, viewerId)) allowCircles = true;
    } else if (viewerId) {
      const { isCircleMate } = require('../utils/permissions');
      if (await isCircleMate(ownerId, viewerId)) allowCircles = true;
    }

    const allowedVis = allowCircles ? ['Public', 'Circles'] : ['Public'];

    const moods = await Mood.find({ userId: ownerId, visibility: { $in: allowedVis } }).sort({ createdAt: -1 }).lean();
    const journals = await Journal.find({ userId: ownerId, visibility: { $in: allowedVis } }).sort({ createdAt: -1 }).lean();

    res.status(200).json({ moods, journals });
  } catch (err) {
    console.error('visible-entries error', err);
    res.status(500).json(err);
  }
});

// ==============================
// 2. GET USER & STATS (Existing)
// ==============================
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
router.put("/:id", async (req, res) => {
  // ... (Keep your existing update logic here) ...
  if (req.params.id) {
    if (req.body.password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      } catch (err) {
        return res.status(500).json(err);
      }
    }

    try {
      const user = await User.findByIdAndUpdate(req.params.id, {
        $set: {
          username: req.body.username,
          email: req.body.email,
          bio: req.body.bio,
          avatar: req.body.avatar,
          mantra: req.body.mantra,
          interests: req.body.interests,
          ghostMode: req.body.ghostMode,
          ...(req.body.password && { password: req.body.password })
        }
      }, { new: true });

      const moodCount = await Mood.countDocuments({ userId: req.params.id });
      const journalCount = await Journal.countDocuments({ userId: req.params.id });

      const { password, ...other } = user._doc;
      res.status(200).json({ ...other, stats: { moodCount, journalCount } });

    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  } else {
    return res.status(403).json("You can only update your own account!");
  }
});

// --- DELETE USER ---
router.delete("/:id", async (req, res) => {
  // ... (Keep your existing delete logic here) ...
  if (req.params.id) {
    try {
      await User.findByIdAndDelete(req.params.id);
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