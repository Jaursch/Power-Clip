const fs = require('fs');
const videos = require('./videos');

const STD_MSG = '[MSG helpers] ';

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
      console.log(STD_MSG, `Deleting file at: ${path}`);
      fs.unlinkSync(path);
      console.log(STD_MSG, path + ' deleted')
    }
  }catch(err){
    console.error('ERR - deleteIfExists: ' + err);
  }
}

exports.exists = function(path){
  try{
    if(fs.existsSync(path))
      return true;
    else
      return false;
  }catch(err){
      console.error('ERR - exists: ' + err);
  }
}

//when a video is completely downloaded it's path will be entered
exports.waitTillAllDownloaded = async function(){
  console.log('checking videos');
  return new Promise(resolve => {
    function checkAllDownloaded(){
      if(videos.allDownloaded()){
        console.log(STD_MSG, 'all downloaded');
        resolve();
      }else{
        console.log(STD_MSG, 'still downloading');
        setTimeout(checkAllDownloaded, 5000);
      }
    }
    checkAllDownloaded();
  });
  /*for(var i=0; i<videos.count(); i++){
    if(videos.getVideoPath(i) == false){
      console.log(`video ${i} not ready`);
      setTimeout(exports.waitTillAllDownloaded, 5000);
      break;
    }else{
      console.log(`video ${i} ready: ${videos.getVideoPath(i)}`);
    }
  }*/
}

exports.waitTillReady = async function(){
  return new Promise(resolve =>{
    function checkVidPath(){
      if(videos.allReady()==true){
        console.log(STD_MSG, 'actually all ready!');
        resolve();
      }else{
        console.log(STD_MSG, 'waiting a little longer for ready');
        setTimeout(checkVidPath, 2000);
      }
    }
    checkVidPath();
  });
}
