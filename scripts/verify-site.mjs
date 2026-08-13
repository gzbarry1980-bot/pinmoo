import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { metaTagsForRoute, routeMeta } from '../src/data/seo.js';
import { SITE } from '../src/data/site.js';
import { insightClusters } from '../src/data/insights.js';

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

const buildableMeta = SITE.domain === SITE.primaryDomain
  ? routeMeta.filter((meta) => !meta.aiTool && !meta.duplicate)
  : routeMeta;

for (const meta of buildableMeta) {
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
  if (!meta.aiTool && !html.includes(SITE.icpNumber)) fail(`${meta.file}: 页尾缺少 ICP 备案号`);
  if (!meta.aiTool && !html.includes(`href="${SITE.icpUrl}"`)) fail(`${meta.file}: ICP 备案链接不正确`);
  const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || '';
  if (meta.indexable === false && !robots.includes('noindex')) fail(`${meta.file}: 非索引页应为 noindex`);
  if (meta.indexable !== false && (robots.includes('noindex') || robots.includes('nofollow'))) fail(`${meta.file}: 可索引页包含 noindex/nofollow`);

  if (meta.path === '/' && meta.lang !== 'en') {
    if (!html.includes('<title>品牌 GEO 优化｜AI搜索可见度与品牌增长咨询｜品沐咨询</title>')) fail('首页 title 未覆盖品牌 GEO 与 AI 搜索可见度');
    if (!html.includes('免费获取一份品牌 GEO 基础报告')) fail('首页缺少品牌 GEO 免费报告主 CTA');
    if (!html.includes('品牌GEO报告')) fail('首页缺少微信备注口令');
    for (const signal of ['多平台', '多行业', '全链路', 'AI工具']) {
      if (!html.includes(signal)) fail(`首页能力信号缺失: ${signal}`);
    }
    if (!html.includes('看板为演示数据，不代表客户经营结果')) fail('首页经营看板缺少演示数据声明');
    if (!html.includes('案例均来自真实项目，现有内容已经核对')) fail('首页缺少匿名案例事实边界');
    if (!html.includes('AI电商经营周报不是自动写总结，而是先统一数据口径')) fail('首页缺少 AI 经营周报方法说明');
    if (!html.includes('电商店铺有流量但转化率低，应该先检查什么？')) fail('首页缺少直接问答内容');
    if (!/"@type"\s*:\s*"FAQPage"/.test(html)) fail('首页缺少 FAQPage 结构化数据');
    if (/class="text-link">了解更多\b/.test(html)) fail('首页服务锚文本仍使用“了解更多”');
    if (/class="outline-link"[^>]*>查看详情\b/.test(html)) fail('首页案例锚文本仍使用“查看详情”');
  }

  if (meta.insightSlug) {
    if (count(html, /"@type"\s*:\s*"Article"/g) !== 1) fail(`${meta.file}: Article 结构化主体数量不是 1`);
    if (!/"@type"\s*:\s*"FAQPage"/.test(html)) fail(`${meta.file}: 缺少 FAQPage 结构化数据`);
    if (!html.includes('本文依据与适用边界')) fail(`${meta.file}: 缺少证据说明与适用边界`);
    if (!html.includes('id="directAnswerTitle">核心结论</h2>')) fail(`${meta.file}: 缺少可直接引用的核心结论`);
    if (!html.includes('AI参与结构整理和文字校对，最终由鲍俊文复核')) fail(`${meta.file}: 缺少 AI 参与和人工复核声明`);
  }

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
  if (!url.startsWith(SITE.primaryDomain + '/')) fail(`sitemap 出现其他域名: ${url}`);
  if (/\/(?:llms(?:-full)?\.txt|ai\.txt|ai-context\.json|pinmoo-profile\.json)$/.test(url)) fail(`sitemap 不应包含机器资料文件: ${url}`);
}

const robots = await fs.readFile(path.join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('User-agent: OAI-SearchBot')) fail('robots.txt 缺少 OAI-SearchBot');
if (!robots.includes(`Sitemap: ${SITE.primaryDomain}/sitemap.xml`)) fail('robots.txt sitemap 域名不正确');

const googleVerification = await fs.readFile(path.join(dist, 'google3ec590af2111084e.html'), 'utf8').catch(() => '');
if (googleVerification.trim() !== 'google-site-verification: google3ec590af2111084e.html') fail('Google 站点验证文件缺失或内容不正确');

const notFound = await fs.readFile(path.join(dist, '404.html'), 'utf8');
if (!notFound.includes('content="noindex, follow"')) fail('404 页面缺少 noindex');

for (const filename of ['ai-context.json', 'pinmoo-profile.json']) {
  const content = await fs.readFile(path.join(dist, filename), 'utf8');
  try {
    const data = JSON.parse(content);
    if (filename === 'ai-context.json') {
      if (data.aiProduct?.url !== 'https://agent.pinmoo.top/') fail('ai-context.json 工作台域名不正确');
      if (!Array.isArray(data.aiProduct?.workflow) || data.aiProduct.workflow.length !== 4) fail('ai-context.json 缺少四步周报工作流');
      if (!Array.isArray(data.directAnswers) || data.directAnswers.length < 19) fail('ai-context.json 直接回答不足 19 条');
      if (data.machineReadableResources?.knowledgeIndex !== 'https://pinmooconsulting.com/knowledge-index.json') fail('ai-context.json 缺少正式知识索引');
    }
  } catch {
    fail(`${filename} 不是有效 JSON`);
  }
}

const knowledgeIndexContent = await fs.readFile(path.join(dist, 'knowledge-index.json'), 'utf8').catch(() => '');
try {
  const knowledgeIndex = JSON.parse(knowledgeIndexContent);
  if (!Array.isArray(knowledgeIndex.articles) || knowledgeIndex.articles.length < 17) fail('knowledge-index.json 经营洞察不足 17 篇');
  if (knowledgeIndex.articles?.some((article) => !article.canonicalUrl?.startsWith('https://pinmooconsulting.com/insights/'))) {
    fail('knowledge-index.json canonical 域名或路径不正确');
  }
  if (knowledgeIndex.articles?.some((article) => !article.directAnswer || !article.applicableScope || !article.limitations || article.contentModel !== 'CEBA' || article.reviewStatus !== 'editorially-reviewed')) {
    fail('knowledge-index.json 缺少直接回答、适用范围、使用限制或内容复核信息');
  }
  if (!Array.isArray(knowledgeIndex.topicClusters) || knowledgeIndex.topicClusters.length !== insightClusters.length) fail(`knowledge-index.json 主题簇不完整: ${knowledgeIndex.topicClusters?.length || 0}/${insightClusters.length}`);
} catch {
  fail('knowledge-index.json 缺失或不是有效 JSON');
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
