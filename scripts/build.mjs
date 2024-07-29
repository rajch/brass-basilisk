'use strict';

import bt from './buildtools.mjs';

const args = process.argv.join(' ');

const cleanallRegExp = /\s--cleanall(\s|$)/;
if(args.match(cleanallRegExp)) {
    bt.cleanAll(true);
    bt.cleanAll(false);
    process.exit(0);
}

const releaseRegExp = /\s--release(\s|$)/;
// Minify if '--release' option present
const release = args.match(releaseRegExp) ? true : false;
const es5regexp = /\s--es5(\s|$)/;
const transpileToES5 = args.match(es5regexp) ? true : false;

const cleanRegExp = /\s--clean(\s|$)/;

const combineonlyRegExp = /\s--combineonly(\s|$)/;
if (args.match(combineonlyRegExp)) {
    if (args.match(cleanRegExp)) {
        bt.cleanCombinedHTML(release);
    } else {
        await bt.buildCombinedHTML(release, transpileToES5);
    }
    process.exit(0);
}

const sampleRegExp = /\s--sample(\s|$)/;
if (args.match(sampleRegExp)) {
    if (args.match(cleanRegExp)) {
        bt.cleanSample(release);
    } else {
        await bt.buildSample(release, transpileToES5);
    }
    process.exit(0);
}

if(release && transpileToES5) {
    console.error('Currently, you cannot create a minimized ES5 story format. Please use "build-es5" instead.');
    process.exit(1);
}

if (args.match(cleanRegExp)) {
    bt.cleanFormatJs(release);
} else {
    await bt.buildFormatJS(release, transpileToES5);
}
