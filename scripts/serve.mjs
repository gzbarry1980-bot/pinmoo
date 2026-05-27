import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 5173);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8']
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const resolved = path.resolve(root, '.' + decoded);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  try {
    const decoded = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = safePath(req.url || '/');
    if (!filePath) throw new Error('Invalid path');
    let stat = await fs.stat(filePath).catch(() => null);
    if (!stat) {
      const publicPath = path.resolve(root, 'public', '.' + decoded);
      if (publicPath.startsWith(path.resolve(root, 'public'))) {
        filePath = publicPath;
        stat = await fs.stat(filePath).catch(() => null);
      }
    }
    if (stat && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    if (!stat && !path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
      stat = await fs.stat(filePath).catch(() => null);
      if (!stat) filePath = path.join(root, 'index.html');
    }
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': types.get(path.extname(filePath)) || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log('PINMOO site running at http://localhost:' + port + '/');
});
