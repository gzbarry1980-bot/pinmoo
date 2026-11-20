import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { insights } from './check-20261028-editorial/src/data/insights.js';

const checks = [
  ['store-diagnosis-vs-coaching-vs-project-optimization', '第二个周期怎样接住第一轮结果'],
  ['pinmoo-client-owner-responsibilities', '账号权限应按实际工作配置'],
  ['cross-platform-ecommerce-operations-coordination', '不能把各后台归因金额直接相加']
];
for (const [slug, phrase] of checks) {
  const article = insights.find(item => item.slug === slug);
  assert.ok(article, `Missing article: ${slug}`);
  assert.equal(article.updated, '2026-10-28', `Wrong updated date: ${slug}`);
  const html = await fs.readFile(new URL(`./check-20261028-editorial/dist/insights/${slug}/index.html`, import.meta.url), 'utf8');
  assert.ok(html.includes(phrase), `Missing public text: ${slug}`);
  assert.ok(html.includes(`https://pinmooconsulting.com/insights/${slug}/`), `Missing canonical URL: ${slug}`);
}
console.log(`Editorial source, date, rendered text and canonical checks passed for ${checks.length} articles.`);
