const prompt = require('prompt-sync')();
const fs = require('fs');
const s = require('./service');
const help = require('./helpers');
const videos = require('./videos');

const STD_MSG = '[MSG powerclip] ';

//prompts for a url and then returns it if a valid YT link
//index is an optional param
function promptURL(index=null){
  //console.log('index: '+index+'\nindex null? '+(index===null)+'\nindex blank? ' + (index==""));
  let index_txt = !(index==null)? ' for video #' + (index+1) : '';

  let url = prompt(`Enter YouTube URL${index_txt}: `);
  let validated = false;

  //Make sure user gives a valid url
  do{
    url? null: url = 'https://www.youtube.com/watch?v=nbXgHAzUWB0';

    validated = s.validate(url);

    if(!validated){
      console.log('Invalid URL!\n');
      url = prompt('Try a valid YouTube URL: ');
    }
  }while(!validated)
  return url;
}


//use if we need to make everything async
async function combineTwoVideos(){

}

console.log("\nWelcome to PowerClip! Let's get this party started!\n");

const args = process.argv.slice(2);

switch(args[0]){
case 'standard':
  var url = promptURL();
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
case 'hd':
  var url = promptURL();

  s.downloadSingleHD(url);
  break;
default:
  console.log('We are now going to combine two clipped YouTube videos');

  const testUrls = ['https://www.youtube.com/watch?v=Co0tTeuUVhU', 'https://www.youtube.com/watch?v=nbXgHAzUWB0']
  for (var i =0; i<2; i++){
    //let url = promptURL(i);
    //let startTime = prompt('Enter the start time of the video\'s clip (default 0:45): ');
    //let length = prompt('How long should this clip be (default 60[seconds]): ');

    //videos.create(url, startTime, length);
    videos.create(testUrls[i]);
  }
  console.log(JSON.stringify(videos.getAll()));

  //doesn't take start time & clip length
  //console.log(songs.length);
  for(var i=0; i<videos.count(); i++){
    s.prepClip(i); //NOTE: For dev purposes, shouldn't run if videos are downloaded correctly
  }

  s.clipVideos();

  s.combineTwo();

  break;
}
