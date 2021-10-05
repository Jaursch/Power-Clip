const express = require("express");
const path = require("path");
const powerclip = require('./service.js');

const app = express();
const port = process.env.PORT || "8080";

app.get("/", (req, res) => {
	console.log(`Getting a basic request`);
	res.status(200).send("Basic request for Powerclip!");
});

app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});
	