// 真实截图工具：启动静态服务器 + playwright-core 调用本机 Chrome 截图。
// 用法：node _capture.mjs [outDir]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const PW = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 8137;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2' };

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' ) urlPath = '/index.html';
  // map /verify/ -> /verify/index.html etc.
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise(r => server.listen(PORT, r));
console.log('server up on', PORT);

const { chromium } = (await import(pathToFileURL(PW).href)).default;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

// 取一个有效学校 id
const schools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/schools.json'), 'utf8'));
const firstId = (Array.isArray(schools) ? schools : schools.schools)[0].id;

const pages = [
  ['home', '/'],
  ['verify', '/verify/?new=1'],
  ['schools', '/schools/'],
  ['school-detail', `/schools/detail/?id=${firstId}`],
  ['target', '/target/'],
  ['special-talent', '/special/?mode=talent'],
  ['quota', '/quota/'],
  ['my', '/my/'],
  ['plans', '/plans/'],
  ['unlock', '/unlock/'],
  ['admissions', '/admissions/'],
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  for (const [name, url] of pages) {
    try {
      await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1200); // 等 JS 运行 + 数据渲染
      const file = path.join(OUT, `${name}-${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log('saved', path.basename(file));
    } catch (e) {
      console.log('FAIL', name, vp.name, e.message);
    }
  }
  await context.close();
}
await browser.close();
server.close();
console.log('done');
