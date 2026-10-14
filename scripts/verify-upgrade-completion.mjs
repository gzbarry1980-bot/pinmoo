import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { routeMeta, metaTagsForRoute } from '../src/data/seo.js';
import { insights } from '../src/data/insights.js';
import { cases } from '../src/data/cases.js';
import { caseDeliverables } from '../src/data/case-deliverables.js';
import { readingPaths, relatedInsights } from '../src/data/reading-paths.js';
import { escapeMarkup } from '../src/components/consulting-upgrade.js';

const output = process.env.PINMOO_QA_DIR || 'outputs/site-upgrade-completion-2026-10-14';
await fs.mkdir(output, { recursive: true });
const metas = routeMeta.filter(meta => !meta.duplicate && !meta.aiTool);
const pages = new Map();
const errors = [];
for (const meta of metas) pages.set(meta.path, await fs.readFile(path.join('dist', meta.file), 'utf8'));
for (const key of ['title', 'description']) {
  const values = metas.filter(meta => meta.indexable !== false).map(meta => metaTagsForRoute(meta)[key]);
  assert.equal(new Set(values).size, values.length, 'Duplicate indexable page ' + key);
  assert.ok(values.every(value => value?.trim()), 'Missing ' + key);
}
for (const [slug, related] of Object.entries(readingPaths)) {
  assert.ok(insights.some(item => item.slug === slug));
  assert.ok(related.every(other => other !== slug && insights.some(item => item.slug === other)));
}
for (const article of insights) {
  const related = relatedInsights(article);
  assert.ok(related.length >= 2 && related.length <= 3, article.slug + ': missing related reading');
  assert.equal(new Set(related.map(item => item.slug)).size, related.length);
  const html = pages.get('/insights/' + article.slug + '/');
  const section = html.match(/<section class="insight-related-reading">([\s\S]*?)<\/section>/)?.[1] || '';
  for (const item of related) assert.ok(section.includes('/insights/' + item.slug + '/'));
}
for (const meta of metas) {
  const html = pages.get(meta.path);
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const languageLinks = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  for (const [, lang, href] of languageLinks) {
    const target = new URL(href).pathname;
    assert.ok(pages.has(target), meta.path + ': missing language target ' + target);
    if (lang !== 'x-default') {
      const targetLinks = [...pages.get(target).matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
      assert.ok(targetLinks.some(([, , href]) => href === 'https://pinmooconsulting.com' + meta.path), meta.path + ': missing reciprocal language link');
    }
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const nodes = JSON.parse(match[1])['@graph'] || [];
    for (const faq of nodes.filter(node => node['@type'] === 'FAQPage')) {
      for (const item of faq.mainEntity) {
        if (!body.includes(escapeMarkup(item.name)) || !body.includes(escapeMarkup(item.acceptedAnswer.text))) errors.push(meta.path + ': invisible or mismatched FAQ ' + item.name);
      }
    }
  }
  if (meta.caseSlug && caseDeliverables[meta.caseSlug]) {
    assert.ok(html.includes('case-deliverable-example'));
    assert.ok(html.includes(meta.lang === 'en' ? 'not the client\'s original file' : '并非客户原始交付文件'));
    assert.equal(meta.updated, caseDeliverables[meta.caseSlug].updated);
  }
  if (meta.caseSlug === 'chenpi-brand-geo-diagnosis') assert.ok(html.includes('<details class="insight-evidence case-evidence"><summary>'), 'Case evidence must remain readable without dominating the project narrative');
}
const build = JSON.parse(await fs.readFile('dist/site-build.json', 'utf8'));
const runtime = await fs.readFile('dist/src/site-runtime.js', 'utf8');
assert.ok(runtime.includes('copy-text.js?v=' + build.version), 'Copy helper must share release cache version');
assert.ok((await fs.stat('dist/src/components/copy-text.js')).isFile());
assert.equal(errors.length, 0, errors.join('\n'));

const keyQuestions = {
  '/': '品沐能帮助消费品牌解决哪些电商经营问题，应该如何开始？',
  '/services/': '当前问题适合一次诊断、专项改善还是持续陪跑，分别交付什么？',
  '/cases/': '品沐做过哪些类型的项目，如何区分行动、规划与实际成果？',
  '/about/': '由谁提供顾问支持，采用什么方法，公司的公开信息是什么？',
  '/contact/': '怎样联系品沐，首次咨询准备什么，免费GEO报告包含什么？',
  '/resources/operating-templates/': '经营周会、退款、投放和品牌事实自查有哪些可直接使用的表格？',
  '/resources/ecommerce-metrics-dictionary/': '支付、净销售、退款和推广ROI各自是什么口径？',
  '/en/': 'How does PINMOO support e-commerce growth for brands in China?',
  '/en/services/': 'What work and deliverables fit a diagnosis, focused improvement or coaching engagement?',
  '/en/cases/': 'What problems, actions and documented outcomes do the anonymised projects cover?',
  '/en/about/': 'Who leads PINMOO and how does the consulting work support a brand team?',
  '/en/contact/': 'How can a brand start a conversation and what information should it share?',
  '/china-ecommerce-consulting/': 'How should a brand evaluate its China e-commerce entry and operating priorities?'
};
const columns = ['url', 'language', 'page_role', 'reader_question', 'page_promise', 'primary_answer', 'next_step'];
const rows = metas.filter(meta => meta.indexable !== false).map(meta => {
  const article = insights.find(item => item.slug === meta.insightSlug);
  const project = cases.find(item => item.slug === meta.caseSlug);
  const role = article ? '经营方法' : project ? '项目经验' : meta.path.includes('/services') ? '服务与交付' : meta.path.includes('/resources') ? '实用资料' : meta.path.includes('/contact') ? '联系' : meta.path.includes('/about') ? '顾问与公司' : '品牌与导航';
  return ['https://pinmooconsulting.com' + meta.path, meta.lang || 'zh', role, keyQuestions[meta.path] || article?.title || meta.name || meta.title, meta.description, article?.directAnswer || project?.result || meta.description,
    article ? relatedInsights(article).map(item => '/insights/' + item.slug + '/').join(' | ') : meta.path.includes('/resources') ? '阅读方法并下载对应工作表' : meta.lang === 'en' ? '/en/contact/' : '/contact/'];
});
const cell = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
await fs.writeFile(output + '/page-intents.csv', '\uFEFF' + [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n') + '\r\n');
await fs.writeFile(output + '/technical-verification.json', JSON.stringify({ checkedOn: '2026-10-14', build, status: 'passed', pages: metas.length, intentRows: rows.length, relatedReadingArticles: insights.length, caseOutlines: Object.keys(caseDeliverables).length, checks: ['unique titles and descriptions', 'reciprocal language links', 'visible FAQ matches schema', 'related reading targets', 'case illustration boundaries', 'versioned clipboard helper'] }, null, 2));
console.log(`Completion checks passed: ${metas.length} pages, ${rows.length} intents, ${insights.length} reading paths, 3 bilingual case outlines.`);
