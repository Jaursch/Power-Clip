//Use this file as a class

//relevant link: https://stackoverflow.com/questions/3922994/share-variables-between-files-in-node-js
//Scenario #3

const h = require('./helpers');

const STD_MSG = '[MSG videos] ';

// url:string,
// startTime:Date,
// length:seconds - how long it should be
// ready:bool - ready to be clipped
// TEST:: downloaded:bool - video has been downloaded
// videoPath:string - full video path
// clipPath:string - full clip path
const videos = [];

function valid(index, element){
  if(!(typeof index === 'number' && isFinite(index)))
    throw `Given index is not a number`;
  if(videos[index]==null)
    throw `Video is not valid at index: ${index}!`;
  if(typeof element !== 'undefined'){
    switch(element){
      case 'videoPath':
        if(typeof videos[index].videoPath == 'undefined')
          throw `Video #${index} does not have a specified video path!`;
        break;
      case 'clipPath':
        if(typeof videos[index].clipPath == 'undefined')
          throw `Video #${index} does not have a specified clip path!`;
    }
  }
  return true;
}

exports.count = function(){
  return videos.length;
}

//adds video info to array and returns index
exports.create = function(url, startTime, length, vidPath=null){
  videos.push({url:url,
               startTime: startTime==null?'0:45':startTime,
               length: length==null?'60':length,
               ready: false,
               videoPath: vidPath==null?null:vidPath
             });
  return videos.length-1;
}

exports.getAll = function(){
  return videos;
}

exports.getVideo = function(index){
  try{
    if(valid(index)){
      return videos[index];
    }
  }catch(e){
    console.error(e);
  }
}

exports.getUrl = function(index){
  return videos[index].url
}

exports.getStartTime = function(index){
  return videos[index].startTime;
}

exports.getLength = function(index){
  return videos[index].length;
}

exports.getVideoPath = function(index){
  if(!videos[index].hasOwnProperty('videoPath') || !videos[index].videoPath)
    return false;
  else{
    return videos[index].videoPath;
  }
}

exports.setUrl = function(index, url){
  videos[index].url = url;
}

exports.setVideoPath = function(index, path){
  if(h.exists(path)){
    videos[index].videoPath = path;
  }else{
    throw 'Given video path does not exist';
  }
}

exports.setClipPath = function(index, path){
  if(h.exists(path)){
    videos[index].clipPath = path;
  }else{
    throw `Given clip path for video ${index} does not exist: ${path}`;
  }
}

exports.setReady = function(index, ready=true){
  videos[index].ready = ready;
}

exports.isReady = function(index){
  return videos[index].ready;
}

exports.allDownloaded = function(){
  for(let video of videos){
    if(video.videoPath == false || typeof(video.videoPath) == 'undefined'|| video.videoPath == null){
      return false;
    }
  }return true;
}

exports.allReady = function(){
  for(let video of videos){
    if(video.ready==false){
      return false;
    }
  }return true;
}
