'use strict';

import { readFileSync, writeFileSync } from 'fs';
import minifyHTML from '@minify-html/node';


const htmlOutputFileName = (minimize) => {
    return minimize ? 'out/combined.html' : 'out/combined-debug.html';
}

const minify = (source) => {
    return minifyHTML.minify(
        Buffer.from(source),
        {
            minify_css: true,
            minify_js: true,
            keep_closing_tags: true
        }
    ).toString('utf-8')
}

const buildCombinedHTML = (minimize) => {
    const outputFileName = htmlOutputFileName(minimize);
    console.log(`Building combined HTML file:${outputFileName}`);

    // Begin with HTML
    const templateFile = readFileSync('assets/template.html', 'utf8');
    let compiledStr = templateFile + "";

    // Add CSS and JS
    const cssFile = readFileSync('assets/style.css', 'utf8');
    const jsFile = readFileSync("src/gd.js", 'utf8');
    compiledStr = compiledStr
        .replace(
            '<link rel="stylesheet" href="style.css">',
            '<style>\n' + cssFile + '\n</style>'
        ).replace(
            '<script src="../src/gd.js"></script>',
            '<script>\n' + jsFile + '\n</script>'
        );

    if (minimize) {
        compiledStr = minify(compiledStr)
    }
    // Write Output 
    writeFileSync(outputFileName, compiledStr);
    console.log('Combined HTML file built.')
}

const buildFormatJS = (minimize) => {
    console.log('Building format.js...')

    buildCombinedHTML(minimize);

    // Read manifest from template file
    const manifestFile = readFileSync("assets/formatManifest.json", 'utf8');
    const manifest = JSON.parse(manifestFile);

    // Insert combined html template (debug or release) into manifest
    const inputFileName = htmlOutputFileName(minimize);
    const inputFile = readFileSync(inputFileName, 'utf8');
    manifest.source = inputFile;

    // Create format.js with manifest
    let format = "window.storyFormat(" + JSON.stringify(manifest) + ");";
    writeFileSync('out/format.js', format);

    console.log('format.js built.')
}

const buildSample = (minimize) => {
    console.log('Building sample.html...')

    buildCombinedHTML(minimize);
    const htmlInputFileName = htmlOutputFileName(minimize);

    // The sample combines the combined HTML file with the sample 
    // data.
    const combinedHTMLFile = readFileSync(htmlInputFileName, 'utf8');
    const testDataFile = readFileSync("assets/sampledata.html", 'utf8');
    const compiledStr = combinedHTMLFile
        .replace('{{STORY_NAME}}', 'Sample Story')
        .replace('{{STORY_DATA}}', testDataFile);

    writeFileSync('out/sample.html', compiledStr);
    console.log('sample.html built.')
}

export default { buildCombinedHTML, buildFormatJS, buildSample };