const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');
const readline = require('readline');
const help = require('./helpers');

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

exports.clipVideo = function (startTime, length) {
  const outputFile = './bin/cliped_out1.mp4';

  help.deleteIfExists(outputFile);

  console.log('start clipping');
  if(!startTime)
    startTime = '30.0';

  const ffmpegProcess = cp.spawn(ffmpeg, [
    '-loglevel', '8', '-hide_banner',

    '-ss', startTime,

    '-i', './bin/out1.mp4',

    '-c', 'copy',
    //duration of cut, default 60
    '-t',length,
    //output file
    outputFile

  ], {
    windowsHide: true
  });

  ffmpegProcess.on('close', () => {
    console.log('clipping done');
  })
}

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

//download single, full 360p video from given YT url
exports.downloadSingle = function(url){
  let title = '';

  const readStream = ytdl(url);
  readStream.on('info',(info, format) => {
              console.log(STREAM_MSG + 'Now Downloading: ' + info.videoDetails.title);
              title = help.replace(info.videoDetails.title);

              const fileType = format.container;
              const writeStream = fs.createWriteStream(`${title}.${fileType}`);

              readStream.pipe(writeStream);
            })
            .on('progress',(_,downloaded,total) =>{
              const percent = (downloaded/total*100).toFixed(1);
              if(percent % 5 == 0) //print log every 5%
                console.log('Progress: ' +  percent +'%\t'+ 'downloaded: '+ downloaded +'\t'+ 'total: ' + total);
            })
}

exports.downloadSingleHD = function(url){
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

  //create bin folder?
  
  help.deleteIfExists('./bin/out1.mp4');

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
    './bin/out1.mp4',
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

    exports.clipVideo(startTime, secLength);
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
