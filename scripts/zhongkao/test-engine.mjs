import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluatePlan, evaluateRecord, replayPlan, simulateOutcomes } from '../../guangzhou-zhongkao/engine.js';
import { simulateOutcomesRealistic } from '../../guangzhou-zhongkao/realistic-sim.js';

const lines = {
  2025: { gradients: [707, 667, 627, 587, 547, 507], publicMinimum: 487, privateMinimum: 487 },
  2026: { gradients: [712, 672, 632, 592, 552, 512], publicMinimum: 492, privateMinimum: 412 }
};

const profile = {
  mode: 'replay',
  targetYear: 2025,
  score: 710,
  tieRank: null,
  candidateType: '户籍生',
  admissionDistrict: '天河区',
  quotaEligible: false,
  riskPreference: '均衡'
};

const plan = [
  { key: 'b3-1', batch: 3, position: 1, schoolId: 'a', schoolName: '第一志愿学校' },
  { key: 'b3-2', batch: 3, position: 2, schoolId: 'b', schoolName: '第二志愿学校' },
  { key: 'b3-3', batch: 3, position: 3, schoolId: 'c', schoolName: '第三志愿学校' }
];

const records = [
  { year: 2025, batch: 3, schoolId: 'a', schoolName: '第一志愿学校', scope: '全市', candidateType: '户籍生', cutoffScore: 715, cutoffTieRank: 10, lastVolunteerNo: 1, lastCandidateScore: 715, lastCandidateTieRank: 10, gradientIndex: 1 },
  { year: 2025, batch: 3, schoolId: 'b', schoolName: '第二志愿学校', scope: '全市', candidateType: '户籍生', cutoffScore: 710, cutoffTieRank: 200, lastVolunteerNo: 1, lastCandidateScore: 710, lastCandidateTieRank: 200, gradientIndex: 1 },
  { year: 2025, batch: 3, schoolId: 'c', schoolName: '第三志愿学校', scope: '全市', candidateType: '户籍生', cutoffScore: 698, cutoffTieRank: 100, lastVolunteerNo: 1, lastCandidateScore: 698, lastCandidateTieRank: 100, gradientIndex: 2 }
];

test('官方710分示例：前两志愿落选，第三志愿受梯度保护录取', () => {
  const result = replayPlan(profile, plan, { admissions: records, allocations: [], lines });
  assert.equal(result.slotResults[0].state, 'fail');
  assert.match(result.slotResults[0].reason, /715/);
  assert.equal(result.slotResults[1].state, 'fail');
  assert.match(result.slotResults[1].reason, /第1志愿已完成计划/);
  assert.equal(result.slotResults[2].state, 'pass');
  assert.match(result.slotResults[2].reason, /梯度优先保护/);
  assert.equal(result.admitted.schoolId, 'c');
});

test('同分但缺少同分序号时返回不确定', () => {
  const outcome = evaluateRecord(profile, plan[1], records[1], 710, lines, null);
  // 志愿序号门槛比同分门槛更早生效。
  assert.equal(outcome.state, 'fail');
  const firstPosition = { ...plan[1], position: 1 };
  const uncertain = evaluateRecord(profile, firstPosition, records[1], 710, lines, null);
  assert.equal(uncertain.state, 'uncertain');
});

test('官网考生B示例：达到最低分但低于末位志愿分数时落选，下一梯度志愿录取', () => {
  const candidateB = { ...profile, score: 638 };
  const candidateBPlan = [
    { key: 'b3-1', batch: 3, position: 1, schoolId: 'b1', schoolName: '第一志愿学校' },
    { key: 'b3-2', batch: 3, position: 2, schoolId: 'b2', schoolName: '第二志愿学校' },
    { key: 'b3-3', batch: 3, position: 3, schoolId: 'b3', schoolName: '第三志愿学校' },
    { key: 'b3-4', batch: 3, position: 4, schoolId: 'b4', schoolName: '第四志愿学校' }
  ];
  const candidateBRecords = [
    { year: 2025, batch: 3, schoolId: 'b1', scope: '全市', candidateType: '户籍生', cutoffScore: 670, cutoffTieRank: 100, lastVolunteerNo: 1, lastCandidateScore: 670, lastCandidateTieRank: 100, gradientIndex: 2 },
    { year: 2025, batch: 3, schoolId: 'b2', scope: '全市', candidateType: '户籍生', cutoffScore: 630, cutoffTieRank: 100, lastVolunteerNo: 1, lastCandidateScore: 650, lastCandidateTieRank: 100, gradientIndex: 3 },
    { year: 2025, batch: 3, schoolId: 'b3', scope: '全市', candidateType: '户籍生', cutoffScore: 627, cutoffTieRank: 200, lastVolunteerNo: 3, lastCandidateScore: 642, lastCandidateTieRank: 100, gradientIndex: 3 },
    { year: 2025, batch: 3, schoolId: 'b4', scope: '全市', candidateType: '户籍生', cutoffScore: 598, cutoffTieRank: 100, lastVolunteerNo: 1, lastCandidateScore: 598, lastCandidateTieRank: 100, gradientIndex: 4 }
  ];
  const result = replayPlan(candidateB, candidateBPlan, { admissions: candidateBRecords, allocations: [], lines });
  assert.equal(result.slotResults[0].state, 'fail');
  assert.equal(result.slotResults[1].state, 'fail');
  assert.equal(result.slotResults[2].state, 'fail');
  assert.match(result.slotResults[2].reason, /末位考生分数642分/);
  assert.equal(result.slotResults[3].state, 'pass');
  assert.match(result.slotResults[3].reason, /梯度优先保护/);
  assert.equal(result.admitted.schoolId, 'b4');
});

