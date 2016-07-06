const config = require('./configs/test');

console.log(config.path.join('src/test/resources', 'anno404.json'));
var annotationSets = config.fs.readFileSync(config.path.join('/Users/AKB/Dropbox/BitBucket/NoFrameNet/src/test/resources', 'anno404.json'));
//var annotationSets = configs.fs.readFileSync('test');
console.log(annotationSets);

var json = JSON.parse(annotationSets);
console.log(json);
