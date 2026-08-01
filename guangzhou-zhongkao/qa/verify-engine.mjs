import { simulateOutcomes, evaluatePlan } from '../engine.js';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/admissions.json', import.meta.url)));
const schools = JSON.parse(readFileSync(new URL('../data/schools.json', import.meta.url)));
const bands = JSON.parse(readFileSync(new URL('../data/score-bands.json', import.meta.url)));
const lines = JSON.parse(readFileSync(new URL('../data/control-lines.json', import.meta.url)));
const manifest = JSON.parse(readFileSync(new URL('../data/manifest.json', import.meta.url)));

// 取 3 所真实学校构造 15 槽
const pick = ['华南师范大学附属中学（石牌校区）', '广州市第二中学', '广州市第六中学（海珠校区）']
  .map((name) => schools.find((school) => school.name === name)?.id)
  .filter(Boolean);
const plan = [
  { key: 'b3-1', batch: 3, position: 1, schoolId: pick[0], schoolName: 'A' },
  { key: 'b3-2', batch: 3, position: 2, schoolId: pick[1], schoolName: 'B' },
  { key: 'b4-1', batch: 4, position: 1, schoolId: pick[2], schoolName: 'C' }
];
const profile = {
  mode: 'forecast',
  targetYear: 2027,
  score: 710,
  scoreLow: 700,
  scoreHigh: 720,
  tieRank: null,
  candidateType: '户籍生',
  admissionDistrict: '天河区',
  householdDistrict: '天河区',
  schoolDistrict: '天河区',
  sourceSchoolId: '',
  referenceGrade: 'C',
  riskPreference: '均衡',
  ownershipPreference: '不限',
  boardingPreference: '不限',
  maxAnnualFee: null,
  preferredDistricts: ['天河区'],
  excludedSchools: [],
  crossDistrict: false,
  quotaEligible: false,
  notAdmittedFirstBatch: true
};

const ds = { admissions: data, allocations: [], bands, lines, manifest, schools, sourceSchools: [], sources: [] };
const out = simulateOutcomes(profile, plan, ds, 20260722, 10000);
// 稳定序列化关键结果
const sig = out.slotResults.map((row) => [row.batch, row.position, row.chance, row.tier, row.interval[0], row.interval[1]]);
console.log(JSON.stringify(sig));
