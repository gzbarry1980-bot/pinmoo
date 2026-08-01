const FALLBACK_SCHOOLS = [
  { id: 'fallback-gz-gz', name: '广东广雅中学（荔湾校区）', district: '荔湾区', ownership: '公办' },
  { id: 'fallback-gz-zx', name: '广州市执信中学（执信路校区）', district: '越秀区', ownership: '公办' },
  { id: 'fallback-gz-lz', name: '广州市铁一中学（越秀校区）', district: '越秀区', ownership: '公办' },
  { id: 'fallback-gz-lzpy', name: '广州市铁一中学（番禺校区）', district: '番禺区', ownership: '公办' },
  { id: 'fallback-gz-lzby', name: '广州市铁一中学（白云校区）', district: '白云区', ownership: '公办' },
  { id: 'fallback-gz-lz6', name: '广州市第六中学（海珠校区）', district: '海珠区', ownership: '公办' },
  { id: 'fallback-gz-qh', name: '清华附中湾区学校（智谷校区）', district: '全市', ownership: '公办' },
  { id: 'fallback-gz-16', name: '广州市第十六中学', district: '越秀区', ownership: '公办' }
];

const FALLBACK_RECORDS = [
  { schoolId: 'fallback-gz-gz', schoolName: '广东广雅中学（荔湾校区）', district: '荔湾区', cutoffScore: 733, lastVolunteerNo: 1, gradientIndex: 1 },
  { schoolId: 'fallback-gz-zx', schoolName: '广州市执信中学（执信路校区）', district: '越秀区', cutoffScore: 732, lastVolunteerNo: 1, gradientIndex: 1 },
  { schoolId: 'fallback-gz-lz', schoolName: '广州市铁一中学（越秀校区）', district: '越秀区', cutoffScore: 638, lastVolunteerNo: 6, gradientIndex: 3 },
  { schoolId: 'fallback-gz-lzpy', schoolName: '广州市铁一中学（番禺校区）', district: '番禺区', cutoffScore: 710, lastVolunteerNo: 1, gradientIndex: 2 },
  { schoolId: 'fallback-gz-lzby', schoolName: '广州市铁一中学（白云校区）', district: '白云区', cutoffScore: 712, lastVolunteerNo: 2, gradientIndex: 1 },
  { schoolId: 'fallback-gz-lz6', schoolName: '广州市第六中学（海珠校区）', district: '海珠区', cutoffScore: 726, lastVolunteerNo: 1, gradientIndex: 1 },
  { schoolId: 'fallback-gz-qh', schoolName: '清华附中湾区学校（智谷校区）', district: '全市', cutoffScore: 712, lastVolunteerNo: 3, gradientIndex: 1 },
  { schoolId: 'fallback-gz-16', schoolName: '广州市第十六中学', district: '越秀区', cutoffScore: 712, lastVolunteerNo: 3, gradientIndex: 1 }
];

let datasetPromise;

function appConfig() {
  const app = getApp();
  return app && app.globalData ? app.globalData : {};
}

