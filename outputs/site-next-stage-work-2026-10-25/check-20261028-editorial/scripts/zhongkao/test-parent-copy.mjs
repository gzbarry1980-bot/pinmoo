import test from 'node:test';
import assert from 'node:assert/strict';
import {confidenceCopy,plainCopy,readingGuideHTML} from '../../guangzhou-zhongkao/parent-copy.js';
test('parent confidence wording explains evidence, never substitutes admission probability',()=>{
 assert.equal(confidenceCopy('中').label,'历史依据：一般');
 assert.match(confidenceCopy('中').explanation,/年数.*补估.*波动/);
 const guide=readingGuideHTML();assert.match(guide,/不是录取机会/);assert.match(guide,/100分不等于100%录取/);assert.match(guide,/保底也有风险/);
 assert.match(guide,/同分序号/);assert.match(guide,/末位志愿序号/);
});
test('copy transformations are repeat-safe and preserve numeric evidence',()=>{
 for(const original of ['中置信度 · 3年直接同口径数据 · 最终去向13.4%','志愿顺序与梯度','资格与表格有效性','部分情景按同校最近年份位次折算（13%）','近年等位门槛跨度28分，已放宽区间','近年75%记录在第一志愿完成计划','标准历史情景模拟']){
  const changed=plainCopy(original);assert.equal(plainCopy(changed),changed);
  assert.deepEqual(changed.match(/\d+(?:\.\d+)?/g),original.match(/\d+(?:\.\d+)?/g));
 }
 assert.equal(plainCopy('中置信度'),'历史依据：一般');
});
