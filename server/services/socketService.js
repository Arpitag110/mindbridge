const Notification = require("../models/Notification");
const User = require("../models/User");

class SocketService {
  constructor(io) {
    this.io = io;
    this.onlineUsers = [];
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      // Add user to online list
      socket.on("newUser", ({ username, userId }) => {
        this.onlineUsers = this.onlineUsers.filter(user => user.username !== username);
        if (username && userId) {
          this.onlineUsers.push({ username, userId, socketId: socket.id });
        }
      });

      // Join circle room
      socket.on("joinCircle", (circleId) => {
        socket.join(circleId);
      });

      // Send circle notification
      socket.on("sendCircleNotification", async ({ senderId, senderName, circleId, type, message, members }) => {
        if (!members) return;

        members.forEach(async (member) => {
          if (member._id === senderId) return;

          try {
            // Save to DB
            const newNotif = new Notification({
              recipientId: member._id,
              senderName,
              type,
              message,
            });
            await newNotif.save();

            // Send real-time if online
            const receiver = this.onlineUsers.find(user => user.userId === member._id);
            if (receiver) {
              this.io.to(receiver.socketId).emit("getNotification", {
                senderName,
                type,
                message,
                createdAt: Date.now()
              });
            }
          } catch (err) {
            console.error("Notif Error:", err);
          }
        });
      });

      // Send direct notification
      socket.on("sendNotification", async ({ senderName, receiverName, type, message }) => {
        try {
          const receiverUser = await User.findOne({ username: receiverName });
          if (receiverUser) {
            const newNotif = new Notification({
              recipientId: receiverUser._id,
              senderName,
              type,
              message,
            });
            await newNotif.save();
          }

          const receiver = this.onlineUsers.find(user => user.username === receiverName);
          if (receiver) {
            this.io.to(receiver.socketId).emit("getNotification", {
              senderName,
              type,
              message,
              createdAt: Date.now()
            });
          }
        } catch (err) {
          console.error("Notification error:", err);
        }
      });

      // Send direct message
      socket.on("sendMessage", ({ senderId, receiverId, text }) => {
        console.log("💬 Message received:", { senderId, receiverId, text });
        const receiver = this.onlineUsers.find(user => user.userId === receiverId);
        if (receiver) {
          this.io.to(receiver.socketId).emit("getMessage", {
            senderId,
            text,
            createdAt: Date.now()
          });
        }
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        this.onlineUsers = this.onlineUsers.filter((user) => user.socketId !== socket.id);
      });
    });
  }
}

module.exports = SocketService;

