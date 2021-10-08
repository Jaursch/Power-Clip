const {v4: uuid} = require('uuid')
const Promise = require('promise')
const express = require("express");
const path = require("path");
const powerclip = require('./service.js');
const fs = require('fs');

const help = require('./helpers');
const e = require('express');

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

async function downloadVideo(url) {
	return await powerclip.downloadYT(url);
}

app.post('/compile', async (req, res) => {

		const {urls} = req.body
		const id = uuid()
		res.json({ id })

		const filePaths = await Promise.all(urls.map(async (url) => downloadVideo(url)))
		await powerclip.combine(filePaths, id)
		// now splice using the filePaths var


		// provide uuid for spliced video
		// after response sent:
		// for each url, download from YouTube
		// add each url as a pending download
		// once all downloads are done, splice together (save as [uuid].mp4)
		// when user makes request to /download?id={id}, return spliced video

});

app.get('/download', async (req, res) => {
	const id = req.query.id;
	const exists = help.exists(`./bin/${id}.mp4`);

	if(!exists){
		res.status(404).send("video id not found!")
	}else{
		res.download(`./bin/${id}.mp4`);
	}
})

app.post('/combine', async (req, res) => {
	const filepaths = ['./bin/Hah_gay.mp4', './bin/Hah_gay.mp4'];
	const outputPath = await powerclip.combine(filepaths, "endpath");
	res.json({outputPath});
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
	