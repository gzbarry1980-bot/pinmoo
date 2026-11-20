import test from 'node:test';import assert from 'node:assert/strict';
import {schoolReferenceRecord} from '../../guangzhou-zhongkao/school-service.js';
import {safeReturnPath,planPath,currentProfile} from '../../guangzhou-zhongkao/flow-context.js';
import {decisionRisks} from '../../guangzhou-zhongkao/decision-experience.js';
import {preserveReviewedBands} from './preserve-reviewed-bands.mjs';
const data={admissions:[
 {schoolId:'a',year:2026,batch:3,candidateType:'户籍生',scope:'老三区',cutoffScore:700},
 {schoolId:'a',year:2026,batch:3,candidateType:'外区生',scope:'全市',cutoffScore:720},
 {schoolId:'a',year:2026,batch:3,candidateType:'随迁子女',scope:'全市',cutoffScore:710}
]};
test('school reference follows candidate, shared old-three region and external plans',()=>{
 for(const district of ['越秀区','荔湾区','海珠区'])assert.equal(schoolReferenceRecord(data,'a',{candidateType:'auto'},{candidateType:'户籍生',admissionDistrict:district}).cutoffScore,700);
 assert.equal(schoolReferenceRecord(data,'a',{candidateType:'auto'},{candidateType:'户籍生',admissionDistrict:'天河区'}).cutoffScore,720);
 assert.equal(schoolReferenceRecord(data,'a',{candidateType:'auto'},{candidateType:'随迁子女',admissionDistrict:'天河区'}).cutoffScore,710);
 assert.equal(schoolReferenceRecord({admissions:data.admissions.filter(r=>r.candidateType==='户籍生')},'a',{candidateType:'auto'},{candidateType:'随迁子女'}),null);
 assert.equal(schoolReferenceRecord(data,'a',{candidateType:'户籍生'},{candidateType:'随迁子女'}).cutoffScore,700);
});
test('return context is same-origin only and explicit missing plan never loads another family draft',()=>{
 assert.equal(safeReturnPath('https://evil.test/verify/','https://app.test'),null);
 assert.equal(safeReturnPath('//evil.test/schools/','https://app.test'),null);
 assert.equal(safeReturnPath('/serial-key/','https://app.test'),null);
 assert.equal(safeReturnPath('/verify/?plan=a&step=plan','https://app.test'),'/verify/?plan=a&step=plan');
 const ws={activePlanId:'b',profile:{candidateType:'户籍生'},plans:[{id:'a',profile:{candidateType:'随迁子女'}},{id:'b',profile:{candidateType:'户籍生'}}]};
 assert.equal(currentProfile(new URLSearchParams('plan=a'),ws).candidateType,'随迁子女');
 assert.equal(currentProfile(new URLSearchParams('plan=missing'),ws),null);
 assert.match(planPath('a','plan'),/step=plan&plan=a/);
});
test('specific qualification problems precede generic reform notices',()=>{
 const risks=decisionRisks({referenceGrade:'unknown'},{mode:'forecast',usableYears:[2026],policyContext:{structuralChange:true},slotResults:[{state:'ineligible',batch:3,position:2,schoolName:'a',reason:'无报考资格'}]},{suggestions:['补齐保底']});
 assert.match(risks[0],/第3批第2志愿/);assert.ok(risks.findIndex(t=>t.includes('科目分值'))>risks.findIndex(t=>t==='补齐保底'));
});
test('scheduled refresh preserves reviewed image rows and rejects a changed source image',async()=>{
 const rows=[{year:2021,score:750,cumulative:240,cumulativeRatio:.0027,sourceId:'official-2021-score-bands'}];
 const options={year:2021,parsed:[],previousBands:rows,previousSources:[{id:'official-2021-score-bands',parserVersion:'reviewed',imageEvidence:{url:'https://example.test/image.png',sha256:'same',rows:1}}],fetchAsset:async()=>({sha256:'same'})};
 assert.deepEqual((await preserveReviewedBands(options)).rows,rows);
 await assert.rejects(preserveReviewedBands({...options,fetchAsset:async()=>({sha256:'changed'})}),/image changed/);
 await assert.rejects(preserveReviewedBands({...options,previousBands:[]}),/rows incomplete/);
 await assert.rejects(preserveReviewedBands({...options,parsed:[{...rows[0],cumulative:241}]}),/disagree/);
});
