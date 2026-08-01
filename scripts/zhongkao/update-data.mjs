import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertDataset,
  fetchBytes,
  gradientIndex,
  hashBytes,
  idFromName,
  inferDistrict,
  parseBatch2Pdf,
  parseGeneralAdmissions,
  parseSchoolDirectoryPdf,
  parseScoreBands
} from './data-lib.mjs';
import { BATCH2_PDFS, CONTROL_LINES, INDEX_URL, OFFICIAL_GUIDE_URL, OFFICIAL_QA_URL, SOURCE_PAGES } from './source-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputDir = path.join(root, 'guangzhou-zhongkao', 'data');
const fetchedAt = new Date().toISOString();
const parserVersion = '1.1.1';
const sources = [];
const admissions = [];
const allocations = [];
const bands = [];

function sourceId(year, kind) {
  return `official-${year}-${kind}`;
}

async function fetchHtml(year, kind, url) {
  const result = await fetchBytes(url);
  const text = new TextDecoder('utf-8').decode(result.bytes);
  sources.push({ id: sourceId(year, kind), year, kind, title: `${year}年${kind}`, url, fetchedAt, sha256: result.sha256, parserVersion });
  return text;
}

for (const [yearText, pages] of Object.entries(SOURCE_PAGES)) {
  const year = Number(yearText);
  const scoreHtml = await fetchHtml(year, 'score-bands', pages.scoreBands);
  bands.push(...parseScoreBands(scoreHtml, year, sourceId(year, 'score-bands')));
  for (const batch of [3, 4]) {
    const kind = `batch-${batch}`;
    const html = await fetchHtml(year, kind, pages[`batch${batch}`]);
    admissions.push(...parseGeneralAdmissions(html, year, batch, sourceId(year, kind)));
  }
}

for (const [yearText, url] of Object.entries(BATCH2_PDFS)) {
  const year = Number(yearText);
  const kind = 'batch-2-pdf';
  const result = await fetchBytes(url);
  sources.push({ id: sourceId(year, kind), year, kind, title: `${year}年第二批次名额分配录取分数`, url, fetchedAt, sha256: result.sha256, parserVersion });
  const parsed = await parseBatch2Pdf(result.bytes, year, sourceId(year, kind));
  allocations.push(...parsed);
  process.stdout.write(`${year} batch 2: ${parsed.length} records\n`);
}

const guideKind = 'school-directory-pdf';
const guideSourceId = sourceId(2026, guideKind);
const guideResult = await fetchBytes(OFFICIAL_GUIDE_URL);
sources.push({
  id: guideSourceId,
  year: 2026,
  kind: guideKind,
  title: '2026年广州市高中阶段学校招生报考指南',
  url: OFFICIAL_GUIDE_URL,
  fetchedAt,
  sha256: guideResult.sha256,
  parserVersion
});
const schoolDirectory = await parseSchoolDirectoryPdf(guideResult.bytes, guideSourceId);
if (schoolDirectory.length < 150) {
  throw new Error(`2026年学校校址表仅解析到${schoolDirectory.length}所学校，拒绝发布`);
}
const schoolDirectoryById = new Map(schoolDirectory.map((row) => [row.schoolId, row]));
process.stdout.write(`2026 school directory: ${schoolDirectory.length} records\n`);

const lines = Object.fromEntries(Object.entries(CONTROL_LINES).map(([year, line]) => [year, {
  ...line,
  sourceId: sourceId(Number(year), SOURCE_PAGES[year].controlLines ? 'control-lines' : 'score-bands')
}]));

for (const row of [...admissions, ...allocations]) row.gradientIndex = gradientIndex(row.cutoffScore, lines[row.year]);

