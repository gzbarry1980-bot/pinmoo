import { octoberPlatformInsights } from '../../src/data/insights-platform-october.js';
import { pinmooInsights } from '../../src/data/insights-pinmoo.js';
import fs from 'node:fs/promises';
const origin = 'https://pinmooconsulting.com';
const root = new URL('./', import.meta.url);
const get = async path => {
  const response = await fetch(origin + path);
  return { status: response.status, text: await response.text() };
};
const build = JSON.parse((await get('/site-build.json')).text);
const sitemap = (await get('/sitemap.xml')).text;
const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const pages = [];
for (const article of [...octoberPlatformInsights, ...pinmooInsights]) {
  const path = `/insights/${article.slug}/`;
  const result = await get(path);
  const expectedText = [...article.lead, ...article.sections.flatMap(section => section.paragraphs)];
  const checks = {
    http200: result.status === 200,
    title: result.text.includes(escape(article.title)),
    completeBody: expectedText.every(paragraph => result.text.includes(escape(paragraph))),
    canonical: result.text.includes(`<link rel="canonical" href="${origin}${path}"`),
    articleSchema: result.text.includes('"@type":"Article"'),
    disclosure: result.text.includes(escape(article.disclosure)),
    sitemap: sitemap.includes(origin + path)
  };
  pages.push({url:origin + path,title:article.title,status:result.status,checks,passed:Object.values(checks).every(Boolean)});
  console.log(`${pages.at(-1).passed ? 'PASS' : 'FAIL'} ${article.slug}`);
  await new Promise(resolve => setTimeout(resolve, 200));
}
const receipt = {checkedDate:'2026-10-02',checkedAt:new Date().toISOString(),commit:'cd8ebe9',articleCount:build.articleCount,build,checkedArticles:pages.length,passed:build.articleCount===76 && pages.every(page=>page.passed),pages};
await fs.writeFile(new URL('官网发布核对.json',root), JSON.stringify(receipt,null,2)+'\n');
if (!receipt.passed) process.exitCode=1;
else {
  const ledgerPath = new URL('发布数据与来源台账.json',root);
  const ledger = JSON.parse(await fs.readFile(ledgerPath,'utf8'));
  for (const record of ledger.records) record.officialStatus='已发布：HTTP200及完整正文已核对';
  await fs.writeFile(ledgerPath, JSON.stringify(ledger,null,2)+'\n');
}
