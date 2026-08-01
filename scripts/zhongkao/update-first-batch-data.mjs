import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchBytes, hashBytes, htmlRows, idFromName, inferDistrict, numeric } from './data-lib.mjs';
import {
  AUTONOMOUS_MASTER_URL,
  AUTONOMOUS_POLICY_URL,
  AUTONOMOUS_QUALIFICATION_URL,
  FIRST_BATCH_RESULT_URL,
  OFFICIAL_GUIDE_URL,
  OFFICIAL_QA_URL,
  SPECIAL_TALENT_NOTICE_URL
} from './source-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputFile = path.join(root, 'guangzhou-zhongkao', 'data', 'first-batch-2026.json');
const generatedAt = new Date().toISOString();
const parserVersion = '1.1.0';
const DISTRICTS = ['荔湾区', '越秀区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'];
const SCORE_LINES_2026 = {
  '普通高中第一梯度投档控制线': 712,
  '普通高中第二梯度投档控制线': 672,
  '普通高中第三梯度投档控制线': 632,
  '普通高中第四梯度投档控制线': 592,
  '普通高中第五梯度投档控制线': 552,
  '普通高中第六梯度投档控制线': 512,
  '公办普通高中录取最低控制线': 492,
  '民办普通高中录取最低控制线': 412,
  '优秀体育后备人才录取最低控制线': 394
};

function normalizeText(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSchoolName(value = '') {
  return value
    .replace(/[\s　]+/g, '')
    .replace(/^(?:性质|学校名称)/, '')
    .replace(/(?:公办|民办|中外合作)$/, '')
    .trim();
}

function scoreReference(requirements = []) {
  const scores = requirements
    .map((requirement) => SCORE_LINES_2026[requirement])
    .filter(Number.isFinite);
  if (!scores.length) {
    return {
      minimum: null,
      maximum: null,
      display: requirements.includes('无') ? '以专业测试为主' : '以项目规则为准',
      basis: '未设置可直接换算的文化分控制线'
    };
  }
  const minimum = Math.min(...scores);
  const maximum = Math.max(...scores);
  return {
    minimum,
    maximum,
    display: minimum === maximum ? `${minimum}分以上` : `${minimum}—${maximum}分`,
    basis: minimum === maximum ? '按该校项目的2026官方控制线换算' : '该校不同项目控制线不同，按最低至最高范围展示'
  };
}

function parseTalentResults(html, specialTalent) {
  const rows = htmlRows(html);
  const resultHeader = (cells) => cells[0] === '序号'
    && cells[1] === '学校名称'
    && cells[4] === '末位考生合成成绩';
  const ordinaryHeaderIndex = rows.findIndex((cells) => resultHeader(cells) && cells.length === 5);
  const footballHeaderIndex = rows.findIndex((cells, index) => index > ordinaryHeaderIndex && resultHeader(cells) && cells.length >= 6);
  if (ordinaryHeaderIndex < 0 || footballHeaderIndex < 0) throw new Error('第一批特长生录取结果表头缺失，拒绝发布');

  const readDataRows = (startIndex) => {
    const records = [];
    for (let index = startIndex + 1; index < rows.length; index += 1) {
      if (!/^\d+$/.test(rows[index][0] || '')) break;
      records.push(rows[index]);
    }
    return records;
  };
  const candidates = [...specialTalent].sort((a, b) => b.schoolName.length - a.schoolName.length);
  return [
    ...readDataRows(ordinaryHeaderIndex).map((cells) => ({ cells, resultType: '普通高中特长生' })),
    ...readDataRows(footballHeaderIndex).map((cells) => ({ cells, resultType: '足球人才培养改革试点' }))
  ].map(({ cells, resultType }) => {
    const school = candidates.find((candidate) => cells[1].startsWith(candidate.schoolName));
    if (!school) throw new Error(`第一批特长生录取结果无法匹配学校：${cells[1]}`);
    return {
      sequence: Number(cells[0]),
      schoolId: school.schoolId,
      schoolName: school.schoolName,
      fullProjectName: cells[1],
      resultType,
      ownership: cells[2],
      scope: cells[3],
      compositeScore: numeric(cells[4]),
      professionalTestScore: numeric(cells[5]),
      sourceId: 'official-2026-first-batch-result'
    };
  });
}

function joinColumn(items, minX, maxX, lowerY, upperY, separator = '') {
  return items
    .filter((item) => item.x >= minX && item.x < maxX && item.y > lowerY && item.y <= upperY)
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((item) => item.str.trim())
    .filter(Boolean)
    .join(separator)
    .replace(/[\s　]+/g, separator ? ' ' : '')
    .trim();
}

function rowAnchors(items) {
  return items
    .filter((item) => item.x >= 55 && item.x < 75 && /^\d{1,3}$/.test(item.str) && item.y > 35 && item.y < 500)
    .sort((a, b) => b.y - a.y);
}

async function pdfPageItems(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  const items = content.items
    .filter((item) => item.str?.trim())
    .map((item) => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5] }));
  page.cleanup();
  return items;
}