function requestJson(path) {
  const base = String(appConfig().dataBaseUrl || '').replace(/\/$/, '');
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}/data/${path}`,
      timeout: 12000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject(new Error(`数据请求失败：${res.statusCode}`));
      },
      fail: reject
    });
  });
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.records)) return value.records;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

function fallbackDataset(errorMessage) {
  return {
    schools: FALLBACK_SCHOOLS,
    admissions: FALLBACK_RECORDS.map((record) => ({ ...record, year: 2026, batch: 3, candidateType: '户籍生', sourceId: 'mini-fallback' })),
    allocations: [],
    bands: [{ year: 2026, score: 700, cumulativeRatio: 0.1 }, { year: 2026, score: 650, cumulativeRatio: 0.5 }, { year: 2026, score: 600, cumulativeRatio: 0.9 }],
    lines: { 2026: { gradients: [707, 667, 627, 587, 547], publicMinimum: 497, privateMinimum: 497 } },
    manifest: { latestPolicyYear: 2026, years: [2026], version: 'fallback', limitations: [errorMessage || '当前使用体验数据，请联网后刷新。'] },
    isFallback: true
  };
}

function loadDataset(force = false) {
  if (datasetPromise && !force) return datasetPromise;
  const allocationFiles = [2021, 2022, 2023, 2024, 2025, 2026].map((year) => requestJson(`allocations-${year}.json`));
  datasetPromise = Promise.all([
    requestJson('schools.json'),
    requestJson('admissions.json'),
    requestJson('manifest.json'),
    requestJson('score-bands.json'),
    requestJson('control-lines.json'),
    ...allocationFiles
  ])
    .then(([schools, admissions, manifest, bands, lines, ...allocations]) => ({
      schools: asArray(schools),
      admissions: asArray(admissions),
      allocations: allocations.flatMap(asArray),
      bands: asArray(bands),
      lines,
      manifest,
      isFallback: false
    }))
    .catch((error) => fallbackDataset(error && error.message));
  return datasetPromise;
}

function candidateTypeFor(profile) {
  if (profile && profile.candidateType) return profile.candidateType;
  return '户籍生';
}

function recordForSchool(records, schoolId, candidateType) {
  const matched = records.filter((record) => record.schoolId === schoolId && (!record.candidateType || record.candidateType === candidateType));
  if (!matched.length) return null;
  return matched.sort((a, b) => (b.year || 0) - (a.year || 0))[0];
}

function latestRecords(dataset, profile) {
  const candidateType = candidateTypeFor(profile);
  const allRecords = [...(dataset.admissions || []), ...(dataset.allocations || [])];
  const records = allRecords.filter((record) => {
    const year = Number(record.year);
    const batch = Number(record.batch);
    return year === 2026 && batch >= 2 && batch <= 4 && (!record.candidateType || record.candidateType === candidateType) && Number.isFinite(Number(record.cutoffScore));
  });
  const map = {};
  records.forEach((record) => {
    const key = `${record.schoolId || record.schoolName}|${record.batch}`;
    const old = map[key];
    if (!old || Number(record.cutoffScore) < Number(old.cutoffScore) || Number(record.lastVolunteerNo || 99) > Number(old.lastVolunteerNo || 0)) map[key] = record;
  });
  return Object.values(map);
}

function classify(cutoff, center) {
  const gap = Number(cutoff) - center;
  if (gap >= 15) return { label: '冲刺', tone: 'rush', reason: `门槛高于中心估分约${Math.round(gap)}分` };
  if (gap <= -12) return { label: '保底', tone: 'safe', reason: `门槛低于中心估分约${Math.round(Math.abs(gap))}分` };
  return { label: '匹配', tone: 'match', reason: `与中心估分差距约${Math.round(Math.abs(gap))}分` };
}

function familyKey(name) {
  return String(name || '').replace(/[（(].*$/u, '').replace(/\s+/g, '').trim();
}

function buildDraft(profile, dataset) {
  const lower = Math.min(Number(profile.lower) || 0, Number(profile.upper) || 0);
  const upper = Math.max(Number(profile.lower) || 0, Number(profile.upper) || 0);
  const center = Math.round((lower + upper) / 2);
  const schools = dataset.schools || [];
  const records = latestRecords(dataset, profile);
  const schoolMap = {};
  schools.forEach((school) => { schoolMap[school.id] = school; });
  const candidates = records.map((record) => {
    const school = schoolMap[record.schoolId] || { id: record.schoolId, name: record.schoolName, district: record.district || '未核准', ownership: record.ownership || '未核准' };
    const classification = classify(Number(record.cutoffScore), center);
    const sameDistrict = profile.district && (school.district === profile.district || record.district === profile.district);
    return {
      id: school.id || record.schoolId || record.schoolName,
      schoolId: school.id || record.schoolId || record.schoolName,
      schoolName: school.name || record.schoolName,
      family: familyKey(school.name || record.schoolName),
      district: school.district || record.district || '未核准',
      ownership: school.ownership || record.ownership || '未核准',
      boarding: school.boarding,
      annualFee: school.annualFee,
      batch: Number(record.batch),
      cutoffScore: Number(record.cutoffScore),
      lastVolunteerNo: record.lastVolunteerNo,
      gradientIndex: record.gradientIndex,
      sameDistrict,
      ...classification
    };
  }).sort((a, b) => {
    if (a.sameDistrict !== b.sameDistrict) return a.sameDistrict ? -1 : 1;
    if (a.label !== b.label) return ({ 冲刺: 0, 匹配: 1, 保底: 2 }[a.label] || 9) - ({ 冲刺: 0, 匹配: 1, 保底: 2 }[b.label] || 9);
    return Math.abs(a.cutoffScore - center) - Math.abs(b.cutoffScore - center);
  });
  const risk = profile.riskPreference || '均衡';
  const targetCounts = risk === '进取' ? { 冲刺: 4, 匹配: 5, 保底: 3 } : risk === '稳健' ? { 冲刺: 1, 匹配: 5, 保底: 6 } : { 冲刺: 2, 匹配: 6, 保底: 4 };
  const result = [];
  const usedSchools = {};
  const usedFamilies = {};
  const pick = (candidate) => {
    if (result.length >= 12 || usedSchools[candidate.id] || (candidate.family && usedFamilies[candidate.family])) return false;
    usedSchools[candidate.id] = true;
    if (candidate.family) usedFamilies[candidate.family] = true;
    result.push(candidate);
    return true;
  };
  const localCounts = Object.fromEntries(['冲刺', '匹配', '保底'].map((label) => [label, Math.round(targetCounts[label] / 2)]));
  localCounts.保底 += targetCounts.保底 - Object.values(localCounts).reduce((sum, value) => sum + value, 0);
  [3, 4].forEach((batch) => {
    const pool = candidates.filter((candidate) => candidate.batch === batch);
    ['冲刺', '匹配', '保底'].forEach((label) => {
      pool.filter((candidate) => candidate.label === label).slice(0, localCounts[label] * 4).forEach((candidate) => {
        if (result.filter((item) => item.batch === batch && item.label === label).length < localCounts[label]) pick(candidate);
      });
    });
    pool.forEach((candidate) => {
      if (result.filter((item) => item.batch === batch).length < 6) pick(candidate);
    });
  });
  candidates.forEach((candidate) => pick(candidate));
  const batchRows = [3, 4].flatMap((batch) => result.filter((candidate) => candidate.batch === batch).sort((a, b) => ({ 冲刺: 0, 匹配: 1, 保底: 2 }[a.label] || 9) - ({ 冲刺: 0, 匹配: 1, 保底: 2 }[b.label] || 9) || b.cutoffScore - a.cutoffScore).slice(0, 6).map((candidate, index) => ({ ...candidate, key: `b${batch}-${index + 1}`, batch, position: index + 1, slot: index + 1, directionTier: candidate.label })));
  const slotted = batchRows;
  return {
    lower,
    upper,
    center,
    items: slotted,
    plan: slotted,
    counts: {
      rush: slotted.filter((item) => item.label === '冲刺').length,
      match: slotted.filter((item) => item.label === '匹配').length,
      safe: slotted.filter((item) => item.label === '保底').length
    },
    riskPreference: risk,
    isFallback: dataset.isFallback,
    dataVersion: dataset.manifest && dataset.manifest.version
  };
}

function searchSchools(dataset, query, district) {
  const normalized = String(query || '').trim().toLowerCase();
  return (dataset.schools || []).filter((school) => {
    const matchesQuery = !normalized || String(school.name || '').toLowerCase().includes(normalized);
    const matchesDistrict = !district || district === '全部' || school.district === district;
    return matchesQuery && matchesDistrict;
  }).slice(0, 30);
}

function schoolHistory(dataset, school, candidateType = '户籍生') {
  const records = (dataset.admissions || []).filter((record) => (record.schoolId === school.id || record.schoolName === school.name) && (!record.candidateType || record.candidateType === candidateType) && Number.isFinite(Number(record.cutoffScore)));
  return records.sort((a, b) => Number(b.year || 0) - Number(a.year || 0)).slice(0, 6);
}

module.exports = { loadDataset, buildDraft, searchSchools, schoolHistory };
