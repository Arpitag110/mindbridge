const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// REGISTER
// When someone sends a POST request to this address...
router.post("/register", async (req, res) => {
  try {
    // 1. Get the info from the user (Frontend)
    const { username, email, password } = req.body;

    // 2. Secure the password (Hash it)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the new User with the hashed password
    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
    });

    // 4. Save to MongoDB
    const user = await newUser.save();
    
    // 5. Send back the success message
    res.status(200).json(user);
    
  } catch (err) {
    // If something goes wrong (like a duplicate email)
    res.status(500).json(err);
  }
});

module.exports = router;