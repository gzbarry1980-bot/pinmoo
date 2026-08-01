import { createHash } from 'node:crypto';
import * as XLSX from 'xlsx';

const DISTRICTS = ['荔湾区', '越秀区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区'];

export function cleanHtml(value = '') {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&mdash;|&ndash;/gi, '—')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function htmlRows(html) {
  return [...html.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
    .map((row) => [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanHtml(cell[1])))
    .filter((cells) => cells.length);
}

export function numeric(value) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
  if (!normalized) return null;
  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

export function parseXlsxRows(bytes, sheetName = null) {
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: false });
  const selectedName = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[selectedName];
  if (!sheet) throw new Error(`XLSX工作表不存在：${selectedName}`);
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
}

export function idFromName(name) {
  return 'gz-' + createHash('sha1').update(normalizeSchoolName(name)).digest('hex').slice(0, 12);
}

export function normalizeSchoolName(name = '') {
  return name.replace(/[\s　]+/g, '').replace(/[（(]校本部[）)]/g, '').trim();
}

export function inferDistrict(name = '', scope = '') {
  for (const district of DISTRICTS) {
    if (scope.includes(district) || name.includes(district.replace('区', ''))) return district;
  }
  if (scope.includes('老三区')) return '老三区';
  return scope.includes('全市') ? '全市' : '未标明';
}

export function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export async function fetchBytes(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Pinmoo-Guangzhou-Zhongkao-Data/1.0 (+https://zhongkao.pinmooconsulting.com/)' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, contentType: response.headers.get('content-type') || '', sha256: hashBytes(bytes) };
}

export function parseGeneralAdmissions(html, year, batch, sourceId) {
  const records = [];
  const rows = htmlRows(html);
  for (const cells of rows) {
    if (!/^\d+$/.test(cells[0] || '') || cells.length < 9) continue;
    const schoolName = normalizeSchoolName(cells[1]);
    const ownership = cells[2]?.includes('民办') ? '民办' : '公办';
    const scope = cells[3] || '未标明';
    const groups = [
      { candidateType: '户籍生', offset: 4 },
      { candidateType: '随迁子女', offset: 9 },
      { candidateType: '外区生', offset: 14 }
    ];
    for (const group of groups) {
      const cutoffScore = numeric(cells[group.offset]);
      if (cutoffScore === null || cutoffScore < 300 || cutoffScore > 810) continue;
      records.push({
        year,
        batch,
        category: batch === 3 ? '示范性高中统招' : '普通高中及综合高中',
        schoolId: idFromName(schoolName),
        schoolName,
        ownership,
        scope,
        district: inferDistrict(schoolName, scope),
        candidateType: group.candidateType,
        sourceSchoolId: null,
        sourceSchoolName: null,
        quota: null,
        admittedCount: null,
        cutoffScore,
        cutoffTieRank: numeric(cells[group.offset + 1]),
        lastVolunteerNo: numeric(cells[group.offset + 2]),
        lastCandidateScore: numeric(cells[group.offset + 3]),
        lastCandidateTieRank: numeric(cells[group.offset + 4]),
        sourceId
      });
    }
  }
  return records;
}

export function parseScoreBands(html, year, sourceId) {
  const records = [];
  for (const cells of htmlRows(html)) {
    if (!/^\d+$/.test(cells[0] || '') || cells.length < 4) continue;
    const score = numeric(cells[1]);
    const cumulative = numeric(cells[2]);
    const ratio = numeric(cells[3]);
    if (score === null || cumulative === null || ratio === null || score > 810) continue;
    records.push({ year, score, cumulative, cumulativeRatio: ratio / 100, sourceId });
  }
  return records.sort((a, b) => b.score - a.score);
}

function joinColumn(items, minX, maxX, lowerY, upperY) {
  return items
    .filter((item) => item.x >= minX && item.x < maxX && item.y > lowerY && item.y <= upperY)
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map((item) => item.str.trim())
    .filter(Boolean)
    .join('')
    .replace(/\s+/g, '');
}

export async function parseBatch2Pdf(bytes, year, sourceId) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const records = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => item.str?.trim())
      .map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5] }));
    const scoreItems = items
      .filter((item) => item.x >= 350 && item.x < 400 && /^\d{3}$/.test(item.str.trim()))
      .filter((item) => Number(item.str) >= 300 && Number(item.str) <= 810)
      .sort((a, b) => b.y - a.y);
    for (let index = 0; index < scoreItems.length; index += 1) {
      const scoreItem = scoreItems[index];
      // Table rows with no admitted candidate have no score. Using neighbouring
      // score rows as boundaries would therefore absorb those blank rows. A
      // fixed band captures wrapped school names (normally y +/- 7) without
      // crossing into the next physical table row.
      const upperY = scoreItem.y + 8.5;
      const lowerY = scoreItem.y - 8.5;
      const schoolName = normalizeSchoolName(joinColumn(items, 0, 175, lowerY, upperY));
      const sourceSchoolName = normalizeSchoolName(joinColumn(items, 175, 350, lowerY, upperY));
      if (!schoolName || !sourceSchoolName || /招生学校|送生学校|第\d+页/.test(schoolName + sourceSchoolName)) continue;
      const sameLine = items.filter((item) => Math.abs(item.y - scoreItem.y) <= 2.5);
      const numberAt = (minX, maxX) => numeric(sameLine.find((item) => item.x >= minX && item.x < maxX)?.str);
      records.push({
        year,
        batch: 2,
        category: '名额分配',
        schoolId: idFromName(schoolName),
        schoolName,
        ownership: '公办',
        scope: '送生初中',
        district: inferDistrict(sourceSchoolName, sourceSchoolName),
        candidateType: '户籍生',
        sourceSchoolId: idFromName(sourceSchoolName),
        sourceSchoolName,
        quota: null,
        admittedCount: null,
        cutoffScore: Number(scoreItem.str),
        cutoffTieRank: numberAt(395, 435),
        lastCandidateScore: numberAt(435, 475),
        lastVolunteerNo: numberAt(475, 510),
        lastCandidateTieRank: numberAt(510, 555),
        sourceId
      });
    }
    page.cleanup();
  }
  await loadingTask.destroy();
  return records;
}

