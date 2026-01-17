const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const SocketService = require("./services/socketService");

// Routes
const authRoute = require("./routes/auth");
const moodRoute = require("./routes/mood");
const journalRoute = require("./routes/journal");
const userRoute = require("./routes/users");
const circleRoute = require("./routes/circles");
const postRoute = require("./routes/posts");
const questionRoute = require("./routes/questions");
const notificationRoute = require("./routes/notifications");
const messageRoute = require("./routes/messages");

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

// Initialize Socket Service
new SocketService(io);

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
app.use("/api/messages", messageRoute);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});