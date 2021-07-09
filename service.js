const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');
const readline = require('readline');
const help = require('./helpers');
const videos = require('./videos');

const STD_MSG = '[MSG service] ';
const STREAM_MSG = '[MSG DURING STREAM] ';

const tracker = {
  start: Date.now(),
  audio: { downloaded: 0, total: Infinity },
  video: { downloaded: 0, total: Infinity },
  merged: { frame: 0, speed: '0x', fps: 0 },
};
const showProgress = () => {
  readline.cursorTo(process.stdout, 0);
  const toMB = i => (i / 1024 / 1024).toFixed(2);

  process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
  process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

  process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
  process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

  process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
  process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

  process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
  readline.moveCursor(process.stdout, 0, -3);
};

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
  const filepath = filename == null? './bin/video_info.json':'./bin/'+filename+'.json';

  await fs.writeFile(filepath, JSON.stringify(info, null, 2), err =>{
    if(err){
      console.error(err);
    }
    return
  });
  return filepath;
}

//download single, full 360p video from given YT url
exports.downloadSingle = function(url){
  let title = '';

  try {
    const readStream = ytdl(url);
    readStream.on('info',(info, format) => {
                console.log(STREAM_MSG + 'Now Downloading: ' + info.videoDetails.title);
                title = help.replace(info.videoDetails.title);
  
                const fileType = format.container;
                if(!fs.existsSync('./bin'))
                  fs.mkdirSync('./bin'); 
                const writeStream = fs.createWriteStream(`./bin/${title}.${fileType}`);
  
                readStream.pipe(writeStream);
              })
              .on('progress',(_,downloaded,total) =>{
                const percent = (downloaded/total*100).toFixed(1);
                if(percent % 5 == 0) //print log every 5%
                  console.log(`Progress: ${percent}%\t downloaded: ${downloaded}\t total: ${total}`);
              })
              .on('error', (err) => {
                throw err
              })    
  } catch (err) {
    console.error(STD_MSG, "Error during download: ", err);    
  }
}

// TODO: Currently depreciated- does not work w/ videos object
exports.downloadSingleHD = function(url, index){
  !(index==null)? null:index=00;
  let path = `./bin/out${index}.mp4`;

  // Get audio and video streams
  const audio = ytdl(url, { quality: 'highestaudio' })
    .on('progress', (_, downloaded, total) => {
      tracker.audio = { downloaded, total };
    });
  const video = ytdl(url, { quality: 'highestvideo' })
    .on('progress', (_, downloaded, total) => {
      tracker.video = { downloaded, total };
    });

  // Prepare the progress bar
  let progressbarHandle = null;
  const progressbarInterval = 1000;

  help.deleteIfExists(`./bin/out${index}.mp4`);

  // Start the ffmpeg child process
  const ffmpegProcess = cp.spawn(ffmpeg, [
    // Remove ffmpeg's console spamming
    '-loglevel', '8', '-hide_banner',
    // Redirect/Enable progress messages
    '-progress', 'pipe:3',
    // Set inputs
    '-i', 'pipe:4',
    '-i', 'pipe:5',
    // Map audio & video from streams
    '-map', '0:a',
    '-map', '1:v',
    // Keep encoding
    '-c:v', 'copy',
    // Define output file
    path,
  ], {
    windowsHide: true,
    stdio: [
      /* Standard: stdin, stdout, stderr */
      'inherit', 'inherit', 'inherit',
      /* Custom: pipe:3, pipe:4, pipe:5 */
      'pipe', 'pipe', 'pipe',
    ],
  });
  ffmpegProcess.on('close', () => {
    // Cleanup
    process.stdout.write('\n\n\n\n');
    clearInterval(progressbarHandle);

    const startTime = '40';
    const secLength = '60';

    exports.clipVideo(index, startTime, secLength);
  });

  // Link streams
  // FFmpeg creates the transformer streams and we just have to insert / read data
  ffmpegProcess.stdio[3].on('data', chunk => {
    // Start the progress bar
    if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
    // Parse the param=value list returned by ffmpeg
    const lines = chunk.toString().trim().split('\n');
    const args = {};
    for (const l of lines) {
      const [key, value] = l.split('=');
      args[key.trim()] = value.trim();
    }
    tracker.merged = args;
  });
  audio.pipe(ffmpegProcess.stdio[4]);
  video.pipe(ffmpegProcess.stdio[5]);
}

