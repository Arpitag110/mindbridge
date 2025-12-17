const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoute = require("./routes/auth"); // IMPORT THE ROUTE

const app = express();
dotenv.config();

app.use(express.json());

// CONNECT DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error(err));

// USE ROUTES
app.use("/api/auth", authRoute); // CONNECT THE ROUTE

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});