import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBytes, htmlRows, normalizeSchoolName, numeric } from './data-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dataDir = path.join(root, 'guangzhou-zhongkao', 'data');
const outputFile = path.join(dataDir, 'autonomous-results.json');
const parserVersion = '1.0.0';
const sources = [
  {
    year: 2026,
    id: 'official-2026-first-batch-result',
    title: '2026年普通高中第一批次录取结果（自主招生）',
    url: 'https://gzzk.gz.gov.cn/zkzz/zkxx/lnfs/content/post_10908006.html'
  },
  {
    year: 2025,
    id: 'official-2025-first-batch-result',
    title: '2025年普通高中第一批次录取结果（自主招生）',
    url: 'https://gzzk.gz.gov.cn/zkzz/zkxx/lnfs/content/post_10363521.html'
  }
];

function resultSchoolName(value = '') {
  return normalizeSchoolName(String(value).replace(/[（(]自主招生[）)]$/, ''));
}

function sourceSchoolMap(records) {
  return new Map(records.map((record) => [normalizeSchoolName(record.schoolName), record]));
}

function parseRows(html, source, knownSchools) {
  const rows = htmlRows(new TextDecoder().decode(html));
  const headerIndex = rows.findIndex((cells) => cells[0] === '序号'
    && cells[4] === '户籍生自主招生末位考生合成成绩'
    && cells[5] === '非户籍生自主招生末位考生合成成绩');
  if (headerIndex < 0) throw new Error(`${source.year}年自主招生结果表头缺失，拒绝生成`);
  const records = [];
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const cells = rows[index];
    if ((cells?.[0] || '').startsWith('说明')) break;
    if (!/^\d+$/.test(cells?.[0] || '') || cells.length < 5) continue;
    const sourceSchoolName = resultSchoolName(cells[1]);
    const known = knownSchools.get(sourceSchoolName);
    records.push({
      year: source.year,
      sequence: Number(cells[0]),
      schoolId: known?.schoolId || null,
      schoolName: known?.schoolName || sourceSchoolName,
      sourceSchoolName,
      ownership: cells[2] || null,
      scope: cells[3] || null,
      householdCompositeScore: numeric(cells[4]),
      nonHouseholdCompositeScore: numeric(cells[5]),
      sourceId: source.id,
      sourceUrl: source.url,
      matchNote: known ? null : '官方历史名称或校区口径与2026名单不同，未强行合并'
    });
  }
  if (records.length < 50) throw new Error(`${source.year}年自主招生结果记录数异常：${records.length}`);
  return records;
}

const firstBatch = JSON.parse(await fs.readFile(path.join(dataDir, 'first-batch-2026.json'), 'utf8'));
const knownSchools = sourceSchoolMap(firstBatch.autonomous);
const outputSources = [];
const records = [];
for (const source of sources) {
  const fetched = await fetchBytes(source.url);
  outputSources.push({
    ...source,
    sha256: fetched.sha256,
    fetchedAt: new Date().toISOString(),
    parserVersion
  });
  records.push(...parseRows(fetched.bytes, source, knownSchools));
}

const output = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  parserVersion,
  years: [...new Set(records.map((record) => record.year))].sort(),
  scoreModel: {
    maximum: 100,
    middleSchoolStudyScoreWeight: 0.7,
    schoolAssessmentWeight: 0.3,
    note: '自主招生合成成绩不是中考总分；须先满足学校公布的最低控制线和参考科目等级要求。'
  },
  notes: [
    '“--”表示该考生口径或该招生计划没有考生被录取。',
    '历史名称或校区发生变化时不强行合并，避免把不同招生口径误当作同一学校。'
  ],
  counts: {
    records: records.length,
    matchedSchoolRecords: records.filter((record) => record.schoolId).length,
    unmatchedHistoricalNames: records.filter((record) => !record.schoolId).length
  },
  sources: outputSources,
  records
};
await fs.writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outputFile}: ${records.length} records`);
