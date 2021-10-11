const Promise = require('promise');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');
const readline = require('readline');
const stream = require('stream');

const help = require('./helpers');
const videos = require('./videos');
const { Readable } = require('stream');

const STD_MSG = '[MSG service] ';
const STREAM_MSG = '[MSG DURING STREAM] ';
const DEMUXER_LIST_PATH = './bin/list.txt';
const OUTPUT_PATH ='./bin/';

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

/**
 * Download youtube video in standard 360p quality
 * @param {string} url  url of valid youtube video
 */
exports.downloadYT = async function(url){
  return await new Promise((resolve, reject) => {
    let title = '';
    let path = '';
    
    try {
      let readStream = ytdl(url);
      readStream.on('info',(info, format) => {
                  console.log(STREAM_MSG + 'Now Downloading: ' + info.videoDetails.title);
                  title = help.replace(info.videoDetails.title);
    
                  // const fileType = format.container;
                  if(!fs.existsSync('./bin'))
                    fs.mkdirSync('./bin'); 
                  path = `./bin/${title}.mp4`;
                  help.deleteIfExists(path);
                  let writeStream = fs.createWriteStream(path);
    
                  readStream.pipe(writeStream);
                })
                .on('progress',(_,downloaded,total) =>{
                  const percent = (downloaded/total*100).toFixed(1);
                  if(percent % 5 == 0){ //print log every 5%
                    readline.cursorTo(process.stdout, 0); //untested
                    process.stdout.write(`Progress: ${percent}%\t downloaded: ${downloaded}\t total: ${total}`);
                  }if(percent == 100 && path != ''){ //finished
                    console.log("\n");
                    // return path;
                    resolve(path);
                  }
                })
                .on('error', (err) => {
                  console.error(err);
                })    
    } catch (err) {
      console.error(STD_MSG, "Error during download: ", err);
      reject(err)
    }
  });
}

/**
 * Download youtube video in highest quality available
 * @param {string} url 
 */
 exports.downloadHD = async function(url){
   return await new Promise((resolve, reject) => {
    let path = '';
    let title = '';

    try{
      ytdl.getBasicInfo(url).then((info) => {
        // Get audio and video streams
        const audio = ytdl(url, { quality: 'highestaudio' });
        const video = ytdl(url, { quality: 'highestvideo' });

        console.log(STREAM_MSG + 'Now Downloading: ' + info.videoDetails.title);
        title = help.replace(info.videoDetails.title);

        if(!fs.existsSync('./bin'))
          fs.mkdirSync('./bin'); 
        path = `./bin/${title}.mp4`;
        help.deleteIfExists(path);
    
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
          resolve(path);
        });
        ffmpegProcess.on('error', (err) => {
          reject(err);
        })
      
        // Link streams
        audio.pipe(ffmpegProcess.stdio[4]);
        video.pipe(ffmpegProcess.stdio[5]);    
      });
    }catch(err){
      console.error(STD_MSG, "Error during HD download: ", err);
      reject(err);
    }
   });
}


/**
 * Download youtube video in highest quality available for Powerclip script
 * @param {string} url 
 * @param {int} index 
 * @returns {string} relative path of downloaded video
 */
