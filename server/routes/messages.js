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

// 2. Get list of previous conversation partners (Recent Chats) - MUST BE BEFORE /:user1Id/:user2Id
router.get("/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all messages where user is sender OR receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 }).lean();

    // Get unique user IDs from those messages
    const partnerIds = new Set();
    messages.forEach((msg) => {
      const senderId = msg.sender.toString();
      const receiverId = msg.receiverId.toString();
      const userIdStr = userId.toString();

      // Determine the other user
      if (senderId === userIdStr) {
        partnerIds.add(receiverId);
      } else {
        partnerIds.add(senderId);
      }
    });

    // Build partner objects with lastMessage and unread count
    const partnerArray = Array.from(partnerIds);
    const partners = await User.find({ _id: { $in: partnerArray } })
      .select("username email _id avatar");

    // Create a map for quick lookup
    const partnerMap = {};
    partners.forEach(p => { partnerMap[p._id.toString()] = p; });

    const enriched = [];
    for (const pid of partnerArray) {
      // Last message between user and partner
      const lastMsg = await Message.findOne({
        $or: [
          { sender: userId, receiverId: pid },
          { sender: pid, receiverId: userId },
        ],
      }).sort({ createdAt: -1 }).lean();

      // Count unread messages sent by partner to this user
      const unreadCount = await Message.countDocuments({ sender: pid, receiverId: userId, read: false });

      const userObj = partnerMap[pid] || { _id: pid };
      enriched.push({
        _id: userObj._id,
        username: userObj.username,
        avatar: userObj.avatar,
        lastMessage: lastMsg ? lastMsg.text : null,
        lastMessageAt: lastMsg ? lastMsg.createdAt : null,
        unreadCount,
      });
    }

    res.status(200).json(enriched);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json(err);
  }
});

// MARK ALL MESSAGES IN A CONVERSATION AS READ FOR A USER
router.put('/mark-read-conversation/:userId/:partnerId', async (req, res) => {
  try {
    const { userId, partnerId } = req.params;
    await Message.updateMany({ sender: partnerId, receiverId: userId, read: false }, { $set: { read: true } });
    res.status(200).json('Conversation marked as read');
  } catch (err) {
    console.error('Error marking conversation read:', err);
    res.status(500).json(err);
  }
});

// 3. Get chat history between two users
router.get("/:user1Id/:user2Id", async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.params.user1Id, receiverId: req.params.user2Id },
        { sender: req.params.user2Id, receiverId: req.params.user1Id },
      ],
    }).populate("sender", "_id username avatar").sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;