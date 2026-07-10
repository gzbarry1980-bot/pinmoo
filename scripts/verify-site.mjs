import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { metaTagsForRoute, routeMeta } from '../src/data/seo.js';
import { SITE } from '../src/data/site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const failures = [];
let htmlCount = 0;
let linkCount = 0;

function fail(message) {
  failures.push(message);
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function hrefToPath(href, basePath = '/') {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
  try {
    const url = new URL(href, SITE.domain + basePath);
    if (url.origin !== SITE.domain) return null;
    return decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
}

async function localTargetExists(pathname) {
  const clean = pathname.replace(/^\/+/, '');
  const candidates = pathname.endsWith('/')
    ? [path.join(dist, clean, 'index.html')]
    : [path.join(dist, clean), path.join(dist, clean, 'index.html')];
  for (const candidate of candidates) {
    const stat = await fs.stat(candidate).catch(() => null);
    if (stat?.isFile()) return true;
  }
  return false;
}

for (const meta of routeMeta) {
  const target = path.join(dist, meta.file);
  const html = await fs.readFile(target, 'utf8').catch(() => null);
  if (!html) {
    fail(`缺少页面文件: ${meta.file}`);
    continue;
  }
  htmlCount += 1;
  const expected = metaTagsForRoute(meta);
  if (count(html, /<title>[\s\S]*?<\/title>/gi) !== 1) fail(`${meta.file}: title 数量不是 1`);
  if (count(html, /<link rel="canonical"/gi) !== 1) fail(`${meta.file}: canonical 数量不是 1`);
  if (!html.includes(`<link rel="canonical" href="${expected.canonical}" />`)) fail(`${meta.file}: canonical 不正确`);
  if (!html.includes('<meta charset="UTF-8"')) fail(`${meta.file}: 缺少 UTF-8 charset`);
  if (!html.includes('<meta name="description"')) fail(`${meta.file}: 缺少 description`);
  if (!meta.aiTool && count(html, /<h1(?:\s[^>]*)?>/gi) !== 1) fail(`${meta.file}: H1 数量不是 1`);
  const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || '';
  if (meta.indexable === false && !robots.includes('noindex')) fail(`${meta.file}: 非索引页应为 noindex`);
  if (meta.indexable !== false && (robots.includes('noindex') || robots.includes('nofollow'))) fail(`${meta.file}: 可索引页包含 noindex/nofollow`);

  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch {
      fail(`${meta.file}: JSON-LD 无法解析`);
    }
  }

  for (const match of html.matchAll(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/gi)) {
    const pathname = hrefToPath(match[1], meta.path);
    if (pathname && !(await localTargetExists(pathname))) fail(`${meta.file}: hreflang 指向不存在页面 ${pathname}`);
  }

  for (const match of html.matchAll(/href="([^"]+)"/gi)) {
    const pathname = hrefToPath(match[1], meta.path);
    if (!pathname) continue;
    linkCount += 1;
    if (!(await localTargetExists(pathname))) fail(`${meta.file}: 内链不存在 ${pathname}`);
  }
}

const sitemap = await fs.readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const pageUrls = sitemapUrls.filter((url) => !url.includes('/assets/'));
const expectedSitemapUrls = routeMeta
  .filter((meta) => meta.sitemap !== false && meta.indexable !== false && !meta.duplicate)
  .map((meta) => metaTagsForRoute(meta).canonical);
if (new Set(pageUrls).size !== pageUrls.length) fail('sitemap 包含重复 URL');
if (pageUrls.length !== expectedSitemapUrls.length) fail(`sitemap 页面数不正确: ${pageUrls.length}/${expectedSitemapUrls.length}`);
for (const url of pageUrls) {
  if (!url.startsWith(SITE.domain + '/')) fail(`sitemap 出现其他域名: ${url}`);
  if (/\/(?:llms(?:-full)?\.txt|ai\.txt|ai-context\.json|pinmoo-profile\.json)$/.test(url)) fail(`sitemap 不应包含机器资料文件: ${url}`);
}

const robots = await fs.readFile(path.join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('User-agent: OAI-SearchBot')) fail('robots.txt 缺少 OAI-SearchBot');
if (!robots.includes(`Sitemap: ${SITE.domain}/sitemap.xml`)) fail('robots.txt sitemap 域名不正确');

const notFound = await fs.readFile(path.join(dist, '404.html'), 'utf8');
if (!notFound.includes('content="noindex, follow"')) fail('404 页面缺少 noindex');

for (const filename of ['ai-context.json', 'pinmoo-profile.json']) {
  const content = await fs.readFile(path.join(dist, filename), 'utf8');
  try {
    JSON.parse(content);
  } catch {
    fail(`${filename} 不是有效 JSON`);
  }
}

const securityHeaders = await fs.readFile(path.join(root, 'deploy', 'nginx', 'pinmoo-security-headers.conf'), 'utf8');
for (const header of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Permissions-Policy']) {
  if (!securityHeaders.includes(header)) fail(`Nginx 安全配置缺少 ${header}`);
}

if (failures.length) {
  console.error(`站点检查失败，共 ${failures.length} 项：`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`站点检查通过：${htmlCount} 个页面，${pageUrls.length} 个 sitemap URL，${linkCount} 条站内链接。`);
