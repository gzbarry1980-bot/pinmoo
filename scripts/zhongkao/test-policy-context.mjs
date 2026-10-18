import test from 'node:test';
import assert from 'node:assert/strict';
import {latestAdmissionYear,defaultForecastYear,latestScoreDistributionYear,policyContext,REFORM_2027,analysisIsCurrent} from '../../guangzhou-zhongkao/policy-context.js';
import {simulateOutcomes,replayPlan,evaluateRecord} from '../../guangzhou-zhongkao/engine.js';
import {simulateOutcomesRealistic} from '../../guangzhou-zhongkao/realistic-sim.js';
import {filterSchools} from '../../guangzhou-zhongkao/school-service.js';
const manifest={latestPolicyYear:2027,latestAnnualRulesYear:2026,latestAdmissionYear:2026,latestScoreDistributionYear:2026,defaultForecastYear:2027,years:[2025,2026]};
const profile={mode:'forecast',targetYear:2027,score:705,scoreLow:700,scoreHigh:710,candidateType:'户籍生',admissionDistrict:'天河区'};
const plan=[{key:'b3-1',batch:3,position:1,schoolId:'a',schoolName:'测试学校'}];
const data={manifest,admissions:[2025,2026].map(year=>({year,batch:3,schoolId:'a',schoolName:'测试学校',candidateType:'户籍生',scope:'全市',cutoffScore:702,lastVolunteerNo:1,lastCandidateScore:702,gradientIndex:2})),allocations:[],bands:[2025,2026].flatMap(year=>[{year,score:710,cumulativeRatio:.1},{year,score:700,cumulativeRatio:.2},{year,score:690,cumulativeRatio:.3}]),lines:Object.fromEntries([2025,2026].map(year=>[year,{gradients:[707,667],publicMinimum:492}]))};
test('Published policy year cannot move data retrieval or default target to 2028',()=>{assert.equal(latestAdmissionYear(manifest),2026);assert.equal(defaultForecastYear(manifest),2027);assert.equal(latestScoreDistributionYear(data),2026);assert.equal(latestAdmissionYear({latestPolicyYear:2026,years:[2025,2026]}),2026);});
test('2027 facts retain 810 total, old-three-district grouping and scoped grade requirement',()=>{assert.equal(Object.values(REFORM_2027.subjectScores).reduce((a,b)=>a+b,0),810);assert.deepEqual(REFORM_2027.migrantPlanRatio,[.08,.20]);assert.equal(REFORM_2027.sharedAdmissionDistricts.length,3);assert.deepEqual(REFORM_2027.referenceGrades.appliesTo,['自主招生','名额分配']);});
test('Reform announcement and annual details are distinguished, replay and unknown cycle are explicit',()=>{const c=policyContext(profile,manifest);assert.match(c.notice,/已收录2027—2029/);assert.equal(c.annualDetailsStatus,'not_reviewed');assert.equal(c.referenceDataYear,2026);assert.equal(policyContext({...profile,mode:'replay',targetYear:2025},manifest).structuralChange,false);assert.equal(policyContext({...profile,targetYear:2030},manifest).frameworkYear,null);});
for(const [name,simulate] of [['standard',(p,d)=>simulateOutcomes(p,plan,d,8,600)],['variability',(p,d)=>simulateOutcomesRealistic(p,plan,d,{seed:8,iterations:600})]]){
 test(`${name}: 2027 framework uses observed 2026 distribution, fixed seed and limited confidence`,()=>{const first=simulate(profile,data),second=simulate(profile,data);assert.deepEqual(first,second);assert.equal(first.policyContext.scoreDistributionYear,2026);assert.equal(first.slotResults[0].confidence,'低');assert.equal(first.slotResults[0].policyUncertainty,true);assert.match(first.policyContext.uncertaintyNote,/科目分值调整/);const legacy=simulate(profile,{...data,manifest:{...manifest,latestPolicyYear:2026}});assert.equal(first.slotResults[0].chance,legacy.slotResults[0].chance);assert.deepEqual(first.outcomes,legacy.outcomes);});
}
test('Historical replay and school filters retain actual year records',()=>{const result=replayPlan({...profile,mode:'replay',targetYear:2026,score:710},plan,data);assert.equal(result.admitted.schoolId,'a');const schools=[{id:'a',name:'测试学校',ownership:'公办'}];assert.equal(filterSchools({...data,schools},{sort:'cutoff'}).length,1);});
test('Saved summaries must match both model and data before comparison',()=>{const m={version:'v1'};assert.equal(analysisIsCurrent({dataVersion:'v1',modelVersion:'2.2'},m),false);assert.equal(analysisIsCurrent({dataVersion:'v1',modelVersion:'2.3'},m),true);assert.equal(analysisIsCurrent({dataVersion:'v0',modelVersion:'2.3'},m),false);assert.equal(analysisIsCurrent({dataVersion:'v1',modelVersion:'replay'},m),true);});
test('Using a policy year with no observed bands cannot silently skip rank conversion',()=>{
 const shifted={...data,bands:data.bands.map(r=>({...r,score:r.year===2025?r.score+10:r.score})),admissions:data.admissions.map(r=>({...r,cutoffScore:r.year===2025?712:702,lastCandidateScore:r.year===2025?712:702,gradientIndex:r.year===2025?1:2}))};
 const r=simulateOutcomes({...profile,scoreLow:705,scoreHigh:705},plan,shifted,8,1000);
 assert.equal(r.slotResults[0].chance,95);assert.equal(r.policyContext.scoreDistributionYear,2026);
});
test('Old-three-district admissions are shared while another district is not treated as local',()=>{
 const record={...data.admissions[1],scope:'老三区'};
 for(const district of ['越秀区','荔湾区','海珠区'])assert.equal(evaluateRecord({...profile,admissionDistrict:district},plan[0],record,705,data.lines).state,'pass');
 assert.equal(evaluateRecord({...profile,admissionDistrict:'天河区'},plan[0],record,705,data.lines).state,'ineligible');
});
