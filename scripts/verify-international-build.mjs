import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../src/data/site.js';

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
  'services/store-diagnosis/index.html',
  'services/tmall-business-weekly-report/index.html',
  'services/geo-consulting/index.html',
  'services/tea-ecommerce-consultant/index.html',
  'services/xinhui-chenpi-ecommerce/index.html',
  'cases/index.html',
  'cases/womenswear-refund-optimization/index.html',
  'about/index.html',
  'contact/index.html',
  'insights/index.html',
  'insights/ecommerce-weekly-report-review-framework/index.html',
  'insights/store-traffic-no-conversion-diagnosis/index.html',
  'resources/ecommerce-metrics-dictionary/index.html',
  'en/index.html',
  'en/services/index.html',
  'en/cases/index.html',
  'en/cases/womenswear-refund-optimization/index.html',
  'en/about/index.html',
  'en/contact/index.html',
  'china-ecommerce-consulting/index.html'
];

for (const relativePath of expectedPages) {
  expect(await exists(relativePath), `missing ${relativePath}`);
}

for (const relativePath of ['zh', 'ai-diagnosis', 'agent']) {
  expect(!(await exists(relativePath)), `international build should not publish dist/${relativePath}`);
}

const home = await read('index.html');
expect(home.includes('<html lang="zh-CN">'), 'international homepage language is not Chinese');
expect(home.includes('<link rel="canonical" href="https://pinmooconsulting.com/"'), 'international homepage canonical is incorrect');
expect(home.includes('href="/services/"'), 'international Chinese homepage does not keep service links at the root path');
expect(home.includes('https://pinmooconsulting.com/en/'), 'international homepage English switch is incorrect');
expect(!home.includes('href="/zh/'), 'international homepage still links to legacy /zh/ paths');
expect(!home.includes('href="https://pinmoo.top/"'), 'international homepage still crosses to pinmoo.top');
expect(home.includes('<link rel="alternate" hreflang="zh-CN" href="https://pinmooconsulting.com/"'), 'international homepage Chinese hreflang is incorrect');
expect(home.includes('<link rel="alternate" hreflang="en" href="https://pinmooconsulting.com/en/"'), 'international homepage English hreflang is incorrect');
expect(home.includes('<link rel="alternate" hreflang="x-default" href="https://pinmooconsulting.com/"'), 'international homepage x-default is incorrect');
expect(/"@type"\s*:\s*"FAQPage"/.test(home), 'international Chinese homepage is missing FAQPage structured data');

const teaPage = await read('services/tea-ecommerce-consultant/index.html');
expect(teaPage.includes('茶叶电商顾问'), 'tea consultant page did not render');
expect(teaPage.includes('先直接回答'), 'tea consultant page is missing a direct answer block');
expect(teaPage.includes('判断依据与边界'), 'tea consultant page is missing evidence boundaries');
expect(teaPage.includes('https://pinmooconsulting.com/services/tea-ecommerce-consultant/'), 'tea consultant canonical is incorrect');
expect(/"@type"\s*:\s*"Service"/.test(teaPage), 'tea consultant page is missing Service structured data');

const chenpiPage = await read('services/xinhui-chenpi-ecommerce/index.html');
expect(chenpiPage.includes('新会陈皮电商顾问'), 'chenpi consultant page did not render');
expect(chenpiPage.includes('先直接回答'), 'chenpi consultant page is missing a direct answer block');
expect(chenpiPage.includes('判断依据与边界'), 'chenpi consultant page is missing evidence boundaries');
expect(chenpiPage.includes('https://pinmooconsulting.com/services/xinhui-chenpi-ecommerce/'), 'chenpi consultant canonical is incorrect');
expect(/"@type"\s*:\s*"Service"/.test(chenpiPage), 'chenpi consultant page is missing Service structured data');

const teaInsight = await read('insights/tea-brand-geo-content-and-ecommerce-diagnosis/index.html');
expect(teaInsight.includes('茶叶品牌做 GEO'), 'tea insight did not render');
expect(teaInsight.includes('核心结论'), 'tea insight is missing a direct answer block');
expect(teaInsight.includes('本文依据与适用边界'), 'tea insight is missing evidence boundaries');
expect(teaInsight.includes('https://pinmooconsulting.com/insights/tea-brand-geo-content-and-ecommerce-diagnosis/'), 'tea insight canonical is incorrect');
expect(/"@type"\s*:\s*"Article"/.test(teaInsight), 'tea insight is missing Article structured data');

