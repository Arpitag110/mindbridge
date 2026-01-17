const router = require("express").Router();
const postController = require("../controllers/postController");

// Create post
router.post("/", postController.createPost.bind(postController));

// Get posts for a circle
router.get("/:circleId", postController.getPostsByCircle.bind(postController));

// Toggle like
router.put("/:id/like", postController.toggleLike.bind(postController));

// Add comment
router.put("/:id/comment", postController.addComment.bind(postController));

// Delete post
router.delete("/:id", postController.deletePost.bind(postController));

// Update post
router.put("/:id", postController.updatePost.bind(postController));

module.exports = router;
