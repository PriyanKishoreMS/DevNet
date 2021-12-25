const express = require("express");
const router = express.Router();
const Profile = require("../../model/Profile");
const User = require("../../model/User");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const request = require("request");
const config = require("config");
const { response } = require("express");

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private

router.get("/me", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			"user",
			["name", "avatar"]
		);
		if (!profile) {
			return res.status(400).json({ msg: "Profile doesn't exist" });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   POST api/profile/
// @desc    Create/Update profile
// @access  Private

router.post(
	"/",
	[
		auth,
		[
			check("status", "Status is required").not().isEmpty(),
			check("skills", "Skills is required").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const profileFields = {};
		profileFields.user = req.user.id;

		const standardFields = [
				"company",
				"website",
				"location",
				"bio",
				"status",
				"githubusername",
			],
			socialFields = [
				"youtube",
				"twitter",
				"facebook",
				"linkedin",
				"instagram",
			];

		standardFields.forEach(field => {
			if (req.body[field]) profileFields[field] = req.body[field];
		});

		const { skills } = req.body;

		if (skills) {
			profileFields.skills = skills.split(",").map(skill => skill.trim());
		}

		profileFields.social = {};

		socialFields.forEach(field => {
			if (req.body[field]) profileFields.social[field] = req.body[field];
		});

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			// update
			if (profile) {
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}

			// create
			profile = new Profile(profileFields);

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);

// @route   POST api/profile/
// @desc    Get all profiles
// @access  Public

router.get("/", async (req, res) => {
	try {
		const profiles = await Profile.find().populate("user", ["name", "avatar"]);
		res.json(profiles);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   POST api/profile/user/:user_id
// @desc    Get user profile by user id
// @access  Public

router.get("/user/:user_id", async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate("user", ["name", "avatar"]);
		if (!profile) {
			return res.status(400).json({ msg: "Profile not found" });
		}
		res.json(profile);
	} catch (err) {
		if (err.kind == "ObjectId")
			return res.status(400).json({ msg: "Profile not found" });
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   POST api/profile/
// @desc    Delete profile,user & posts
// @access  Private

router.delete("/", auth, async (req, res) => {
	try {
		await Profile.findOneAndRemove({ user: req.user.id });
		await User.findOneAndRemove({ _id: req.user.id });

		res.json({ msg: "User deleted" });
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private

router.put(
	"/experience",
	[
		auth,
		[
			check("title", "Title is required").not().isEmpty(),
			check("company", "Company is required").not().isEmpty(),
			check("from", "From date is required").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { title, company, location, from, to, current, description } =
			req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(newExp);

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		profile.experience.map(item => {
			if (item.id === req.params.exp_id) {
				return item.remove();
			}
		});

		await profile.save();

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private

router.put(
	"/education",
	[
		auth,
		[
			check("college", "College is required").not().isEmpty(),
			check("degree", "Degree is required").not().isEmpty(),
			check("fieldofstudy", "Field of Study is required").not().isEmpty(),
			check("from", "From date is required").not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { college, degree, fieldofstudy, from, to, current, description } =
			req.body;

		const newEd = {
			college,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.education.unshift(newEd);

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send("Server Error");
		}
	}
);

// @route   DELETE api/profile/education/:ed_id
// @desc    Delete profile education
// @access  Private

router.delete("/education/:ed_id", auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		profile.education.map(item => {
			if (item.id === req.params.ed_id) {
				return item.remove();
			}
		});

		await profile.save();

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

// @route   GET api/profile/github/:username
// @desc    Get github repos
// @access  Public

router.get("/github/:username", (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${
				req.params.username
			}/repos?per_page=4&sort=asc&client_id=${config.get(
				"githubClientId"
			)}&client_secret=${config.get("githubSecretKey")}`,
			method: "GET",
			headers: { "user-agent": "nodejs" },
		};

		request(options, (error, response, body) => {
			if (error) console.error(error);

			if (response.statusCode !== 200) {
				return res.status(404).json({ msg: "No Github profile found" });
			}

			res.json(JSON.parse(body));
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server Error");
	}
});

module.exports = router;
