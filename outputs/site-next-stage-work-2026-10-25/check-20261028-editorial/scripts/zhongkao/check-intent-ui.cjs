const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/Administrator/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const origin=process.env.ZK_TEST_ORIGIN||'http://localhost:5174';
const schools=JSON.parse(fs.readFileSync('guangzhou-zhongkao/data/schools.json','utf8'));
const chosen=['广州市第十六中学','广州市培正中学','广东广雅中学（荔湾校区）'].map(name=>schools.find(s=>s.name===name));
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Isolated test entitlement; no live serial or device record is created.
  await page.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));
  await page.route('**/api/access/session',r=>r.fulfill({json:{authenticated:true,entitled:true}}));
  await page.goto(origin+'/verify/?new=1&start=intent');
  await page.waitForFunction(()=>document.body.dataset.uiReady==='true');
  assert.equal(await page.locator('[data-start-mode="intent"]').getAttribute('aria-pressed'),'true');
  await page.selectOption('#admissionDistrict','越秀区');
  await page.fill('#scoreLow','680');await page.fill('#scoreHigh','700');
  for(const school of chosen){await page.fill('#intentSearch',school.name);await page.locator(`[data-add="${school.id}"]`).click();}
  assert.equal(await page.locator('.intent-selected-row').count(),3);
  await page.locator(`[data-priority="${chosen[2].id}"]`).check();
  await page.selectOption('#intentStrategy','priority');
  await page.locator('#generateIntent').click();
  await page.waitForFunction(()=>!document.getElementById('generateIntent').disabled,{},{timeout:60000});
  const status=await page.locator('#intentStatus').innerText();assert(status.includes('已生成'),status);
  const ids=await page.locator('.school-select').evaluateAll(es=>es.map(e=>e.value).filter(Boolean));
  assert.equal(ids.length,3);assert.equal(new Set(ids).size,3);assert.equal(ids[0],chosen[2].id);
  assert.equal(await page.locator('#analysis').isHidden(),true);
  assert.equal(await page.locator('#intentOrderExplanation li').count(),3);
  await page.locator('[data-start-mode="intent"]').click();
  await page.selectOption('#intentStrategy','balanced');await page.locator('#generateIntent').click();
  await page.waitForFunction(()=>!document.getElementById('generateIntent').disabled,{},{timeout:60000});
  assert((await page.locator('#intentStatus').innerText()).includes('兼顾风险'));
  await page.locator('#analyzePlan').click();await page.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:60000});
  assert((await page.locator('#totalScore').innerText()).trim());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  await page.reload();await page.waitForFunction(()=>document.body.dataset.uiReady==='true');
  assert.equal(await page.locator('.intent-selected-row').count(),3);
  if(width===1440){
   await page.locator('[data-start-mode="intent"]').click();
   await page.selectOption('#intentStrategy','safe');
   await page.locator('#intentSupplement').check();
   await page.locator('#generateIntent').click();
   await page.waitForFunction(()=>!document.getElementById('generateIntent').disabled,{},{timeout:120000});
   const safeStatus=await page.locator('#intentStatus').innerText();assert(safeStatus.includes('更稳妥'),safeStatus);
   const filled=await page.locator('.school-select').evaluateAll(es=>es.map(e=>e.value).filter(Boolean));
   assert(filled.length>3);assert.equal(new Set(filled).size,filled.length);
   for(const school of chosen)assert(filled.includes(school.id));
   assert.equal(await page.locator('#analysis').isHidden(),true);
   console.log('PASS supplemental schools: safe strategy, retains chosen schools, unique slots, stops at step2');
  }
  console.log(`PASS ${width}px: select, priority, balanced, no duplicates, step2, evaluation, recovery`);
  await page.close();
 }
 const anonymous=await browser.newPage();
 await anonymous.goto(origin+'/verify/?new=1&start=intent');
 await anonymous.waitForFunction(()=>document.body.dataset.uiReady==='true');
 await anonymous.fill('#intentSearch',chosen[0].name);
 await anonymous.locator(`[data-add="${chosen[0].id}"]`).click();
 await anonymous.locator('#generateIntent').click();
 await anonymous.locator('.paywall-overlay.show').waitFor({state:'visible'});
 assert.equal(await anonymous.locator('#intentOrderExplanation').count(),0);
 console.log('PASS anonymous access: generation requires serial unlock');
 await anonymous.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
