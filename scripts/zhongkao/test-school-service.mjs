import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesSchool,filterSchools,historyFor,latestRecord} from '../../guangzhou-zhongkao/school-service.js';
import {readWorkspace,updateWorkspace} from '../../guangzhou-zhongkao/workspace-store.js';
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
test('workspace save errors are visible; reading invalid storage is safe',()=>{
  const storage={getItem:()=>'{bad',setItem:()=>{throw new Error('full');}};
  assert.deepEqual(readWorkspace(storage).plans,[]);
  assert.throws(()=>updateWorkspace(s=>s.favorites.push('a'),storage),/full/);
});
