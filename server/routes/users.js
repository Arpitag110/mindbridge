const router = require("express").Router();
const userController = require("../controllers/userController");

// Search users
router.get("/", userController.searchUsers.bind(userController));

// Get visible entries
router.get("/:id/visible-entries", userController.getVisibleEntries.bind(userController));

// Get user by ID
router.get("/:id", userController.getUserById.bind(userController));

// Update user
router.put("/:id", userController.updateUser.bind(userController));

// Delete user
router.delete("/:id", userController.deleteUser.bind(userController));

module.exports = router;
