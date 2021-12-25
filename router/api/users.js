const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar/lib/gravatar");
const bcrypt = require("bcryptjs");
const config = require("config");
const secret = config.get("jwtSecret");
const jwt = require("jsonwebtoken");
const User = require("../../model/User");

// @route   POST api/users
// @desc    Register user
// @access  Public

// express-validator
router.post(
	"/",
	[
		check("name", "Please enter your name").not().isEmpty(),
		check("email", "Please enter a valid email id").isEmail(),
		check(
			"password",
			"Please enter a password with 6 or more characters"
		).isLength({ min: 6 }),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// find if email already exists
		const { name, email, password } = req.body;

		try {
			let user = await User.findOne({ email });

			if (user) {
				return res
					.status(400)
					.json({ errors: [{ msg: "User already exists, please log in" }] });
			}

			// gravatar
			const avatar = gravatar.url(email, {
				s: "200",
				r: "pg",
				d: "mm",
			});

			user = new User({
				name,
				email,
				avatar,
				password,
			});

			// bcryptjs
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);

			await user.save();

			// jsonwebtoken => uniqe token given to client with
			// mongo ObjectId as payload -- goto middleware/auth
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				secret,
				{
					expiresIn: "5h",
				},
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);

module.exports = router;
