'use strict';

import { watch } from 'chokidar';
import server from 'alive-server';

const watcher = watch(	[
		'src/*.js',
		'assets/template.html',
		'assets/style.css',
		'assets/sampledata.html'
	],
	{
		disableGlobbing: false,
		awaitWriteFinish: true
	}
);

import bt from './buildtools.mjs';

console.log('Setting up watcher...')
watcher.on('change', async () => {
	await bt.buildSample(false);
});

const es5OptPos = process.argv.findIndex((value) => value.toLowerCase() === '--es5');
const transpileToES5 = es5OptPos > -1 ? true : false;

console.log('Building sample.html...')
await async function() {
	await bt.buildSample(false, transpileToES5);
}();

var params = {
	port: 8181, // Set the server port. Defaults to 8080.
	host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
	root: "out/", // Set root directory that's being served. Defaults to cwd.
	open: false, // When false, it won't load your browser by default.
	ignore: 'node_modules,scripts', // comma-separated string for paths to ignore
	file: "", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
	wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
	// mount: [['/components', './node_modules']], // Mount a directory to a route.
	logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
	// middleware: [function(req, res, next) { next(); }], // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
	mimetypes: { 'application/wasm': ['.wasm'], 'text/css': ['.css'] }, // Set extended MIME types,
	index: 'sample.html' // By default send supports "index.html" files, to disable this set false or to supply a new index pass a string or an array in preferred order 
};

console.log('Development server ready.')
server.start(params);