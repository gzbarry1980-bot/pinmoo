import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const baseline=process.argv.includes('--baseline');
const out=path.resolve('guangzhou-zhongkao/docs/minimal-ui-20261012/'+(baseline?'before':'after'));fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],metrics={},errors=[];
const check=(name,pass,details)=>{results.push({name,pass,details});console.log((pass?'PASS ':'FAIL ')+name);if(!pass)throw new Error(name);};
const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await c.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));await c.route('**/api/access/session',r=>r.fulfill({json:{authenticated:true,entitled:true}}));
const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
async function visibleChars(){return p.evaluate(()=>{const main=document.querySelector('main');const walk=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);const limit=Math.min(innerHeight,document.getElementById('workflowActions')?.getBoundingClientRect().top||innerHeight,document.querySelector('.mobile-nav')?.getBoundingClientRect().top||innerHeight);let n,total=0;while(n=walk.nextNode()){const parent=n.parentElement;if(!parent||parent.closest('script,style,select,textarea,[hidden]'))continue;const d=parent.closest('details:not([open])');if(d&&!parent.closest('summary'))continue;const range=document.createRange();range.selectNodeContents(n);const r=range.getBoundingClientRect();if(r.width>0&&r.height>0&&r.top>=0&&r.bottom<=limit&&getComputedStyle(parent).visibility!=='hidden')total+=n.textContent.replace(/\s/g,'').length;}return total;});}
async function go(route){await p.goto('http://localhost:5174'+route,{waitUntil:'networkidle'});await p.waitForTimeout(300);}
async function ready(){await p.waitForFunction(()=>document.body.dataset.uiReady==='true');await p.waitForTimeout(200);}
try{
 await go('/');await p.locator('.home-start-option').nth(3).waitFor();metrics.home=await visibleChars();await p.screenshot({path:path.join(out,'home-mobile.png')});
 await go('/verify/?new=1');await ready();metrics.profile=await visibleChars();await p.screenshot({path:path.join(out,'profile-mobile.png')});
 if(!baseline){
  check('Profile stage hides the volunteer table',await p.locator('#volunteerForm').isHidden());
  check('Advanced settings remain available',await p.locator('#advancedProfile').count()===1);
  await p.locator('[data-compact-fold="region"] > summary').click();await p.selectOption('#regionPreference','custom');
  check('Custom region choices remain reachable',await p.locator('#regionPreference-0').isVisible());await p.selectOption('#regionPreference','household');await p.locator('[data-compact-fold="region"] > summary').click();
  await p.locator('#quotaEligible').evaluate(e=>e.closest('details').open=true);await p.locator('#quotaEligible').check();check('Quota checkbox still opens source-school controls',await p.locator('#sourceSchoolId').isVisible());await p.locator('#quotaEligible').uncheck();check('Quota cancellation still clears and hides controls',await p.locator('#quotaDetails').evaluate(e=>e.hidden));
  await p.selectOption('#admissionDistrict','越秀区');await p.fill('#scoreLow','680');await p.fill('#scoreHigh','700');
  check('Range still sets the estimate center',await p.locator('#score').inputValue()==='690');
  await p.locator('#generateUnified').click();await p.waitForFunction(()=>!document.getElementById('generateUnified').disabled,{},{timeout:90000});
  check('Generated draft focuses only on step 2',await p.locator('#profile').isHidden()&&await p.locator('#analysis').isHidden()&&await p.locator('#volunteerForm').isVisible());
  check('Filling checks default to collapsed',await p.locator('[data-compact-fold="coach"]').evaluate(e=>!e.open));
  metrics.plan=await visibleChars();await p.screenshot({path:path.join(out,'plan-mobile.png')});
  await p.locator('#analyzePlan').click();await p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:90000});
  check('Step 3 shows score, not the whole input form',await p.locator('#analysis').isVisible()&&await p.locator('#profile').isHidden()&&await p.locator('#volunteerForm').isHidden());
  check('Score remains a real output',!!(await p.locator('#totalScore').innerText()).trim());
  check('Result heading is readable',await p.locator('#analysis .panel-heading > h2').isVisible());
  check('Export tools are not a wall of buttons above the score',await p.locator('#exportPlan').isHidden()&&await p.locator('#printPlan').isHidden());
  check('Qualification caps keep their original output container',await p.locator('#scoreCaps').count()===1);
  check('Assumptions remain reachable in collapsed disclosure',await p.locator('[data-compact-fold="assumptions"]').evaluate(e=>!e.open));
  check('Full disclaimer is retained',(await p.locator('.disclaimer').innerText()).includes('本系统仅供参考'));
  await p.waitForTimeout(250);metrics.result=await visibleChars();await p.screenshot({path:path.join(out,'result-mobile.png')});
  await p.locator('#workflowBack').click();await p.waitForTimeout(200);check('Result back button opens the table',await p.locator('#volunteerForm').isVisible());
  await p.locator('#workflowBack').click();await p.waitForTimeout(200);check('Table back button retains inputs',(await p.locator('#scoreLow').inputValue())==='680'&&await p.locator('#profile').isVisible());
  await p.locator('[data-start-mode="intent"]').click();await p.fill('#intentSearch','广州市培正中学');await p.locator('#intentSearchResults [data-add]').first().click();await p.locator('#generateIntent').click();await p.waitForFunction(()=>!document.getElementById('generateIntent').disabled,{},{timeout:90000});
  check('Intent explanation does not precede the table as a long article',await p.locator('#intentOrderExplanation').evaluate(e=>!e.open));
  check('Missing safety warning stays visible',await p.locator('#intentSafetyNotice').isVisible());
  await p.locator('[data-start-mode="target"]').click();await p.fill('#targetSchoolName','广州市培正中学');await p.locator('#analyzeTarget').click();await p.waitForFunction(()=>!document.getElementById('targetResult').hidden,{},{timeout:90000});check('Target mode still computes a target score',(await p.locator('#targetTitle').innerText()).includes('建议冲刺分'));
  await p.locator('#adoptTarget').click();await p.waitForTimeout(200);await p.locator('[data-start-mode="manual"]').click();await p.locator('#analyzePlan').click();await p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:90000});check('Manual mode still reaches a result',await p.locator('#analysis').isVisible());
  await p.evaluate(()=>dispatchEvent(new Event('beforeprint')));await p.emulateMedia({media:'print'});check('Print retains inputs, volunteer table and results',await p.locator('#profile').isVisible()&&await p.locator('#volunteerForm').isVisible()&&await p.locator('#analysis').isVisible());await p.emulateMedia({media:'screen'});await p.evaluate(()=>dispatchEvent(new Event('afterprint')));
  for(const width of [360,390,430,1440]){await p.setViewportSize({width,height:844});for(const route of ['/','/verify/?new=1','/special/?mode=talent','/special/?mode=autonomous','/schools/']){await go(route);const s=await p.evaluate(()=>({width:innerWidth,scroll:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)}));check('Responsive '+width+' '+route,s.scroll<=s.width+1,s);}}
  check('No script errors',errors.length===0,errors);
 }
}catch(e){results.push({name:'Execution',pass:false,details:{message:e.message,errors}});console.log('FAIL '+e.message);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({at:new Date().toISOString(),scope:'Local UI only; isolated entitlement, no server mutations',metrics,results},null,2));await browser.close();}
