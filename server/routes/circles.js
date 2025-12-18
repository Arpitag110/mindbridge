const router = require("express").Router();
const Circle = require("../models/Circle");

// --- CREATE CIRCLE ---
router.post("/", async (req, res) => {
  const newCircle = new Circle({
    ...req.body,
    members: [req.body.creator], // Creator is first member
    admins: [req.body.creator],  // Creator is first admin
  });
  try {
    const savedCircle = await newCircle.save();
    res.status(200).json(savedCircle);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- GET ALL CIRCLES (With Filters) ---
router.get("/", async (req, res) => {
  const { search, tag } = req.query;
  let query = {};
  if (search) query.name = { $regex: search, $options: "i" };
  if (tag) query.tags = { $in: [tag] };

  try {
    const circles = await Circle.find(query).populate("members", "username"); // Just count usually
    res.status(200).json(circles);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- GET SINGLE CIRCLE ---
router.get("/:id", async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id)
      .populate("members", "username avatar")
      .populate("admins", "username avatar")
      .populate("pendingMembers", "username avatar"); // IMPORTANT for Admin Panel
    res.status(200).json(circle);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- UPDATE CIRCLE (Admin Only) ---
router.put("/:id", async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (circle.admins.includes(req.body.userId)) {
      await circle.updateOne({ $set: req.body.updates });
      res.status(200).json("Circle updated");
    } else {
      res.status(403).json("Not authorized");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- JOIN / REQUEST JOIN ---
router.put("/:id/join", async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle.members.includes(req.body.userId)) {
      if (circle.visibility === "private") {
        await circle.updateOne({ $push: { pendingMembers: req.body.userId } });
        res.status(200).json("Request sent");
      } else {
        await circle.updateOne({ $push: { members: req.body.userId } });
        res.status(200).json("Joined successfully");
      }
    } else {
      res.status(403).json("Already a member");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- HANDLE JOIN REQUESTS (Approve/Reject) ---
router.put("/:id/request", async (req, res) => {
  const { adminId, userId, action } = req.body; // action: 'approve' or 'reject'
  try {
    const circle = await Circle.findById(req.params.id);
    if (circle.admins.includes(adminId)) {
      if (action === 'approve') {
        await circle.updateOne({ 
          $pull: { pendingMembers: userId },
          $push: { members: userId }
        });
      } else {
        await circle.updateOne({ $pull: { pendingMembers: userId } });
      }
      res.status(200).json(`Request ${action}ed`);
    } else {
      res.status(403).json("Not authorized");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- KICK MEMBER ---
router.put("/:id/kick", async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (circle.admins.includes(req.body.adminId)) {
      await circle.updateOne({ 
        $pull: { members: req.body.memberId, admins: req.body.memberId } 
      });
      res.status(200).json("Member removed");
    } else {
      res.status(403).json("Not authorized");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- PROMOTE MEMBER ---
router.put("/:id/promote", async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (circle.admins.includes(req.body.adminId)) {
      await circle.updateOne({ $push: { admins: req.body.memberId } });
      res.status(200).json("Member promoted");
    } else {
      res.status(403).json("Not authorized");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;