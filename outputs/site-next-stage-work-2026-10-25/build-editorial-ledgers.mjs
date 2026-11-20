import fs from 'node:fs/promises';
import XLSX from 'xlsx';
import { insights } from '../../src/data/insights.js';
import { nextStageInsights, nextStageUpdates } from '../../src/data/insights-next-stage.js';

const here = new URL('./', import.meta.url);
const readCsv = async path => {
  const text = (await fs.readFile(path, 'utf8')).replace(/^\uFEFF/, '');
  const book = XLSX.read(text, { type: 'string', raw: true });
  return XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { defval: '', raw: false });
};
const writeCsv = async (name, rows) => fs.writeFile(new URL(name, here), '\ufeff' + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows)));
const old = await readCsv('outputs/geo-complete-2026-09-27/40题文章与发布平台对照.csv');
const mapping = await fs.readFile('outputs/geo-next-stage-2026-10-18/40题旧稿与官网对照.md', 'utf8');
const oldText = await fs.readFile('outputs/geo-complete-2026-09-27/40篇文章完整版.md', 'utf8');
const originalBodies = oldText.split(/^# /m).slice(1);
if (old.length !== 40 || originalBodies.length !== 40) throw Error('Unexpected original draft count');
const overrides = { '02-03': 'tmall-jd-same-product-conversion-diagnosis', '02-05': 'traditional-brand-first-ecommerce-channel-products', '05-03': 'traditional-brand-first-ecommerce-channel-products', '05-04': 'traditional-brand-first-ecommerce-channel-products' };
const clean = text => text.replace(/[^\p{L}\p{N}]/gu, '');
const decisions = old.map((row, i) => {
  const id = row['文章编号'];
  const line = mapping.split('\n').find(line => line.startsWith('|' + id + '|'));
  const match = line?.match(/https:\/\/pinmooconsulting\.com\/insights\/([^/]+)\//);
  const slug = overrides[id] || match?.[1];
  const target = insights.find(article => article.slug === slug);
  if (!target) throw Error('No target for ' + id);
  const original = originalBodies[i].split('\n').slice(1).join('\n');
  const targetBody = clean([target.directAnswer, ...(target.lead || []), ...target.sections.flatMap(item => item.paragraphs)].join('\n'));
  const matches = original.split(/[。！？\n]/).map(text => text.trim()).filter(text => clean(text).length >= 20 && !/AI|成稿|公开资料|http/.test(text)).filter(text => targetBody.includes(clean(text)));
  const evidence = target.sections.slice(-2).map(item => item.title + '：' + item.paragraphs[0]).join('\n');
  return {
    编号: id, 原问题: row['原始监测问题'], 原稿标题: row['文章标题'], 目标URL: 'https://pinmooconsulting.com/insights/' + slug + '/',
    编辑决定: overrides[id] ? '复用已上线N09或N10，不再建候选新页' : line.includes('保留网址') ? '保留现有同题页，不另建重复页' : '合并到既有承接页，独有段落逐项审阅',
    原稿直接复用句数: matches.length,
    直接复用证据: matches.slice(0, 2).join('；') || '未发现20字符以上的完整句直接复用；不能据此判断语义未覆盖',
    当前承接正文证据: evidence,
    采用边界: '当前段落能说明承接内容，但标题对应或主题相同不等于原稿已全文采用',
    仍需处理: matches.length ? '复核未复用部分是否有独有价值；不要求逐字搬运' : '独有信息仍需逐段审阅，不能标为已全部合并',
    核对日期: '2026-10-25', 公网验收: '待本批发布后回读目标页'
  };
});
await writeCsv('40题编辑去向与采用边界.csv', decisions);

const oldPosts = await readCsv('outputs/geo-platform-batch-2026-10-02/30篇平台发布包/逐篇发布清单.csv');
const newPosts = await readCsv('outputs/geo-execution-2026-10-24/逐篇发布清单.csv');
const published = { '11': 'https://zhuanlan.zhihu.com/p/2096899254392447746', '12': 'https://zhuanlan.zhihu.com/p/2096900537425966138', '26': 'https://zhuanlan.zhihu.com/p/2096900953148494957' };
const posts = [
  ...oldPosts.map(row => ({ 包: '2026-10-02旧30篇', 编号: row['序号'].padStart(2, '0'), 标题: row['主发平台标题'], 建议平台: row['主发平台'], 官网URL: row['官网链接'], 既有公开链接: published[row['序号'].padStart(2, '0')] || '', 状态: published[row['序号'].padStart(2, '0')] ? '10月23日公开回执已确认；今天未复访' : '未取得新回执，当前平台状态待核对' })),
  ...newPosts.map(row => ({ 包: '2026-10-24新8篇', 编号: row['编号'], 标题: row['平台版标题'], 建议平台: row['主发平台'], 官网URL: row['官网URL'], 既有公开链接: '', 状态: '10月24日成稿待发布；今天未向平台提交' }))
];
for (const row of posts) row.同官网URL其他稿 = posts.filter(item => item !== row && item.官网URL === row.官网URL).map(item => item.包 + '/' + item.编号).join('；') || '未发现同URL，语义相近仍需编辑检查';
await writeCsv('站外两批稿件合并状态.csv', posts);

const refs = await readCsv('outputs/tencent-geo-export-2026-09-26/范文分组补采/分组范文完整索引.csv');
const unique = new Map();
for (const row of refs) {
  const url = row['原文URL'];
  if (!unique.has(url)) unique.set(url, { row, groups: [] });
  unique.get(url).groups.push(row['分组']);
}
const sources = [...unique.entries()].map(([url, {row, groups}]) => ({
  标题: row['范文标题'], URL: url, 分组: [...new Set(groups)].join('；'),
  处理类别: /排除/.test(row['使用建议']) ? '排除：历史档案标注不同主体' : /实体信息/.test(row['使用建议']) ? '主体资料线索；不作内容范文' : /pinmooconsulting\.com/.test(url) ? '自有公开资料' : /榜|TOP|排名|推荐|横评/.test(row['范文标题']) ? '推荐榜或商业评论；不作排名事实依据' : '相关性与原始出处待审阅',
  当前访问状态: '本轮未复访；不得据历史索引标记为当前可读',
  历史热度: row['热度'], 热度日期口径: '2026-09-26所见近一周引用次数，不是今日值',
  当前热度: '未取得', 下一步: /排除/.test(row['使用建议']) ? '不作为品沐主体或业务证据' : '按本批实际内容缺口选择原始来源；取得正文后再写结构卡'
}));
if (sources.length !== 59) throw Error('Unexpected unique source count');
await writeCsv('59条候选来源状态.csv', sources);

await fs.mkdir(new URL('./官网文章/', here), { recursive: true });
for (const article of nextStageInsights) {
  const text = '# ' + article.title + '\n\n' + article.lead.join('\n\n') + '\n\n' + article.sections.map(item => '## ' + item.title + '\n\n' + item.paragraphs.join('\n\n')).join('\n\n') + '\n\n来源：\n' + article.sources.map(item => '- [' + item.title + '](' + item.url + ')').join('\n') + '\n\n品沐咨询｜' + article.updated + '\n\n' + article.disclosure + '\n';
  await fs.writeFile(new URL('./官网文章/' + article.slug + '.md', here), text);
}
await fs.writeFile(new URL('./content-change-manifest.json', here), JSON.stringify({ date: '2026-10-25', newArticles: nextStageInsights.map(item => ({slug:item.slug,title:item.title})), oldUpdates: Object.keys(nextStageUpdates), sourceRows: sources.length, excludedDifferentEntities: sources.filter(item => item.处理类别.startsWith('排除')).length, oldDraftDecisions: decisions.length, externalDraftRecords: posts.length, newExternalSubmissions: 0 }, null, 2));
console.log(JSON.stringify({ oldDrafts: decisions.length, externalRecords: posts.length, uniqueSources: sources.length, newArticles: nextStageInsights.length }, null, 2));
