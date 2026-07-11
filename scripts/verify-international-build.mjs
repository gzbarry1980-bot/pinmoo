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

const sitemap = await read('sitemap.xml');
const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
expect(sitemapUrls.length >= 10, 'international sitemap has too few URLs');
expect(sitemapUrls.every((url) => url.startsWith('https://pinmooconsulting.com/')), 'international sitemap contains another domain');
expect(sitemapUrls.every((url) => !url.includes('/en/')), 'international sitemap contains legacy /en/ URLs');

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
