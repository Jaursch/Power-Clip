//Use this file as a class

//relevant link: https://stackoverflow.com/questions/3922994/share-variables-between-files-in-node-js
//Scenario #3

// url:string,
// startTime:Date,
// length:seconds - how long it should be
// ready:bool - ready to be clipped
// videoPath:string
// clipPath:string
const videos = [];

function valid(index, element){
  if(videos[index]==null)
    throw 'Video is not valid at given index!';
  if(typeof element !== 'undefined'){
    switch(element){
      case 'videoPath':
        if(typeof videos[index].videoPath == 'undefined')
          throw 'This video does not have a specified video path!';
        break;
      case 'clipPath':
        if(typeof videos[index].clipPath == 'undefined')
          throw 'This video does not have a specified clip path!';
    }
  }
  return true;
}

exports.count = function(){
  return videos.length;
}

exports.create = function(url, startTime='0:45', length='60'){
  videos.push({url:url,
               startTime: startTime,
               length: length,
               ready: false
             });
  return videos.length-1;
}

exports.getAll = function(){
  return videos;
}

exports.getVideo = function(index){
  try{
    if(valid(videos[index]))
      return videos[index];
  }catch(e){
    console.error(e);
  }
}

exports.getUrl = function(index){
  return videos[index].url
}

exports.setUrl = function(index, url){
  videos[index].url = url;
}

exports.setReady = function(index, ready=true){
  videos[index].ready = ready;
}

exports.isReady = function(index){
  return videos[index].ready;
}

exports.allReady = function(){
  for(let video of videos){
    if(video.ready==false){
      return false;
    }
  }return true;
}
