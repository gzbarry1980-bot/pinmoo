import test from 'node:test';
import assert from 'node:assert/strict';
import {regionMode,preferredRegions,matchesRegion,regionSummary,regionValidation,prioritizeRegions} from '../../guangzhou-zhongkao/region-preference.js';
import {parseAnonymousPlan} from '../../guangzhou-zhongkao/workspace-store.js';
import {simulateOutcomes} from '../../guangzhou-zhongkao/engine.js';

const household={regionPreference:'household',householdDistrict:'天河区'};
test('区域偏好：新档默认同区，旧档显式区域不丢失，不限区域忽略旧列表',()=>{
 assert.equal(regionMode({}),'household');
 assert.equal(regionMode({preferredDistricts:['越秀区']}),'custom');
 assert.deepEqual(preferredRegions(household),['天河区']);
 assert.deepEqual(preferredRegions({...household,regionPreference:'none',preferredDistricts:['越秀区']}),[]);
 assert.equal(regionSummary({...household,regionPreference:'none'}),'不限区域');
});
test('多区选择去重、忽略未知值、空选择给出提示；以校址而非招生范围匹配',()=>{
 const custom={regionPreference:'custom',preferredDistricts:['天河区','越秀区','越秀区','未知']};
 assert.deepEqual(preferredRegions(custom),['天河区','越秀区']);
 assert.equal(regionValidation(custom),'');
 assert.match(regionValidation({...custom,preferredDistricts:[]}),/至少选择/);
 assert.equal(matchesRegion({campusDistrict:'越秀区',district:'天河区'},household),false);
 assert.equal(matchesRegion({campusDistrict:'天河区',scope:'全市'},household),true);
 assert.equal(matchesRegion({scope:'天河区'},household),false);
});
test('同区软优先仅在接近条件内生效，所有外区候选保留，不限区域保留基准顺序',()=>{
 const candidates=[{id:'outside',rank:1,school:{campusDistrict:'越秀区'}},{id:'home',rank:6,school:{campusDistrict:'天河区'}},{id:'far',rank:25,school:{campusDistrict:'天河区'}}];
 assert.deepEqual(prioritizeRegions(candidates,household).map(c=>c.id),['home','outside','far']);
 assert.equal(prioritizeRegions(candidates,household,{tolerance:3})[0].id,'outside');
 assert.equal(prioritizeRegions(candidates,household,{comparable:()=>false})[0].id,'outside');
 assert.deepEqual(prioritizeRegions(candidates,{...household,regionPreference:'none'}),candidates);
 assert.equal(candidates[0].id,'outside');
});
test('匿名方案导入导出保留区域模式并拒绝未知模式',()=>{
 const plan=[2,3,4].flatMap(batch=>Array.from({length:batch===2?3:6},(_,i)=>({key:`b${batch}-${i+1}`,batch,position:i+1,schoolId:''})));
 const raw={profile:{...household,mode:'forecast',targetYear:2027,score:690,scoreLow:680,scoreHigh:700,candidateType:'户籍生'},plan};
 assert.equal(parseAnonymousPlan(JSON.parse(JSON.stringify(raw)),[]).profile.regionPreference,'household');
 assert.throws(()=>parseAnonymousPlan({...raw,profile:{...raw.profile,regionPreference:'invalid'}},[]),/区域偏好/);
});
test('同一分数、志愿和种子下区域喜好不改变模拟投档机会',()=>{
 const profile={...household,mode:'forecast',targetYear:2027,score:700,scoreLow:690,scoreHigh:710,candidateType:'户籍生',admissionDistrict:'天河区',quotaEligible:false};
 const plan=[{key:'b3-1',batch:3,position:1,schoolId:'a',schoolName:'测试学校'}];
 const data={manifest:{years:[2026],latestPolicyYear:2026},lines:{2026:{gradients:[712,672,632,592,552,512],publicMinimum:492,privateMinimum:412}},allocations:[],bands:[{year:2026,score:710,cumulativeRatio:.1},{year:2026,score:690,cumulativeRatio:.2}],admissions:[{year:2026,batch:3,schoolId:'a',schoolName:'测试学校',scope:'全市',candidateType:'户籍生',cutoffScore:695,lastVolunteerNo:1,gradientIndex:2}]};
 const baseline=simulateOutcomes(profile,plan,data,42,500);
 for(const regionPreference of ['none','custom'])assert.deepEqual(simulateOutcomes({...profile,regionPreference,preferredDistricts:['越秀区']},plan,data,42,500),baseline);
});
