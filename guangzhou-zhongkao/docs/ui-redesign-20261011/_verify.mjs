// 回归验证：检查关键页面无控制台错误，关键元素可交互。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const PW = 'C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 8138;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'verify-log.txt');

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
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`PAGEERROR: ${e.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`); });

const checks = [];
function check(name, cond, detail) { checks.push({ name, ok: cond, detail }); }

// 1. 首页
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1000);
const homeCards = await page.locator('.home-start-option').count();
check('首页 4 张入口卡', homeCards === 4, `实际 ${homeCards}`);
const firstCardHref = await page.locator('.home-start-option').first().getAttribute('href');
check('首页入口卡有 href', !!firstCardHref, firstCardHref);

// 2. verify 页
await page.goto(`http://127.0.0.1:${PORT}/verify/?new=1`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1200);
const steps = await page.locator('.workflow-steps button').count();
check('求证版步骤数为 3', steps === 3, `实际 ${steps}`);
const primaryCtas = await page.locator('#volunteerForm .form-actions .button-primary, #volunteerForm .form-actions .primary-button').count();
check('志愿表只有一个主 CTA', primaryCtas === 1, `实际 ${primaryCtas}`);

// 3. 学校列表
await page.goto(`http://127.0.0.1:${PORT}/schools/`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1200);
const schoolCards = await page.locator('.library-card').count();
check('学校列表有学校卡', schoolCards > 0, `实际 ${schoolCards}`);
const mainLinks = await page.locator('.library-card .school-card-main').count();
check('学校卡主资料区可点击', mainLinks === schoolCards, `主链接 ${mainLinks} / 卡 ${schoolCards}`);

// 4. 学校详情
const firstId = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/schools.json'), 'utf8'))[0].id;
await page.goto(`http://127.0.0.1:${PORT}/schools/detail/?id=${firstId}`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1200);
const backBtn = await page.locator('#returnToSchools, #returnSchoolContext').count();
check('学校详情有返回按钮', backBtn >= 1, `实际 ${backBtn}`);

// 5. 我的/解锁
await page.goto(`http://127.0.0.1:${PORT}/my/`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(800);
const activeTab = await page.locator('.mobile-nav a[aria-current="page"]').count();
check('底部导航有高亮当前页', activeTab === 1, `实际 ${activeTab}`);

await browser.close();
server.close();

const lines = [
  'UI 改版回归验证结果',
  `时间: ${new Date().toISOString()}`,
  `页面错误/控制台错误: ${errors.length}`,
  ...errors,
  '',
  '检查项:',
  ...checks.map(c => `${c.ok ? '✓' : '✗'} ${c.name}${c.ok ? '' : ` (${c.detail})`}`),
  '',
  `通过: ${checks.filter(c => c.ok).length} / ${checks.length}`
];
fs.writeFileSync(OUT, lines.join('\n'));
console.log(lines.join('\n'));
