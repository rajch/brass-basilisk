'use strict';

import bt from './buildtools.mjs';

const args = process.argv.join(' ');

const sampleRegExp = /\s--sample(\s|$)/;

if(args.match(sampleRegExp)) {
    bt.buildSample();
    process.exit(0);
}

const formatjsRegExp = /\s--formatjs(\s|$)/;
const releaseRegExp = /\s--release(\s|$)/;

const release = !args.match(releaseRegExp);

if(args.match(formatjsRegExp)) {
    bt.buildFormatJS(release);
    process.exit(0);
}

bt.buildCombinedHTML(release);
