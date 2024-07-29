'use strict';

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import minifyHTML from '@minify-html/node';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

const ensureOutDirectory = () => {
    const dirPath = 'out/'
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath);
        console.log('out/ directory created.')
    }
}

const deleteOutputFile = (outputFileName) => {
    if (existsSync(outputFileName)) {
        unlinkSync(outputFileName)
        console.log(`File:${outputFileName} deleted.`);
    } else {
        console.log(`File:${outputFileName} does not exist.`);
    }
}

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
    ).toString('utf-8');
}

const buildCombinedJS = async (transpileToES5) => {
    const outputFileName = 'out/gd.js';
    console.log(`Building combined JS file:${outputFileName}`);

    const pluginarr = transpileToES5
        ? [resolve(), babel({ babelHelpers: 'bundled' })]
        : [];

    console.log('Rolling up...');
    let bundle = await rollup({
        input: 'src/gd.js',
        plugins: pluginarr
    });

    console.log(bundle.watchFiles);

    console.log(`Writing ${outputFileName}...`);
    await bundle.write({
        file: 'out/gd.js',
        format: 'cjs'
    });

    await bundle.close();
}

const buildCombinedHTML = async (minimize, transpileToES5) => {
    const outputFileName = htmlOutputFileName(minimize);
    console.log(`Building combined HTML file:${outputFileName}`);

    ensureOutDirectory();

    // Combine Javascript
    await buildCombinedJS(transpileToES5);

    // Begin with HTML
    const templateFile = readFileSync('assets/template.html', 'utf8');
    let compiledStr = templateFile + "";

    // Add CSS
    const cssFile = readFileSync('assets/style.css', 'utf8');
    // Add combined JS
    const jsFile = readFileSync("out/gd.js", 'utf8');
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

const cleanCombinedHTML = (release) => {
    let outputFileName = htmlOutputFileName(release);
    console.log(`Deleting combined HTML file:${outputFileName}`);
    deleteOutputFile(outputFileName)
    outputFileName = 'out/gd.js';
    console.log(`Deleting combined JS file:${outputFileName}`);
    deleteOutputFile(outputFileName)
}

const buildFormatJS = async (minimize, transpileToES5) => {
    console.log('Building format.js...')

    await buildCombinedHTML(minimize, transpileToES5);

    // Read manifest from template file
    const manifestFile = readFileSync("assets/formatManifest.json", 'utf8');
    const manifest = JSON.parse(manifestFile);

    // Insert combined html file (debug or release) into manifest
    const inputFileName = htmlOutputFileName(minimize);
    const inputFile = readFileSync(inputFileName, 'utf8');
    manifest.source = inputFile;

    // Create format.js with manifest
    let format = "window.storyFormat(" + JSON.stringify(manifest) + ");";
    writeFileSync('out/format.js', format);

    console.log('format.js built.');
    // Delete combined html file generated for this build
    cleanCombinedHTML(minimize);
}

const cleanFormatJs = (release) => {
    deleteOutputFile('out/format.js');
}

const buildSample = async (minimize, transpileToES5) => {
    console.log('Building sample.html...')

    await buildCombinedHTML(minimize, transpileToES5);
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
    // Delete combined html file generated for this build
    cleanCombinedHTML(minimize);
}

const cleanSample = (release) => {
    deleteOutputFile('out/sample.html');
}

const cleanAll = (release) => {
    cleanFormatJs(release);
    cleanSample(release);
    cleanCombinedHTML(release);
}

export default {
    buildCombinedHTML, cleanCombinedHTML,
    buildFormatJS, cleanFormatJs,
    buildSample, cleanSample,
    cleanAll
};