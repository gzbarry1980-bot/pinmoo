import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { evaluateRecord } from '../../guangzhou-zhongkao/engine.js';

const root = path.resolve(import.meta.dirname, '../..');
const dataRoot = path.join(root, 'guangzhou-zhongkao', 'data');
const caseLibrary = JSON.parse(await fs.readFile(path.join(dataRoot, 'admission-cases.json'), 'utf8'));
const controlLines = JSON.parse(await fs.readFile(path.join(dataRoot, 'control-lines.json'), 'utf8'));

test('公开案例库的来源与用途边界完整', () => {
  const sourceIds = new Set(caseLibrary.sources.map((source) => source.id));
  assert.equal(sourceIds.size, caseLibrary.sources.length);
  for (const source of caseLibrary.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
  }
  for (const item of [...caseLibrary.ruleCases, ...caseLibrary.actualCases]) {
    assert.ok(item.sourceIds.length > 0, `${item.id}缺少来源`);
    item.sourceIds.forEach((id) => assert.ok(sourceIds.has(id), `${item.id}引用未知来源${id}`));
  }
  assert.ok(caseLibrary.actualCases.every((item) => item.completePlanKnown === false));
  assert.equal(caseLibrary.policy.actualCaseUse, 'validation_only');
});

for (const ruleCase of caseLibrary.ruleCases.filter((item) => item.kind === 'official_hypothetical')) {
  test(`复演官方逐志愿案例：${ruleCase.id}`, () => {
    const profile = { candidateType: '户籍生', admissionDistrict: '越秀区', quotaEligible: true };
    let admittedPosition = null;
    for (const volunteer of ruleCase.volunteers) {
      const slot = { batch: ruleCase.batch, position: volunteer.position, schoolId: `${ruleCase.id}-${volunteer.position}` };
      const record = {
        year: ruleCase.year,
        batch: ruleCase.batch,
        schoolId: slot.schoolId,
        scope: '全市',
        candidateType: '户籍生',
        cutoffScore: volunteer.cutoffScore,
        cutoffTieRank: null,
        lastVolunteerNo: volunteer.lastVolunteerNo,
        lastCandidateScore: volunteer.lastCandidateScore ?? volunteer.cutoffScore,
        lastCandidateTieRank: null
      };
      const result = evaluateRecord(profile, slot, record, ruleCase.candidateScore, controlLines, null);
      assert.equal(result.state, volunteer.expectedState, `${ruleCase.id}第${volunteer.position}志愿判断不符`);
      if (result.state === 'pass' && admittedPosition === null) admittedPosition = volunteer.position;
    }
    assert.equal(admittedPosition, ruleCase.expectedAdmittedPosition);
  });
}

for (const year of [...new Set(caseLibrary.actualCases.map((item) => item.year))]) {
  test(`${year}年公开实际名额分配案例可在官方录取表中逐条核验`, async () => {
    const allocations = JSON.parse(await fs.readFile(path.join(dataRoot, `allocations-${year}.json`), 'utf8'));
    for (const item of caseLibrary.actualCases.filter((row) => row.year === year)) {
      const record = allocations.find((row) => row.batch === item.batch
        && row.sourceSchoolName === item.sourceSchoolName
        && row.schoolName === item.schoolName
        && row.cutoffScore === item.admittedScore);
      assert.ok(record, `${item.id}未在官方录取表中找到`);
      assert.equal(record.lastVolunteerNo, item.lastVolunteerNo, `${item.id}末位志愿序号不符`);
    }
  });
}

