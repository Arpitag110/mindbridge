const router = require("express").Router();
const circleController = require("../controllers/circleController");

// Create circle
router.post("/", circleController.createCircle.bind(circleController));

// Get all circles
router.get("/", circleController.getAllCircles.bind(circleController));

// Get single circle
router.get("/:id", circleController.getCircleById.bind(circleController));

// Update circle
router.put("/:id", circleController.updateCircle.bind(circleController));

// Join circle
router.put("/:id/join", circleController.joinCircle.bind(circleController));

// Handle join request
router.put("/:id/request", circleController.handleJoinRequest.bind(circleController));

// Kick member
router.put("/:id/kick", circleController.kickMember.bind(circleController));

// Promote member
router.put("/:id/promote", circleController.promoteMember.bind(circleController));

module.exports = router;
