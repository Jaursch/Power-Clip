const { json } = require("express");
const express = require("express");
const path = require("path");
const powerclip = require('./service.js');

const app = express();
const port = process.env.PORT || "8080";

app.use(express.json());

app.get("/", (req, res) => {
	console.log(`Getting a basic request`);
	res.status(200).send("Basic request for Powerclip!");
});

app.get("/validate", (req, res) => {
	console.log("body: " + JSON.stringify(req.body));
	if(!Object.keys(req.body).length){
		res.status(400).send("No body provided");
	}else if(!req.body.url){
		res.status(400).send("url needs to be in json format w/ key \"url\"");
	}else{
		const url = req.body.url;
		const valid = powerclip.validate(url);

		let msg = valid? `'${url}' is a valid YouTube link!`: `'${url}' is not a valid YouTube link`;

		res.status(200).send(msg);
	}
	
});

app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});
	