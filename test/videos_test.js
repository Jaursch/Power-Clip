const videos = require('../videos');
const s = require('../service');
const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');
const concat = require('ffmpeg-concat');

const STD_MSG = '[MSG videos_test] ';

function print_videos(){
  console.log(`printing videos: \n ${JSON.stringify(videos.getAll(),1)}\n`);
}

function validate_videos(){
  console.log('Validating video urls');
  for(let i=0;i<videos.count(); i++){
    s.validate(videos.getUrl(i))? console.log(`Video #${i+1} valid!`): console.log(`Video #${i+1} not valid`);
  }
}

function testTimer(){
  console.log('Hello');
  setTimeout(() => { console.log('World');}, 2000);
}

console.log('Starting Videos Test\n\n');
print_videos();

console.log('creating Self Care video object\n');
videos.create('https://www.youtube.com/watch?v=SsKT0s5J8ko', '0:26', '60');

validate_videos();


//Testing Timer
testTimer();
console.log('Goodbye cruel world');

// testing out the combination of two hard-coded clips. 
// expected:  - that list has path names of existing clips
//            - command is made from root of Power-Clip
const listpath = 'list.txt';
module.exports.testCombine = async function(){
  try{
    const testStream = cp.spawn(ffmpeg, [
      '-i', './bin/clip0.mp4', '-i', './bin/clip1.mp4',
      '-filter_complex', '[0:v]scale=1920:1080:force_original_aspect_ratio=decrease:eval=frame,pad=1920:1080:-1:-1:color=black,setsar=1[v0],[1:v]scale=1920:1080:force_original_aspect_ratio=decrease:eval=frame,pad=1920:1080:-1:-1:color=black,setsar=1[v1],[v0] [0:a] [v1] [1:a] concat=n=2:v=1:a=1 [v] [a]',
      '-map', '[v]',
      '-map', '[a]',
      '-vsync', '2',
      './bin/output.mp4',
    ],
    {stdio: [process.stdin, process.stdout, process.stderr]}
    );
    testStream.stdout.on('data', function(data){
      console.log(data.toString());
    })
    testStream.on('close', (msg) => {
      console.log('from testStream: ', msg);
    });
    testStream.on('error', (err) =>{
      console.error(err);
    })  
  }catch(err){
    console.error(err);
  }
}
