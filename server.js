const express = require("express");
const connectDB = require("./config/db");

const app = express();
app.use(
	express.json({
		extended: false,
	})
);

connectDB();

app.get("/", (req, res) => {
	res.send("Hello World");
});

app.use("/api/users", require("./router/api/users"));
app.use("/api/profile", require("./router/api/profile"));
app.use("/api/auth", require("./router/api/auth"));
app.use("/api/posts", require("./router/api/posts"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});
