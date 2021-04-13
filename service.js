const fs = require('fs');
const ytdl = require('ytdl-core');

exports.validate = function (url){
  return ytdl.validateURL(url)
}

exports.info = async function(url, filename){
  const info = await ytdl.getBasicInfo(url);

  filename == null? filename = "video_info":null;

  await fs.writeFile('./test/'+ filename +'.json', JSON.stringify(info, null, 2), err =>{
    if(err){
      console.error(err);
    }
    return
  });
  const title = info.player_response.videoDetails.title;
  console.log(title +'\'s info can be found in: /test/'+filename+'.json');
}
