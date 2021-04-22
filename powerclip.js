const s = require('./service');
const help = require('./helpers');
const prompt = require('prompt-sync')();
const fs = require('fs');


console.log("\nWelcome to PowerClip! Let's get this party started!\n");

const args = process.argv.slice(2);

switch(args[0]){
case 'standard':
  var url = singleURL();
  if(args.includes('info')){
    const filepath = s.info(url);
    console.log('Video\'s data can be found at: ' + filepath);
  }
  s.downloadSingle(url);

  break;
case 'clip':
  const out1_path = help.DEF_VID_PATH;
  const exists = help.exists(out1_path);

  console.log('Default clip will be taken from '+help.DEF_VID_PATH+' \n');

  if (exists) {

    const startTime = prompt('Enter a start time: ');
    const secLength = prompt('How many seconds?: ');

    s.clipVideo(startTime, secLength);
  }else
    console.log(help.DEF_VID_PATH+' does not exist. Cannot use default clip');

  break;
default:
  var url = singleURL();

  s.downloadSingleHD(url);
  break;
}

//prompts for a url and then returns it if a valid YT link
function singleURL(){
  let url = prompt('Enter YouTube URL: ');
  let validated = false;

  do{
    //test url
    url? null: url = 'https://www.youtube.com/watch?v=nbXgHAzUWB0';

    validated = s.validate(url);

    if(!validated){
      console.log('Invalid URL!\n');
      url = prompt('Try a valid YoutTube URL: ');
    }
  }while(!validated)
  return url;
}
