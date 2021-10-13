const {v4: uuid} = require('uuid')
const Promise = require('promise')
const express = require("express");
const path = require("path");
const powerclip = require('./service.js');
const fs = require('fs');
const mailer = require('nodemailer');

const help = require('./helpers');
const e = require('express');

const app = express();
const port = process.env.PORT || "8080";

// Nodemailer account info

app.use(express.json());

app.get("/", (req, res) => {
	console.log(`Getting a basic request`);
	res.status(200).send("Basic request for Powerclip!");
});

app.get("/validate", (req, res) => {
	console.log("/validate - get");
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

app.post("/standard", async (req, res) => {
	console.log("/standard - get");
	if(validateJSONbody(req, res)){
		const url = req.body.url;
		if(!powerclip.validate(url)){
			res.status(400).send(`'${url}' is not a valid YouTube url`);
		}else{ 
			let id = uuid();
			res.json({id});

      		let hd = req.body.hd? req.body.hd : false;
			// download video
			let path = await downloadVideo(url, hd);

			// rename file to use given uuid
			let newpath = `./bin/${id}.mp4`;
			fs.renameSync(path, newpath);

			console.log("Video complete at: ", newpath);

			// Now notify the user that their video is complete!
			if(req.body.email){
				sendEmail(req.body.email, id);
			}else{
				console.log("No email address included. No notification email will be sent.");
			}
		}
	}

});

async function downloadVideo(url, hd) {
	if(hd == true){
		return await powerclip.downloadHD(url);
	}else{
		return await powerclip.downloadYT(url);
	}
}

async function clipVideo(path, start=0, length=15) {
	return await powerclip.clipVideo(path, start, length);
}

/**
 * We can send a collection of urls
 * We can send urls & single start time 
 * send urls & individual start times
 * 	videos
 * 		[
 * 			url
 * 			start
 * 			length
 * 		]
 */
app.post('/compile', async (req, res) => {
		// reformat to check if start time & clip length is given
		//console.log(req.body);

		const videos = req.body.videos;
		const id = uuid();
		res.json({ id });

		const startTime = Date.now();
		// Download Videos, Clip & Combine
		let hd = req.body.hd? req.body.hd : false;
		let filePaths = await Promise.all(videos.map(async (video) => downloadVideo(video.url, hd)));
		for(let i=0; i<videos.length; i++){
			videos[i].filePath = filePaths[i];
		}
		filePaths = await Promise.all(videos.map(async (video) => clipVideo(video.filePath, video.start, video.length)));
		const outputPath = await powerclip.combine(filePaths, id);
		console.log("Combine video complete at: ", outputPath);
		console.log("Total Completion Time: ", parseInt((Date.now()-startTime) / 1000 ), " seconds");

		// Now notify the user that their video is complete!
		if(req.body.email){
			sendEmail(req.body.email, id);
		}else{
			console.log("No email address included. No notification email will be sent.");
		}
});

/**
 * 
 */
app.get('/download', async (req, res) => {
	const id = req.query.id;
	const exists = help.exists(`./bin/${id}.mp4`);

	if(!exists){
		res.status(404).send("video id not found!")
	}else{
		res.download(`./bin/${id}.mp4`, 'powerclip.mp4');
	}
});

app.get('/clip', async (req, res) => {
	const videos = req.body.videos;

	const clipPath = await clipVideo(videos.filePath, videos.start, videos.length);
	console.log(clipPath);

	res.send(clipPath);
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

/**
 * Sends email to announce video is ready for download
 * @param {string} address email address to send completed video link
 * @param {string} id UUID for the completed video
 */
function sendEmail(address, id){
	const transporter = mailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'powerclipvideos@gmail.com',
			pass: 'powerclip2021'
		}
	});
	
	const mailData = {
		from: '"PowerClip" <notifications@powerclip.com>',
		to: address,
		subject: "Your video is ready!",
		// text: `Your PowerClip is ready! \nYour video id is: blank. Use the following request to download your video: `,
		html: `<p><b>Your PowerClip is ready!</b> \nYour video id is: ${id}. Use the following request to download your video: http://localhost:8080/download?id=${id}</p>`
	};
	transporter.sendMail(mailData, (err, info) => {
		if(err){
			console.error(err);
		}else{
			console.log('Email Sent!');
		}
	});	
}

	