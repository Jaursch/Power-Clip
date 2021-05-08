const videos = require('../videos');
const s = require('../service');

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
