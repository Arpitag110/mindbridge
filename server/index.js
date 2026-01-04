const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// Models
const Notification = require("./models/Notification");

// Routes
const authRoute = require("./routes/auth");
const moodRoute = require("./routes/mood");
const journalRoute = require("./routes/journal");
const userRoute = require("./routes/users");
const circleRoute = require("./routes/circles");
const postRoute = require("./routes/posts");
const questionRoute = require("./routes/questions");
const notificationRoute = require("./routes/notifications");
const messageRoute = require("./routes/messages"); // <--- ADDED: Message Route

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  },
});

app.use(cors());
app.use(express.json());

// Use Routes
app.use("/api/auth", authRoute);
app.use("/api/mood", moodRoute);
app.use("/api/journal", journalRoute);
app.use("/api/users", userRoute);
app.use("/api/circles", circleRoute);
app.use("/api/posts", postRoute);
app.use("/api/questions", questionRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/messages", messageRoute); // <--- ADDED: Use Message Route

// --- SOCKET LOGIC ---
let onlineUsers = [];

io.on("connection", (socket) => {

  // 1. ADD USER
  socket.on("newUser", ({ username, userId }) => {
    onlineUsers = onlineUsers.filter(user => user.username !== username);
    if (username && userId) {
      onlineUsers.push({ username, userId, socketId: socket.id });
    }
  });

  // 2. JOIN CIRCLE
  socket.on("joinCircle", (circleId) => {
    socket.join(circleId);
  });

  // 3. SEND CIRCLE NOTIFICATION (Persistent)
  socket.on("sendCircleNotification", ({ senderId, senderName, circleId, type, message, members }) => {
    if (!members) return;

    members.forEach(async (member) => {
      // Don't notify the sender
      if (member._id === senderId) return;

      try {
        // A. Save to DB (History/Offline)
        const newNotif = new Notification({
          recipientId: member._id,
          senderName,
          type,
          message,
        });
        await newNotif.save();

        // B. Send Real-time (If Online)
        const receiver = onlineUsers.find(user => user.userId === member._id);
        if (receiver) {
          io.to(receiver.socketId).emit("getNotification", {
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

  // 4. DIRECT NOTIFICATION (Like/Comment)
  socket.on("sendNotification", async ({ senderName, receiverName, type, message }) => {
    try {
      // A. Save to database for offline users (and history)
      const receiverUser = await require('./models/User').findOne({ username: receiverName });
      if (receiverUser) {
        const newNotif = new Notification({
          recipientId: receiverUser._id,
          senderName,
          type,
          message,
        });
        await newNotif.save();
      }

      // B. Send real-time if user is online
      const receiver = onlineUsers.find(user => user.username === receiverName);
      if (receiver) {
        io.to(receiver.socketId).emit("getNotification", {
          senderName,
          type,
          message,
          createdAt: Date.now()
        });
      } else {
      }
    } catch (err) {
      console.error("Notification error:", err);
    }
  });

  // 5. CHAT MESSAGE (DIRECT) <--- ADDED: Chat Logic
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    console.log("💬 Message received:", { senderId, receiverId, text });
    console.log("👥 Online users:", onlineUsers.map(u => ({ username: u.username, userId: u.userId })));

    const receiver = onlineUsers.find(user => user.userId === receiverId);
    console.log("🎯 Found receiver:", receiver);

    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
        createdAt: Date.now()
      });
    }
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});