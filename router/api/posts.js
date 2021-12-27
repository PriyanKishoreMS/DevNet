const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../model/User");
const Post = require("../../model/Post");

// @route   POST api/posts
// @desc    Create posts
// @access  Private

router.post(
	"/",
	[auth, [check("text", "Post cannot be empty").not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");

			const post = new Post({
				user: req.user.id,
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
			});

			await post.save();
			res.json(post);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Errror");
		}
	}
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private

router.get("/", auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private

router.get("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}
		res.json(post);
	} catch (err) {
		console.error(err.message);
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found" });
		}
		res.status(500).send("Server Error");
	}
});

// @route   DELETE api/posts/:id
// @desc    Delete post by ID
// @access  Private

router.delete("/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}

		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User unauthorized" });
		}

		await post.remove();

		res.json({ msg: "Post removed" });
	} catch (err) {
		console.error(err.message);
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found" });
		}
		res.status(500).send("Server Error");
	}
});

// @route   PUT api/posts/like/:id
// @desc    Like or unlike post by post ID
// @access  Private

router.put("/like/:id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ msg: "Post not found" });
		}

		if (post.likes.filter(like => like.id === req.user.id).length > 0) {
			post.likes = post.likes.filter(like => like.id !== req.user.id);
		} else {
			post.likes.unshift(req.user.id);
		}

		await post.save();
		res.json(post.likes);
	} catch (err) {
		console.error(err.message);
		if (err.kind === "ObjectId") {
			return res.status(404).json({ msg: "Post not found" });
		}
		res.status(500).send("Server Error");
	}
});

// @route   POST api/posts/comment/:id
// @desc    Comment on posts
// @access  Private

router.post(
	"/comment/:id",
	[auth, [check("text", "Comment cannot be empty").not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select("-password");
			const post = await Post.findById(req.params.id);

			const newComment = {
				user: req.user.id,
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
			};

			post.comments.unshift(newComment);
			await post.save();
			res.json(post.comments);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Errror");
		}
	}
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment from post
// @access  Private

router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		const comment = post.comments.find(
			comment => comment.id === req.params.comment_id
		);

		if (!comment) {
			return res.status(404).json({ msg: "Comment not found" });
		}

		if (comment.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: "User unauthorized" });
		}

		post.comments.map(comment => {
			if (comment.id === req.params.comment_id) {
				return comment.remove();
			}
		});

		await post.save();
		res.json(post.comments);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

module.exports = router;
