const router = require("express").Router();
const authController = require("../controllers/authController");

// Register route
router.post("/register", authController.register.bind(authController));

// Login route
router.post("/login", authController.login.bind(authController));

module.exports = router;
