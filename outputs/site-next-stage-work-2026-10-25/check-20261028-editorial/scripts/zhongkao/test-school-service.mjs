import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesSchool,filterSchools,historyFor,latestRecord,schoolLocation} from '../../guangzhou-zhongkao/school-service.js';
import {readWorkspace,updateWorkspace,parseAnonymousPlan} from '../../guangzhou-zhongkao/workspace-store.js';
test('school search supports campus aliases and is independent of candidate score',()=>{
  assert.ok(matchesSchool({name:'华南师范大学附属中学（石牌校区）'},'华附石牌'));
  assert.ok(matchesSchool({name:'广州市培正中学'},'培正'));
  assert.ok(!matchesSchool({name:'广州市培正中学'},'不存在'));
  assert.equal(filterSchools({schools:[{id:'a',name:'历史学校',ownership:'公办'}],admissions:[]},{}).length,1);
});
test('school history keeps populations and years distinct, missing is null',()=>{
  const data={admissions:[{schoolId:'a',year:2026,batch:3,candidateType:'户籍生',cutoffScore:700},{schoolId:'a',year:2026,batch:3,candidateType:'随迁子女',cutoffScore:720}]};
  assert.equal(historyFor(data,'a',{candidateType:'随迁子女'})[0].cutoffScore,720);
  assert.equal(latestRecord(data,'a',{year:2025}),null);
});
test('official guide contacts are split from campus address without inventing missing phones',()=>{
 assert.deepEqual(schoolLocation({campusAddress:'020-87305762、87651040、广州市越秀区培正路2号'}),{address:'广州市越秀区培正路2号',phones:['020-87305762','87651040']});
 assert.deepEqual(schoolLocation({campusAddress:null}),{address:'',phones:[]});
});
test('workspace save errors are visible; reading invalid storage is safe',()=>{
  const storage={getItem:()=>'{bad',setItem:()=>{throw new Error('full');}};
  assert.deepEqual(readWorkspace(storage).plans,[]);
  assert.throws(()=>updateWorkspace(s=>s.favorites.push('a'),storage),/full/);
});
test('anonymous import strips identity fields and uses verified school names',()=>{
 const plan=[2,3,4].flatMap(b=>Array.from({length:b===2?3:6},(_,i)=>({key:`b${b}-${i+1}`,batch:b,position:i+1,schoolId:'',schoolName:'',phone:'not allowed'})));
 plan[3].schoolId='a';plan[3].schoolName='<script>unsafe</script>';
 const input={profile:{mode:'forecast',targetYear:2027,score:690,scoreLow:680,scoreHigh:700,candidateType:'户籍生',name:'not allowed'},plan};
 const result=parseAnonymousPlan(input,[{id:'a',name:'已核验学校'}]);
 assert.equal(result.profile.name,undefined);assert.equal(result.plan[3].phone,undefined);assert.equal(result.plan[3].schoolName,'已核验学校');
 assert.throws(()=>parseAnonymousPlan({...input,profile:{...input.profile,score:999}},[]),/估分/);
});
