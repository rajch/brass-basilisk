'use strict';

const fs = require('fs');

// Begin with HTML
const templateFile = fs.readFileSync('assets/template.html', 'utf8');
let compiledStr = templateFile + "";

// Add CSS and JS
const cssFile = fs.readFileSync('assets/style.css', 'utf8');
const jsFile = fs.readFileSync("src/gd.js", 'utf8');
compiledStr = compiledStr
    .replace(
        '<link rel="stylesheet" href="style.css" >',
        '<style>\n' + cssFile + '\n</style>'
    ).replace(
        '<script src="../src/gd.js"></script>',
        '<script>\n' + jsFile + '\n</script>'
    );

// Write Output 
fs.writeFileSync('out/output.html', compiledStr);