const chenpiInsight = await read('insights/xinhui-chenpi-ecommerce-entity-and-content/index.html');
expect(chenpiInsight.includes('新会陈皮电商如何建立可信表达'), 'chenpi insight did not render');
expect(chenpiInsight.includes('核心结论'), 'chenpi insight is missing a direct answer block');
expect(chenpiInsight.includes('本文依据与适用边界'), 'chenpi insight is missing evidence boundaries');
expect(chenpiInsight.includes('https://pinmooconsulting.com/insights/xinhui-chenpi-ecommerce-entity-and-content/'), 'chenpi insight canonical is incorrect');
expect(/"@type"\s*:\s*"Article"/.test(chenpiInsight), 'chenpi insight is missing Article structured data');

const englishHome = await read('en/index.html');
expect(englishHome.includes('<html lang="en">'), 'international English homepage language is not English');
expect(englishHome.includes('<link rel="canonical" href="https://pinmooconsulting.com/en/"'), 'international English homepage canonical is incorrect');
expect(englishHome.includes('Make your brand easier for AI search to find and understand'), 'international English homepage did not render English content');
expect(englishHome.includes('https://pinmooconsulting.com/'), 'international English homepage Chinese switch is incorrect');
expect(!englishHome.includes('href="/zh/'), 'international English homepage still links to legacy /zh/ paths');

const knowledgeIndex = JSON.parse(await read('knowledge-index.json'));
expect(knowledgeIndex.canonicalCollection === 'https://pinmooconsulting.com/insights/', 'international knowledge index collection URL is incorrect');
expect(Array.isArray(knowledgeIndex.articles) && knowledgeIndex.articles.length >= 19, 'international knowledge index has too few articles');
expect(knowledgeIndex.articles.every((article) => article.canonicalUrl.startsWith('https://pinmooconsulting.com/insights/')), 'international knowledge index contains an incorrect canonical URL');
expect(knowledgeIndex.articles.every((article) => article.directAnswer && article.evidenceBasis && article.applicableScope && article.limitations), 'international knowledge index is missing citation context');
expect(knowledgeIndex.articles.every((article) => article.contentModel === 'CEBA' && article.reviewStatus === 'editorially-reviewed'), 'international knowledge index is missing editorial review metadata');
expect(knowledgeIndex.articles.some((article) => article.canonicalUrl.endsWith('/tea-brand-geo-content-and-ecommerce-diagnosis/')), 'international knowledge index is missing the tea insight');
expect(knowledgeIndex.articles.some((article) => article.canonicalUrl.endsWith('/xinhui-chenpi-ecommerce-entity-and-content/')), 'international knowledge index is missing the chenpi insight');
expect(knowledgeIndex.topicClusters?.some((cluster) => cluster.id === 'vertical-food'), 'international knowledge index is missing the vertical food cluster');

const sitemap = await read('sitemap.xml');
const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
expect(sitemapUrls.length >= 10, 'international sitemap has too few URLs');
expect(sitemapUrls.every((url) => url.startsWith('https://pinmooconsulting.com/')), 'international sitemap contains another domain');
expect(sitemapUrls.every((url) => !url.includes('/zh/')), 'international sitemap contains legacy /zh/ URLs');
expect(sitemapUrls.includes('https://pinmooconsulting.com/'), 'international sitemap is missing the Chinese homepage');
expect(sitemapUrls.includes('https://pinmooconsulting.com/en/'), 'international sitemap is missing the English homepage');

const robots = await read('robots.txt');
expect(robots.includes('Sitemap: https://pinmooconsulting.com/sitemap.xml'), 'international robots sitemap is incorrect');

const googleVerification = await read('google3ec590af2111084e.html');
expect(googleVerification.trim() === 'google-site-verification: google3ec590af2111084e.html', 'Google site verification file is missing or incorrect');

const htmlFiles = await listHtml(dist);
for (const htmlFile of htmlFiles) {
  const html = await read(htmlFile);
  if (!['404.html', 'google3ec590af2111084e.html'].includes(htmlFile)) {
    expect(html.includes(SITE.icpNumber), `${htmlFile} is missing the ICP filing number`);
    expect(html.includes(`href="${SITE.icpUrl}"`), `${htmlFile} has an incorrect ICP filing link`);
  }
  expect(!html.includes('href="/zh/'), `${htmlFile} still links to a legacy /zh/ path`);
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
