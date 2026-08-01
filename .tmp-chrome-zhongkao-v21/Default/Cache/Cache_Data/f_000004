// realistic-sim.js
// 波动压力测试模块 —— 独立于 engine.js，不修改任何录取判断逻辑。
// 录取判断完全复用 engine.js 导出的 evaluateRecord（字节级一致）；
// 本文件只重写“模拟编排”这一层，用于检验方案在额外波动与边界条件下的敏感性。
//
// 设计目标（相对 engine.simulateOutcomes 的增强点）：
// 1. 单分估值的表现方差：多数考生只填一个分数，但真实发挥有波动，
//    当 low===high 时注入 ±12 分的合理表现方差（而非退化为定值）。
// 2. 年际难度/ cohort 抖动：每次抽样在分位映射后的分数上叠加 ±0.8% 抖动，
//    反映“按分数段换算位次”本身的不确定性与当年考生整体波动。
// 3. 压线/末位志愿的梯度化概率：原实现把 uncertain 状态按 0.5 抛硬币，
//    这里改为按候选分在“最低分—末位考生分”区间内的相对位置给概率，更真实。
// 4. 低数据/异常分支：无记录→no-data、资格不符→ineligible 均计入未录取，
//    并保留 yearsWithData 用于置信度；新增 per-slot 统计供 UI 提示。
//
// 输出结构与 engine.simulateOutcomes 完全一致，app.js 渲染层无需改动。

import { evaluateRecord, gradientIndex } from './engine.js?v=20260729b';