async function parseGuideTables(bytes) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const specialTalent = [];
  const autonomousGuide = [];

  for (let pageNumber = 37; pageNumber <= 54; pageNumber += 1) {
    const items = await pdfPageItems(pdf, pageNumber);
    const anchors = rowAnchors(items);
    const specialHeaderFloor = Math.min(
      ...items
        .filter((item) => item.x >= 350 && item.x < 385 && item.str.includes('子女') && item.y > anchors[0].y)
        .map((item) => item.y),
      999
    );
    for (let index = 0; index < anchors.length; index += 1) {
      const anchor = anchors[index];
      const upperY = index === 0
        ? Math.min(500, anchor.y + 42, specialHeaderFloor - 2)
        : (anchors[index - 1].y + anchor.y) / 2;
      const lowerY = index === anchors.length - 1 ? 35 : (anchor.y + anchors[index + 1].y) / 2;
      const schoolName = normalizeSchoolName(joinColumn(items, 74, 155, lowerY, upperY));
      if (!schoolName || /学校名称|招生学校/.test(schoolName)) continue;
      const ownership = joinColumn(items, 155, 175, lowerY, upperY).includes('民办') ? '民办' : '公办';
      const districtRaw = joinColumn(items, 220, 250, lowerY, upperY);
      const district = DISTRICTS.find((item) => districtRaw.includes(item)) || inferDistrict(schoolName, '');
      const scopeRaw = joinColumn(items, 325, 350, lowerY, upperY);
      const scope = /^(?:全市)+$/.test(scopeRaw) ? '全市' : (scopeRaw || '以官方计划表为准');
      const migrantScopeRaw = joinColumn(items, 350, 385, lowerY, upperY);
      const migrantScope = /优秀体育后备人才/.test(migrantScopeRaw) ? null : (migrantScopeRaw || null);
      const projectSummary = joinColumn(items, 385, 478, lowerY, upperY, ' ')
        .replace(/\[|\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const projectPlanNumbers = items
        .filter((item) => item.x >= 478 && item.x < 515 && item.y > lowerY && item.y <= upperY)
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((item) => numeric(item.str))
        .filter((value) => Number.isFinite(value));
      const cutoffRequirements = items
        .filter((item) => item.x >= 515 && item.x < 640 && item.y > lowerY && item.y <= upperY)
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((item) => item.str.replace(/\s+/g, ''))
        .filter((value, itemIndex, values) => value && values.indexOf(value) === itemIndex);
      const totalPlan = items
        .filter((item) => item.x >= 640 && item.x < 675 && item.y > lowerY && item.y <= upperY)
        .map((item) => ({ value: numeric(item.str), distance: Math.abs(item.y - anchor.y) }))
        .filter((item) => Number.isFinite(item.value) && item.value > 0 && item.value <= 500)
        .sort((a, b) => a.distance - b.distance)[0]?.value ?? null;
      specialTalent.push({
        id: `talent-${pageNumber}-${index + 1}`,
        schoolId: idFromName(schoolName),
        schoolName,
        ownership,
        district,
        pathway: schoolName.includes('中本贯通') ? '中本贯通试点' : '普通高中特长生',
        scope,
        migrantScope,
        projectSummary: projectSummary || '项目以官方计划表为准',
        projectPlanNumbers,
        totalPlan,
        cutoffRequirements,
        sourceId: 'official-2026-guide',
        sourcePage: pageNumber
      });
    }
  }

  for (let pageNumber = 55; pageNumber <= 57; pageNumber += 1) {
    const items = await pdfPageItems(pdf, pageNumber);
    const anchors = rowAnchors(items);
    for (let index = 0; index < anchors.length; index += 1) {
      const anchor = anchors[index];
      const upperY = anchor.y + 13;
      const lowerY = index === anchors.length - 1 ? 35 : anchors[index + 1].y + 5;
      const schoolName = normalizeSchoolName(joinColumn(items, 74, 160, lowerY, upperY));
      if (!schoolName || /学校名称|招生学校/.test(schoolName)) continue;
      const autonomousDistrictRaw = joinColumn(items, 230, 260, lowerY, upperY);
      autonomousGuide.push({
        sequence: Number(anchor.str),
        schoolId: idFromName(schoolName),
        schoolName,
        ownership: joinColumn(items, 160, 185, lowerY, upperY).includes('民办') ? '民办' : '公办',
        district: DISTRICTS.find((item) => autonomousDistrictRaw.includes(item)) || inferDistrict(schoolName, ''),
        scope: joinColumn(items, 440, 480, lowerY, upperY) || '以学校简章为准',
        plan: numeric(joinColumn(items, 480, 515, lowerY, upperY)),
        migrantPlanCap: numeric(joinColumn(items, 515, 550, lowerY, upperY)),
        cutoff: joinColumn(items, 550, 625, lowerY, upperY, ' '),
        referenceGrade: joinColumn(items, 625, 655, lowerY, upperY),
        sourceId: 'official-2026-guide',
        sourcePage: pageNumber
      });
    }
  }
  await loadingTask.destroy();
  return { specialTalent, autonomousGuide };
}

function parseAutonomousMaster(html) {
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  const records = [];
  for (const row of rows) {
    const cells = [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1]);
    if (!/^\d+$/.test(normalizeText(cells[0] || '')) || cells.length < 7) continue;
    const prospectusUrl = row.match(/href=["'](https:\/\/gzzk\.gz\.gov\.cn\/attachment\/[^"']+\.pdf)["']/i)?.[1] || null;
    records.push({
      sequence: Number(normalizeText(cells[0])),
      schoolName: normalizeSchoolName(normalizeText(cells[1])),
      affiliation: normalizeText(cells[2]),
      plan: numeric(normalizeText(cells[3])),
      cutoff: normalizeText(cells[4]),
      referenceGrade: normalizeText(cells[5]),
      prospectusUrl
    });
  }
  return records;
}

