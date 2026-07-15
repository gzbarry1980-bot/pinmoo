import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const failures = [];

async function listHtml(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(path.join(directory, entry.name), relativePath));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(relativePath);
  }
  return files;
}

async function read(relativePath) {
  return fs.readFile(path.join(dist, relativePath), 'utf8').catch(() => '');
}

async function exists(relativePath) {
  const stat = await fs.stat(path.join(dist, relativePath)).catch(() => null);
  return Boolean(stat);
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const expectedPages = [
  'index.html',
  'services/index.html',
  'cases/index.html',
  'about/index.html',
  'contact/index.html',
  'zh/index.html',
  'zh/services/index.html',
  'zh/cases/index.html',
  'zh/about/index.html',
  'zh/contact/index.html',
  'china-ecommerce-consulting/index.html'
];

for (const relativePath of expectedPages) {
  expect(await exists(relativePath), `missing ${relativePath}`);
}

for (const relativePath of ['en', 'ai-diagnosis', 'agent', 'insights', 'resources']) {
  expect(!(await exists(relativePath)), `international build should not publish dist/${relativePath}`);
}

const home = await read('index.html');
expect(home.includes('<html lang="en">'), 'international homepage language is not English');
expect(home.includes('<link rel="canonical" href="https://pinmooconsulting.com/"'), 'international homepage canonical is incorrect');
expect(home.includes('Find the Right China E-commerce Growth Constraint'), 'international homepage did not render English content');
expect(!home.includes('href="/en/'), 'international homepage still links to /en/ paths');
expect(home.includes('href="/zh/"'), 'international homepage Chinese switch does not stay on the .com site');
expect(!home.includes('href="https://pinmoo.top/"'), 'international homepage Chinese switch still crosses to pinmoo.top');
expect(home.includes('<link rel="alternate" hreflang="zh-CN" href="https://pinmooconsulting.com/zh/"'), 'international homepage Chinese hreflang is incorrect');
expect(home.includes('<link rel="alternate" hreflang="x-default" href="https://pinmooconsulting.com/"'), 'international homepage x-default is incorrect');

const chineseHome = await read('zh/index.html');
expect(chineseHome.includes('<html lang="zh-CN">'), 'international Chinese homepage language is not zh-CN');
expect(chineseHome.includes('<link rel="canonical" href="https://pinmooconsulting.com/zh/"'), 'international Chinese homepage canonical is incorrect');
expect(chineseHome.includes('href="/zh/services/"'), 'international Chinese homepage does not keep service links on .com');
expect(chineseHome.includes('href="https://pinmooconsulting.com/"'), 'international Chinese homepage English switch is incorrect');
expect(!chineseHome.includes('https://pinmoo.top'), 'international Chinese homepage contains a pinmoo.top cross-domain link');
expect(chineseHome.includes('AI电商经营周报不是自动写总结，而是先统一数据口径'), 'international Chinese homepage is missing the AI report method');
expect(chineseHome.includes('电商店铺有流量但转化率低，应该先检查什么？'), 'international Chinese homepage is missing direct answers');
expect(/"@type"\s*:\s*"FAQPage"/.test(chineseHome), 'international Chinese homepage is missing FAQPage structured data');

const sitemap = await read('sitemap.xml');
const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
expect(sitemapUrls.length >= 10, 'international sitemap has too few URLs');
expect(sitemapUrls.every((url) => url.startsWith('https://pinmooconsulting.com/')), 'international sitemap contains another domain');
expect(sitemapUrls.every((url) => !url.includes('/en/')), 'international sitemap contains legacy /en/ URLs');
expect(sitemapUrls.includes('https://pinmooconsulting.com/zh/'), 'international sitemap is missing the Chinese homepage');

const robots = await read('robots.txt');
expect(robots.includes('Sitemap: https://pinmooconsulting.com/sitemap.xml'), 'international robots sitemap is incorrect');

const htmlFiles = await listHtml(dist);
for (const htmlFile of htmlFiles) {
  const html = await read(htmlFile);
  expect(!html.includes('href="/en/'), `${htmlFile} still links to a legacy /en/ path`);
  for (const match of html.matchAll(/href="(\/[^"?#]*)/g)) {
    const href = match[1];
    if (href.startsWith('/assets/') || href.startsWith('/src/')) continue;
    const cleanPath = href.replace(/^\//, '').replace(/\/$/, '');
    const target = href === '/' ? 'index.html' : path.extname(cleanPath) ? cleanPath : `${cleanPath}/index.html`;
    expect(await exists(target), `${htmlFile} links to missing ${href}`);
  }
}

if (failures.length) {
  console.error(`International build verification failed with ${failures.length} issue(s):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`International build verification passed: ${htmlFiles.length} pages, ${sitemapUrls.length} sitemap URLs.`);
