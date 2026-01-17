const Message = require("../models/Message");
const User = require("../models/User");

class MessageController {
  // Save a new message
  async createMessage(req, res) {
    try {
      const newMessage = new Message(req.body);
      const savedMessage = await newMessage.save();
      res.status(200).json(savedMessage);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Get list of conversations for a user
  async getConversations(req, res) {
    try {
      const userId = req.params.userId;

      const messages = await Message.find({
        $or: [{ sender: userId }, { receiverId: userId }],
      }).sort({ createdAt: -1 }).lean();

      const partnerIds = new Set();
      messages.forEach((msg) => {
        const senderId = msg.sender.toString();
        const receiverId = msg.receiverId.toString();
        const userIdStr = userId.toString();

        if (senderId === userIdStr) {
          partnerIds.add(receiverId);
        } else {
          partnerIds.add(senderId);
        }
      });

      const partnerArray = Array.from(partnerIds);
      const partners = await User.find({ _id: { $in: partnerArray } })
        .select("username email _id avatar");

      const partnerMap = {};
      partners.forEach(p => { partnerMap[p._id.toString()] = p; });

      const enriched = [];
      for (const pid of partnerArray) {
        const lastMsg = await Message.findOne({
          $or: [
            { sender: userId, receiverId: pid },
            { sender: pid, receiverId: userId },
          ],
        }).sort({ createdAt: -1 }).lean();

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
  }

  // Mark conversation as read
  async markConversationRead(req, res) {
    try {
      const { userId, partnerId } = req.params;
      await Message.updateMany({ sender: partnerId, receiverId: userId, read: false }, { $set: { read: true } });
      res.status(200).json('Conversation marked as read');
    } catch (err) {
      console.error('Error marking conversation read:', err);
      res.status(500).json(err);
    }
  }

  // Get chat history between two users
  async getChatHistory(req, res) {
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
  }
}

module.exports = new MessageController();