const [guideResult, masterResult, firstBatchResult] = await Promise.all([
  fetchBytes(OFFICIAL_GUIDE_URL),
  fetchBytes(AUTONOMOUS_MASTER_URL),
  fetchBytes(FIRST_BATCH_RESULT_URL)
]);
const masterHtml = new TextDecoder('utf-8').decode(masterResult.bytes);
const firstBatchHtml = new TextDecoder('utf-8').decode(firstBatchResult.bytes);
const { specialTalent, autonomousGuide } = await parseGuideTables(guideResult.bytes);
const autonomousMaster = parseAutonomousMaster(masterHtml);
const talentResults = parseTalentResults(firstBatchHtml, specialTalent);

for (const row of specialTalent) row.scoreReference = scoreReference(row.cutoffRequirements);

if (specialTalent.length < 110) throw new Error(`特长生表仅解析到${specialTalent.length}条，拒绝发布`);
if (talentResults.length < 375) throw new Error(`特长生录取结果仅解析到${talentResults.length}条，拒绝发布`);
if (autonomousGuide.length !== 56 || autonomousMaster.length !== 56) {
  throw new Error(`自主招生学校数量异常：指南${autonomousGuide.length}，汇总页${autonomousMaster.length}，拒绝发布`);
}

const autonomous = autonomousGuide.map((guideRow, index) => {
  const masterRow = autonomousMaster[index];
  if (!masterRow || masterRow.schoolName !== guideRow.schoolName) {
    throw new Error(`自主招生第${index + 1}所学校无法匹配：${guideRow.schoolName} / ${masterRow?.schoolName || '缺失'}`);
  }
  return {
    ...guideRow,
    plan: masterRow.plan ?? guideRow.plan,
    cutoff: masterRow.cutoff || guideRow.cutoff,
    referenceGrade: masterRow.referenceGrade || guideRow.referenceGrade,
    affiliation: masterRow.affiliation,
    prospectusUrl: masterRow.prospectusUrl,
    sourceIds: ['official-2026-guide', 'official-2026-autonomous-master']
  };
});
if (autonomous.some((row) => !row.prospectusUrl)) throw new Error('存在缺少官方简章链接的自主招生学校，拒绝发布');

