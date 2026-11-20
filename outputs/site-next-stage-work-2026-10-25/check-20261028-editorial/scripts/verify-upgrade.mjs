import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import XLSX from 'xlsx';
import { routeMeta } from '../src/data/seo.js';
import { insights } from '../src/data/insights.js';
import { insightPractice } from '../src/data/insight-practice.js';
import { practicalResources, resourceLibrary } from '../src/data/practical-resources.js';
import { cases } from '../src/data/cases.js';

const root = path.resolve('dist');
const pages = routeMeta.filter(meta => !meta.duplicate && !meta.aiTool);
let images = 0;
for (const meta of pages) {
  const html = await fs.readFile(path.join(root, meta.file), 'utf8');
  for (const match of html.matchAll(/<(?:img|script|source)[^>]+(?:src|srcset)="([^"]+)"/g)) {
    const url = new URL(match[1], 'https://pinmooconsulting.com');
    if (url.origin !== 'https://pinmooconsulting.com') continue;
    const file = path.join(root, decodeURIComponent(url.pathname));
    assert.ok((await fs.stat(file)).isFile(), meta.path + ': missing resource ' + url.pathname);
    images++;
  }
  if (meta.insightSlug) {
    const toc = html.indexOf('insight-mobile-toc');
    const body = html.indexOf('class="insight-section');
    assert.ok(toc >= 0 && body >= 0 && toc < body, meta.path + ': mobile table of contents should precede body');
  }
}

for (const item of practicalResources) {
  const data = await fs.readFile(path.join(root, 'downloads', item.filename));
  assert.equal(data.subarray(0, 3).toString('hex'), 'efbbbf', 'CSV must include UTF-8 BOM for Chinese spreadsheet readers');
  const book = XLSX.read(data, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1, defval: '' });
  assert.deepEqual(rows[0], item.headers, item.id + ': CSV header mismatch');
  assert.deepEqual(rows.slice(1), item.rows, item.id + ': CSV rows mismatch');
  if (item.example) {
    assert.ok(item.example.rows.every(row => row.length === item.headers.length), item.id + ': example fields must match the blank template');
    const exampleData = await fs.readFile(path.join(root, 'downloads', item.example.filename));
    const exampleBook = XLSX.read(exampleData, { type: 'buffer' });
    const exampleRows = XLSX.utils.sheet_to_json(exampleBook.Sheets[exampleBook.SheetNames[0]], { header: 1, defval: '' });
    assert.deepEqual(exampleRows, [item.headers, ...item.example.rows], item.id + ': downloadable example must match the displayed source');
  }
}

const enhanced = insights.filter(item => item.practicalResource);
assert.equal(enhanced.length, Object.keys(insightPractice).length);
assert.equal(enhanced.length, 18);
for (const item of enhanced) {
  assert.equal(item.updated, insightPractice[item.slug].updated || '2026-10-13');
  assert.ok(item.published <= item.updated);
  assert.equal(item.sections.filter(section => section.id === 'practical-next-step').length, 1);
  assert.ok(practicalResources.some(resource => resource.id === item.practicalResource));
}

const home = await fs.readFile(path.join(root, 'index.html'), 'utf8');
assert.equal(new Set(cases.map(item => item.image)).size, cases.length, 'Each case needs its own image');
for (const item of cases) {
  assert.ok(item.image.startsWith('/assets/cases/' + item.slug + '.'), item.slug + ': case image must match the case, not a page hero');
  for (const lang of ['', 'en/']) {
    const html = await fs.readFile(path.join(root, lang, 'cases', item.slug, 'index.html'), 'utf8');
    assert.ok(html.includes(item.image), item.slug + ': detail image binding mismatch');
    assert.ok(!html.includes('/assets/visuals/contact-diagnosis-flow.webp'), item.slug + ': contact image leaked into a case');
  }
}
assert.ok(home.includes('/assets/cases/chenpi-brand-geo-diagnosis.webp'));
assert.ok(home.includes('data-event="consult_open"'));
assert.ok(home.includes('确认范围与交付'));
assert.ok(home.includes(resourceLibrary.path));
assert.ok(!home.includes('先拿到公开信息版基础报告，再一起确认'));
const faqGraph = [...home.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(match => JSON.parse(match[1])['@graph'] || []);
for (const item of faqGraph.find(node => node['@type'] === 'FAQPage').mainEntity) {
  assert.ok(home.includes(item.name) && home.includes(item.acceptedAnswer.text), 'FAQ schema must match visible content');
}
const index = await fs.readFile(path.join(root, 'insights/index.html'), 'utf8');
assert.ok(index.includes('href="https://pinmooconsulting.com/en/" aria-label="English overview"'));
assert.ok(index.includes('insightReset'));
const contact = await fs.readFile(path.join(root, 'contact/index.html'), 'utf8');
assert.ok(contact.indexOf('contact-actions') < contact.indexOf('contact-wechat'));
assert.ok(contact.includes('公司与品牌事实是否一致'));
const geo = await fs.readFile(path.join(root, 'services/geo-consulting/index.html'), 'utf8');
const serviceIndex = await fs.readFile(path.join(root, 'services/index.html'), 'utf8');
assert.equal((geo.match(/class="geo-service-card/g) || []).length, 6, 'GEO modules belong on the specific service page');
assert.ok(!serviceIndex.includes('class="geo-service-card'), 'General services should not duplicate all GEO modules');

console.log(`升级检查通过：${pages.length} 个页面资源，${images} 条资源引用，4 份空白表及4份示范CSV解析，18 篇内容增强与关键路径检查。`);
