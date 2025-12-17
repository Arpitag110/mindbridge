const express = require("express");
const cors = require("cors"); // 1. Ensure this import is here
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoute = require("./routes/auth");

dotenv.config();
connectDB();

const app = express();

// --- MIDDLEWARE SECTION ---
app.use(cors()); // 2. THIS LINE MUST BE HERE (Allows the frontend to connect)
app.use(express.json());

// --- ROUTES SECTION ---
app.use("/api/auth", authRoute); // 3. This must be AFTER cors()

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});