'use strict';

import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws'; // The only lightweight dep needed for reload, or skip completely
import { watch } from 'chokidar';
import bt from './buildtools.mjs';

const args = process.argv.join(' ');
const transpileToES5 = /\s--es5(\s|$)/.test(args);

// 1. Core Native HTTP Server
const PORT = 8181;
const server = http.createServer((req, res) => {
	// Always serve out/sample.html for your Twine testing environment
	const filePath = path.join('out', 'sample.html');
	
	fs.readFile(filePath, 'utf8', (err, content) => {
		if (err) {
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('Error loading sample.html. Did it build successfully?');
			return;
		}
		
		// Inject a tiny, clean client-side reload script on the fly
		const injectScript = `
			<script>
				const ws = new WebSocket('ws://' + location.host);
				ws.onmessage = (msg) => { if (msg.data === 'reload') location.reload(); };
			</script>
		`;
		
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(content + injectScript);
	});
});

// 2. Ultra-lightweight WebSocket server for live reload trigger
const wss = new WebSocketServer({ server });
let sockets = [];
wss.on('connection', (ws) => {
	sockets.push(ws);
	ws.on('close', () => sockets = sockets.filter(s => s !== ws));
});

// 3. File Watcher & Orchestration
const watcher = watch(
	['src/*.js', 'assets/template.html', 'assets/style.css', 'assets/sampledata.html'],
	{ awaitWriteFinish: true }
);

console.log('Performing baseline build...');
await bt.buildSample(false, transpileToES5);

watcher.on('change', async () => {
	console.log('Change detected! Recompiling...');
	await bt.buildSample(false, transpileToES5);
	
	// Trigger browser refresh via websockets
	sockets.forEach(ws => ws.send('reload'));
});

server.listen(PORT, '0.0.0.0', () => {
	console.log(`Development server ready at http://localhost:${PORT}`);
});
