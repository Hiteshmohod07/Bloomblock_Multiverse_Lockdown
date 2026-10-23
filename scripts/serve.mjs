import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const builtUI = new URL('../web-dist/index.html', import.meta.url);
const root = fileURLToPath(new URL(existsSync(builtUI) ? '../web-dist/' : '../', import.meta.url));
let port = Number(process.env.PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
const firstPort = port;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const path = resolve(root, relative);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) {
      response.writeHead(403).end('Forbidden'); return;
    }
    const file = await readFile(path);
    const headers = { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
    const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, file.length - Number(range[2]));
      const end = range[1] ? Math.min(file.length - 1, range[2] ? Number(range[2]) : file.length - 1) : file.length - 1;
      if (start > end || start >= file.length) { response.writeHead(416, { 'Content-Range': `bytes */${file.length}` }).end(); return; }
      response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${file.length}` });
      response.end(file.subarray(start, end + 1));
    } else {
      response.writeHead(200, { ...headers, 'Content-Length': file.length }); response.end(file);
    }
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    if (process.env.PORT === undefined && port < firstPort + 10) {
      console.log(`Port ${port} is already in use; trying ${port + 1}.`);
      port += 1;
      server.listen(port, '127.0.0.1');
      return;
    }
    console.error(`Port ${port} is already in use. Open the existing game, stop its server with Ctrl+C, or choose another PORT.`);
  } else {
    console.error(`Unable to start Bloomlock: ${error.message}`);
  }
  process.exitCode = 1;
});
server.on('listening', () => console.log(`Bloomlock is playable at http://localhost:${port}`));
server.listen(port, '127.0.0.1');
