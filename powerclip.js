const s = require('./service');
const prompt = require('prompt-sync')();

console.log("\nWelcome to PowerClip! Let's get this party started!\n");

var url = prompt('Enter youtube url: ');

//test url
url? null: url = 'https://www.youtube.com/watch?v=nbXgHAzUWB0';

console.log('validating url: ' + url);

const validated = s.validate(url);
validated == true ? console.log('good url!') : console.log('bad url!');

if (validated == true) {

  const filepath = s.info(url);
  console.log('Video\'s data can be found at: ' + filepath);

  s.downloadSingle(url);
}
