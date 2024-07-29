'use strict';

import bt from './buildtools.mjs';

const args = process.argv.join(' ');

const sampleRegExp = /\s--sample(\s|$)/;
const releaseRegExp = /\s--release(\s|$)/;
// Minify if '--release' option present
const release = args.match(releaseRegExp) ? true : false;

if(args.match(sampleRegExp)) {
    bt.buildSample(release);
    process.exit(0);
}

const formatjsRegExp = /\s--formatjs(\s|$)/;

if(args.match(formatjsRegExp)) {
    bt.buildFormatJS(release);
    process.exit(0);
}

bt.buildCombinedHTML(release);
