const { json } = require("express");
const express = require("express");
const path = require("path");
const powerclip = require('./service.js');
const fs = require('fs');

const app = express();
const port = process.env.PORT || "8080";

app.use(express.json());

app.get("/", (req, res) => {
	console.log(`Getting a basic request`);
	res.status(200).send("Basic request for Powerclip!");
});

app.get("/validate", (req, res) => {
	console.log("/validate - get");
	//onsole.log("body: " + JSON.stringify(req.body));
	if(!Object.keys(req.body).length){
		res.status(400).send("No body provided");
	}else if(!req.body.url){
		res.status(400).send("url needs to be in json format w/ key \"url\"");
	}else{
		const url = req.body.url;
		const valid = powerclip.validate(url);

		let msg = valid? `'${url}' is a valid YouTube link!`: `'${url}' is not a valid YouTube url`;

		res.status(200).send(msg);
	}
});

app.get("/info", async (req, res) => {
	console.log("/info - get");

	if(!Object.keys(req.body).length){
		res.status(400).send("No body provided");
	}else if(!req.body.url){
		res.status(400).send("url needs to be in json format w/ key \"url\"");
	}else{
		const url = req.body.url;

		const valid = powerclip.validate(url);
		if(!valid){
			res.status(400).send(`'${url}' is not a valid YouTube url`);
		}else{
			//get filepath of information
			let infopath = await powerclip.info(url);
			console.log("infopath: " + infopath);

			let data = fs.readFileSync(infopath);
			fs.readFile(infopath, (err, data)=>{
				if(err){
					console.err("err: " + err);
					res.status(500).send("error parsing file: " + err);
				}else{					
					let info = JSON.parse(data);
					res.status(200).send(info.videoDetails);
				}
			})
		}
	}

});

app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});
	