import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findSchoolOutcome,outcomeMetric,renderOutcomeSummary,renderOutcomeDetails} from '../../guangzhou-zhongkao/school-outcome-view.js';
const outcomes=JSON.parse(fs.readFileSync('guangzhou-zhongkao/data/school-outcomes.json','utf8'));
const data={outcomes};
test('Reviewed table has exact unique school IDs, per-source evidence and no model inputs',()=>{
 const schools=JSON.parse(fs.readFileSync('guangzhou-zhongkao/data/schools.json','utf8'));
 assert.equal(outcomes.records.length,63);assert.equal(new Set(outcomes.records.map(r=>r.schoolId)).size,63);
 for(const r of [...outcomes.records,...outcomes.aggregateRecords]){assert.equal(r.useInModel,false);assert.ok(outcomes.sources.some(s=>s.id===r.sourceId&&s.imageSHA256?.length===64));for(const y of r.years){assert.ok([2023,2024,2025].includes(y.year));assert.equal(y.denominator,null);}if(r.schoolId)assert.ok(schools.some(s=>s.id===r.schoolId));}
});
test('Counts cannot be rendered as rates and missing cells stay blank',()=>{
 assert.equal(outcomeMetric('80人','count','special').label,'特控人数');
 const school=findSchoolOutcome(data,'gz-524a67309dff');const summary=renderOutcomeSummary(school);
 assert.match(summary,/特控人数 80人/);assert.doesNotMatch(summary,/上线比例 80人/);
 assert.equal(findSchoolOutcome(data,'gz-79a8dd8dc065').years[0].year,2024);
 assert.equal(outcomeMetric(null,null,'600'),null);
});
test('Key classes and multi-campus aggregates retain visible scope boundaries',()=>{
 assert.match(renderOutcomeSummary(findSchoolOutcome(data,'gz-a9afa174ddb3')),/重点班特控率/);
 const iron=findSchoolOutcome(data,'gz-9a6f1f35a825');assert.equal(iron.schoolId,null);
 assert.match(renderOutcomeDetails(iron,outcomes.sources),/不能作为当前单校区/);
 assert.equal(findSchoolOutcome(data,'gz-198c01489912').sourceSchoolLabel,'华附石牌');
 assert.equal(findSchoolOutcome(data,'gz-fd2a5311bae4'),null);
 assert.equal(findSchoolOutcome(data,'gz-284b2b772794'),null);
});
test('Disagreement survives transcription and no official verification is invented',()=>{
 assert.ok(findSchoolOutcome(data,'gz-96a493c0f2d1').issues.some(x=>x.includes('62.5%')));
 assert.ok(outcomes.sources.every(s=>s.officialVerification==='not_verified'));
 const evil={...outcomes.records[0],sourceSchoolLabel:'<img src=x onerror=alert(1)>',sourceId:'bad'};
 const html=renderOutcomeDetails(evil,[{id:'bad',url:'javascript:alert(1)',title:'<script>'}]);
 assert.ok(!html.includes('<img'));assert.ok(!html.includes('href="javascript:'));assert.ok(html.includes('&lt;img'));
});