const schoolMap = new Map();
for (const row of [...admissions, ...allocations]) {
  const existing = schoolMap.get(row.schoolId);
  if (!existing) {
    schoolMap.set(row.schoolId, {
      id: row.schoolId,
      name: row.schoolName,
      district: row.district || inferDistrict(row.schoolName, row.scope),
      ownership: row.ownership,
      category: row.batch === 2 || row.batch === 3 ? '示范性或优质普通高中' : '普通高中或综合高中',
      admissionScopes: [row.scope],
      boarding: null,
      annualFee: null,
      annualFeeSourceId: null,
      sourceIds: [row.sourceId]
    });
  } else {
    if (!existing.admissionScopes.includes(row.scope)) existing.admissionScopes.push(row.scope);
    if (!existing.sourceIds.includes(row.sourceId)) existing.sourceIds.push(row.sourceId);
    if (existing.district === '未标明' && row.district !== '未标明') existing.district = row.district;
  }
}
for (const school of schoolMap.values()) {
  const location = schoolDirectoryById.get(school.id);
  school.campusDistrict = location?.campusDistrict || null;
  school.campusAddress = location?.campusAddress || null;
  school.campusDistrictSourceId = location?.sourceId || null;
  if (location) {
    school.district = location.campusDistrict;
    if (!school.sourceIds.includes(location.sourceId)) school.sourceIds.push(location.sourceId);
  } else if (school.district === '全市' || school.district === '老三区') {
    school.district = '未核准';
  }
}
const schools = [...schoolMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
const sourceSchools = [...new Map(allocations.map((row) => [row.sourceSchoolId, {
  id: row.sourceSchoolId,
  name: row.sourceSchoolName,
  district: row.district
}])).values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

const metaSources = [
  { id: 'official-index', kind: 'index', title: '广州招考历年分数', url: INDEX_URL },
  { id: 'official-2026-qa', kind: 'policy', title: '2026年广州市中考志愿填报问答', url: OFFICIAL_QA_URL }
];
for (const item of metaSources) sources.push({ ...item, year: 2026, fetchedAt, sha256: null, parserVersion });

assertDataset({ admissions, allocations, bands, schools, lines });

const coverage = Object.fromEntries([2021, 2022, 2023, 2024, 2025, 2026].map((year) => [year, {
  batch2: allocations.filter((row) => row.year === year).length,
  batch3: admissions.filter((row) => row.year === year && row.batch === 3).length,
  batch4: admissions.filter((row) => row.year === year && row.batch === 4).length,
  scoreBands: bands.filter((row) => row.year === year).length
}]));
const schoolLocationDigest = hashBytes(new TextEncoder().encode(JSON.stringify(schoolDirectory)));
const versionSeed = JSON.stringify({ coverage, hashes: sources.map((source) => source.sha256).filter(Boolean), parserVersion, schoolLocationDigest });
const version = `${fetchedAt.slice(0, 10).replaceAll('-', '')}-${hashBytes(new TextEncoder().encode(versionSeed)).slice(0, 8)}`;
const manifest = {
  schemaVersion: '1.0.0',
  version,
  generatedAt: fetchedAt,
  latestPolicyYear: 2026,
  years: [2021, 2022, 2023, 2024, 2025, 2026],
  coverage,
  counts: { schools: schools.length, schoolLocations: schoolDirectory.length, sourceSchools: sourceSchools.length, admissions: admissions.length, allocations: allocations.length, scoreBands: bands.length, sources: sources.length },
  limitations: [
    '2021年第三、第四批及2022年第三批官方页面以图片发布，当前自动数据包仅保留其来源，未来预测对这些统招记录按缺失处理。',
    '官方录取分数表未统一提供每校实际录取人数；相关字段保持为空，不以招生计划推定。',
    '学校住宿、学费及高考表现缺少统一可比口径，未进入机会模型。'
  ]
};

const previousManifest = await fs.readFile(path.join(outputDir, 'manifest.json'), 'utf8')
  .then((value) => JSON.parse(value))
  .catch(() => null);
if (previousManifest && process.env.ALLOW_ZHONGKAO_DATA_DRIFT !== '1') {
  const driftErrors = [];
  const compareCount = (label, previous, current) => {
    if (!Number.isFinite(previous) || previous <= 0 || !Number.isFinite(current)) return;
    const drift = Math.abs(current - previous) / previous;
    if (drift > 0.15) driftErrors.push(`${label}由${previous}变为${current}（${Math.round(drift * 100)}%）`);
  };
  for (const [year, current] of Object.entries(coverage)) {
    const previous = previousManifest.coverage?.[year];
    if (!previous) continue;
    for (const key of ['batch2', 'batch3', 'batch4', 'scoreBands']) {
      compareCount(`${year}.${key}`, previous[key], current[key]);
    }
  }
  for (const key of ['schools', 'sourceSchools', 'admissions', 'allocations', 'scoreBands']) {
    compareCount(`counts.${key}`, previousManifest.counts?.[key], manifest.counts[key]);
  }
  if (driftErrors.length) {
    throw new Error(`数据记录数异常变化超过15%，拒绝覆盖上一版本：${driftErrors.join('；')}。人工确认后可设置 ALLOW_ZHONGKAO_DATA_DRIFT=1 重建。`);
  }
}

await fs.mkdir(outputDir, { recursive: true });
const writeJson = (name, value) => fs.writeFile(path.join(outputDir, name), JSON.stringify(value, null, 2) + '\n', 'utf8');
await Promise.all([
  writeJson('manifest.json', manifest),
  writeJson('schools.json', schools),
  writeJson('source-schools.json', sourceSchools),
  writeJson('admissions.json', admissions),
  writeJson('score-bands.json', bands),
  writeJson('control-lines.json', lines),
  writeJson('sources.json', sources),
  ...Object.keys(SOURCE_PAGES).map((year) => writeJson(`allocations-${year}.json`, allocations.filter((row) => row.year === Number(year))))
]);

process.stdout.write(`Generated ${version}: ${JSON.stringify(manifest.counts)}\n`);