exports.downloadHDScript = function(url, index){
  !(index==null)? null:index=00;
  let path = `${OUTPUT_PATH}out${index}.mp4`;

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

  help.deleteIfExists(path);

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

    return path;
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

/**
 * Creates a shortened video of the given path for specified time & starting interval
 * @param {string} inputPath path of mp4 video to manipulate
 * @param {int} startTime index to start new video in seconds
 * @param {int} length duration of new video in seconds
 */
exports.clipVideo = async function (inputPath, startTime=0, length=15) {
  return await new Promise((resolve, reject) => {
    let title = inputPath.slice(inputPath.indexOf(OUTPUT_PATH) + OUTPUT_PATH.length, inputPath.indexOf('.mp4'));
    let outputPath = `${OUTPUT_PATH}clip${title}.mp4`;

    // console.log(STD_MSG, `Clipping from path : ${inputPath}`);
    // console.log(STD_MSG, "title: ", title);
    help.deleteIfExists(outputPath);

    try{
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
    
      ffmpegProcess.on('message', (msg) => {
        console.log(STD_MSG, 'message from clipping of ', inputPath, ': ', msg);
      });
      ffmpegProcess.on('close', () => {
        console.log(STD_MSG, 'clipping done for path: ', outputPath);
        resolve(outputPath);
      });
    }catch(err){
      console.error(err);
      reject(err);
    }
  }); 
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

//Combines two clips together
exports.combineTwo = async function(){
  await help.waitTillReady();

  const outputPath = 'bin/output.mp4';
  help.deleteIfExists(outputPath);

  const v = videos.getAll();
  const inputParams = [];
  var filterCmd = '';
  for(idx in v){
    inputParams.push('-i',`${v[idx].clipPath}`);
    filterCmd += `[${idx}:v]scale=1920:1080:force_original_aspect_ratio=decrease:eval=frame,pad=1920:1080:-1:-1:color=black,setsar=1[v${idx}],`;
    //console.log('input params: \n', inputParams);
    //console.log('filterCmd: \n', filterCmd);
  }
  // adding final concat filter mapping
  for(idx in v){
    filterCmd += `[v${idx}] [${idx}:a] `;
  }
  filterCmd += `concat=n=${v.length}:v=1:a=1 [v] [a]`;

  //console.log(filterCmd);

  const params = [
    // expanding clip paths to be combined
    ...inputParams,
    '-filter_complex', filterCmd,
    '-map', '[v]',
    '-map', '[a]',
    '-vsync', '2',
    outputPath
  ]

  //console.log('params: \n',params);

  const combineStream = cp.spawn(ffmpeg, params);
  combineStream.on('message', (msg) => {
    console.log(STD_MSG, 'combining videos msg: ', msg);
  });
  combineStream.on('close', (msg) => {
    console.log(STD_MSG, 'combining \'closed\' msg: ', msg);
  });
  combineStream.on('error', (msg) => {
    console.log(STD_MSG, 'combining \'error\' msg: ', msg);
  })
}

//Combine array of file together w/ given filepaths
exports.combine = async function(filepaths, outFileName){
  return await new Promise((resolve, reject) => {
    const outputPath = `./bin/${outFileName}.mp4`;
    help.deleteIfExists(outputPath);

    const inputParams = [];
    var filterCmd = '';
    for(idx in filepaths){
      inputParams.push('-i',`${filepaths[idx]}`);
      filterCmd += `[${idx}:v]scale=1920:1080:force_original_aspect_ratio=decrease:eval=frame,pad=1920:1080:-1:-1:color=black,setsar=1[v${idx}],`;
    }
    // adding final concat filter mapping
    for(idx in filepaths){
      filterCmd += `[v${idx}] [${idx}:a] `;
    }
    filterCmd += `concat=n=${filepaths.length}:v=1:a=1 [v] [a]`;
    //console.log(filterCmd);

    const params = [
      // expanding clip paths to be combined
      ...inputParams,
      '-filter_complex', filterCmd,
      '-map', '[v]',
      '-map', '[a]',
      '-vsync', '2',
      outputPath
    ];
    //console.log('params: \n',params);

    const combineStream = cp.spawn(ffmpeg, params);
    combineStream.stdout.on('data', (data) => {
      console.log(STD_MSG, 'combining stdout data: ', data);
    });
    combineStream.on('error', (err) => {
      reject(err);
    });
    combineStream.on('close', (msg) => {
      if(msg === 0){
        resolve(outputPath);
      }else{
        console.error(STD_MSG, 'Error combining video');
        reject();
      }
    });  
  });
}