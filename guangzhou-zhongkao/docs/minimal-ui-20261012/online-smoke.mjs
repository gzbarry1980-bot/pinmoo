// Low-frequency, read-only production UI checks. Licensed flows use isolated
// browser API fixtures; no payment, serial activation or device binding occurs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const out=path.join(path.dirname(fileURLToPath(import.meta.url)),'online-release/browser-evidence');fs.mkdirSync(out,{recursive:true});
const origin='https://zhongkao.pinmooconsulting.com';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[],badResponses=[];
const check=(name,pass,details)=>{results.push({name,pass,details});console.log((pass?'PASS ':'FAIL ')+name);if(!pass)throw new Error(name);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let lastNavigation=0;
async function go(page,route){const gap=12000-(Date.now()-lastNavigation);if(gap>0)await pause(gap);lastNavigation=Date.now();await page.goto(origin+route,{waitUntil:'networkidle'});await page.waitForTimeout(400);}
async function ready(page){await page.waitForFunction(()=>document.body.dataset.uiReady==='true');}
async function context(width,fixture=true){
 const c=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
 if(fixture){await c.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));await c.route('**/api/access/session',r=>r.fulfill({json:{authenticated:true,entitled:true}}));}
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});return {c,p};
}
try{
 const {c,p}=await context(390);
 await go(p,'/');check('Live minimal homepage title',await p.locator('h1').innerText()==='你想先做什么？');
 check('Four compact entry cards',await p.locator('.home-start-option').count()===4);
 check('School search is present',await p.locator('[data-school-search]').count()>0);
 check('Minimal stylesheet loaded',await p.locator('link[href*="minimal-ui.css"]').count()>0);
 check('Mobile has no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.screenshot({path:path.join(out,'home-mobile.png')});
 await go(p,'/verify/?new=1');await ready(p);
 check('Step 1 shows conditions, not table',await p.locator('#profile').isVisible()&&await p.locator('#volunteerForm').isHidden());
 check('Advanced settings initially collapsed',await p.locator('#advancedProfile').evaluate(e=>!e.open));
 await p.selectOption('#admissionDistrict','越秀区');await p.fill('#scoreLow','680');await p.fill('#scoreHigh','700');
 await p.locator('#generateUnified').click();await p.waitForFunction(()=>!document.getElementById('generateUnified').disabled,{},{timeout:90000});
 check('Generated plan lands in step 2',await p.locator('#volunteerForm').isVisible()&&await p.locator('#analysis').isHidden()&&await p.locator('#profile').isHidden());
 check('Volunteer slots are populated',await p.locator('#volunteerForm select').evaluateAll(es=>es.some(e=>e.value)));
 await p.screenshot({path:path.join(out,'plan-mobile.png')});
 await p.locator('#analyzePlan').click();await p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:90000});
 check('Result shows actual score',/^\d+$/.test((await p.locator('#totalScore').innerText()).trim()));
 check('Result focuses on step 3',await p.locator('#analysis').isVisible()&&await p.locator('#volunteerForm').isHidden());
 check('Result heading readable',await p.locator('#analysis .panel-heading > h2').isVisible());
 check('Safety disclaimer preserved',(await p.locator('.disclaimer').innerText()).includes('本系统仅供参考'));
 await p.screenshot({path:path.join(out,'result-mobile.png')});
 await p.locator('#workflowBack').click();check('Back returns to step 2',await p.locator('#volunteerForm').isVisible());
 await p.locator('#workflowBack').click();check('Back to conditions retains score range',await p.locator('#profile').isVisible()&&await p.locator('#scoreLow').inputValue()==='680');
 await p.locator('[data-start-mode="target"]').click();await p.fill('#targetSchoolName','广州市培正中学');await p.locator('#analyzeTarget').click();await p.waitForFunction(()=>!document.getElementById('targetResult').hidden,{},{timeout:90000});
 check('Target mode computes suggested score',(await p.locator('#targetTitle').innerText()).includes('建议冲刺分'));
 await p.locator('[data-start-mode="intent"]').click();await p.fill('#intentSearch','广州市培正中学');await p.locator('#intentSearchResults [data-add]').first().click();await p.locator('#generateIntent').click();await p.waitForFunction(()=>!document.getElementById('generateIntent').disabled,{},{timeout:90000});
 check('Intended-school mode generates a table',await p.locator('#volunteerForm').isVisible());
 await p.locator('[data-start-mode="manual"]').click();check('Manual mode exposes the table',await p.locator('#volunteerForm').isVisible());
 await go(p,'/special/?mode=talent');check('Specialty school project selector visible',await p.locator('#talentProject').isVisible());
 await go(p,'/schools/?sort=name');await p.locator('.school-card-main').first().waitFor();check('School cards load',await p.locator('.library-card').count()>0);
 await c.close();
 const desktop=await context(1440);await go(desktop.p,'/');check('Desktop homepage fits screen',await desktop.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await desktop.p.screenshot({path:path.join(out,'home-desktop.png')});await desktop.c.close();
 const anonymous=await context(390,false);await go(anonymous.p,'/verify/?new=1');await ready(anonymous.p);await anonymous.p.waitForFunction(()=>window.ZhongkaoAccess?.getState().resolved);
 const access=await anonymous.p.evaluate(()=>({entitled:window.ZhongkaoAccess.isEntitled(),resolved:window.ZhongkaoAccess.getState().resolved}));
 check('Real anonymous session remains locked',access.resolved&&!access.entitled,access);
 await anonymous.p.evaluate(()=>window.ZhongkaoAccess.showPaywall());check('Unlock prompt still opens',await anonymous.p.locator('.paywall-overlay').isVisible());await anonymous.c.close();
 check('No production script errors',errors.length===0,errors);check('No failed or rate-limited resource requests',badResponses.length===0,badResponses);
}catch(e){results.push({name:'Execution',pass:false,details:e.message});console.log('FAIL '+e.message);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({at:new Date().toISOString(),origin,scope:'Public UI read-only; licensed interactions use isolated browser fixtures; anonymous guard uses real session; no payment or serial/device mutation',results,errors,badResponses},null,2));await browser.close();}
