const router = require("express").Router();
const Post = require("../models/Post");

// --- CREATE POST ---
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    // Populate user immediately for UI
    const populatedPost = await Post.findById(savedPost._id).populate("userId", "username avatar");
    res.status(200).json(populatedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- GET POSTS FOR A CIRCLE ---
router.get("/:circleId", async (req, res) => {
  try {
    const posts = await Post.find({ circleId: req.params.circleId })
      .populate("userId", "username avatar") // Author
      .populate("comments.userId", "username avatar") // Commenters
      .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- TOGGLE LIKE ---
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("The post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- ADD COMMENT (NEW) ---
router.put("/:id/comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = { userId: req.body.userId, text: req.body.text };
    
    await post.updateOne({ $push: { comments: comment } });
    
    // Return the updated post with populated data so the UI updates instantly
    const updatedPost = await Post.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("comments.userId", "username avatar");
        
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ... existing create, get, like, comment routes ...

// --- DELETE POST ---
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // Allow if user is author OR request contains adminId (handled in frontend logic)
    if (post.userId.toString() === req.body.userId || req.body.isAdmin) {
      await post.deleteOne();
      res.status(200).json("Post deleted");
    } else {
      res.status(403).json("You can only delete your own posts");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- UPDATE POST ---
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId.toString() === req.body.userId) {
      await post.updateOne({ $set: { content: req.body.content } });
      res.status(200).json("Post updated");
    } else {
      res.status(403).json("You can only update your own posts");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;