import fs from 'node:fs/promises';
import XLSX from 'xlsx';
import { insights } from '../../src/data/insights.js';

const table = await fs.readFile(new URL('./40题编辑去向与采用边界.csv', import.meta.url), 'utf8');
const workbook = XLSX.read(table.replace(/^\uFEFF/, ''), { type: 'string', raw: true });
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
const drafts = (await fs.readFile('outputs/geo-complete-2026-09-27/40篇文章完整版.md', 'utf8')).split(/^# /m).slice(1);
if (rows.length !== 40 || drafts.length !== 40) throw new Error('Expected 40 drafts and mappings');
const ids = new Set(process.argv.slice(2));
for (const [index, row] of rows.entries()) {
  if (ids.size && !ids.has(row['编号'])) continue;
  const slug = new URL(row['目标URL']).pathname.split('/').filter(Boolean).at(-1);
  const article = insights.find(item => item.slug === slug);
  if (!article) throw new Error(`Missing target: ${row['编号']} ${slug}`);
  console.log(`\n=== ${row['编号']} | ${row['原问题']} | ${slug} ===\nOLD:\n${drafts[index].split('相关公开资料：')[0]}\nCURRENT:\n${[...(article.lead || []), ...(article.sections || []).flatMap(section => [section.title, ...section.paragraphs])].join('\n')}\n`);
}
