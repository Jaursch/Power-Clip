const fs = require('fs');
const ytdl = require('ytdl-core');
const help = require('./helpers');

const STREAM_MSG = '[MSG DURING STREAM]:: ';

//validates url of YouTube video
exports.validate = function (url){
  return ytdl.validateURL(url)
}

//gets the info of a valid YT link and stores json return value in a file
exports.info = async function(url){
  const info = await ytdl.getBasicInfo(url);

  //create filename
  const title = info.videoDetails.media.song;
  const filename = help.replace(title);

  //create file path from filename
  const filepath = filename == null? './test/video_info.json':'./test/'+filename+'.json';

  await fs.writeFile(filepath, JSON.stringify(info, null, 2), err =>{
    if(err){
      console.error(err);
    }
    return
  });
  return filepath;
}

exports.downloadSingle = function(url){
  //const title = await info(url);
  var title = '';

  const readStream = ytdl(url);
  readStream.on('info',(info, format) => {
              console.log(STREAM_MSG + 'title: ' + info.videoDetails.title);
              title = help.replace(info.videoDetails.title);

              const fileType = format.container;
              const writeStream = fs.createWriteStream(`${title}.${fileType}`);

              readStream.pipe(writeStream);
            })
            .on('progress',(chunkSize,dledBytes,totBytes) =>{
              const percent = (dledBytes/totBytes*100).toFixed(2);
              console.log('Progress: ' +  percent +'%\t'+ 'downloaded: '+ dledBytes +'\t'+ 'total: ' + totBytes);
            })

  console.log('outside stream');

    //.pipe(fs.createWriteStream(title + '.mp4'));
}
