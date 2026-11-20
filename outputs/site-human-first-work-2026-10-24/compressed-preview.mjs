import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
const root = path.resolve('dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!target.startsWith(root + path.sep) && target !== root) throw Error('Invalid path');
    const stat = await fs.stat(target);
    const file = stat.isDirectory() ? path.join(target, 'index.html') : target;
    const type = mime[path.extname(file)] || 'application/octet-stream';
    let body = await fs.readFile(file);
    const compress = body.length >= 1024 && /text|javascript|json|svg/.test(type) && /gzip/.test(request.headers['accept-encoding'] || '');
    const headers = { 'Content-Type': type, Vary: 'Accept-Encoding' };
    if (compress) { body = gzipSync(body); headers['Content-Encoding'] = 'gzip'; }
    response.writeHead(200, headers); response.end(body);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(5192, '127.0.0.1', () => console.log('Compressed audit preview: http://localhost:5192'));
