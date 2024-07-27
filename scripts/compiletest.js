'use strict';

const fs = require('fs');

// Write Sample
const outputHTMLFile = fs.readFileSync("out/output.html", 'utf8');
const testDataFile = fs.readFileSync("assets/sampledata.html", 'utf8');
const compiledStr = outputHTMLFile
    .replace('{{STORY_NAME}}', 'Sample Story')
    .replace('<template>{{STORY_DATA}}</template>', testDataFile);

fs.writeFileSync('out/sample.html', compiledStr);