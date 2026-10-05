import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir='guangzhou-zhongkao/docs/qa-20261005-data-fusion';await fs.mkdir(dir,{recursive:true});
const base=process.env.ZK_TEST_URL||'http://localhost:5174';
const model=JSON.parse(await fs.readFile('guangzhou-zhongkao/data/allocations-2026.json','utf8'));
const target=model.find(r=>r.schoolName==='广州市第六中学（海珠校区）'&&r.sourceSchoolName==='广州市第一中学');assert.ok(target);
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));
await page.route('**/api/access/session',r=>r.fulfill({json:{authenticated:true,entitled:true,accessSource:'serial',serial:{deviceCount:1,maxDevices:2,remainingDevices:1}}}));
try{
 await page.goto(`${base}/quota/?school=${target.schoolId}`);await page.locator('#quotaYear option').first().waitFor({state:'attached'});
 await page.locator('#quotaSourceSearch').fill(target.sourceSchoolName);await page.locator('#quotaSource').selectOption(target.sourceSchoolId);
 await page.locator('#quotaResults table').waitFor();
 const row=page.locator('#quotaResults tr[data-target-school="true"]');await row.waitFor();assert.match(await row.innerText(),new RegExp(String(target.cutoffScore)));assert.match(await row.innerText(),/676（门槛）/);
 assert.match(await page.locator('#quotaCoverage').innerText(),/当年无人被录取/);
 const outcomes=JSON.parse(await fs.readFile('guangzhou-zhongkao/data/allocation-outcomes-2026.json','utf8'));
 const empty=outcomes.records.find(r=>r.cutoffScore===null);await page.locator('#quotaSourceSearch').fill('');await page.locator('#quotaSource').selectOption(empty.sourceSchoolId);assert.ok(await page.locator('#quotaSlot1 option[disabled]').count()>0);assert.match(await page.locator('#quotaResults').innerText(),/当年无人录取/);await page.locator('#quotaSource').selectOption(target.sourceSchoolId);
 await page.screenshot({path:`${dir}/quota-desktop.png`,fullPage:false});checks.push('此前漏解析的六中海珠记录可按初中查询；控制线与实际分数分别显示；空白结果不可误选为0分保底');
 await page.locator('#quotaConfirmed').check();await page.locator('#quotaSlot1').selectOption(target.schoolId);await page.locator('#saveQuota').click();await page.waitForURL('**/verify/?resume=1#volunteerForm');
 await page.waitForFunction(()=>document.body.dataset.uiReady==='true');assert.equal(await page.locator('.school-select[data-key="b2-1"]').inputValue(),target.schoolId);checks.push('新增录取记录可带入第二批模拟，未丢失学校ID');
 await page.locator('#scoreLow').fill('710');await page.locator('#scoreHigh').fill('730');await page.locator('#generateUnified').click();await page.locator('#analyzePlan').click();await page.locator('#analysis[data-stale="false"]').waitFor({state:'visible',timeout:60000});assert.notEqual(await page.locator('#totalScore').innerText(),'--');checks.push('补充数据后完整方案仍能生成最终评估');
 await page.goto(`${base}/schools/detail/?id=${target.schoolId}`);await page.locator('#quotaEvidence').waitFor();assert.match(await page.locator('#quotaEvidence').innerText(),/676分/);assert.ok(await page.locator('#quotaEvidence a[href*="gzzk.gz.gov.cn"]').count());checks.push('学校档案展示名额分配结果和官方最低控制线来源');
 await page.screenshot({path:`${dir}/school-desktop.png`,fullPage:false});
 await page.setViewportSize({width:390,height:844});for(const route of ['/quota/',`/schools/detail/?id=${target.schoolId}`]){await page.goto(base+route);await page.locator('.mobile-nav').waitFor({state:'attached'});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);}
 checks.push('手机查询与学校档案无页面横向溢出');await page.screenshot({path:`${dir}/school-mobile.png`,fullPage:false});assert.deepEqual(errors,[]);
 await fs.writeFile(`${dir}/results.json`,JSON.stringify({status:'passed',checks,errors,completedAt:new Date().toISOString(),access:'isolated fixture; no real device binding'},null,2));console.log(JSON.stringify({status:'passed',checks,errors}));
}finally{await browser.close();}
