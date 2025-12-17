const express = require("express");
const mongoose = require("mongoose"); // Import Mongoose
const dotenv = require("dotenv");
const app = express();

dotenv.config();

app.use(express.json());

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("MongoDB Connection Failed:", err));

app.get("/", (req, res) => {
  res.send("MindBridge Server is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});