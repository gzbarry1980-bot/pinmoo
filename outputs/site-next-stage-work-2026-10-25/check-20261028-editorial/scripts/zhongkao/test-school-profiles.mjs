import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { enrichSchoolProfiles } from './school-profile-data.mjs';
const schools = JSON.parse(await fs.readFile('guangzhou-zhongkao/data/schools.json', 'utf8'));
const controls = JSON.parse(await fs.readFile('guangzhou-zhongkao/data/quota-controls-2026.json', 'utf8'));
const sources = JSON.parse(await fs.readFile('guangzhou-zhongkao/data/sources.json', 'utf8'));
const result = enrichSchoolProfiles(schools, controls);
assert.equal(result.matched.length, 110);
for (const s of schools.filter(s => s.schoolProfileSourceId)) {
  assert(sources.some(r => r.id === s.schoolProfileSourceId));
  assert(s.administrativeAffiliation);
  assert(s.schoolDesignation);
}
for (const name of ['广东广雅中学（本部校区）', '广东广雅中学（荔湾校区）', '广东广雅中学（花都校区）']) {
  const s = schools.find(s => s.name === name);
  assert.equal(s.administrativeAffiliation, '市属');
  assert.equal(s.schoolDesignation, '国家级示范性普通高中');
}
assert.equal(schools.find(s => s.name === '广东广雅中学（花都校区）').campusDistrict, '花都区');
console.log('学校资料测试通过：110个学校/历史校区档案，来源完整，区域与隶属分离。');
