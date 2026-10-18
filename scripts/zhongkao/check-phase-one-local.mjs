import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const origin='http://127.0.0.1:5174',out=path.resolve('guangzhou-zhongkao/docs/phase-one-20261018/browser');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];const check=(name,pass)=>{checks.push({name,pass});console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)throw new Error(name);};
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
async function context(width,entitled=false){const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await c.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));await c.route('**/api/access/session',r=>r.fulfill({json:{authenticated:entitled,entitled}}));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return {c,p};}
async function go(p,route){const r=await p.goto(origin+route,{waitUntil:'networkidle'});check('Local HTTP 200 '+route,r?.status()===200);}
try{
 const {c,p}=await context(1440);
 await go(p,'/');await p.locator('.home-data>summary').click();check('Home distinguishes published policy and observed data',(await p.locator('#homeDataStatus').innerText()).includes('录取数据截至2026年'));
 await go(p,'/verify/?new=1');await p.waitForFunction(()=>document.body.dataset.uiReady==='true');
 check('2027 is default forecast target',await p.locator('#targetYear').inputValue()==='2027');
 check('Published reform is visible',(await p.locator('#policyBanner').innerText()).includes('已收录2027—2029'));
 await p.locator('#advancedProfile>summary').click();
 await p.selectOption('#targetYear','2028');check('Banner follows selected year',(await p.locator('#policyBanner').innerText()).includes('2028年'));
 await p.selectOption('#mode','replay');await p.selectOption('#targetYear','2025');check('Replay keeps actual 2025 year',await p.locator('#targetYear').inputValue()==='2025');
 await p.selectOption('#mode','forecast');await p.selectOption('#targetYear','2027');
 await p.fill('#score','690');await p.fill('#scoreLow','680');await p.fill('#scoreHigh','700');
 await p.locator('#generateUnified').click();await p.waitForFunction(()=>!document.getElementById('generateUnified').disabled,{},{timeout:120000});
 check('Generated draft stops at step 2',await p.locator('#volunteerForm').isVisible()&&await p.locator('#analysis').isHidden());
 check('Anonymous preview still has 3 choices',await p.locator('#publicPlanPreview li').count()===3);
 await p.screenshot({path:path.join(out,'policy-and-draft-desktop.png')});await c.close();
 const phone=await context(390,true);
 await go(phone.p,'/verify/?new=1');await phone.p.waitForFunction(()=>document.body.dataset.uiReady==='true');
 await phone.p.locator('#advancedProfile>summary').click();
 await phone.p.fill('#score','690');await phone.p.fill('#scoreLow','680');await phone.p.fill('#scoreHigh','700');
 await phone.p.locator('#generateUnified').click();await phone.p.waitForFunction(()=>!document.getElementById('generateUnified').disabled,{},{timeout:120000});
 await phone.p.locator('#analyzePlan').click();await phone.p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:120000});
 check('Complete assessment remains visible with isolated test entitlement',await phone.p.locator('#totalScore').isVisible());
 check('Reform uncertainty is in actual results',(await phone.p.locator('#analysis').innerText()).includes('新政策录取结果校准'));
 check('Model 2.3 is disclosed',(await phone.p.locator('#methodText').textContent()).includes('v2.3'));
 check('Mobile assessment has no page overflow',await phone.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await phone.p.screenshot({path:path.join(out,'assessment-mobile.png')});
 for(const [id,text] of [['gz-524a67309dff','80人'],['gz-9a6f1f35a825','多个校区合计'],['gz-79a8dd8dc065','68.00%'],['gz-d88fc5845fdc','标准7人间与特色4人间'],['gz-e0c6a89c9e84','文章写招生300人']]){
  await go(phone.p,'/schools/detail/?id='+id);await phone.p.locator('#overview').waitFor();
  check('School reference rendered '+id,(await phone.p.locator('main').innerText()).includes(text));
  check('School detail fits 390px '+id,await phone.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(id==='gz-524a67309dff'){
   await phone.p.locator('.detail-tabs a[href="#outcomes"]').click();
   check('80 people is not relabelled as a rate',(await phone.p.locator('#outcomes').innerText()).includes('80人（人数）'));
   await phone.p.screenshot({path:path.join(out,'outcomes-count-mobile.png')});
  }
 }
 await go(phone.p,'/schools/?sort=name');await phone.p.locator('.library-card').first().waitFor();
 check('School list contains outcome summaries',await phone.p.locator('.school-outcome-summary').count()>0);
 check('School list fits mobile',await phone.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await phone.p.screenshot({path:path.join(out,'school-list-mobile.png')});await phone.c.close();
 check('No page script errors',errors.length===0);
}catch(e){checks.push({name:'Execution',pass:false,message:e.message});console.error(e.stack);for(const c of browser.contexts())for(const p of c.pages()){try{fs.writeFileSync(path.join(out,'failure-text.txt'),await p.locator('body').innerText());await p.screenshot({path:path.join(out,'failure.png')});}catch{}}process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({origin,at:new Date().toISOString(),entitlementTest:'isolated responses only; no real code activation, account, payment or device binding',checks,errors},null,2));await browser.close();}
