const Post = require("../models/Post");

class PostController {
  // Create a new post
  async createPost(req, res) {
    try {
      const newPost = new Post(req.body);
      const savedPost = await newPost.save();
      const populatedPost = await Post.findById(savedPost._id).populate("userId", "username avatar");
      res.status(200).json(populatedPost);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Get posts for a circle
  async getPostsByCircle(req, res) {
    try {
      const posts = await Post.find({ circleId: req.params.circleId })
        .populate("userId", "username avatar")
        .populate("comments.userId", "username avatar")
        .sort({ createdAt: -1 });
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Toggle like on post
  async toggleLike(req, res) {
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
  }

  // Add comment to post
  async addComment(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      const comment = { userId: req.body.userId, text: req.body.text };
      
      await post.updateOne({ $push: { comments: comment } });
      
      const updatedPost = await Post.findById(req.params.id)
        .populate("userId", "username avatar")
        .populate("comments.userId", "username avatar");
        
      res.status(200).json(updatedPost);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Delete post
  async deletePost(req, res) {
    try {
      const post = await Post.findById(req.params.id);
      if (post.userId.toString() === req.body.userId || req.body.isAdmin) {
        await post.deleteOne();
        res.status(200).json("Post deleted");
      } else {
        res.status(403).json("You can only delete your own posts");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  }

  // Update post
  async updatePost(req, res) {
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
  }
}

module.exports = new PostController();

