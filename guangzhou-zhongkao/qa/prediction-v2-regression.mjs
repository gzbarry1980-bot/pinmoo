import fs from 'node:fs/promises';
import path from 'node:path';
import { evaluatePlan, schoolFamilyKey, simulateOutcomes } from '../engine.js';
import { simulateOutcomesRealistic } from '../realistic-sim.js';

const root = path.resolve(import.meta.dirname, '..');
const load = async (name) => JSON.parse(await fs.readFile(path.join(root, 'data', name), 'utf8'));
const [manifest, schools, admissions, bands, lines] = await Promise.all([
  load('manifest.json'), load('schools.json'), load('admissions.json'), load('score-bands.json'), load('control-lines.json')
]);
const dataset = { manifest, schools, admissions, bands, lines, allocations: [] };
const profile = {
  mode: 'forecast', targetYear: 2027, score: 690, scoreLow: 680, scoreHigh: 700,
  candidateType: '户籍生', admissionDistrict: '天河区', schoolDistrict: '天河区',
  householdDistrict: '天河区', riskPreference: '均衡', quotaEligible: false,
  notAdmittedFirstBatch: true, excludedSchools: [], preferredDistricts: ['天河区'],
  boardingPreference: '不限', maxAnnualFee: null
};

const latest = admissions
  .filter((row) => row.year === 2026 && row.candidateType === '户籍生' && [3, 4].includes(row.batch))
  .sort((a, b) => b.cutoffScore - a.cutoffScore);
const families = new Set();
const selected = latest.filter((row) => {
  const family = schoolFamilyKey(row.schoolName);
  if (families.has(family)) return false;
  families.add(family);
  return true;
});
const plan = [
  ...selected.filter((row) => row.batch === 3).slice(0, 6),
  ...selected.filter((row) => row.batch === 4).slice(0, 6)
].map((row, index) => ({
  key: `qa-${row.batch}-${index}`, batch: row.batch,
  position: (index % 6) + 1, schoolId: row.schoolId, schoolName: row.schoolName
}));

const standardA = simulateOutcomes(profile, plan, dataset, 20260729, 3000);
const standardB = simulateOutcomes(profile, plan, dataset, 20260729, 3000);
const realistic = simulateOutcomesRealistic(profile, plan, dataset, { seed: 20260729, iterations: 3000 });

const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(JSON.stringify(standardA) === JSON.stringify(standardB), '固定输入和种子必须产生相同结果');
assert(JSON.stringify(standardA.usableYears) === JSON.stringify([2023, 2024, 2025, 2026]), '第三、第四批共同情景应排除整批缺失的2021、2022年');
assert(standardA.slotResults.every((row) => row.chance >= 5 && row.chance <= 95), '标准模型不得出现0%或100%');
assert(realistic.slotResults.every((row) => row.chance >= 5 && row.chance <= 95), '压力模型不得出现0%或100%');
assert(standardA.slotResults.every((row) => row.historicalEvidence && Array.isArray(row.historicalEvidence.directYears)), '标准模型须输出逐校历史证据摘要');
assert(realistic.slotResults.every((row) => row.historicalEvidence && (row.historicalEvidence.firstChoiceOnlyRate === null || Number.isFinite(row.historicalEvidence.firstChoiceOnlyRate))), '压力模型须输出末位志愿分布校准');
assert(realistic.slotResults.some((row) => Number.isFinite(row.historicalEvidence.firstChoiceOnlyRate)), '压力模型至少应有一个可核验的末位志愿分布');
assert(plan.length === new Set(plan.map((row) => schoolFamilyKey(row.schoolName))).size, '自动方案测试样本不得重复学校体系');

const sameFamily = admissions.filter((row) => row.year === 2026 && row.batch === 3 && row.candidateType === '户籍生' && schoolFamilyKey(row.schoolName) === '广州市第六中学').slice(0, 2);
assert(sameFamily.length === 2, '需找到同一学校体系的两个校区用于回归测试');
const duplicatePlan = sameFamily.map((row, index) => ({ key: `dup-${index}`, batch: 3, position: index + 1, schoolId: row.schoolId, schoolName: row.schoolName }));
const duplicateAnalysis = simulateOutcomes(profile, duplicatePlan, dataset, 20260729, 500);
const duplicateScore = evaluatePlan(profile, duplicatePlan, duplicateAnalysis);
assert(duplicateScore.suggestions.some((item) => item.includes('不同校区或招生项目')), '同一学校体系的不同校区应给出分散度提示');

console.log(JSON.stringify({
  modelVersion: standardA.modelVersion,
  usableYears: standardA.usableYears,
  deterministic: true,
  standardNoneRisk: standardA.noneProbability,
  realisticNoneRisk: realistic.noneProbability,
  evidenceCalibration: true,
  familyDuplicateWarning: true,
  testedSlots: plan.length
}, null, 2));
