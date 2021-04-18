const s = require('./service');
const prompt = require('prompt-sync')();

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
  const startTime = prompt('Enter a start time: ');
  const secLength = prompt('How many seconds?: ');

  s.clipVideo(startTime, secLength);

  break;
default:
  var url = singleURL();

  s.downloadSingleHD(url);
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
