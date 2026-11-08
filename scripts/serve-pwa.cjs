/** Minimal localhost preview with a same-origin ADSB.lol API bridge. Node 18+. */
'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../dist');
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};
let handler;
async function handleAPI(req, res) {
  handler ||= import(pathToFileURL(path.resolve(__dirname, '../functions/api/aircraft.js')).href)
    .then(mod => mod.onRequestGet);
  const proxy = await handler;
  const result = await proxy({ request: new Request(`http://localhost:${port}${req.url}`) });
  res.writeHead(result.status, Object.fromEntries(result.headers));
  res.end(Buffer.from(await result.arrayBuffer()));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (url.pathname === '/api/aircraft') {
      if (req.method !== 'GET') {res.writeHead(405);res.end();return;}
      await handleAPI(req, res);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {res.writeHead(405);res.end();return;}
    const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const absolute = path.resolve(root, '.' + rel);
    if (!absolute.startsWith(root + path.sep)) {res.writeHead(403);res.end();return;}
    const body = await fs.readFile(absolute);
    res.writeHead(200, {
      'Content-Type': types[path.extname(absolute)] || 'application/octet-stream',
      'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500);
    res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Nachthimmel v2 PWA + ADSB.lol Proxy: http://localhost:${port}/`);
});
