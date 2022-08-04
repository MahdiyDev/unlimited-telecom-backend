const express = require("express");
const cors = require("cors");
const { port, secret } = require("./config");
const { pg } = require("./utils/pg");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

async function auth(req, res, next) {
	try {
		const { token } = req.headers;

		if (!token) return res.status(401).end();

		const parsedToken = token.split(" ");

		const bearer = parsedToken[0];

		if (bearer !== "Bearer") return res.status(403).end();

		const _token = parsedToken[1];

		const valid = jwt.verify(_token, secret);

		const user = await pg(
			`
      SELECT * FROM admins
      WHERE id = $1
    `,
			[valid.id]
		);

		if (!user) return res.status(401).end();

		req["id"] = user.id;
		next();
	} catch (error) {
		console.log(error);
		res.status(500).end();
	}
}

app.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;

		if ((!username, !password))
			return res
				.status(400)
				.json({ message: "username and password is required" });

		const admin = await pg(
			`
      SELECT * FROM admins
      WHERE username = $1
      AND password = $2
      AND status = true
    `,
			[username, password]
		);

		const token = jwt.sign({ id: admin.id }, secret);

		res.status(200).json({ token: `Bearer ${token}` });
	} catch (error) {
		res.status(500).end();
	}
});

app.post("/data", auth, async (req, res) => {
	try {
		const { data } = req.body;

		if (!data) return res.status(400).json({ message: "data is required" });

		const result = await pg(
			`
      INSERT INTO info(data)
      VALUES($1)
      RETURNING *
    `,
			[data]
		);

		res.status(200).json({ data: result });
	} catch (error) {
		res.status(500).end();
	}
});

app.get("/data", auth, async (req, res) => {
	try {
		const data = await pg(`
      SELECT * FROM info
      ORDER BY created_at DESC
      LIMIT 1
    `);

		res.status(200).json({ data });
	} catch (error) {
		res.status(500).end();
	}
});

app.listen(port, () => {
	console.log("app running on http://localhost:%d", port);
});
