const fs = require('fs');
const videos = require('./videos');

exports.DEF_VID_PATH = './bin/out00.mp4';

//replaces extra chars w/ underscore
exports.replace = function (link){
  return link.replace(/[^a-z0-9\-]/gi, '_');
}

//if a path exists, delete the file at the end of the path
exports.deleteIfExists = function(path){
  try{
    if(fs.existsSync(path)){
      console.log('deleting');
      fs.unlinkSync(path);
      console.log(path + 'deleted')
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

exports.waitTillReady = function(){
  if(videos.allReady()==false){
    setTimeout(exports.waitTillReady(),5000);
  }else{
    console.log('actually all ready!');
  }
}
