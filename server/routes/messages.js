const router = require("express").Router();
const Message = require("../models/Message");
const User = require("../models/User"); // We need this to get usernames/avatars

// 1. Save a new message
router.post("/", async (req, res) => {
  const newMessage = new Message(req.body);
  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. Get chat history between two users
router.get("/:user1Id/:user2Id", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.params.user1Id, receiverId: req.params.user2Id },
        { sender: req.params.user2Id, receiverId: req.params.user1Id },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. Get list of previous conversation partners (Recent Chats)
router.get("/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find all messages where user is sender OR receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    // Get unique user IDs from those messages
    const partnerIds = new Set();
    messages.forEach((msg) => {
      const otherUserId = 
        msg.sender.toString() === userId 
          ? msg.receiverId.toString() 
          : msg.sender.toString();
      partnerIds.add(otherUserId);
    });

    // Fetch details for those users
    const partners = await User.find({ _id: { $in: Array.from(partnerIds) } })
      .select("username email _id");

    res.status(200).json(partners);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;