test('不符合名额分配资格时直接判定资格不符', () => {
  const slot = { key: 'b2-1', batch: 2, position: 1, schoolId: 'quota', schoolName: '名额学校' };
  const record = { year: 2025, batch: 2, schoolId: 'quota', schoolName: '名额学校', scope: '送生初中', candidateType: '户籍生', cutoffScore: 650, lastVolunteerNo: 2, gradientIndex: 2 };
  const outcome = evaluateRecord({ ...profile, quotaEligible: false }, slot, record, 710, lines, null);
  assert.equal(outcome.state, 'ineligible');
});

test('预测固定种子可重复且学校机会不显示0或100', () => {
  const forecastProfile = { ...profile, mode: 'forecast', targetYear: 2027, scoreLow: 700, scoreHigh: 720 };
  const bands = [2025, 2026].flatMap((year) => [
    { year, score: 720, cumulativeRatio: 0.08 },
    { year, score: 710, cumulativeRatio: 0.11 },
    { year, score: 700, cumulativeRatio: 0.15 },
    { year, score: 690, cumulativeRatio: 0.2 }
  ]);
  const repeated = records.map((row) => ({ ...row, year: 2026, cutoffScore: row.cutoffScore + 2, gradientIndex: row.gradientIndex }));
  const data = { admissions: [...records, ...repeated], allocations: [], lines, bands, manifest: { years: [2025, 2026], latestPolicyYear: 2026 } };
  const first = simulateOutcomes(forecastProfile, plan, data, 42, 1000);
  const second = simulateOutcomes(forecastProfile, plan, data, 42, 1000);
  assert.deepEqual(first, second);
  first.slotResults.forEach((row) => assert.ok(row.chance >= 5 && row.chance <= 95));
});

test('单校把握与最终去向分开计算，后排保底不因前序录取被误判为冲刺', () => {
  const forecastProfile = { ...profile, mode: 'forecast', targetYear: 2027, score: 710, scoreLow: 710, scoreHigh: 710 };
  const twoSlots = [
    { key: 'b3-1', batch: 3, position: 1, schoolId: 'first', schoolName: '前序学校' },
    { key: 'b3-2', batch: 3, position: 2, schoolId: 'safe', schoolName: '后排保底学校' }
  ];
  const admissions = [2025, 2026].flatMap((year) => [
    { year, batch: 3, schoolId: 'first', schoolName: '前序学校', scope: '全市', candidateType: '户籍生', cutoffScore: 700, lastVolunteerNo: 2, lastCandidateScore: 700, gradientIndex: 2 },
    { year, batch: 3, schoolId: 'safe', schoolName: '后排保底学校', scope: '全市', candidateType: '户籍生', cutoffScore: 680, lastVolunteerNo: 2, lastCandidateScore: 680, gradientIndex: 2 }
  ]);
  const bands = [2025, 2026].flatMap((year) => [
    { year, score: 720, cumulativeRatio: 0.08 },
    { year, score: 710, cumulativeRatio: 0.11 },
    { year, score: 700, cumulativeRatio: 0.15 },
    { year, score: 680, cumulativeRatio: 0.22 }
  ]);
  const result = simulateOutcomes(forecastProfile, twoSlots, { admissions, allocations: [], lines, bands, manifest: { years: [2025, 2026], latestPolicyYear: 2026 } }, 7, 500);
  assert.equal(result.slotResults[0].chance, 95);
  assert.equal(result.slotResults[1].chance, 95);
  assert.equal(result.slotResults[1].tier, '保底');
  assert.equal(result.slotResults[0].outcomeProbability, 100);
  assert.equal(result.slotResults[1].outcomeProbability, 0);
});

