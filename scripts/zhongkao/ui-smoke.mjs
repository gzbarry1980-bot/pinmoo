import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ZK_TEST_URL||'http://localhost:5174';
const dir=new URL('../../guangzhou-zhongkao/docs/qa-20261005/',import.meta.url);await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],checks=[];
await fs.writeFile(new URL('results.json',dir),JSON.stringify({status:'running',startedAt:new Date().toISOString()},null,2));
const page=await browser.newPage({viewport:{width:1440,height:1000}});
// Test-only HTTP fixtures exercise entitled UI without changing production access controls.
await page.route('**/api/access/config',route=>route.fulfill({json:{accessMode:'enforce'}}));
await page.route('**/api/access/session',route=>route.fulfill({json:{authenticated:true,entitled:true,accessSource:'serial',serial:{deviceCount:1,maxDevices:2,remainingDevices:1}}}));
page.on('pageerror',e=>errors.push(e.message));
const screenshot=async name=>page.screenshot({path:new URL(name+'.png',dir).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:false});
const goto=async path=>{await page.goto(base+path);await page.locator('.mobile-nav').waitFor({state:'attached'});await page.waitForTimeout(150);};
try{
 await goto('/');await screenshot('home-desktop');
 await page.locator('#homeSchoolSearch').fill('培正');await page.locator('[data-school-search] button').click();await page.waitForURL('**/schools/?q=*');
 await page.locator('.library-card').first().waitFor();assert.ok(await page.locator('#libraryCount').innerText());checks.push('首页无考生信息搜索学校');await screenshot('library-desktop');
 await page.locator('.library-card h3 a').first().click();await page.locator('#historyTable table').waitFor();checks.push('独立学校档案、历史口径');await screenshot('detail-desktop');
 await page.locator('[data-favorite]').first().click();assert.equal(await page.locator('[data-favorite]').first().getAttribute('aria-pressed'),'true');checks.push('收藏学校');
 await page.locator('#returnToSchools').click();await page.locator('.library-card').first().waitFor();assert.equal(await page.locator('[name=q]').inputValue(),'培正');checks.push('返回保留搜索');
 await goto('/schools/?q=铁一');await page.locator('.library-card').first().waitFor();await page.locator('[data-compare]').nth(0).click();await page.locator('[data-compare]').nth(1).click();await goto('/schools/compare/');await page.locator('#compareTable table').waitFor();checks.push('两校比较');await screenshot('compare-desktop');
 await goto('/direction/');await page.locator('#directionLow').fill('680');await page.locator('#directionHigh').fill('700');await page.locator('#generateDirection').click();await page.locator('#directionResult').waitFor({state:'visible',timeout:60000});assert.match(await page.locator('#directionStats').innerText(),/合理度/);checks.push('方向生成含最终评估');await screenshot('direction-desktop');
 assert.match(await page.locator('#directionGroups').innerText(),/历史依据/);assert.doesNotMatch(await page.locator('#directionGroups').innerText(),/[高中低]置信度/);checks.push('方向页使用家长能理解的依据标签');
 await page.locator('[data-direction-risk="稳健"]').click();await page.locator('#directionChanges').waitFor({state:'visible',timeout:60000});assert.equal(await page.locator('#directionRisk').inputValue(),'稳健');checks.push('切换风险策略显示具体变化');
 await page.locator('#adoptDirection').click();await page.waitForURL('**/verify/?draft=direction*');await page.locator('.school-select').first().waitFor();await page.waitForTimeout(300);assert.ok((await page.locator('.school-select').evaluateAll(s=>s.filter(x=>x.value).length))>=8);checks.push('采用方向并恢复12槽主志愿');
 await page.locator('#analyzePlan').click();await page.locator('#analysis').waitFor({state:'visible',timeout:60000});assert.notEqual(await page.locator('#totalScore').innerText(),'--');assert.equal(await page.locator('#analysis').getAttribute('data-stale'),'false');checks.push('完整评估分值、去向、建议');await page.locator('#analysis').evaluate(el=>window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-100,behavior:'instant'}));await screenshot('analysis-desktop');
 await page.locator('#analysis').getByText('查看每个志愿的机会与历史依据',{exact:true}).click();assert.match(await page.locator('#chanceList').innerText(),/历史依据/);assert.doesNotMatch(await page.locator('#chanceList').innerText(),/[高中低]置信度|直接同口径/);await page.locator('#analysis .parent-reading-guide summary').click();assert.match(await page.locator('#analysis .parent-reading-guide').innerText(),/不是录取机会/);await page.locator('#analysis .parent-reading-guide').screenshot({path:new URL('parent-reading-guide.png',dir).pathname.replace(/^\/([A-Z]:)/,'$1')});checks.push('结果术语可展开解释且区别依据与录取机会');
 const scoreBefore=await page.locator('#totalScore').innerText();await page.locator('#outcomeList [data-school-detail]').first().click();await page.locator('#historyTable table').waitFor();await page.getByRole('link',{name:'返回当前评估结果',exact:true}).click();await page.locator('#analysis').waitFor({state:'visible'});assert.equal(await page.locator('#totalScore').innerText(),scoreBefore);checks.push('评估学校档案返回保持完整结果');
 const nameBefore=await page.locator('.school-select').nth(0).inputValue();await page.locator('[data-move=down]').first().click();assert.equal(await page.locator('#analysis').getAttribute('data-stale'),'true');await page.locator('#undoPlan').click();assert.equal(await page.locator('.school-select').nth(0).inputValue(),nameBefore);checks.push('排序失效提示与撤销');
 await page.locator('.workspace-save-options>summary').click();await page.locator('#saveAsPlan').click();await goto('/my/');assert.ok(await page.locator('.plan-summary').count()>=2);checks.push('多方案另存');
 await page.locator('[data-plan-compare]').nth(0).check();await page.locator('[data-plan-compare]').nth(1).check();await page.getByRole('button',{name:'比较选中的两份方案'}).click();await page.locator('.data-table').waitFor();checks.push('两份方案条件与志愿比较');
 await goto('/verify/?new=1');await page.locator('.school-select').first().waitFor();assert.equal(await page.locator('.school-select').evaluateAll(s=>s.filter(x=>x.value).length),0);checks.push('新方案空白');
 await goto('/target/?school=gz-198c01489912');assert.match(await page.locator('#targetSchoolName').inputValue(),/石牌/);checks.push('学校带入目标校');
 await page.locator('#analyzeTarget').click();await page.locator('#targetResult').waitFor({state:'visible',timeout:60000});await page.locator('#targetProfileLink').waitFor();checks.push('目标校分值规划与档案链接');
 await goto('/special/?mode=talent');await page.locator('#schoolGrid .school-card').first().waitFor();checks.push('专项页面可用');
 await page.setViewportSize({width:390,height:844});
 for(const [route,name] of [['/','home-mobile'],['/schools/?q=培正','library-mobile'],['/schools/detail/?id=gz-198c01489912','detail-mobile'],['/direction/','direction-mobile'],['/target/','target-mobile'],['/verify/?resume=1','verify-mobile'],['/special/?mode=autonomous','special-mobile'],['/unlock/','unlock-mobile'],['/my/','my-mobile']]){await goto(route);await screenshot(name);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.ok(!overflow,`body overflow at ${route}`);const sizes=await page.evaluate(()=>[...new Set([...document.querySelectorAll('body *')].filter(el=>el.children.length===0&&el.textContent.trim()&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>getComputedStyle(el).fontSize))]);assert.ok(sizes.every(size=>['13px','16px','32px'].includes(size)),`unexpected type sizes ${sizes} at ${route}`);}
 checks.push('主要页面可见文字仅32/16/13px三个字号');
 checks.push('390px各主要页无横向溢出');assert.deepEqual(errors,[]);
 await goto('/unlock/?returnTo=%2Fverify%2F%3Fresume%3D1%23analysis');await page.locator('#serialEntitledPanel').waitFor({state:'visible'});assert.match(await page.locator('#serialEntitledPanel a').getAttribute('href'),/verify.*analysis/);checks.push('解锁后返回原任务（测试会话）');
 const locked=await browser.newPage({viewport:{width:390,height:844}});await locked.route('**/api/access/config',route=>route.fulfill({json:{accessMode:'enforce'}}));await locked.route('**/api/access/session',route=>route.fulfill({json:{authenticated:false,entitled:false}}));await locked.goto(base+'/verify/');await locked.locator('[data-gate=volunteer] .gate-veil').waitFor();checks.push('未授权用户闸门仍在');await locked.close();
 console.log(JSON.stringify({status:'passed',checks,errors},null,2));
 await fs.writeFile(new URL('results.json',dir),JSON.stringify({status:'passed',completedAt:new Date().toISOString(),checks,errors,sessionMode:'test-only HTTP fixtures, no live serial entitlement verified'},null,2));
}catch(error){await fs.writeFile(new URL('results.json',dir),JSON.stringify({status:'failed',checks,errors,failure:error.message},null,2));throw error;}finally{await browser.close();}