export async function parseSchoolDirectoryPdf(bytes, sourceId) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  const records = [];
  let inGeneralSchoolSection = false;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => item.str?.trim())
      .map((item) => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5] }));
    const pageText = items.map((item) => item.str).join('').replace(/\s+/g, '');
    if (pageText.includes('招生批次：第三批次') && pageText.includes('校址所在区')) inGeneralSchoolSection = true;
    if (pageText.includes('招生批次：第一批次（中本贯通）')) inGeneralSchoolSection = false;
    if (!inGeneralSchoolSection) {
      page.cleanup();
      continue;
    }
    if (!pageText.includes('学校名称') || !pageText.includes('校址') || !pageText.includes('所在区')) {
      page.cleanup();
      continue;
    }

    const districtHeader = items.find((item) => item.str.replace(/\s+/g, '') === '所在区');
    const phoneHeader = items.find((item) => item.str.replace(/\s+/g, '') === '联系电话');
    if (!districtHeader || !phoneHeader) {
      page.cleanup();
      continue;
    }

    const anchors = items
      .filter((item) => item.x >= 55 && item.x < 75 && /^\d{1,3}$/.test(item.str))
      .sort((a, b) => b.y - a.y);
    for (let anchorIndex = 0; anchorIndex < anchors.length; anchorIndex += 1) {
      const anchor = anchors[anchorIndex];
      const upperY = anchorIndex === 0 ? anchor.y + 14 : (anchors[anchorIndex - 1].y + anchor.y) / 2;
      const lowerY = anchorIndex === anchors.length - 1 ? anchor.y - 14 : (anchor.y + anchors[anchorIndex + 1].y) / 2;
      const districtItem = items.find((item) => (
        Math.abs(item.y - anchor.y) <= 1.2
        && Math.abs(item.x - districtHeader.x) <= 6
        && /^[\u4e00-\u9fa5]{1,8}(?:区|市)$/.test(item.str.replace(/\s+/g, ''))
      ));
      if (!districtItem) continue;

      const rowItems = items.filter((item) => item.y < upperY && item.y >= lowerY);
      const schoolName = normalizeSchoolName(rowItems
        .filter((item) => item.x >= 75 && item.x < 155)
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((item) => item.str)
        .join('')).replace(/(?:公办|民办|中外合作)$/g, '');
      if (!schoolName || /学校名称|学校性质|学校类别/.test(schoolName)) continue;

      const address = rowItems
        .filter((item) => item.x >= districtHeader.x + 18 && item.x < phoneHeader.x - 12)
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((item) => item.str.trim())
        .filter(Boolean)
        .join('')
        .replace(/\s+/g, '');
      records.push({
        schoolId: idFromName(schoolName),
        schoolName,
        campusDistrict: districtItem.str.replace(/\s+/g, ''),
        campusAddress: address || null,
        sourceId,
        sourcePage: pageNumber
      });
    }
    page.cleanup();
  }
  await loadingTask.destroy();

  return [...new Map(records.map((record) => [record.schoolId, record])).values()];
}

export function gradientIndex(score, line) {
  if (!line) return null;
  for (let index = 0; index < line.gradients.length; index += 1) {
    if (score >= line.gradients[index]) return index + 1;
  }
  if (score >= line.publicMinimum) return line.gradients.length + 1;
  return line.gradients.length + 2;
}

export function assertDataset({ admissions, allocations, bands, schools, lines }) {
  const failures = [];
  if (new Set(schools.map((school) => school.id)).size !== schools.length) failures.push('学校主键不唯一');
  if (!admissions.length) failures.push('第三、第四批次数据为空');
  if (!allocations.length) failures.push('第二批次数据为空');
  for (const row of [...admissions, ...allocations]) {
    if (row.cutoffScore < 300 || row.cutoffScore > 810) failures.push(`录取分数越界：${row.schoolName}`);
  }
  for (const year of Object.keys(lines)) {
    const gradients = lines[year].gradients;
    if (gradients.some((value, index) => index > 0 && gradients[index - 1] - value !== 40)) failures.push(`${year}梯度间隔异常`);
  }
  const bandsByYear = new Map();
  for (const item of bands) {
    if (!bandsByYear.has(item.year)) bandsByYear.set(item.year, []);
    bandsByYear.get(item.year).push(item);
  }
  for (const yearBands of bandsByYear.values()) {
    for (let index = 1; index < yearBands.length; index += 1) {
      if (yearBands[index].cumulative < yearBands[index - 1].cumulative) failures.push(`${yearBands[index].year}分数段累计人数非单调`);
    }
  }
  if (failures.length) throw new Error(failures.join('\n'));
}
