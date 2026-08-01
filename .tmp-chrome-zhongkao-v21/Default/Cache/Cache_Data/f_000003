export const YEAR_WEIGHTS = { 2021: 0.05, 2022: 0.08, 2023: 0.12, 2024: 0.2, 2025: 0.25, 2026: 0.3 };
export const BATCH_LIMITS = { 2: 3, 3: 6, 4: 6 };

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

export function gradientIndex(score, line) {
  if (!line) return 99;
  for (let index = 0; index < line.gradients.length; index += 1) {
    if (score >= line.gradients[index]) return index + 1;
  }
  if (score >= line.publicMinimum) return line.gradients.length + 1;
  return line.gradients.length + 2;
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

export function candidateTypeFor(profile, record) {
  if (profile.candidateType === '户籍生') {
    if (record?.candidateType === '外区生') return '外区生';
    return '户籍生';
  }
  return '随迁子女';
}

function recordFor(records, profile, slot, year) {
  const possible = records.filter((row) => row.year === year && row.batch === slot.batch && row.schoolId === slot.schoolId);
  return selectRecord(possible, profile, slot);
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
  const volunteerReachRate = volunteerRows.length
    ? Math.round((volunteerRows.filter((row) => row.lastVolunteerNo >= slot.position).length / volunteerRows.length) * 100)
    : null;
  const firstChoiceOnlyRate = volunteerRows.length
    ? Math.round((volunteerRows.filter((row) => row.lastVolunteerNo === 1).length / volunteerRows.length) * 100)
    : null;
  return {
    directYears: rows.map((row) => row.year),
    cutoffRange,
    cutoffSpan: cutoffRange ? cutoffRange[1] - cutoffRange[0] : null,
    volunteerReachRate,
    firstChoiceOnlyRate
  };
}

export function evaluateRecord(profile, slot, record, candidateScore, lines, tieRank = null) {
  if (!record) return { state: 'no-data', reason: '该年度和考生口径暂无可核验记录' };
  if (!scopeEligible(profile, record)) return { state: 'ineligible', reason: `招生范围为${record.scope}` };
  if (slot.batch === 2 && (!profile.quotaEligible || profile.candidateType !== '户籍生')) {
    return { state: 'ineligible', reason: '第二批名额分配仅适用于符合资格的户籍生' };
  }
  const line = lines[record.year];
  const candidateGradient = gradientIndex(candidateScore, line);
  const schoolGradient = record.gradientIndex || gradientIndex(record.cutoffScore, line);
  if (candidateScore < record.cutoffScore) return { state: 'fail', reason: `低于当年最低分${record.cutoffScore}分`, record };
  if (candidateGradient > schoolGradient) return { state: 'fail', reason: `考生位于第${candidateGradient}梯度，学校在第${schoolGradient}梯度完成计划`, record };
  if (candidateGradient < schoolGradient) return { state: 'pass', reason: '受高梯度优先保护', record };
  if (!record.lastVolunteerNo) return { state: 'uncertain', reason: '缺少末位考生志愿序号，无法按同梯度志愿优先规则判断', record };
  if (slot.position > record.lastVolunteerNo) {
    return { state: 'fail', reason: `学校在同梯度第${record.lastVolunteerNo}志愿已完成计划`, record };
  }

  const atLastVolunteer = slot.position === record.lastVolunteerNo;
  if (atLastVolunteer && !Number.isFinite(record.lastCandidateScore)) {
    return { state: 'uncertain', reason: `第${record.lastVolunteerNo}志愿缺少末位考生分数，结果不能确定`, record };
  }
  const thresholdScore = atLastVolunteer ? record.lastCandidateScore : record.cutoffScore;
  const thresholdTieRank = atLastVolunteer ? record.lastCandidateTieRank : record.cutoffTieRank;
  const thresholdLabel = atLastVolunteer ? `第${record.lastVolunteerNo}志愿末位考生分数` : '录取最低分';
  if (candidateScore < thresholdScore) {
    return { state: 'fail', reason: `低于${thresholdLabel}${thresholdScore}分`, record };
  }
  if (candidateScore === thresholdScore && thresholdTieRank) {
    if (!tieRank) return { state: 'uncertain', reason: `同为${candidateScore}分，需填写同分序号再判断`, record };
    if (tieRank > thresholdTieRank) return { state: 'fail', reason: `同分序号晚于${thresholdLabel}末位${thresholdTieRank}`, record };
  }
  return { state: 'pass', reason: atLastVolunteer ? '达到末位志愿分数和同分序号要求' : '达到录取最低分和志愿序号要求', record };
}

function orderedSlots(plan) {
  return [...plan].filter((slot) => slot.schoolId).sort((a, b) => a.batch - b.batch || a.position - b.position);
}

export function replayPlan(profile, plan, dataset) {
  const year = Number(profile.targetYear);
  const records = [...dataset.admissions, ...(dataset.allocations || [])];
  const results = [];
  let admitted = null;
  for (const slot of orderedSlots(plan)) {
    const record = recordFor(records, profile, slot, year);
    const outcome = admitted
      ? { state: 'stopped', reason: `已在${admitted.batch}批第${admitted.position}志愿录取` }
      : evaluateRecord(profile, slot, record, Number(profile.score), dataset.lines, Number(profile.tieRank) || null);
    const result = { ...slot, ...outcome };
    results.push(result);
    if (outcome.state === 'pass') admitted = result;
  }
  return { mode: 'replay', slotResults: results, admitted, noneProbability: admitted ? 0 : 100 };
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

export function simulateOutcomes(profile, plan, dataset, seed = 20260722, iterations = 10000) {
  const slots = orderedSlots(plan);
  const records = [...dataset.admissions, ...(dataset.allocations || [])];
  const random = mulberry32(seed);
  const availableYears = scenarioYearsForPlan(dataset, records, slots);
  if (!availableYears.length) {
    return { mode: 'forecast', slotResults: [], outcomes: [{ key: 'none', probability: 100, slot: null }], noneProbability: 100, iterations, seed, modelVersion: '2.1', usableYears: [] };
  }
  const index = buildSimulationIndex(records, slots, availableYears);
  const bandsByYear = new Map(availableYears.map((year) => [year, dataset.bands.filter((row) => row.year === year)]));
  const latestBands = bandsByYear.get(dataset.manifest.latestPolicyYear) || [];
  const hits = new Map(slots.map((slot) => [slot.key, 0]));
  const yearTotals = new Map();
  const yearHits = new Map(slots.map((slot) => [slot.key, new Map()]));
  const outcomes = new Map();
  const imputedCounts = new Map(slots.map((slot) => [slot.key, 0]));
  const low = Number(profile.scoreLow || profile.score);
  const mode = Number(profile.score);
  const high = Number(profile.scoreHigh || profile.score);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const year = weightedYear(random, availableYears);
    yearTotals.set(year, (yearTotals.get(year) || 0) + 1);
    const rawScore = triangular(random, low, mode, high);
    const percentile = percentileForScore(rawScore, latestBands);
    const yearBands = bandsByYear.get(year) || [];
    const mappedScore = scoreForPercentile(percentile, yearBands) ?? rawScore;
    let admittedKey = null;
    for (const slot of slots) {
      const scenarioRecord = scenarioRecordFor(index, profile, slot, year, dataset, bandsByYear);
      if (scenarioRecord.imputed) imputedCounts.set(slot.key, imputedCounts.get(slot.key) + 1);
      const outcome = evaluateRecord(profile, slot, scenarioRecord.record, mappedScore, dataset.lines, null);
      const viable = outcome.state === 'pass' || (outcome.state === 'uncertain' && random() < 0.5);
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
    const imputedRatio = imputedCounts.get(slot.key) / iterations;
    const historicalEvidence = historicalEvidenceFor(index, profile, slot, availableYears, bandsByYear, dataset.manifest.latestPolicyYear);
    if (imputedRatio > 0.4) [lower, upper] = [lower - 10, upper + 10];
    else if (imputedRatio > 0.1) [lower, upper] = [lower - 6, upper + 6];
    if (historicalEvidence.cutoffSpan >= 30) [lower, upper] = [lower - 10, upper + 10];
    else if (historicalEvidence.cutoffSpan >= 18) [lower, upper] = [lower - 6, upper + 6];
    const interval = [clamp(Math.round(lower), 5, 95), clamp(Math.round(upper), 5, 95)].sort((a, b) => a - b);
    const confidence = yearsWithData >= 4 && imputedRatio <= 0.1 && interval[1] - interval[0] <= 20 && historicalEvidence.cutoffSpan < 18
      ? '高'
      : yearsWithData >= 3 && imputedRatio <= 0.4 && historicalEvidence.cutoffSpan < 30 ? '中' : '低';
    const outcomeProbability = Math.round(((outcomes.get(slot.key) || 0) / iterations) * 1000) / 10;
    const notes = [];
    if (imputedRatio > 0) notes.push(`部分情景按同校最近年份位次折算（${Math.round(imputedRatio * 100)}%）`);
    if (yearsWithData < 3) notes.push('直接同口径历史不足3年');
    if (historicalEvidence.cutoffSpan >= 18) notes.push(`近年等位门槛跨度${historicalEvidence.cutoffSpan}分，已放宽区间`);
    if (historicalEvidence.firstChoiceOnlyRate >= 50 && slot.position > 1) notes.push(`近年${historicalEvidence.firstChoiceOnlyRate}%记录在第一志愿完成计划`);
    return { ...slot, state: 'forecast', chance, interval, tier: chanceTier(chance), outcomeProbability, confidence, yearsWithData, imputedRatio, historicalEvidence, notes: notes.length ? notes : undefined };
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
    modelVersion: '2.1',
    usableYears: availableYears,
    excludedYears: dataset.manifest.years.filter((year) => !availableYears.includes(year))
  };
}

function firstGap(slots, batch) {
  const rows = slots.filter((slot) => slot.batch === batch).sort((a, b) => a.position - b.position);
  let emptySeen = false;
  for (const row of rows) {
    if (!row.schoolId) emptySeen = true;
    else if (emptySeen) return row.position;
  }
  return null;
}

export function schoolFamilyKey(schoolName) {
  return String(schoolName || '').replace(/[（(].*$/u, '').replace(/\s+/g, '').trim();
}

export function evaluatePlan(profile, plan, analysis) {
  const filled = plan.filter((slot) => slot.schoolId);
  const excludedNames = Array.isArray(profile.excludedSchools) ? profile.excludedSchools : [];
  const excludedRows = filled.filter((slot) => excludedNames.some((name) => slot.schoolName?.includes(name)));
  const districtRows = Array.isArray(profile.preferredDistricts) && profile.preferredDistricts.length
    ? filled.filter((slot) => slot.district && !profile.preferredDistricts.includes(slot.district))
    : [];
  const boardingRows = profile.boardingPreference === '需要住宿'
    ? filled.filter((slot) => slot.boarding === false)
    : [];
  const feeRows = profile.maxAnnualFee
    ? filled.filter((slot) => Number.isFinite(slot.annualFee) && slot.annualFee > profile.maxAnnualFee)
    : [];
  const relevantSlots = profile.quotaEligible && profile.candidateType === '户籍生' ? 15 : 12;
  const duplicateIds = [...new Set(filled.map((slot) => slot.schoolId).filter((id, index, all) => all.indexOf(id) !== index))];
  const familyRows = new Map();
  filled.forEach((slot) => {
    const key = schoolFamilyKey(slot.schoolName);
    if (!key) return;
    if (!familyRows.has(key)) familyRows.set(key, []);
    familyRows.get(key).push(slot);
  });
  const duplicateFamilies = [...familyRows.entries()].filter(([, rows]) => new Set(rows.map((row) => row.schoolId)).size > 1);
  const gaps = [2, 3, 4].map((batch) => ({ batch, position: firstGap(plan, batch) })).filter((item) => item.position);
  const invalidRows = analysis.slotResults.filter((row) => ['ineligible', 'no-data'].includes(row.state));

  let validity = 20;
  validity -= duplicateIds.length * 6 + gaps.length * 4 + invalidRows.length * 4;
  validity = clamp(validity, 0, 20);
  const utilization = Math.round(clamp(filled.length / relevantSlots, 0, 1) * 15);

  const forecastRows = analysis.slotResults.filter((row) => row.chance !== undefined);
  const tierCounts = { 冲刺: 0, 匹配: 0, 保底: 0 };
  forecastRows.forEach((row) => { tierCounts[row.tier] += 1; });
  let structure = 5;
  if (tierCounts.冲刺 >= (profile.riskPreference === '稳健' ? 0 : 1)) structure += 5;
  if (tierCounts.匹配 >= 2) structure += 7;
  if (tierCounts.保底 >= (profile.riskPreference === '进取' ? 1 : 2)) structure += 8;
  structure = clamp(structure, 0, 25);

  let order = 25;
  const orderIssues = [];
  for (const batch of [2, 3, 4]) {
    const rows = forecastRows.filter((row) => row.batch === batch).sort((a, b) => a.position - b.position);
    for (let index = 1; index < rows.length; index += 1) {
      if (rows[index].chance + 10 < rows[index - 1].chance) {
        order -= 5;
        orderIssues.push({ previous: rows[index - 1], current: rows[index] });
      }
    }
  }
  order = clamp(order, 0, 25);

  const safetyTarget = profile.riskPreference === '稳健' ? 10 : profile.riskPreference === '进取' ? 25 : 15;
  let safety = 15;
  if (forecastRows.length && tierCounts.保底 === 0) safety -= 8;
  if (analysis.noneProbability > safetyTarget) safety -= Math.min(7, Math.ceil((analysis.noneProbability - safetyTarget) / 5));
  safety -= Math.min(5, excludedRows.length * 2 + districtRows.length + boardingRows.length * 2 + feeRows.length * 3);
  safety -= Math.min(3, duplicateFamilies.length);
  safety = clamp(safety, 0, 15);

  const rawTotal = Math.round(validity + utilization + structure + order + safety);
  const caps = [];
  if (invalidRows.some((row) => row.state === 'ineligible')) caps.push({ limit: 59, reason: '存在无报考资格学校', action: '替换无资格学校并重新核对户籍、学籍、跨区和名额分配资格' });
  if (forecastRows.length && tierCounts.保底 === 0) caps.push({ limit: 69, reason: '没有可接受的保底志愿', action: '在第三或第四批后段加入机会中值不低于75%的可接受学校' });
  if (feeRows.length) caps.push({ limit: 69, reason: '存在超过明确学费上限的学校', action: '替换超预算学校，不建议仅为提高评分而放宽真实预算' });
  let total = rawTotal;
  caps.forEach((cap) => { total = Math.min(total, cap.limit); });
  total = Math.round(total);
  const label = total >= 85 ? '结构合理' : total >= 70 ? '基本合理' : total >= 55 ? '需要优化' : '建议重排';
  const suggestions = [];
  for (const item of gaps) suggestions.push(`第${item.batch}批第${item.position}志愿前存在空档，请按志愿序号连续填写。`);
  if (duplicateIds.length) suggestions.push('同一批次或跨批次存在重复学校，请确认每个位置都是您愿意接受的独立选择。');
  for (const [family, rows] of duplicateFamilies.slice(0, 2)) {
    suggestions.push(`“${family}”出现了${rows.length}个不同校区或招生项目。它们可能使用不同学校代码，但会降低方案分散度；如无明确校区偏好，建议只保留其中一个。`);
  }
  for (const row of invalidRows.slice(0, 3)) suggestions.push(`第${row.batch}批第${row.position}志愿“${row.schoolName}”：${row.reason}。`);
  if (forecastRows.length && tierCounts.保底 === 0) suggestions.push('当前没有保底志愿：请在第三或第四批最后两个位置加入机会中值不低于75%的可接受学校。');
  if (analysis.noneProbability > safetyTarget) suggestions.push(`未被当前普通高中志愿录取的估算风险为${analysis.noneProbability}%，高于${profile.riskPreference}策略的${safetyTarget}%目标。`);
  for (const row of excludedRows.slice(0, 2)) suggestions.push(`第${row.batch}批第${row.position}志愿“${row.schoolName}”在排除清单中，请替换为明确愿意就读的学校。`);
  for (const row of feeRows.slice(0, 2)) suggestions.push(`第${row.batch}批第${row.position}志愿“${row.schoolName}”公开年学费${row.annualFee}元，超过填写的${profile.maxAnnualFee}元上限，建议替换。`);
  for (const row of boardingRows.slice(0, 2)) suggestions.push(`第${row.batch}批第${row.position}志愿“${row.schoolName}”与住宿刚需不符，请先核实住宿条件或替换。`);
  if (districtRows.length) suggestions.push(`有${districtRows.length}个志愿不在偏好区域内；如属于可接受保底，请保留，否则建议从相同机会档位替换。`);
  for (const batch of [3, 4]) {
    const rows = forecastRows.filter((row) => row.batch === batch).sort((a, b) => a.position - b.position);
    for (let index = 1; index < rows.length; index += 1) {
      if (rows[index].chance + 10 < rows[index - 1].chance) {
        suggestions.push(`第${batch}批第${rows[index].position}志愿“${rows[index].schoolName}”比前一志愿更难，建议前移或替换为更稳的学校。`);
        break;
      }
    }
  }
  if (!suggestions.length) suggestions.push('当前梯度和顺序基本合理，建议重点核对每所学校的招生范围、住宿与收费信息。');

  const improvements = [];
  const addImprovement = (key, labelName, current, maximum, actions, target = '#volunteerForm') => {
    if (current >= maximum) return;
    improvements.push({ key, label: labelName, current, maximum, points: maximum - current, action: actions.filter(Boolean).join('；'), target });
  };
  const duplicateNames = [...new Set(filled.filter((slot) => duplicateIds.includes(slot.schoolId)).map((slot) => slot.schoolName).filter(Boolean))];
  addImprovement('validity', '资格与表格有效性', validity, 20, [
    gaps.length ? `补齐${gaps.map((item) => `第${item.batch}批第${item.position}志愿前的空档`).join('、')}` : '',
    duplicateNames.length ? `删除或替换重复学校：${duplicateNames.join('、')}` : '',
    invalidRows.length ? `替换资格或数据不符的志愿：${invalidRows.slice(0, 3).map((row) => `第${row.batch}批第${row.position}志愿“${row.schoolName}”`).join('、')}` : ''
  ]);

  const relevantPlan = profile.quotaEligible && profile.candidateType === '户籍生' ? plan : plan.filter((slot) => slot.batch !== 2);
  const missingSlots = relevantPlan.filter((slot) => !slot.schoolId);
  addImprovement('utilization', '志愿槽位利用', utilization, 15, [
    missingSlots.length ? `补齐剩余${missingSlots.length}个可用位置，优先从${missingSlots.slice(0, 4).map((slot) => `第${slot.batch}批第${slot.position}志愿`).join('、')}开始` : '',
    '只增加真正愿意就读且符合资格的学校'
  ]);

  const structureActions = [];
  if (!forecastRows.length) structureActions.push('历史复盘不生成冲稳保机会档；如需优化结构，请切换未来预测模式');
  if (forecastRows.length && profile.riskPreference !== '稳健' && tierCounts.冲刺 < 1) structureActions.push('增加至少1个冲刺志愿');
  if (forecastRows.length && tierCounts.匹配 < 2) structureActions.push(`再增加${2 - tierCounts.匹配}个机会中值45%—74%的匹配志愿`);
  const safeTarget = profile.riskPreference === '进取' ? 1 : 2;
  if (forecastRows.length && tierCounts.保底 < safeTarget) structureActions.push(`再增加${safeTarget - tierCounts.保底}个机会中值不低于75%的保底志愿`);
  addImprovement('structure', '分数与学校适配', structure, 25, structureActions);

  addImprovement('order', '志愿顺序与梯度', order, 25, [
    orderIssues.length ? orderIssues.slice(0, 3).map(({ current }) => `将第${current.batch}批第${current.position}志愿“${current.schoolName}”前移，或替换为机会更高的学校`).join('；') : ''
  ]);

  const safetyActions = [];
  if (forecastRows.length && tierCounts.保底 === 0) safetyActions.push('在第三或第四批最后两个位置加入可接受保底学校');
  if (analysis.noneProbability > safetyTarget) safetyActions.push(`把未录取风险从${analysis.noneProbability}%降到${safetyTarget}%以内`);
  if (excludedRows.length) safetyActions.push(`替换排除清单中的${excludedRows.map((row) => `“${row.schoolName}”`).join('、')}`);
  if (feeRows.length) safetyActions.push(`替换超过${profile.maxAnnualFee}元年学费上限的学校`);
  if (boardingRows.length) safetyActions.push('替换不满足住宿刚需的学校，或先核实住宿条件');
  if (duplicateFamilies.length) safetyActions.push(`减少同一学校体系的重复校区或项目：${duplicateFamilies.map(([family]) => family).join('、')}`);
  if (districtRows.length) safetyActions.push(`将${districtRows.length}个非偏好区域志愿替换为同机会档的可接受学校`);
  addImprovement('safety', '保底完整性与偏好', safety, 15, safetyActions);

  return { total, rawTotal, label, dimensions: { validity, utilization, structure, order, safety }, tierCounts, suggestions, improvements, caps };
}
