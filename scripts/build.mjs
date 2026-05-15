import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { routeMeta, jsonLdForRoute, metaTagsForRoute } from '../src/data/seo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
await fs.mkdir(dist, { recursive: true });

function fakeNode() {
  return {
    innerHTML: '', hidden: false, style: {}, dataset: {},
    classList: { toggle(){}, add(){}, remove(){}, contains(){ return false; } },
    addEventListener(){}, setAttribute(){}, getAttribute(){ return null; },
    querySelector(){ return fakeNode(); }, querySelectorAll(){ return []; }, closest(){ return fakeNode(); }
  };
}
const bootRoot = fakeNode();
globalThis.document = {
  body: fakeNode(),
  getElementById(id) { return id === 'root' ? bootRoot : fakeNode(); },
  querySelector() { return fakeNode(); },
  querySelectorAll() { return []; }
};
globalThis.window = {
  location: { pathname: '/', hostname: 'pinmooconsulting.com' },
  addEventListener(){},
  scrollY: 0,
  setTimeout,
  performance: globalThis.performance
};
globalThis.IntersectionObserver = class { constructor(){} observe(){} unobserve(){} disconnect(){} };
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 16);
const { renderSite } = await import(pathToFileURL(path.join(root, 'src/static-main.js')).href + '?build=' + Date.now());

async function copy(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) await copy(path.join(src, entry), path.join(dest, entry));
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createFakeNode() {
  return {
    innerHTML: '',
    hidden: false,
    style: {},
    dataset: {},
    classList: { toggle(){}, add(){}, remove(){}, contains(){ return false; } },
    addEventListener(){},
    setAttribute(){},
    getAttribute(){ return null; },
    querySelector(){ return createFakeNode(); },
    querySelectorAll(){ return []; },
    closest(){ return createFakeNode(); }
  };
}

async function prerender(pathname) {
  return renderSite(pathname);
}

function upsertHead(html, meta) {
  const tags = metaTagsForRoute(meta);
  let next = html;
  next = next.replace(/<html lang="[^"]*">/, '<html lang="' + (meta.lang === 'en' ? 'en' : 'zh-CN') + '">');
  next = next.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeHtml(tags.title) + '</title>');
  next = next.replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="' + escapeHtml(tags.description) + '" />');
  next = next.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, '<link rel="canonical" href="' + escapeHtml(tags.canonical) + '" />');
  next = next.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, '<meta property="og:title" content="' + escapeHtml(tags.ogTitle) + '" />');
  next = next.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, '<meta property="og:description" content="' + escapeHtml(tags.ogDescription) + '" />');
  next = next.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, '<meta property="og:url" content="' + escapeHtml(tags.ogUrl) + '" />');
  next = next.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, '<meta property="og:image" content="' + escapeHtml(tags.ogImage) + '" />');
  next = next.replace(/\n\s*<script type="application\/ld\+json" data-seo-jsonld>[\s\S]*?<\/script>/g, '');
  const zhPath = meta.lang === 'en' ? meta.alternatePath : meta.path;
  const enPath = meta.lang === 'en' ? meta.path : (meta.path === '/' ? '/en/' : '/en' + meta.path);
  const extra = [
    '<meta name="robots" content="' + (meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1') + '" />',
    '<meta name="author" content="广州品沐咨询有限公司" />',
    '<meta name="theme-color" content="#1E3A5F" />',
    '<link rel="alternate" hreflang="zh-CN" href="' + escapeHtml(zhPath === '/' ? 'https://pinmooconsulting.com/' : 'https://pinmooconsulting.com' + zhPath.replace(/\/$/, '')) + '" />',
    '<link rel="alternate" hreflang="en" href="' + escapeHtml(enPath === '/en/' ? 'https://pinmooconsulting.com/en/' : 'https://pinmooconsulting.com' + enPath.replace(/\/$/, '')) + '" />',
    '<link rel="alternate" hreflang="x-default" href="https://pinmooconsulting.com/" />',
    '<link rel="alternate" type="text/plain" href="/llms.txt" title="PINMOO 品沐咨询 AI 摘要" />',
    '<link rel="alternate" type="application/json" href="/pinmoo-profile.json" title="PINMOO 品沐咨询结构化品牌资料" />',
    '<script type="application/ld+json" data-seo-jsonld>' + JSON.stringify(jsonLdForRoute(meta)) + '</script>'
  ].join('\n    ');
  if (!next.includes('data-seo-jsonld')) {
    next = next.replace('  </head>', '    ' + extra + '\n  </head>');
  }
  return next;
}

const topLevel = ['index.html', 'services', 'cases', 'about', 'contact', 'public'];
for (const item of topLevel) await copy(path.join(root, item), path.join(dist, item === 'public' ? '' : item));
await copy(path.join(root, 'src/static-main.js'), path.join(dist, 'src/static-main.js'));
await copy(path.join(root, 'src/styles.css'), path.join(dist, 'src/styles.css'));
await copy(path.join(root, 'src/data'), path.join(dist, 'src/data'));

for (const meta of routeMeta) {
  const htmlPath = path.join(dist, meta.file);
  let html;
  try {
    html = await fs.readFile(htmlPath, 'utf8');
  } catch {
    html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
    await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  }
  const rendered = await prerender(meta.path);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*(<script type="module" src="\/src\/static-main\.js"><\/script>)/, () => '<div id="root">' + rendered + '</div>\n    <script type="module" src="/src/static-main.js"></script>');
  html = upsertHead(html, meta);
  await fs.writeFile(htmlPath, html, 'utf8');
}

const today = '2026-05-15';
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  routeMeta.filter((meta) => !meta.noindex).map((meta) => '  <url>\n    <loc>' + metaTagsForRoute(meta).canonical + '</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>' + meta.changefreq + '</changefreq>\n    <priority>' + meta.priority + '</priority>\n  </url>').join('\n') +
  '\n  <url>\n    <loc>https://pinmooconsulting.com/llms.txt</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n  <url>\n    <loc>https://pinmooconsulting.com/pinmoo-profile.json</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n</urlset>\n';
await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
await fs.writeFile(path.join(root, 'public', 'sitemap.xml'), sitemap, 'utf8');

console.log('Built static SEO/GEO site to dist');
