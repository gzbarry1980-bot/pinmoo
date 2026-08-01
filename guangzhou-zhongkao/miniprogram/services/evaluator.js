const { evaluatePlan, replayPlan, simulateOutcomes } = require('./engine');

function forecastProfile(input) {
  const lower = Number(input.lower);
  const upper = Number(input.upper);
  return {
    mode: 'forecast',
    targetYear: Number(input.targetYear) || 2027,
    score: Math.round((lower + upper) / 2),
    scoreLow: lower,
    scoreHigh: upper,
    candidateType: input.candidateType || '户籍生',
    admissionDistrict: input.district || '',
    schoolDistrict: input.district || '',
    riskPreference: input.riskPreference || '均衡',
    quotaEligible: Boolean(input.quotaEligible),
    notAdmittedFirstBatch: true,
    preferredDistricts: input.district ? [input.district] : [],
    excludedSchools: [],
    maxAnnualFee: null,
    boardingPreference: '不限'
  };
}

function analyzePlan(input, plan, dataset) {
  const profile = forecastProfile(input);
  const analysis = simulateOutcomes(profile, plan, dataset, 20260722, 10000);
  const score = evaluatePlan(profile, plan, analysis);
  return { profile, analysis, score };
}

function replayPlanForYear(input, plan, dataset) {
  const profile = { ...forecastProfile(input), mode: 'replay', targetYear: Number(input.targetYear) || 2026, score: Number(input.score || input.lower), tieRank: Number(input.tieRank) || null };
  const analysis = replayPlan(profile, plan, dataset);
  const score = evaluatePlan(profile, plan, analysis);
  return { profile, analysis, score };
}

function formatChance(row) {
  if (!row) return '暂无模拟结果';
  if (row.interval) return `${row.interval[0]}%—${row.interval[1]}%`;
  if (row.state === 'pass') return '可投档';
  if (row.state === 'uncertain') return '结果不确定';
  return '暂不满足';
}

module.exports = { analyzePlan, replayPlanForYear, formatChance };
