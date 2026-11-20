import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resourceURL,filterResources,RESOURCE_CATEGORIES} from '../../guangzhou-zhongkao/resource-library.js';
const data=JSON.parse(fs.readFileSync(new URL('../../guangzhou-zhongkao/data/member-resources.json',import.meta.url),'utf8'));
test('All ten supplied member entrances remain distinct external links',()=>{
 assert.equal(data.records.length,10);assert.equal(new Set(data.records.map(x=>x.id)).size,10);assert.equal(new Set(data.records.map(x=>x.url)).size,10);
 for(const record of data.records){assert.ok(resourceURL(record.url));assert.equal(record.contentStatus,'link_only');assert.deepEqual(record.schoolIds,[]);assert.ok(RESOURCE_CATEGORIES.includes(record.category));}
 assert.ok(data.notice.includes('本系统解锁不包含原平台会员权限'));
});
test('Resource URLs reject script, credentials and unrelated hosts',()=>{
 for(const value of ['javascript:alert(1)','http://khs1y.xetslk.com/','https://khs1y.xetslk.com.evil.example/','https://user:password@khs1y.xetslk.com/','/relative','bad'])assert.equal(resourceURL(value),null);
});
test('Resource filters keep school, policy and examination references easy to find',()=>{
 assert.equal(filterResources(data.records,{category:'选学校'}).length,2);assert.equal(filterResources(data.records,{query:'试卷'})[0].id,'member-exams');
 assert.equal(filterResources(data.records,{category:'选学校',query:'试卷'}).length,0);assert.equal(filterResources(data.records,{query:'不存在的内容'}).length,0);
});
test('Member references are not imported into the admission engine',()=>{
 const engine=fs.readFileSync(new URL('../../guangzhou-zhongkao/engine.js',import.meta.url),'utf8');assert.ok(!engine.includes('member-resources')&&!engine.includes('resource-library'));
});
