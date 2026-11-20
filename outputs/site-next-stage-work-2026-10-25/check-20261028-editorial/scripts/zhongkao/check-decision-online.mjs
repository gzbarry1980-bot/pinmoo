import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const out=path.resolve('guangzhou-zhongkao/docs/decision-upgrade-20261013/online-release/browser-evidence');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[];const check=(name,pass)=>{results.push({name,pass});console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)throw new Error(name);};
async function setup(width,entitled){const c=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});if(entitled)await c.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));if(entitled)await c.route('**/api/access/session',r=>r.fulfill({json:{authenticated:entitled,entitled}}));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return {c,p};}
let lastNavigation=0;
async function go(p,route){const delay=11000-(Date.now()-lastNavigation);if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));lastNavigation=Date.now();await p.goto('https://zhongkao.pinmooconsulting.com'+route,{waitUntil:'networkidle'});}
async function ready(p){await p.waitForFunction(()=>document.body.dataset.uiReady==='true');}
async function generate(p){await p.fill('#scoreLow','680');await p.fill('#scoreHigh','700');await p.locator('#generateUnified').click();await p.waitForFunction(()=>!document.getElementById('generateUnified').disabled,{},{timeout:120000});}
try{
 const {c,p}=await setup(390,false);await go(p,'/verify/?new=1');await ready(p);await generate(p);
 check('Anonymous generation lands in step 2',await p.locator('#volunteerForm').isVisible()&&await p.locator('#analysis').isHidden());
 check('Personal draft preview shows three ordered schools',await p.locator('#publicPlanPreview li').count()===3);
 check('Generation does not force a paywall',await p.locator('.paywall-overlay.show').count()===0);
 check('Full table remains gated',await p.locator('#batchForms').evaluate(e=>e.classList.contains('gated')));
 await p.screenshot({path:path.join(out,'anonymous-plan-mobile.png')});
 await p.locator('#analyzePlan').click();await p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:120000});
 check('Personal basic analysis is readable',await p.locator('#decisionSummary').isVisible());check('Full score remains gated',await p.locator('#scoreRing').evaluate(e=>Boolean(e.closest('.gated'))));
 await p.locator('#decisionSummary details').last().locator('summary').click();check('One explanation is complete',(await p.locator('#decisionSummary').innerText()).includes('志愿'));
 await p.screenshot({path:path.join(out,'anonymous-analysis-mobile.png')});
 check('Mobile result action clearly offers full analysis',await p.locator('#workflowUnlock').isVisible());
 await p.locator('[data-decision-unlock]').click();check('Web paywall uses serial wording',(await p.locator('.paywall-card').innerText()).includes('最多绑定两台设备')&&!(await p.locator('.paywall-card').innerText()).includes('¥9.9'));
 await p.keyboard.press('Escape');check('Escape closes paywall',await p.locator('.paywall-overlay.show').count()===0);
 await p.locator('[data-decision-unlock]').click();await p.locator('.paywall-pay').click();
 const returnTo=new URL(p.url()).searchParams.get('returnTo');check('Unlock return restores saved plan and analysis step',Boolean(returnTo?.includes('plan=')&&returnTo.includes('step=analysis')&&!returnTo.includes('new=1')));
 check('Device continuity help is present',await p.locator('.device-help').count()===1);
 await go(p,returnTo);await ready(p);check('Original analysis returns without refill',await p.locator('#decisionSummary').isVisible()&&await p.locator('#scoreLow').inputValue()==='680');
 await go(p,'/plans/');check('Saved card includes conclusion and next action',(await p.locator('.plan-summary').first().innerText()).includes('主要模拟情景')&&await p.getByRole('link',{name:'继续调整',exact:true}).count()>0);
 check('Secondary management is collapsed',await p.locator('.plan-more').first().evaluate(e=>!e.open));await c.close();
 const licensed=await setup(1440,true);await go(licensed.p,'/verify/?new=1');await ready(licensed.p);await generate(licensed.p);await licensed.p.locator('#analyzePlan').click();await licensed.p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:120000});
 check('Licensed score is visible and ungated',await licensed.p.locator('#totalScore').isVisible()&&await licensed.p.locator('#scoreRing').evaluate(e=>!e.closest('.gated')));
 await licensed.p.locator('#scoreScenarios>summary').click();await licensed.p.locator('#scoreScenarios>button').click();await licensed.p.locator('.scenario-results article').first().waitFor({timeout:120000});check('Three score scenarios use same plan',await licensed.p.locator('.scenario-results article').count()===3);
 await licensed.p.screenshot({path:path.join(out,'licensed-result-desktop.png')});
 await licensed.p.locator('[data-decision-back]').click();check('Back from result preserves all school slots',await licensed.p.locator('#volunteerForm').isVisible()&&await licensed.p.locator('.school-select').evaluateAll(es=>es.filter(e=>e.value).length)>0);
 await licensed.p.locator('[data-start-mode="target"]').click();await licensed.p.fill('#targetSchoolName','广州市培正中学');await licensed.p.locator('#analyzeTarget').click();await licensed.p.waitForFunction(()=>!document.getElementById('targetResult').hidden,{},{timeout:120000});check('Target mode retains suggested-score analysis',(await licensed.p.locator('#targetTitle').innerText()).includes('建议冲刺分'));
 await licensed.p.locator('[data-start-mode="intent"]').click();await licensed.p.fill('#intentSearch','广州市培正中学');await licensed.p.locator('#intentSearchResults [data-add]').first().click();await licensed.p.locator('#generateIntent').click();await licensed.p.waitForFunction(()=>!document.getElementById('generateIntent').disabled,{},{timeout:120000});check('Intended-school mode retains step 2 confirmation',await licensed.p.locator('#volunteerForm').isVisible());
 await licensed.p.locator('[data-start-mode="manual"]').click();await licensed.p.locator('#analyzePlan').click();await licensed.p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:120000});
 const improve=licensed.p.locator('[data-auto-improve="utilization"]');
 if(await improve.count()){
  await licensed.p.locator('#analysisMore details').filter({has:improve}).first().evaluate(e=>e.open=true);
  const before=await licensed.p.locator('.school-select').evaluateAll(es=>es.map(e=>e.value));
  await improve.click();await licensed.p.locator('.adjustment-preview').waitFor({timeout:120000});check('Adjustment is shown before adopting',await licensed.p.getByRole('button',{name:'保留原方案',exact:true}).isVisible());await licensed.p.locator('.adjustment-preview [data-cancel]').click();await licensed.p.waitForFunction(()=>!document.getElementById('analyzePlan').disabled,{},{timeout:120000});check('Cancel adjustment retains original selections',JSON.stringify(before)===JSON.stringify(await licensed.p.locator('.school-select').evaluateAll(es=>es.map(e=>e.value))));
  await licensed.p.waitForFunction(()=>[...document.querySelectorAll('[data-auto-improve]')].every(b=>!b.disabled),{},{timeout:120000});await improve.click();await licensed.p.locator('.adjustment-preview').waitFor({timeout:120000});await licensed.p.locator('.adjustment-preview [data-adopt]').click();await licensed.p.waitForFunction(()=>!document.querySelector('.adjustment-preview')&&[...document.querySelectorAll('[data-auto-improve]')].every(b=>!b.disabled),{},{timeout:120000});check('Adopt applies proposal and recalculates',await licensed.p.locator('.school-select').evaluateAll(es=>es.filter(e=>e.value).length)>before.filter(Boolean).length&&/^\d+$/.test(await licensed.p.locator('#totalScore').innerText()));
 }
 for(const width of [360,390,430,1440]){await licensed.p.setViewportSize({width,height:844});await go(licensed.p,'/schools/detail/?id=gz-ec1a75c75160');await licensed.p.locator('.school-quick-facts').waitFor();check('School six-question card fits '+width,await licensed.p.locator('.school-quick-facts dl>div').count()===6&&await licensed.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await licensed.p.screenshot({path:path.join(out,'school-quick-mobile.png')});await licensed.c.close();check('No browser script errors',errors.length===0);
}catch(e){results.push({name:'Execution',pass:false,message:e.message});console.error(e);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'ui-results.json'),JSON.stringify({at:new Date().toISOString(),scope:'Public anonymous browser + isolated licensed API fixtures; no payment, serial activation or device binding',results,errors},null,2));await browser.close();}

