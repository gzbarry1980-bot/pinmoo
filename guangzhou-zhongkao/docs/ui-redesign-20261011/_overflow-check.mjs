// 响应式溢出检查：360/390/430/1440 宽度下检测横向溢出。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const PW = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 8139;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(PORT, r));

const { chromium } = (await import(pathToFileURL(PW).href)).default;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const widths = [360, 390, 430, 1440];
const pages = ['/', '/verify/?new=1', '/schools/', '/my/'];
const results = [];

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  for (const url of pages) {
    await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => {
      const w = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
      return { viewport: window.innerWidth, docWidth: w, overflow: w > window.innerWidth + 1 };
    });
    results.push({ width, url, ...overflow });
  }
  await context.close();
}
await browser.close();
server.close();

const lines = ['响应式溢出检查结果', `时间: ${new Date().toISOString()}`, ''];
for (const r of results) {
  lines.push(`${r.width}px ${r.url}: viewport=${r.viewport} docWidth=${r.docWidth} ${r.overflow ? '⚠️ 溢出' : '✓ 正常'}`);
}
const anyOverflow = results.some(r => r.overflow);
lines.push('', anyOverflow ? '存在横向溢出，需进一步处理。' : '所有宽度无横向溢出。');
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'overflow-log.txt');
fs.writeFileSync(out, lines.join('\n'));
console.log(lines.join('\n'));
