import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const agentDir = path.join(root, 'dist', 'agent');
const failures = [];

async function read(filename) {
  return fs.readFile(path.join(agentDir, filename), 'utf8').catch(() => '');
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const index = await read('index.html');
expect(index.includes('<link rel="canonical" href="https://agent.pinmoo.top/"'), 'canonical 不是 agent.pinmoo.top');
expect(index.includes('<meta property="og:url" content="https://agent.pinmoo.top/"'), 'og:url 不是 agent.pinmoo.top');
expect(index.includes('href="https://pinmooconsulting.com/"'), '返回官网链接未使用 .com 中文首页绝对地址');
expect(index.includes('./app.js?'), 'index.html 缺少智能体脚本');
expect(index.includes('./styles.css?'), 'index.html 缺少智能体样式');

for (const filename of ['app.js', 'styles.css', 'favicon.svg', '404.html', 'robots.txt', 'sitemap.xml']) {
  const stat = await fs.stat(path.join(agentDir, filename)).catch(() => null);
  expect(Boolean(stat?.isFile()), `缺少 ${filename}`);
}

const robots = await read('robots.txt');
expect(robots.includes('Sitemap: https://agent.pinmoo.top/sitemap.xml'), 'robots.txt sitemap 不正确');
const sitemap = await read('sitemap.xml');
expect(sitemap.includes('<loc>https://agent.pinmoo.top/</loc>'), 'agent sitemap 不正确');

if (failures.length) {
  console.error(`Agent 构建检查失败，共 ${failures.length} 项：`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Agent 构建检查通过：dist/agent');
