// Policy publication, annual admissions rules and observed score data have separate years.
export const POLICY_REVIEW_VERSION = '20261018-policy';
export const MODEL_VERSION = '2.3';
export const POLICY_SOURCES = {
  reform: 'https://gzzk.gz.gov.cn/zwgk/tzwj/content/post_10298205.html',
  explanation: 'https://jyj.gz.gov.cn/yw/jyyw/content/post_10298181.html',
  guide2026: 'https://gzzk.gz.gov.cn/attachment/8/8027/8027351/10816553.pdf'
};
export const REFORM_2027 = Object.freeze({
  firstYear: 2027, lastYear: 2029, publishedAt: '2025-06-05', totalScore: 810,
  subjectScores: { '语文': 140, '数学': 150, '英语': 140, '体育与健康': 70, '道德与法治': 70, '历史': 70, '物理': 100, '化学': 70 },
  migrantPlanRatio: [0.08, 0.20],
  sharedAdmissionDistricts: ['越秀区', '海珠区', '荔湾区'],
  referenceGrades: { demonstration: 'C', other: 'D', appliesTo: ['自主招生', '名额分配'] },
  talentWithinAutonomous: true, sourceURL: POLICY_SOURCES.reform,
  reviewedAt: '2026-10-18', annualDetailsStatus: 'not_reviewed'
});
const validYear = value => Number.isInteger(Number(value)) && Number(value) >= 2000 ? Number(value) : null;
export function latestAdmissionYear(manifest = {}) {
  return validYear(manifest.latestAdmissionYear)
    || Math.max(0, ...(manifest.years || []).map(validYear).filter(Boolean))
    || validYear(manifest.latestPolicyYear) || 2026;
}
export function defaultForecastYear(manifest = {}) {
  return validYear(manifest.defaultForecastYear) || latestAdmissionYear(manifest) + 1;
}
export function analysisIsCurrent(result, manifest = {}) {
  return Boolean(result && result.dataVersion === manifest.version && [MODEL_VERSION, 'replay'].includes(result.modelVersion));
}
export function latestScoreDistributionYear(dataset) {
  const years = [...new Set((dataset.bands || []).map(row => validYear(row.year)).filter(Boolean))];
  const explicit = validYear(dataset.manifest?.latestScoreDistributionYear);
  return explicit && years.includes(explicit) ? explicit : Math.max(0, ...years) || latestAdmissionYear(dataset.manifest);
}
export function policyContext(profile, manifest = {}) {
  const targetYear = validYear(profile.targetYear) || defaultForecastYear(manifest);
  const referenceDataYear = latestAdmissionYear(manifest);
  const reform = targetYear >= 2027 && targetYear <= 2029;
  const unknownCycle = targetYear > 2029;
  const historical = profile.mode === 'replay';
  return {
    version: POLICY_REVIEW_VERSION, targetYear, referenceDataYear,
    frameworkYear: reform ? 2027 : unknownCycle ? null : targetYear,
    annualRulesYear: historical ? targetYear : validYear(manifest.latestAnnualRulesYear) || 2026,
    annualDetailsStatus: historical ? 'historical' : targetYear <= (validYear(manifest.latestAnnualRulesYear) || 2026) ? 'reviewed' : 'not_reviewed',
    structuralChange: !historical && targetYear >= 2027 && referenceDataYear < 2027,
    sourceURL: reform ? POLICY_SOURCES.reform : targetYear === 2026 ? POLICY_SOURCES.guide2026 : null,
    notice: historical ? `${targetYear}年历史复盘，按当年已收录规则和录取结果核对。`
      : reform ? `${targetYear}年：已收录2027—2029改革政策；年度招生细则与计划待核对。录取数据截至${referenceDataYear}年。`
      : unknownCycle ? `${targetYear}年政策尚未收录，当前只能按已有规则和截至${referenceDataYear}年的数据作参考。`
      : `${targetYear}年模拟，录取参考截至${referenceDataYear}年；请核对当年招生细则。`
  };
}
export function applyPolicyContext(analysis, profile, dataset) {
  const context = policyContext(profile, dataset.manifest);
  const note = '2027起科目分值调整；当前用2026及以前成绩分布作参考，机会尚未经新政策录取结果校准';
  return {
    ...analysis, modelVersion: MODEL_VERSION,
    policyContext: { ...context, scoreDistributionYear: latestScoreDistributionYear(dataset), uncertaintyNote: context.structuralChange ? note : null },
    slotResults: (analysis.slotResults || []).map(row => context.structuralChange && row.state === 'forecast'
      ? { ...row, confidence: '低', policyUncertainty: true }
      : row)
  };
}
