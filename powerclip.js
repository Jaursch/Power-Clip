const s = require('./service');
const prompt = require('prompt-sync')();

console.log("\nWelcome to PowerClip! Let's get this party started!\n");

const url = prompt('Enter youtube url: ');

console.log('validating url: ' + url);

const validated = s.validate(url);

validated == true ? console.log('good url!') : console.log('bad url!');

if (validated == true) {
  const ytInfoFile = prompt('Enter a filename to store YT info: ');
  s.info(url, ytInfoFile);

}
