import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {schoolReference,renderSchoolReference} from '../../guangzhou-zhongkao/school-reference-view.js';
const read=name=>JSON.parse(fs.readFileSync(new URL('../../guangzhou-zhongkao/data/'+name,import.meta.url),'utf8'));
const references=read('school-references.json'),schools=read('schools.json');
test('20 references use exact, unique campus IDs with retrievable article provenance',()=>{
 assert.equal(references.records.length,20);
 assert.equal(new Set(references.records.map(r=>r.schoolId)).size,20);
 for(const r of references.records){
  assert.ok(schools.some(s=>s.id===r.schoolId&&s.name===r.schoolName));
  const src=references.sources.find(s=>s.id===r.sourceId);
  assert.ok(src?.url.startsWith('https://app0vjwwvpz3722.h5.xet.pomoho.com/p/course/text/'));
  assert.match(src.contentSHA256,/^[a-f0-9]{64}$/);
  assert.ok(src.publishedAt&&src.capturedAt);
  assert.equal(r.useInModel,false);assert.equal(r.boarding.verifiedForCurrentYear,false);
  assert.ok(r.boarding.semesterFee==null||r.boarding.semesterFee>0);
  assert.equal(r.boarding.feeUnit,'元/学期');
 }
});
test('17 class-table references are historical and preserve discrepancies',()=>{
 assert.equal(references.records.filter(r=>r.classes?.sourceId==='member-class-table-2025-20261014').length,17);
 for(const id of ['gz-3a2e51774f57','gz-96a493c0f2d1','gz-9a6f1f35a825'])assert.ok(schoolReference({references},id).classes.issues.length);
 assert.equal(schoolReference({references},'gz-27a6b9f3302f'),null);
 assert.equal(schoolReference({references},'gz-11fe9a9bc94f').boarding.referenceYear,2023);
 assert.equal(schoolReference({references},'gz-39546db6ee78').schoolName,'广州外国语学校');
 assert.equal(schoolReference({references},'gz-ec1a75c75160'),null); // No unrelated school fallback.
});
test('renderer shows actual facts, dates, source details and no misleading current fee',()=>{
 const html=renderSchoolReference(references.records[0],references.sources);
 assert.match(html,/6—7人间/);assert.match(html,/650元\/学期（历史资料）/);assert.match(html,/2025年/);
 assert.match(html,/不参与录取机会或方案评分/);assert.match(html,/核对事项与资料依据/);
 assert.equal(renderSchoolReference(null), '');
});
test('school reference content and source URLs cannot inject HTML or scripts',()=>{
 const r=structuredClone(references.records[0]);r.features='<img src=x onerror=alert(1)>';r.boarding.rooms='<script>unsafe</script>';
 const html=renderSchoolReference(r,[{id:r.sourceId,title:'<script>title</script>',url:'javascript:alert(1)',publishedAt:'2025-01-01'}]);
 assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));
 assert.ok(html.includes('&lt;script&gt;'));
});
test('raw membership articles, screenshots and OCR outputs are absent from public build',()=>{
 assert.ok(!fs.existsSync(new URL('../../dist/zhongkao/research',import.meta.url)));
 assert.ok(fs.existsSync(new URL('../../dist/zhongkao/data/school-references.json',import.meta.url)));
 assert.ok(!JSON.stringify(references).includes('"text":'));
 for(const r of references.records){const official=schools.find(s=>s.id===r.schoolId);assert.equal(official.boarding,null);assert.equal(official.annualFee,null);}
});
