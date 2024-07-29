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
const cleanRegExp = /\s--clean(\s|$)/;

const combineonlyRegExp = /\s--combineonly(\s|$)/;
if (args.match(combineonlyRegExp)) {
    if (args.match(cleanRegExp)) {
        bt.cleanCombinedHTML(release);
    } else {
        bt.buildCombinedHTML(release);
    }
    process.exit(0);
}

const sampleRegExp = /\s--sample(\s|$)/;
if (args.match(sampleRegExp)) {
    if (args.match(cleanRegExp)) {
        bt.cleanSample(release);
    } else {
        bt.buildSample(release);
    }
    process.exit(0);
}

if (args.match(cleanRegExp)) {
    bt.cleanFormatJs(release);
} else {
    bt.buildFormatJS(release);
}
