const prompt = require('prompt-sync')();
const fs = require('fs');
const s = require('./service');

console.log("Adding files to bin/list.json")

let again = true;
//const file = JSON.parse(fs.readFileSync('bin/list.json').toString());
while(again){
	let url = prompt('enter video url:');
	if(url == 'q'){ break; }
	s.getInfo(url).then((data) => {
		let title = data.videoDetails.media.song;
		console.log(`Title: ${title}`);
		let msg = `{\n\t"name": "${title}",\n\t"url": "${url}",\n\t"start": "45",\n\t"length": "60"\n},`;
		fs.appendFileSync('bin/list.json', msg);
	});
}