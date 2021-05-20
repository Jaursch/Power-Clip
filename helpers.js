const fs = require('fs');
const videos = require('./videos');

exports.DEF_VID_PATH = './bin/out00.mp4';

//replaces extra chars w/ underscore
exports.replace = function (link){
  return link.replace(/[^a-z0-9\-]/gi, '_');
}

//clears out all files in bin folder
exports.cleanBin = function(){

}

//if a path exists, delete the file at the end of the path
exports.deleteIfExists = function(path){
  try{
    if(fs.existsSync(path)){
      console.log(`Deleting file at: ${path}`);
      fs.unlinkSync(path);
      console.log(path + ' deleted')
    }
  }catch(err){
    console.log('ERR - deleteIfExists: ' + err);
  }
}

exports.exists = function(path){
  try{
    if(fs.existsSync(path))
      return true;
    else
      return false;
  }catch(err){
      console.log('ERR - exists: ' + err);
  }
}

//when a video is completely downloaded it's path will be entered
exports.waitTillAllDownloaded = async function(){
  console.log('checking videos');
  for(var i=0; i<videos.count(); i++){
    if(videos.getVideoPath(i) == false){
      console.log(`video ${i} not ready`);
      setTimeout(exports.waitTillAllDownloaded, 5000);
      break;
    }else{
      console.log(`video ${i} ready: ${videos.getVideoPath(i)}`);
    }
  }
}

exports.waitTillReady = async function(){
  if(videos.allReady()==false){
    setTimeout(exports.waitTillReady, 1000);
  }else{
    console.log('actually all ready!');
  }
}
