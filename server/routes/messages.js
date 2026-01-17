const router = require("express").Router();
const messageController = require("../controllers/messageController");

// Create message
router.post("/", messageController.createMessage.bind(messageController));

// Get conversations
router.get("/conversations/:userId", messageController.getConversations.bind(messageController));

// Mark conversation as read
router.put("/mark-read-conversation/:userId/:partnerId", messageController.markConversationRead.bind(messageController));

// Get chat history
router.get("/:user1Id/:user2Id", messageController.getChatHistory.bind(messageController));

module.exports = router;
