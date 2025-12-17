const express = require("express");
const app = express();
const dotenv = require("dotenv");

// Load our environment variables (secrets)
dotenv.config();

// Middleware: Allows us to accept JSON data (like form submissions)
app.use(express.json());

// A simple Route (like a URL page) to test if the server works
app.get("/", (req, res) => {
  res.send("MindBridge Server is Running!");
});

// Pick a port (door) for the server to listen on
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});