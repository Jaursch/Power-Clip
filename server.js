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
	//console.log("body: " + JSON.stringify(req.body));
	if(validateJSONbody(req, res)){
		const url = req.body.url;
		const valid = powerclip.validate(url);

		let msg = valid? `'${url}' is a valid YouTube link!`: `'${url}' is not a valid YouTube url`;

		res.status(200).send(msg);
	}
});

app.get("/info", async (req, res) => {
	console.log("/info - get");

	if(validateJSONbody(req, res)){
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
			});
		}
	}
});

app.get("/standard", async (req, res) => {
	console.log("/standard - get");
	if(validateJSONbody(req, res)){
		const url = req.body.url;
		if(!powerclip.validate(url)){
			res.status(400).send(`'${url}' is not a valid YouTube url`);
		}else{ 
			// download video
			let path = powerclip.downloadYT(url);

			console.log("path value: " + path);

			// once path is given, return video
			/*res.status(200).download(path, 'video.mp4', (err) => {
				if(err){
					console.error("error with standard download: " + err);
					return;
				}else{
					console.log("standard download successful");
				}
			});*/
		}
	}

});

app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

/**
 * Validates request body. Sends error back if invalid
 * @param {object} req Request
 * @param {object} res Response
 * @returns Returns boolean if body is valid
 */
function validateJSONbody(req, res){
	if(!Object.keys(req.body).length){
		res.status(400).send("No body provided");
		return false;
	}else if(!req.body.url){
		res.status(400).send("url needs to be in json format w/ key \"url\"");
		return false;
	}
	return true;
}
	