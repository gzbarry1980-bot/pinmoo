import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {splitAdmissionNameItems} from './data-lib.mjs';
test('coalesced PDF name cells split only at an explicit cell separator',()=>{
 assert.deepEqual(splitAdmissionNameItems([{str:'广州市第六中学（海珠校区） 中山大学附属中学',x:38.75,y:700}]),[{str:'广州市第六中学（海珠校区）',x:38.75,y:700},{str:'中山大学附属中学',x:188.65,y:700}]);
 assert.equal(splitAdmissionNameItems([{str:'华南师范大学附属中学（石牌',x:38.75,y:700}]).length,1);
 assert.equal(splitAdmissionNameItems([{str:'747 180',x:368,y:700}]).length,1);
});
test('fused official quota outcomes retain null and do not change existing scores',async()=>{
 const root='guangzhou-zhongkao/data';
 const all=JSON.parse(await fs.readFile(`${root}/allocation-outcomes-2026.json`,'utf8'));
 const model=JSON.parse(await fs.readFile(`${root}/allocations-2026.json`,'utf8'));
 const pair=r=>`${r.schoolId}|${r.sourceSchoolId}`;
 assert.equal(new Set(all.records.map(pair)).size,all.records.length);
 assert.equal(all.records.length,all.counts.admitted+all.counts.noAdmittedCandidate);
 assert.ok(all.records.some(r=>r.status==='no_admitted_candidate'&&r.cutoffScore===null));
 const index=new Map(all.records.map(r=>[pair(r),r]));
 for(const r of model){const outcome=index.get(pair(r));assert.ok(outcome);for(const f of ['cutoffScore','cutoffTieRank','lastCandidateScore','lastVolunteerNo','lastCandidateTieRank'])assert.equal(outcome[f],r[f]);}
 assert.ok(model.every(r=>Number.isFinite(r.cutoffScore)&&r.admittedCount===null));
});
test('school quota minimum is separate from source-school actual cutoff',async()=>{
 const root='guangzhou-zhongkao/data';
 const controls=JSON.parse(await fs.readFile(`${root}/quota-controls-2026.json`,'utf8'));
 const model=JSON.parse(await fs.readFile(`${root}/allocations-2026.json`,'utf8'));
 assert.equal(controls.records.length,109);
 const six=controls.records.find(r=>r.schoolName==='广州市第六中学（海珠校区）');assert.equal(six.effectiveMinimum,676);
 const actual=model.find(r=>r.schoolId===six.schoolId&&r.sourceSchoolName==='广州市第一中学');assert.equal(actual.cutoffScore,709);assert.equal(actual.lastVolunteerNo,1);
 assert.ok(model.every(r=>r.cutoffScore>=controls.records.find(c=>c.schoolId===r.schoolId).effectiveMinimum));
});
