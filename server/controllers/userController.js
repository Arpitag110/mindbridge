const User = require("../models/User");
const Mood = require("../models/Mood");
const Journal = require("../models/Journal");
const bcrypt = require("bcryptjs");
const { isCircleMate, bothInCircle } = require("../utils/permissions");

class UserController {
  // Search users
  async searchUsers(req, res) {
    const query = req.query.search;

    // Prevent searching if query is empty or undefined
    if (!query) return res.status(200).json([]);

    try {
      const users = await User.find({
        username: { $regex: query, $options: "i" },
      }).select("username _id avatar");

      res.status(200).json(users);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Get visible entries for a viewer
  async getVisibleEntries(req, res) {
    try {
      const ownerId = req.params.id;
      const viewerId = req.query.viewerId || null;
      const circleId = req.query.circleId || null;

      // If viewer is same as owner -> return all
      let allowCircles = false;
      if (viewerId && viewerId.toString() === ownerId.toString()) {
        allowCircles = true;
      } else if (circleId) {
        if (await bothInCircle(circleId, ownerId, viewerId)) allowCircles = true;
      } else if (viewerId) {
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
  }

  // Get user by ID
  async getUserById(req, res) {
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
  }

  // Update user
  async updateUser(req, res) {
    if (!req.params.id) {
      return res.status(403).json("You can only update your own account!");
    }

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
      if (err.code === 11000) {
        if (err.keyPattern?.username) {
          return res.status(400).json({ message: "Username already taken" });
        }
        if (err.keyPattern?.email) {
          return res.status(400).json({ message: "Email already registered" });
        }
        return res.status(400).json({ message: "Account already exists" });
      }
      return res.status(500).json({ message: "Update failed", error: err.message });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required to delete account" });
      }

      // Find the user
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Delete user and associated data
      await User.findByIdAndDelete(req.params.id);
      await Mood.deleteMany({ userId: req.params.id });
      await Journal.deleteMany({ userId: req.params.id });
      
      res.status(200).json({ message: "Account has been deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete account", error: err.message });
    }
  }
}

module.exports = new UserController();