const sources = [
  { id: 'official-2026-guide', title: '2026年广州市高中阶段学校招生报考指南', url: OFFICIAL_GUIDE_URL, sha256: guideResult.sha256 },
  { id: 'official-2026-qa', title: '2026年广州市中考志愿填报问答', url: OFFICIAL_QA_URL, sha256: null },
  { id: 'official-2026-autonomous-policy', title: '2026年广州市普通高中自主招生工作通知', url: AUTONOMOUS_POLICY_URL, sha256: null },
  { id: 'official-2026-autonomous-master', title: '2026年普通高中自主招生计划和招生简章汇总表', url: AUTONOMOUS_MASTER_URL, sha256: masterResult.sha256 },
  { id: 'official-2026-autonomous-qualification', title: '2026年自主招生报名资格审核通过名单', url: AUTONOMOUS_QUALIFICATION_URL, sha256: null },
  { id: 'official-2026-talent-notice', title: '2026年普通高中特长生招生计划通知', url: SPECIAL_TALENT_NOTICE_URL, sha256: null },
  { id: 'official-2026-first-batch-result', title: '2026年普通高中第一批次录取结果', url: FIRST_BATCH_RESULT_URL, sha256: firstBatchResult.sha256 }
].map((source) => ({ ...source, fetchedAt: generatedAt, parserVersion }));

const digest = hashBytes(new TextEncoder().encode(JSON.stringify({
  guide: guideResult.sha256,
  master: masterResult.sha256,
  firstBatchResult: firstBatchResult.sha256,
  specialCount: specialTalent.length,
  talentResultCount: talentResults.length,
  autonomousCount: autonomous.length,
  parserVersion
})));
const payload = {
  schemaVersion: '1.0.0',
  version: `2026-${digest.slice(0, 10)}`,
  year: 2026,
  generatedAt,
  parserVersion,
  counts: {
    specialTalentEntries: specialTalent.length,
    generalHighSchoolTalentEntries: specialTalent.filter((row) => row.pathway === '普通高中特长生').length,
    talentResultEntries: talentResults.length,
    autonomousSchools: autonomous.length
  },
  commonEligibility: {
    firstBatchVolunteerSlots: { specialTalent: 1, autonomous: 1 },
    autonomousRegistrationSchoolLimit: 2,
    notes: [
      '特长生须参加并通过对应招生学校、对应项目的专业测试，方可填报相应志愿。',
      '自主招生须先报名并通过学校资格审核，取得综合能力考核资格后方可填报相应志愿。',
      '自主招生通用对象为具有广州市户籍或学籍的应届初中毕业生；报考公办普通高中还须符合公办普通高中报考条件。',
      '第一批次被录取后，不再参加后续批次投档录取。'
    ]
  },
  specialTalent,
  talentResults,
  autonomous,
  sources,
  limitations: [
    '本数据用于通用资格初筛，不代表考生已取得专业测试或综合能力考核资格。',
    '特长生项目存在项目级测试和控制要求；自主招生存在学校个性化报名条件，均须以学校当年官方简章和中考服务平台审核结果为准。',
    '中本贯通试点记录保留在原始表中并单独标记，不纳入普通高中特长生默认筛选。'
  ]
};

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');
process.stdout.write(`Generated ${path.relative(root, outputFile)}: ${JSON.stringify(payload.counts)}\n`);
