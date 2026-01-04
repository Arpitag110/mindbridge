const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// --- REGISTER ROUTE ---
router.post("/register", async (req, res) => {
  try {
    // 1. Secure the password (Hash it)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 2. Create the new User
    const newUser = new User({
      username: req.body.username || req.body.name, // <--- Your Fix
      email: req.body.email,
      password: hashedPassword,
    });

    // 3. Save to MongoDB
    const user = await newUser.save();
    res.status(200).json(user);

  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error (email already exists)
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// --- LOGIN ROUTE (NEW) ---
router.post("/login", async (req, res) => {
  try {
    // 1. Find the user by email
    const user = await User.findOne({ email: req.body.email });

    // 2. If user doesn't exist, return error
    if (!user) {
      return res.status(404).json("User not found!");
    }

    // 3. Check if password matches
    const validPassword = await bcrypt.compare(req.body.password, user.password);

    if (!validPassword) {
      return res.status(400).json("Wrong password!");
    }

    // 4. Send the user data back (Success!)
    res.status(200).json(user);

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;