/* ---------- 以下为从 engine.js 复制的纯函数（不修改 engine.js） ---------- */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function triangular(random, min, mode, max) {
  if (max <= min) return min;
  const u = random();
  const split = (mode - min) / (max - min);
  if (u < split) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function weightedYear(random, availableYears) {
  const weights = availableYears.map((year) => YEAR_WEIGHTS[year] || 0.01);
  const total = weights.reduce((sum, value) => sum + value, 0);
  let point = random() * total;
  for (let index = 0; index < availableYears.length; index += 1) {
    point -= weights[index];
    if (point <= 0) return availableYears[index];
  }
  return availableYears.at(-1);
}

// 年份权重需要从 engine 同步一份（engine 未导出，复制以保证本模块自洽）。
const YEAR_WEIGHTS = { 2021: 0.05, 2022: 0.08, 2023: 0.12, 2024: 0.2, 2025: 0.25, 2026: 0.3 };

function scenarioYearsForPlan(dataset, records, slots) {
  const batches = [...new Set(slots.map((slot) => slot.batch))];
  const complete = dataset.manifest.years.filter((year) => {
    const hasBands = dataset.bands.some((row) => row.year === year);
    const hasLine = Boolean(dataset.lines[year]);
    const hasEveryBatch = batches.every((batch) => records.some((row) => row.year === year && row.batch === batch));
    return hasBands && hasLine && hasEveryBatch;
  });
  if (complete.length) return complete;
  return dataset.manifest.years.filter((year) => Boolean(dataset.lines[year]) && batches.every((batch) => records.some((row) => row.year === year && row.batch === batch)));
}

function percentileForScore(score, bands) {
  if (!bands?.length) return null;
  const sorted = [...bands].sort((a, b) => b.score - a.score);
  const exact = sorted.find((row) => score >= row.score);
  if (exact) return exact.cumulativeRatio;
  return sorted.at(-1)?.cumulativeRatio ?? null;
}

function scoreForPercentile(percentile, bands) {
  if (percentile === null || !bands?.length) return null;
  const sorted = [...bands].sort((a, b) => a.cumulativeRatio - b.cumulativeRatio);
  return sorted.find((row) => row.cumulativeRatio >= percentile)?.score ?? sorted.at(-1)?.score ?? null;
}

function scopeEligible(profile, record) {
  if (!record) return false;
  if (record.scope === '全市' || record.scope === '送生初中') return true;
  const district = profile.admissionDistrict || profile.schoolDistrict;
  if (record.scope === '老三区') return ['荔湾区', '越秀区', '海珠区'].includes(district);
  if (record.scope?.includes(district)) return true;
  return record.candidateType === '外区生';
}

function candidateTypeFor(profile, record) {
  if (profile.candidateType === '户籍生') {
    if (record?.candidateType === '外区生') return '外区生';
    return '户籍生';
  }
  return '随迁子女';
}

function selectRecord(possible, profile, slot) {
  if (slot.batch === 2) {
    return possible.find((row) => row.sourceSchoolId === profile.sourceSchoolId) || null;
  }
  const preferredType = profile.candidateType === '户籍生' ? '户籍生' : '随迁子女';
  return possible.find((row) => row.candidateType === preferredType && scopeEligible(profile, row))
    || possible.find((row) => row.candidateType === (profile.candidateType === '户籍生' ? '外区生' : '随迁子女'))
    || null;
}

function buildSimulationIndex(records, slots, years) {
  const selected = new Set(slots.map((slot) => `${slot.batch}|${slot.schoolId}`));
  const allowedYears = new Set(years);
  const byYearBatchSchool = new Map();
  const byBatchSchool = new Map();
  const yearsBySlot = new Map(slots.map((slot) => [slot.key, new Set()]));
  const slotKeyBySchool = new Map(slots.map((slot) => [`${slot.batch}|${slot.schoolId}`, slot.key]));

  for (const row of records) {
    const schoolKey = `${row.batch}|${row.schoolId}`;
    if (!allowedYears.has(row.year) || !selected.has(schoolKey)) continue;
    const key = `${row.year}|${schoolKey}`;
    if (!byYearBatchSchool.has(key)) byYearBatchSchool.set(key, []);
    byYearBatchSchool.get(key).push(row);
    if (!byBatchSchool.has(schoolKey)) byBatchSchool.set(schoolKey, []);
    byBatchSchool.get(schoolKey).push(row);
    yearsBySlot.get(slotKeyBySchool.get(schoolKey))?.add(row.year);
  }

  return { byYearBatchSchool, byBatchSchool, yearsBySlot };
}

function indexedRecordFor(index, profile, slot, year) {
  const possible = index.byYearBatchSchool.get(`${year}|${slot.batch}|${slot.schoolId}`) || [];
  return selectRecord(possible, profile, slot);
}

function mappedHistoricalScore(score, sourceYear, targetYear, bandsByYear) {
  if (!Number.isFinite(score) || sourceYear === targetYear) return score;
  const percentile = percentileForScore(score, bandsByYear.get(sourceYear) || []);
  return scoreForPercentile(percentile, bandsByYear.get(targetYear) || []) ?? score;
}

function scenarioRecordFor(index, profile, slot, year, dataset, bandsByYear) {
  const direct = indexedRecordFor(index, profile, slot, year);
  if (direct) return { record: direct, imputed: false };
  const schoolRows = index.byBatchSchool.get(`${slot.batch}|${slot.schoolId}`) || [];
  const rowsByYear = new Map();
  schoolRows.forEach((row) => {
    if (!rowsByYear.has(row.year)) rowsByYear.set(row.year, []);
    rowsByYear.get(row.year).push(row);
  });
  const alternatives = [...rowsByYear.entries()]
    .map(([sourceYear, rows]) => ({ sourceYear, record: selectRecord(rows, profile, slot) }))
    .filter((item) => item.record)
    .sort((a, b) => Math.abs(a.sourceYear - year) - Math.abs(b.sourceYear - year) || b.sourceYear - a.sourceYear);
  const source = alternatives[0];
  if (!source) return { record: null, imputed: false };
  const cutoffScore = mappedHistoricalScore(source.record.cutoffScore, source.sourceYear, year, bandsByYear);
  const lastCandidateScore = mappedHistoricalScore(source.record.lastCandidateScore, source.sourceYear, year, bandsByYear);
  return {
    imputed: true,
    record: {
      ...source.record,
      year,
      cutoffScore,
      cutoffTieRank: null,
      lastCandidateScore,
      lastCandidateTieRank: null,
      gradientIndex: gradientIndex(cutoffScore, dataset.lines[year]),
      imputedFromYear: source.sourceYear
    }
  };
}

function historicalEvidenceFor(index, profile, slot, availableYears, bandsByYear, latestYear) {
  const rows = availableYears
    .map((year) => indexedRecordFor(index, profile, slot, year))
    .filter(Boolean)
    .sort((a, b) => a.year - b.year);
  const mappedCutoffs = rows
    .map((row) => mappedHistoricalScore(row.cutoffScore, row.year, latestYear, bandsByYear))
    .filter(Number.isFinite);
  const cutoffRange = mappedCutoffs.length
    ? [Math.min(...mappedCutoffs), Math.max(...mappedCutoffs)]
    : null;
  const volunteerRows = rows.filter((row) => Number.isFinite(row.lastVolunteerNo));
  return {
    directYears: rows.map((row) => row.year),
    cutoffRange,
    cutoffSpan: cutoffRange ? cutoffRange[1] - cutoffRange[0] : null,
    volunteerReachRate: volunteerRows.length
      ? Math.round((volunteerRows.filter((row) => row.lastVolunteerNo >= slot.position).length / volunteerRows.length) * 100)
      : null,
    firstChoiceOnlyRate: volunteerRows.length
      ? Math.round((volunteerRows.filter((row) => row.lastVolunteerNo === 1).length / volunteerRows.length) * 100)
      : null
  };
}

function weightedQuantile(rows, point) {
  if (!rows.length) return null;
  const ordered = [...rows].sort((a, b) => a.value - b.value);
  const total = ordered.reduce((sum, row) => sum + (YEAR_WEIGHTS[row.year] || 0.01), 0);
  let cumulative = 0;
  for (const row of ordered) {
    cumulative += (YEAR_WEIGHTS[row.year] || 0.01) / total;
    if (cumulative >= point) return row.value;
  }
  return ordered.at(-1).value;
}

function chanceTier(value) {
  if (value < 45) return '冲刺';
  if (value < 75) return '匹配';
  return '保底';
}

/* ---------------------------- 波动压力测试主体 ---------------------------- */

export function simulateOutcomesRealistic(profile, plan, dataset, { seed = 20260722, iterations = 10000 } = {}) {
  const slots = [...plan].filter((slot) => slot.schoolId).sort((a, b) => a.batch - b.batch || a.position - b.position);
  if (!slots.length) {
    return { mode: 'forecast', slotResults: [], outcomes: [{ key: 'none', probability: 100, slot: null }], noneProbability: 100, iterations, seed };
  }

  const records = [...dataset.admissions, ...(dataset.allocations || [])];
  const random = mulberry32(seed);
  const availableYears = scenarioYearsForPlan(dataset, records, slots);
  if (!availableYears.length) {
    return { mode: 'forecast', slotResults: [], outcomes: [{ key: 'none', probability: 100, slot: null }], noneProbability: 100, iterations, seed, realistic: true, modelVersion: '2.1', usableYears: [] };
  }
  const index = buildSimulationIndex(records, slots, availableYears);
  const bandsByYear = new Map(availableYears.map((year) => [year, dataset.bands.filter((row) => row.year === year)]));
  const latestBands = bandsByYear.get(dataset.manifest.latestPolicyYear) || [];

  const hits = new Map(slots.map((slot) => [slot.key, 0]));
  const yearTotals = new Map();
  const yearHits = new Map(slots.map((slot) => [slot.key, new Map()]));
  const outcomes = new Map();
  // per-slot 异常统计（供 UI 提示“数据不足 / 资格不符”）
  const anomalies = new Map(slots.map((slot) => [slot.key, { noData: 0, ineligible: 0, uncertain: 0, sampled: 0 }]));

  const lowRaw = Number(profile.scoreLow || profile.score);
  const modeRaw = Number(profile.score);
  const highRaw = Number(profile.scoreHigh || profile.score);
  const estBias = Number(profile.estimateBias || 0); // 可选：估分系统性偏差（正=偏乐观）
  // 真实波动 1：单分估值仍有表现方差（多数考生只填一个分数）
  const low = lowRaw === highRaw ? lowRaw - 12 : lowRaw;
  const high = lowRaw === highRaw ? highRaw + 12 : highRaw;
  const mode = modeRaw;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const year = weightedYear(random, availableYears);
    yearTotals.set(year, (yearTotals.get(year) || 0) + 1);
    // 估分波动（三角分布：下限—中心—上限）
    const rawScore = triangular(random, low, mode, high) + estBias;
    const percentile = percentileForScore(rawScore, latestBands);
    const yearBands = bandsByYear.get(year) || [];
    let mappedScore = scoreForPercentile(percentile, yearBands) ?? rawScore;
    // 真实波动 2：分位换算与当年 cohort 的不确定性（±0.8%）
    mappedScore *= 1 + (random() - 0.5) * 0.016;

    let admittedKey = null;
    for (const slot of slots) {
      const scenarioRecord = scenarioRecordFor(index, profile, slot, year, dataset, bandsByYear);
      const outcome = evaluateRecord(profile, slot, scenarioRecord.record, mappedScore, dataset.lines, null);
      const stat = anomalies.get(slot.key);
      stat.sampled += 1;
      if (scenarioRecord.imputed) stat.imputed = (stat.imputed || 0) + 1;
      let viable = false;
      if (outcome.state === 'pass') {
        viable = true;
      } else if (outcome.state === 'uncertain') {
        // 真实波动 3：压线/末位志愿按相对位置给梯度概率，而非固定 0.5
        stat.uncertain += 1;
        const rec = outcome.record;
        if (rec && Number.isFinite(rec.lastCandidateScore) && rec.lastCandidateScore > rec.cutoffScore) {
          const lo = rec.cutoffScore;
          const hi = rec.lastCandidateScore;
          const p = clamp((mappedScore - lo) / (hi - lo), 0.12, 0.88);
          viable = random() < p;
        } else {
          viable = random() < 0.5;
        }
      } else if (outcome.state === 'no-data') {
        stat.noData += 1;
      } else if (outcome.state === 'ineligible') {
        stat.ineligible += 1;
      }
      if (viable) {
        hits.set(slot.key, hits.get(slot.key) + 1);
        const byYear = yearHits.get(slot.key);
        byYear.set(year, (byYear.get(year) || 0) + 1);
        if (!admittedKey) admittedKey = slot.key;
      }
    }
    outcomes.set(admittedKey || 'none', (outcomes.get(admittedKey || 'none') || 0) + 1);
  }

  const slotResults = slots.map((slot) => {
    const chance = clamp(Math.round((hits.get(slot.key) / iterations) * 100), 5, 95);
    const yearly = availableYears.map((year) => ({ year, value: ((yearHits.get(slot.key).get(year) || 0) / (yearTotals.get(year) || 1)) * 100 }));
    let lower = weightedQuantile(yearly, 0.2);
    let upper = weightedQuantile(yearly, 0.8);
    if (lower === null || upper === null) [lower, upper] = [chance - 15, chance + 15];
    if (Math.abs(upper - lower) < 8) [lower, upper] = [chance - 5, chance + 5];
    const yearsWithData = index.yearsBySlot.get(slot.key)?.size || 0;
    const stat = anomalies.get(slot.key);
    const imputedRatio = (stat.imputed || 0) / iterations;
    const historicalEvidence = historicalEvidenceFor(index, profile, slot, availableYears, bandsByYear, dataset.manifest.latestPolicyYear);
    if (imputedRatio > 0.4) [lower, upper] = [lower - 12, upper + 12];
    else if (imputedRatio > 0.1) [lower, upper] = [lower - 7, upper + 7];
    if (historicalEvidence.cutoffSpan >= 30) [lower, upper] = [lower - 12, upper + 12];
    else if (historicalEvidence.cutoffSpan >= 18) [lower, upper] = [lower - 7, upper + 7];
    const confidence = yearsWithData >= 4 && imputedRatio <= 0.1 && upper - lower <= 20 && historicalEvidence.cutoffSpan < 18
      ? '高'
      : yearsWithData >= 3 && imputedRatio <= 0.4 && historicalEvidence.cutoffSpan < 30 ? '中' : '低';
    const notes = [];
    if (imputedRatio > 0) notes.push(`部分情景按同校最近年份位次折算（${Math.round(imputedRatio * 100)}%）`);
    else if (stat.noData) notes.push('部分年份无同口径数据');
    if (stat.ineligible) notes.push('存在资格不符年份');
    if (yearsWithData < 3) notes.push('历史数据较少，区间偏宽');
    if (historicalEvidence.cutoffSpan >= 18) notes.push(`近年等位门槛跨度${historicalEvidence.cutoffSpan}分，已放宽区间`);
    if (historicalEvidence.firstChoiceOnlyRate >= 50 && slot.position > 1) notes.push(`近年${historicalEvidence.firstChoiceOnlyRate}%记录在第一志愿完成计划`);
    return {
      ...slot,
      state: 'forecast',
      chance,
      interval: [clamp(Math.round(lower), 5, 95), clamp(Math.round(upper), 5, 95)].sort((a, b) => a - b),
      tier: chanceTier(chance),
      outcomeProbability: Math.round(((outcomes.get(slot.key) || 0) / iterations) * 1000) / 10,
      confidence,
      yearsWithData,
      imputedRatio,
      historicalEvidence,
      notes: notes.length ? notes : undefined
    };
  });

  const outcomeRows = [...outcomes.entries()].map(([key, count]) => ({
    key,
    probability: Math.round((count / iterations) * 1000) / 10,
    slot: slots.find((slot) => slot.key === key) || null
  })).sort((a, b) => b.probability - a.probability);

  return {
    mode: 'forecast',
    slotResults,
    outcomes: outcomeRows,
    noneProbability: outcomeRows.find((row) => row.key === 'none')?.probability || 0,
    iterations,
    seed,
    realistic: true,
    modelVersion: '2.1',
    usableYears: availableYears,
    excludedYears: dataset.manifest.years.filter((year) => !availableYears.includes(year))
  };
}