//clip all videos that are stored. Will block until all videos are downloaded
exports.clipVideos = async function(){
  await help.waitTillAllDownloaded();
  console.log(STD_MSG, 'All videos should be downloaded');

  for(var i=0; i<videos.count(); i++){
    const video = videos.getVideo(i);
    exports.clipVideo(i, video.startTime, video.length);
  }
}

exports.clipVideo = function (index, startTime, length) {
  !(index==null)?null:index='00'
  let outputPath = `./bin/cliped_out${index}.mp4`;
  let inputPath = videos.getVideoPath(index);

  console.log(STD_MSG, `Clipping from path : ${inputPath}`);

  help.deleteIfExists(outputPath);

  if(!startTime)
  startTime = '30.0';

  const ffmpegProcess = cp.spawn(ffmpeg, [
    '-y',
    '-ss', startTime,
    '-i', inputPath,
    '-t', length,
    '-b:a', '192K',
    '-nostdin',
    //output file
    outputPath

  ], {
    windowsHide: true
  });

  ffmpegProcess.on('close', () => {
    console.log(STD_MSG, 'clipping done for path: ', outputPath);
    try{
      videos.setClipPath(index, outputPath);
      videos.setReady(index);
    }catch(error){
      console.error(error);
    }
  })
}

//Downloads video from given video object index and sends video off to be clipped
exports.prepClip = async function(index){
  let path = `./bin/vid${index}.mp4`;
  let video_info = videos.getVideo(index);

  help.deleteIfExists(path);

  // Get audio and video streams
  const audio = ytdl(video_info.url, { quality: 'highestaudio' });
  const video = ytdl(video_info.url, { quality: 'highestvideo' });

  // Start the ffmpeg child process
  const ffmpegProcess = cp.spawn(ffmpeg, [
    // Remove ffmpeg's console spamming
    '-loglevel', '8', '-hide_banner',
    // Redirect/Enable progress messages
    '-progress', 'pipe:3',
    // Set inputs
    '-i', 'pipe:4',
    '-i', 'pipe:5',
    // Map audio & video from streams
    '-map', '0:a',
    '-map', '1:v',
    // Keep encoding
    '-c:v', 'copy',
    // Define output file
    path,
  ], {
    windowsHide: true,
    stdio: [
      /* Standard: stdin, stdout, stderr */
      'inherit', 'inherit', 'inherit',
      /* Custom: pipe:3, pipe:4, pipe:5 */
      'pipe', 'pipe', 'pipe',
    ],
  });
  ffmpegProcess.on('close', () => {
    console.log(STD_MSG, `Full video #${index} finished at ${path}`);
    try{
      videos.setVideoPath(index, path);
    }catch(error){
      console.error(error);
    }
    //exports.clipVideo(index, videos.getStartTime(index), videos.getLength(index));
  });

  // Link streams
  // FFmpeg creates the transformer streams and we just have to insert / read data
  audio.pipe(ffmpegProcess.stdio[4]);
  video.pipe(ffmpegProcess.stdio[5]);
}

// Creating list of file paths for ffmpeg demuxer
//  to put files together
function createDemuxerList(){
  const v = videos.getAll();
  let txt = '';
  for(video in v){
    txt += `file ${v[video].clipPath}\n`;
  }
  fs.writeFileSync('./bin/list.txt', txt);
}

//Combines two clips together
exports.combineTwo = async function(index){
  console.log(STD_MSG, 'waiting');
  await help.waitTillReady();
  console.log(STD_MSG, 'not waiting anymore!');

  createDemuxerList();
  console.log(`contents of list.txt: \n${fs.readFileSync('./bin/list.txt')}`);
}
