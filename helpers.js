const fs = require('fs');
const videos = require('./videos');

const STD_MSG = '[MSG helpers] ';
const DEMUXER_LIST_PATH = '../bin/list.txt';

exports.DEF_VID_PATH = './bin/out0.mp4';

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
      fs.unlinkSync(path);
      console.log(STD_MSG, `File at ${path} deleted`);
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

// Creating list of file paths for ffmpeg demuxer
//  to put files together
exports.createDemuxerList = function (){
  const v = videos.getAll();
  let txt = '';
  for(video in v){
    txt += `file '${(v[video].clipPath).substring(1)}'\n`;
  }
  fs.writeFileSync(DEMUXER_LIST_PATH, txt);
}
