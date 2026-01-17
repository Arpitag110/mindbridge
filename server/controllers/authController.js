const User = require("../models/User");
const bcrypt = require("bcryptjs");

class AuthController {
  // Register a new user
  async register(req, res) {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Create the new User
      const newUser = new User({
        username: req.body.username || req.body.name,
        email: req.body.email,
        password: hashedPassword,
      });

      // Save to MongoDB
      const user = await newUser.save();
      res.status(200).json(user);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: "Email already registered" });
      }
      res.status(500).json({ message: "Registration failed", error: err.message });
    }
  }

  // Login user
  async login(req, res) {
    try {
      // Find the user by email
      const user = await User.findOne({ email: req.body.email });

      // If user doesn't exist, return error
      if (!user) {
        return res.status(404).json("User not found!");
      }

      // Check if password matches
      const validPassword = await bcrypt.compare(req.body.password, user.password);

      if (!validPassword) {
        return res.status(400).json("Wrong password!");
      }

      // Send the user data back (Success!)
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  }
}

module.exports = new AuthController();

