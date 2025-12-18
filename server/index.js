const express = require("express");
const cors = require("cors"); // 1. Ensure this import is here
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoute = require("./routes/auth");
const moodRoute = require("./routes/mood");
const journalRoute = require("./routes/journal");
const userRoute = require("./routes/users");
const circleRoute = require("./routes/circles");
const postRoute = require("./routes/posts");
const questionRoute = require("./routes/questions");

dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARE SECTION ---
app.use(cors()); // 2. THIS LINE MUST BE HERE (Allows the frontend to connect)
app.use(express.json());

// --- ROUTES SECTION ---
app.use("/api/auth", authRoute);
app.use("/api/mood", moodRoute);
app.use("/api/journal", journalRoute);
app.use("/api/users", userRoute);
app.use("/api/circles", circleRoute);
app.use("/api/posts", postRoute);
app.use("/api/questions", questionRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});