test('存在资格错误时方案总分封顶59', () => {
  const fullPlan = Array.from({ length: 15 }, (_, index) => ({ key: `s-${index}`, batch: index < 3 ? 2 : index < 9 ? 3 : 4, position: index < 3 ? index + 1 : index < 9 ? index - 2 : index - 8, schoolId: `school-${index}`, schoolName: `学校${index}` }));
  const analysis = {
    noneProbability: 80,
    slotResults: fullPlan.map((slot, index) => ({ ...slot, state: index === 0 ? 'ineligible' : 'forecast', chance: 50, tier: '匹配' }))
  };
  const score = evaluatePlan({ ...profile, quotaEligible: true }, fullPlan, analysis);
  assert.ok(score.total <= 59);
  assert.equal(score.caps.some((cap) => cap.limit === 59), true);
  assert.equal(score.improvements.some((item) => item.key === 'validity' && item.points > 0), true);
});

test('满分方案不再显示加分项', () => {
  const fullPlan = Array.from({ length: 15 }, (_, index) => ({ key: `perfect-${index}`, batch: index < 3 ? 2 : index < 9 ? 3 : 4, position: index < 3 ? index + 1 : index < 9 ? index - 2 : index - 8, schoolId: `perfect-school-${index}`, schoolName: `满分学校${index}` }));
  const analysis = {
    noneProbability: 5,
    slotResults: fullPlan.map((slot, index) => ({ ...slot, state: 'forecast', chance: Math.min(95, 35 + index * 4), tier: index === 0 ? '冲刺' : index < 3 ? '匹配' : '保底' }))
  };
  const score = evaluatePlan({ ...profile, quotaEligible: true }, fullPlan, analysis);
  assert.equal(score.total, 100);
  assert.deepEqual(score.improvements, []);
  assert.deepEqual(score.caps, []);
});

test('方案合理度不因中考绝对分数直接加减分', () => {
  const fullPlan = Array.from({ length: 12 }, (_, index) => ({
    key: `relative-${index}`,
    batch: index < 6 ? 3 : 4,
    position: index < 6 ? index + 1 : index - 5,
    schoolId: `relative-school-${index}`,
    schoolName: `相对适配学校${index}`
  }));
  const analysis = {
    noneProbability: 8,
    slotResults: fullPlan.map((slot, index) => ({
      ...slot,
      state: 'forecast',
      chance: index < 2 ? 35 : index < 6 ? 60 : 85,
      tier: index < 2 ? '冲刺' : index < 6 ? '匹配' : '保底'
    }))
  };
  const lowScorePlan = evaluatePlan({ ...profile, score: 530, scoreLow: 520, scoreHigh: 540 }, fullPlan, analysis);
  const highScorePlan = evaluatePlan({ ...profile, score: 750, scoreLow: 740, scoreHigh: 760 }, fullPlan, analysis);
  assert.equal(lowScorePlan.total, highScorePlan.total);
  assert.deepEqual(lowScorePlan.dimensions, highScorePlan.dimensions);
});

test('波动压力测试会改变临界学校机会且固定种子可重复', () => {
  const pressureProfile = { ...profile, mode: 'forecast', targetYear: 2027, score: 700, scoreLow: 700, scoreHigh: 700 };
  const pressurePlan = [{ key: 'pressure-1', batch: 3, position: 1, schoolId: 'pressure-school', schoolName: '临界学校' }];
  const pressureRecords = [{ year: 2026, batch: 3, schoolId: 'pressure-school', schoolName: '临界学校', scope: '全市', candidateType: '户籍生', cutoffScore: 705, lastVolunteerNo: 1, lastCandidateScore: 705, gradientIndex: 2 }];
  const pressureData = { admissions: pressureRecords, allocations: [], lines, bands: [], manifest: { years: [2026], latestPolicyYear: 2026 } };
  const standard = simulateOutcomes(pressureProfile, pressurePlan, pressureData, 88, 2000);
  const stressed = simulateOutcomesRealistic(pressureProfile, pressurePlan, pressureData, { seed: 88, iterations: 2000 });
  const repeated = simulateOutcomesRealistic(pressureProfile, pressurePlan, pressureData, { seed: 88, iterations: 2000 });
  assert.notEqual(standard.slotResults[0].chance, stressed.slotResults[0].chance);
  assert.deepEqual(stressed, repeated);
});
