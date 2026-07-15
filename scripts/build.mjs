import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { absolute, routeMeta, jsonLdForRoute, metaTagsForRoute, imageForRoute } from '../src/data/seo.js';
import { SITE } from '../src/data/site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const isInternationalBuild = SITE.domain === 'https://pinmooconsulting.com';

function withInternationalChinesePrefix(routePath) {
  return routePath === '/' ? '/zh/' : '/zh' + routePath;
}

const internationalRoutes = routeMeta
  .filter((meta) => meta.lang === 'en' && !meta.duplicate && meta.path.indexOf('/en/') === 0)
  .map((meta) => {
    const internationalPath = meta.path.slice(3) || '/';
    return {
      ...meta,
      path: internationalPath,
      file: meta.file.replace(/^en\//, ''),
      renderPath: meta.path,
      alternatePath: undefined,
      languagePair: {
        zh: withInternationalChinesePrefix(internationalPath),
        en: internationalPath,
        xDefault: internationalPath
      },
      international: true,
      updated: '2026-07-15'
    };
  });
const internationalChineseRoutes = routeMeta
  .filter((meta) => meta.lang !== 'en' && !meta.duplicate && !meta.aiTool)
  .map((meta) => {
    const internationalPath = withInternationalChinesePrefix(meta.path);
    const hasEnglishPair = ['/', '/services/', '/cases/', '/about/', '/contact/', '/contact/success/'].includes(meta.path) || meta.caseSlug;
    return {
      ...meta,
      lang: 'zh',
      path: internationalPath,
      file: path.posix.join('zh', meta.file),
      renderPath: internationalPath,
      alternatePath: undefined,
      ...(hasEnglishPair ? {
        languagePair: {
          zh: internationalPath,
          en: meta.path,
          xDefault: meta.path
        }
      } : { noHreflang: true }),
      international: true,
      updated: '2026-07-15'
    };
  });
const chinaEcommerceRoute = routeMeta.find((meta) => meta.path === '/china-ecommerce-consulting/');
const buildRoutes = isInternationalBuild
  ? [...internationalRoutes, ...internationalChineseRoutes, ...(chinaEcommerceRoute ? [{ ...chinaEcommerceRoute, noHreflang: true, international: true, updated: '2026-07-15' }] : [])]
  : routeMeta;

await fs.rm(dist, { recursive: true, force: true });
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
  location: { pathname: '/', hostname: new URL(SITE.domain).hostname },
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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
  const keywordsTag = '<meta name="keywords" content="' + escapeHtml(tags.keywords) + '" />';
  if (tags.keywords) {
    if (/<meta name="keywords" content="[^"]*"\s*\/>/.test(next)) {
      next = next.replace(/<meta name="keywords" content="[^"]*"\s*\/>/, keywordsTag);
    } else {
      next = next.replace(/<meta name="description" content="[^"]*"\s*\/>/, (match) => match + '\n    ' + keywordsTag);
    }
  }
  next = next.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, '<link rel="canonical" href="' + escapeHtml(tags.canonical) + '" />');
  next = next.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, '<meta property="og:title" content="' + escapeHtml(tags.ogTitle) + '" />');
  next = next.replace(/<meta property="og:type" content="[^"]*"\s*\/>/, '<meta property="og:type" content="' + (meta.caseSlug || meta.insightSlug ? 'article' : 'website') + '" />');
  next = next.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, '<meta property="og:description" content="' + escapeHtml(tags.ogDescription) + '" />');
  next = next.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, '<meta property="og:url" content="' + escapeHtml(tags.ogUrl) + '" />');
  next = next.replace(/<meta property="og:image" content="[^"]*"\s*\/>/, '<meta property="og:image" content="' + escapeHtml(tags.ogImage) + '" />');
  next = next.replace(/\n\s*<meta name="robots" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta name="author" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta name="theme-color" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta property="og:site_name" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta property="og:locale" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta property="og:image:alt" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta name="twitter:title" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta name="twitter:description" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<meta name="twitter:image" content="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<link rel="alternate" type="text\/plain" href="[^"]*" title="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<link rel="alternate" type="text\/markdown" href="[^"]*" title="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<link rel="alternate" type="application\/json" href="[^"]*" title="[^"]*"\s*\/>/g, '');
  next = next.replace(/\n\s*<script type="application\/ld\+json" data-seo-jsonld>[\s\S]*?<\/script>/g, '');
  const absolutePath = (pathname) => absolute(pathname);
  const alternate = translatedRoutes(meta);
  const extra = [
    '<meta name="robots" content="' + (meta.indexable === false ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1') + '" />',
    '<meta name="author" content="广州品沐咨询有限公司" />',
    '<meta name="theme-color" content="#1E3A5F" />',
    '<meta property="og:site_name" content="PINMOO 品沐咨询" />',
    '<meta property="og:locale" content="' + (meta.lang === 'en' ? 'en_US' : 'zh_CN') + '" />',
    '<meta property="og:image:alt" content="PINMOO 品沐咨询" />',
    '<meta name="twitter:title" content="' + escapeHtml(tags.title) + '" />',
    '<meta name="twitter:description" content="' + escapeHtml(tags.description) + '" />',
    '<meta name="twitter:image" content="' + escapeHtml(tags.ogImage) + '" />',
    ...(alternate ? [
      '<link rel="alternate" hreflang="zh-CN" href="' + escapeHtml(absolutePath(alternate.zh.path)) + '" />',
      '<link rel="alternate" hreflang="en" href="' + escapeHtml(absolutePath(alternate.en.path)) + '" />',
      '<link rel="alternate" hreflang="x-default" href="' + escapeHtml(absolutePath(alternate.xDefaultPath || alternate.en.path)) + '" />'
    ] : []),
    '<link rel="alternate" type="text/plain" href="/llms.txt" title="PINMOO 品沐咨询 AI 摘要" />',
    '<link rel="alternate" type="text/markdown" href="/llms-full.txt" title="PINMOO 品沐咨询完整 AI 上下文" />',
    '<link rel="alternate" type="application/json" href="/pinmoo-profile.json" title="PINMOO 品沐咨询结构化品牌资料" />',
    '<link rel="alternate" type="application/json" href="/ai-context.json" title="PINMOO 品沐咨询 AI 引用上下文" />',
    '<script type="application/ld+json" data-seo-jsonld>' + JSON.stringify(jsonLdForRoute(meta)) + '</script>'
  ].join('\n    ');
  next = next.replace('  </head>', '    ' + extra + '\n  </head>');
  return next;
}

function translatedRoutes(meta) {
  if (meta.languagePair) {
    return {
      zh: { path: meta.languagePair.zh },
      en: { path: meta.languagePair.en },
      xDefaultPath: meta.languagePair.xDefault
    };
  }
  if (meta.noHreflang) return null;
  if (meta.lang === 'en') {
    if (!meta.alternatePath) return null;
    const zh = routeMeta.find((candidate) => candidate.lang !== 'en' && candidate.path === meta.alternatePath);
    return zh ? { zh, en: meta } : null;
  }
  const en = routeMeta.find((candidate) => candidate.lang === 'en' && !candidate.duplicate && candidate.alternatePath === meta.path);
  return en ? { zh: meta, en } : null;
}

function assertValidHtml(html, meta) {
  if (!/<meta charset="UTF-8"\s*\/?>/i.test(html)) {
    throw new Error('Missing UTF-8 charset in ' + meta.file);
  }
  if (!/<title>[\s\S]*?<\/title>/i.test(html)) {
    throw new Error('Malformed title tag in ' + meta.file);
  }
  if (!meta.aiTool && !html.includes('<main id="main-content">')) {
    throw new Error('Missing prerendered main content in ' + meta.file);
  }
}

async function syncSourceShell(meta) {
  if (meta.aiTool) return;
  const sourcePath = path.join(root, meta.file);
  const stat = await fs.stat(sourcePath).catch(() => null);
  if (!stat || !stat.isFile()) return;
  const html = upsertHead(siteTemplate, meta);
  if (!/<meta charset="UTF-8"\s*\/?>/i.test(html) || !/<title>[\s\S]*?<\/title>/i.test(html)) {
    throw new Error('Invalid source shell for ' + meta.file);
  }
  await fs.writeFile(sourcePath, html, 'utf8');
}

const topLevel = isInternationalBuild
  ? ['index.html', 'public']
  : ['index.html', 'services', 'cases', 'about', 'contact', 'ai-diagnosis', 'public'];
for (const item of topLevel) await copy(path.join(root, item), path.join(dist, item === 'public' ? '' : item));
for (const staleAsset of ['assets/cases/generated-case-sheet.png']) {
  await fs.rm(path.join(dist, staleAsset), { force: true });
}
await copy(path.join(root, 'src/site-runtime.js'), path.join(dist, 'src/site-runtime.js'));
await copy(path.join(root, 'src/styles.css'), path.join(dist, 'src/styles.css'));

const domainAwareFiles = ['robots.txt', 'llms.txt', 'llms-full.txt', 'ai.txt', 'ai-context.json', 'pinmoo-profile.json'];
for (const filename of domainAwareFiles) {
  const target = path.join(dist, filename);
  const stat = await fs.stat(target).catch(() => null);
  if (!stat?.isFile()) continue;
  const source = await fs.readFile(target, 'utf8');
  const localized = source
    .replaceAll('https://pinmoo.top', SITE.primaryDomain);
  await fs.writeFile(target, localized, 'utf8');
}
const assetVersion = createHash('sha256')
  .update(await fs.readFile(path.join(root, 'src', 'styles.css')))
  .update(await fs.readFile(path.join(root, 'src', 'site-runtime.js')))
  .digest('hex')
  .slice(0, 10);
const siteTemplate = (await fs.readFile(path.join(root, 'index.html'), 'utf8'))
  .replace(/\/src\/styles\.css(?:\?v=[a-f0-9]+)?/g, '/src/styles.css?v=' + assetVersion)
  .replace(/\/src\/static-main\.js(?:\?v=[a-f0-9]+)?/g, '/src/static-main.js?v=' + assetVersion);

for (const meta of buildRoutes) {
  const htmlPath = path.join(dist, meta.file);
  await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  let html = meta.aiTool
    ? await fs.readFile(htmlPath, 'utf8')
    : siteTemplate;
  if (!meta.aiTool) {
    const rendered = await prerender(meta.renderPath || meta.path);
    html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*(<script type="module" src="\/src\/static-main\.js\?v=[a-f0-9]+"><\/script>)/, () => '<div id="root">' + rendered + '</div>\n    <script type="module" src="/src/site-runtime.js?v=' + assetVersion + '"></script>');
  }
  html = upsertHead(html, meta);
  assertValidHtml(html, meta);
  await fs.writeFile(htmlPath, html, 'utf8');
}

function sitemapUrl(loc, lastmod, image) {
  const imageBlock = image
    ? '\n    <image:image>\n      <image:loc>' + escapeXml(image) + '</image:loc>\n    </image:image>'
    : '';
  return '  <url>\n    <loc>' + escapeXml(loc) + '</loc>' + imageBlock + '\n    <lastmod>' + escapeXml(lastmod) + '</lastmod>\n  </url>';
}

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  buildRoutes
    .filter((meta) => meta.sitemap !== false && meta.indexable !== false && !meta.duplicate)
    .map((meta) => sitemapUrl(metaTagsForRoute(meta).canonical, process.env.SITEMAP_LASTMOD || meta.updated || '2026-07-10', imageForRoute(meta)))
    .join('\n') +
  '\n</urlset>\n';
await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
if (!isInternationalBuild) {
  await fs.writeFile(path.join(root, 'public', 'sitemap.xml'), sitemap, 'utf8');
}

if (!isInternationalBuild) {
  for (const meta of routeMeta) await syncSourceShell(meta);
}

async function buildAgentSubdomain() {
  const sourceDir = path.join(dist, 'ai-diagnosis');
  const agentDir = path.join(dist, 'agent');
  await copy(sourceDir, agentDir);

  const agentIndex = path.join(agentDir, 'index.html');
  let html = await fs.readFile(agentIndex, 'utf8');
  html = html
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, '<link rel="canonical" href="https://agent.pinmoo.top/" />')
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, '<meta property="og:url" content="https://agent.pinmoo.top/" />')
    .replace('  </head>', '    <meta name="application-name" content="Pinmoo AI 电商经营智能体" />\n  </head>');
  await fs.writeFile(agentIndex, html, 'utf8');

  for (const filename of ['favicon.svg', '404.html']) {
    const source = path.join(dist, filename);
    const stat = await fs.stat(source).catch(() => null);
    if (stat?.isFile()) await fs.copyFile(source, path.join(agentDir, filename));
  }

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    'Sitemap: https://agent.pinmoo.top/sitemap.xml',
    ''
  ].join('\n');
  const agentSitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    '    <loc>https://agent.pinmoo.top/</loc>',
    '    <lastmod>' + escapeXml(process.env.SITEMAP_LASTMOD || '2026-07-11') + '</lastmod>',
    '  </url>',
    '</urlset>',
    ''
  ].join('\n');
  await fs.writeFile(path.join(agentDir, 'robots.txt'), robots, 'utf8');
  await fs.writeFile(path.join(agentDir, 'sitemap.xml'), agentSitemap, 'utf8');

  if (!html.includes('https://agent.pinmoo.top/')) {
    throw new Error('Agent subdomain canonical was not generated');
  }
}

if (!isInternationalBuild) {
  await buildAgentSubdomain();
}

console.log(isInternationalBuild
  ? 'Built international PINMOO site to dist'
  : 'Built static SEO/GEO site and agent subdomain bundle to dist');
