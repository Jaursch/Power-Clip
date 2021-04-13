const fs = require('fs');
const ytdl = require('ytdl-core');

exports.validate = function (url){
  return ytdl.validateURL(url)
}

exports.info = async function(url, filename){
  const info = await ytdl.getBasicInfo(url);

  filename == null? filename = "video_info":null;

  fs.writeFile('./bin/'+ filename +'.txt', info, err =>{
    if(err){
      console.error(err);
    }
    return
  });
  console.log('Link\'s info can be found in: /bin/'+filename+'.txt');
}
