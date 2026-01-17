const Circle = require("../models/Circle");

class CircleController {
  // Create a new circle
  async createCircle(req, res) {
    try {
      const newCircle = new Circle({
        ...req.body,
        members: [req.body.creator],
        admins: [req.body.creator],
      });
      const savedCircle = await newCircle.save();
      res.status(200).json(savedCircle);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Get all circles with filters
  async getAllCircles(req, res) {
    const { search, tag } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (tag) query.tags = { $in: [tag] };

    try {
      const circles = await Circle.find(query).populate("members", "username");
      res.status(200).json(circles);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Get single circle by ID
  async getCircleById(req, res) {
    try {
      const circle = await Circle.findById(req.params.id)
        .populate("members", "username avatar")
        .populate("admins", "username avatar")
        .populate("pendingMembers", "username avatar");
      res.status(200).json(circle);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Update circle (Admin only)
  async updateCircle(req, res) {
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
  }

  // Join or request to join circle
  async joinCircle(req, res) {
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
  }

  // Handle join requests (Approve/Reject)
  async handleJoinRequest(req, res) {
    const { adminId, userId, action } = req.body;
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
  }

  // Kick member from circle
  async kickMember(req, res) {
    try {
      const circle = await Circle.findById(req.params.id);
      if (!circle) {
        return res.status(404).json("Circle not found");
      }
      
      const isAdmin = circle.admins.some(adminId => adminId.toString() === req.body.adminId.toString());
      if (!isAdmin) {
        return res.status(403).json("Not authorized");
      }
      
      await circle.updateOne({ 
        $pull: { members: req.body.memberId, admins: req.body.memberId } 
      });
      res.status(200).json("Member removed");
    } catch (err) {
      res.status(500).json({ message: "Failed to remove member", error: err.message });
    }
  }

  // Promote member to admin
  async promoteMember(req, res) {
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
  }
}

module.exports = new CircleController();

