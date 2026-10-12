// Independent, read-only UI acceptance. Entitlement is an isolated browser fixture.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const out=path.join(here,'codex-evidence');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname.endsWith('/'))pathname+='index.html';
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(8141,'127.0.0.1',r));
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const origin='http://127.0.0.1:8141';
const results=[];
const record=(name,pass,details)=>{results.push({name,pass,details});console.log((pass?'PASS ':'FAIL ')+name+' '+JSON.stringify(details));};
const schools=JSON.parse(fs.readFileSync(path.join(root,'data/schools.json'),'utf8'));
async function context(width=390){const c=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});await c.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));await c.route('**/api/access/session',r=>r.fulfill({json:{authenticated:true,entitled:true}}));return c;}
async function go(p,url){await p.goto(origin+url,{waitUntil:'networkidle'});await p.waitForTimeout(500);}
try{
 const c=await context(),p=await c.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await go(p,'/');
 await p.screenshot({path:path.join(out,'home-mobile-viewport.png')});
 const home=await p.locator('.home-start-option').evaluateAll(es=>es.map(e=>({href:e.getAttribute('href'),y:e.getBoundingClientRect().y,bottom:e.getBoundingClientRect().bottom,font:getComputedStyle(e.querySelector('strong')).fontSize})));
 record('Four homepage entry cards',home.length===4,home);
 record('Four entries visible in first mobile viewport',home.every(x=>x.bottom<780),{entries:home,viewport:844});
 for(let i=0;i<4;i++){
  await go(p,'/');await p.locator('.home-start-option').nth(i).click();
  await p.waitForFunction(()=>document.body.dataset.uiReady==='true');await p.waitForTimeout(700);
  const state=await p.evaluate(()=>({url:location.pathname+location.search+location.hash,mode:document.querySelector('[data-start-mode][aria-pressed="true"]')?.dataset.startMode,planTop:document.getElementById('volunteerForm')?.getBoundingClientRect().top,intentOpen:document.getElementById('intentPlanning')?.open,targetOpen:document.getElementById('targetPlanning')?.open,active:[...document.querySelectorAll('.workflow-steps button.active')].map(x=>x.dataset.flowStep)}));
  record('Homepage mode '+i,locationMode(state,i),state);
 }
 await go(p,'/');
 await p.locator('.batch-entry').first().scrollIntoViewIfNeeded();
 await p.screenshot({path:path.join(out,'home-batches-mobile.png')});
 const before=p.url();await p.locator('.batch-entry h2').first().click();await p.waitForTimeout(200);
 record('Batch card title navigates',p.url()!==before,{before,after:p.url(),tag:await p.locator('.batch-entry').first().evaluate(e=>e.tagName)});
 await go(p,'/admissions/');const ad=p.url();await p.locator('.task-card h3').first().click();await p.waitForTimeout(200);record('Admissions card title navigates',p.url()!==ad,{before:ad,after:p.url()});
 await go(p,'/verify/?new=1');await p.waitForFunction(()=>document.body.dataset.uiReady==='true');
 const step0=await p.locator('.workflow-steps button').evaluateAll(es=>es.map(e=>({key:e.dataset.flowStep,active:e.classList.contains('active'),disabled:e.disabled,locked:e.dataset.locked,complete:e.dataset.complete,aria:e.getAttribute('aria-current')})));
 record('Current step is highlighted on empty plan',step0.some(e=>e.active),step0);
 record('Unavailable result step has disabled state/reason',step0.find(e=>e.key==='analysis')?.disabled===true,step0);
 await p.selectOption('#admissionDistrict','越秀区');await p.fill('#scoreLow','680');await p.fill('#scoreHigh','700');
 await p.locator('[data-start-mode="intent"]').click();
 for(const name of ['广州市第十六中学','广州市培正中学','广东广雅中学（荔湾校区）']){const s=schools.find(s=>s.name===name);await p.fill('#intentSearch',s.name);await p.locator(`[data-add="${s.id}"]`).click();}
 await p.locator('#generateIntent').click();await p.waitForFunction(()=>!document.getElementById('generateIntent').disabled,{},{timeout:90000});
 const plan=await p.locator('.school-select').evaluateAll(es=>es.map(e=>e.value).filter(Boolean));
 record('Intent generation stops at step 2',await p.locator('#analysis').isHidden()&&plan.length===3,{plan,analysisHidden:await p.locator('#analysis').isHidden()});
 await p.locator('#volunteerForm').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'verify-step2-mobile.png')});
 const buttons=await p.locator('.form-actions button, .row-actions button, #generateUnified').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().width>0).map(e=>({text:e.textContent.trim(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width,font:getComputedStyle(e).fontSize,background:getComputedStyle(e).backgroundColor,borderRadius:getComputedStyle(e).borderRadius})));
 record('Visible action buttons at least 44px',buttons.every(e=>e.height>=44&&e.width>=44),buttons);
 await p.locator('#analyzePlan').click();await p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:90000});
 record('Explicit confirmation produces score',!!(await p.locator('#totalScore').innerText()).trim(),await p.locator('#totalScore').innerText());
 const prior=JSON.stringify(plan);await p.locator('[data-flow-step="profile"]').click();
 record('Return to conditions preserves plan',JSON.stringify(await p.locator('.school-select').evaluateAll(es=>es.map(e=>e.value).filter(Boolean)))===prior,{low:await p.locator('#scoreLow').inputValue(),high:await p.locator('#scoreHigh').inputValue()});
 await p.reload();await p.waitForFunction(()=>document.body.dataset.uiReady==='true');record('Reload preserves selected intent schools',(await p.locator('.intent-selected-row').count())===3,{count:await p.locator('.intent-selected-row').count()});
 await go(p,'/schools/?q=培正');await p.locator('.school-card-main').first().waitFor();
 await p.locator('.library-card').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'school-card-mobile.png')});
 const cardDOM=await p.locator('.library-card').first().evaluate(e=>({mainLinks:e.querySelectorAll('.school-card-main').length,nestedOutcomeInside:e.querySelector('.school-card-main .school-outcome-summary')!==null,html:e.innerHTML}));
 record('School card without outcome has one main link',cardDOM.mainLinks===1,cardDOM);
 await p.locator('[data-favorite]').first().click();record('Favorite does not open school preview',await p.locator('#quickSchoolPreview[open]').count()===0,{url:p.url()});
 await p.locator('[data-compare]').first().click();record('Compare does not open school preview',await p.locator('#quickSchoolPreview[open]').count()===0,{pressed:await p.locator('[data-compare]').first().getAttribute('aria-pressed')});
 await p.locator('.school-card-main h3').first().click();await p.locator('#quickSchoolPreview[open]').waitFor();record('School title opens quick preview',true,{url:p.url()});
 await p.locator('#quickSchoolPreview [data-full-school]').click();await p.waitForURL('**/schools/detail/**');await p.locator('.detail-head').waitFor();
 const back=await p.locator('#returnSchoolContext').getAttribute('href');record('School detail returns to original filtered list',back?.includes('q=%E5%9F%B9%E6%AD%A3')||back?.includes('q=培正'),{href:back});
 await p.locator('#returnSchoolContext').click();await p.locator('.school-card-main').first().waitFor();
 record('Return restores list query',new URL(p.url()).searchParams.get('q')==='培正',{url:p.url(),scrollY:await p.evaluate(()=>scrollY)});
 await go(p,'/schools/?q=16中本部');await p.locator('.library-card').first().waitFor();
 const outcomesDOM=await p.locator('.library-card').evaluateAll(es=>es.map(e=>({name:e.querySelector('h3')?.textContent,mainLinks:e.querySelectorAll('.school-card-main').length,hasOutcome:!!e.querySelector('.school-outcome-summary'),actionParents:[...e.querySelectorAll('.card-actions')].map(a=>a.parentElement.tagName)})));
 record('Cards with outcome have one valid main link',outcomesDOM.some(e=>e.hasOutcome)&&outcomesDOM.every(e=>e.mainLinks===1),outcomesDOM);
 await p.locator('.library-card').first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'school-outcome-card-mobile.png')});
 await go(p,'/verify/?new=1');await p.waitForFunction(()=>document.body.dataset.uiReady==='true');await p.waitForTimeout(700);
 await p.selectOption('#admissionDistrict','越秀区');await p.fill('#scoreLow','680');await p.fill('#scoreHigh','700');
 await p.locator('#generateUnified').click();await p.waitForFunction(()=>!document.getElementById('generateUnified').disabled,{},{timeout:90000});
 record('Score generation stops at step 2',await p.locator('#analysis').isHidden(),{filled:await p.locator('.school-select').evaluateAll(es=>es.filter(e=>e.value).length),planTop:await p.locator('#volunteerForm').evaluate(e=>e.getBoundingClientRect().top)});
 await p.locator('#analyzePlan').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'confirm-button-mobile.png')});
 const primary=await p.locator('#analyzePlan').evaluate(e=>({background:getComputedStyle(e).backgroundColor,image:getComputedStyle(e).backgroundImage,color:getComputedStyle(e).color,position:getComputedStyle(e.parentElement).position,bottom:e.getBoundingClientRect().bottom}));
 record('Step 2 CTA has filled background',primary.background!=='rgba(0, 0, 0, 0)'||primary.image!=='none',primary);
 record('Mobile current step actions docked',primary.position==='fixed'||primary.position==='sticky',primary);
 await go(p,'/verify/?new=1&start=target#targetPlanning');await p.waitForFunction(()=>document.body.dataset.uiReady==='true');await p.waitForTimeout(700);
 await p.fill('#targetSchoolName','广州市培正中学');await p.waitForTimeout(300);
 record('Target mode opens usable school form',await p.locator('#targetPlanning').evaluate(e=>e.open),{options:await p.locator('#targetSchoolList option').count()});
 await p.locator('#analyzeTarget').click();await p.waitForFunction(()=>!document.getElementById('targetResult').hidden,{},{timeout:90000});
 record('Target school analysis produces target score',!!(await p.locator('#targetTitle').innerText()).trim(),await p.locator('#targetTitle').innerText());
 await p.locator('#adoptTarget').click();await p.waitForTimeout(300);
 record('Target school draft stops at step 2',await p.locator('#analysis').isHidden(),{filled:await p.locator('.school-select').evaluateAll(es=>es.filter(e=>e.value).length)});
 await p.locator('[data-start-mode="manual"]').click();await p.waitForTimeout(300);
 await p.locator('#analyzePlan').click();await p.waitForFunction(()=>!document.getElementById('analysis').hidden,{},{timeout:90000});
 record('Manual plan confirmation produces evaluation',!!(await p.locator('#totalScore').innerText()).trim(),await p.locator('#totalScore').innerText());
 record('No page script errors',errors.length===0,errors);
 await c.close();
 const desktop=await context(1440),d=await desktop.newPage();await go(d,'/');await d.screenshot({path:path.join(out,'home-desktop-viewport.png')});
 const desktopNav=await d.locator('.mobile-nav').evaluate(e=>({display:getComputedStyle(e).display,height:e.getBoundingClientRect().height}));
 record('Desktop has no mobile bottom navigation',desktopNav.display==='none'||desktopNav.height===0,desktopNav);
 const fonts=await d.evaluate(()=>({title:getComputedStyle(document.querySelector('h1')).fontSize,body:getComputedStyle(document.querySelector('.launch-copy p')).fontSize,note:getComputedStyle(document.querySelector('.launch-copy small')).fontSize,buttonRadius:getComputedStyle(document.querySelector('.hero-search button')).borderRadius}));
 record('24/16/14 typography tokens applied',fonts.title==='24px'&&fonts.body==='16px'&&fonts.note==='14px',fonts);
 await desktop.close();
 const mini=await context(),m=await mini.newPage();await go(m,'/?zk_inmini=1');record('Mini fixture has no duplicate H5 bottom nav',await m.locator('.mobile-nav').count()===0,{count:await m.locator('.mobile-nav').count(),realDevice:false});await mini.close();
 for(const width of [360,390,430,1440]){const responsive=await context(width),r=await responsive.newPage();for(const route of ['/','/verify/?new=1','/schools/','/my/']){await go(r,route);const sizes=await r.evaluate(()=>({viewport:innerWidth,docWidth:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)}));record('Responsive '+width+' '+route,sizes.docWidth<=sizes.viewport+1,sizes);}await responsive.close();}
}catch(e){record('Audit execution',false,{message:e.message,stack:e.stack});}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({at:new Date().toISOString(),scope:'local UI; isolated entitlement fixtures, no production mutations',results},null,2));await browser.close();await new Promise(r=>server.close(r));if(results.some(r=>!r.pass))process.exitCode=1;}
function locationMode(s,i){return s.mode===['score','target','intent','manual'][i]&&(i!==1||s.targetOpen)&&(i!==2||s.intentOpen)&&(i!==3||(s.planTop>=-100&&s.planTop<780));}
