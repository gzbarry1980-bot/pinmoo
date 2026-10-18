import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const origin='https://zhongkao.pinmooconsulting.com';
const out=path.resolve('guangzhou-zhongkao/docs/member-school-integration-20261014/online-browser-20261015');fs.mkdirSync(out,{recursive:true});
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const check=(name,pass)=>{checks.push({name,pass});console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)throw new Error(name);};let last=0;
async function visit(route){const wait=11000-(Date.now()-last);if(wait>0)await new Promise(r=>setTimeout(r,wait));last=Date.now();const response=await page.goto(origin+route,{waitUntil:'networkidle'});check('HTTP 200 '+route,response?.status()===200);}
try{
 for(const [id,expected] of [['gz-5424230557c2','6—7人间'],['gz-3a2e51774f57','同年学校文章记应元7'],['gz-11fe9a9bc94f','仅对应历史智谷校区资料']]){
  await visit('/schools/detail/?id='+id);
  await page.locator('#schoolLife').waitFor();
  check('School facts rendered '+id,(await page.locator('#schoolLife').innerText()).includes(expected));
  check('Versioned frontend loaded '+id,await page.locator('script[src*="experience.js?v=20261015-member"]').count()===1);
  await page.locator('.detail-tabs a[href="#schoolLife"]').click();
  await page.waitForFunction(()=>document.querySelector('.detail-tabs a[href="#schoolLife"]')?.getAttribute('aria-current')==='location');
  check('School section navigation '+id,(await page.locator('#schoolLife').boundingBox()).y>0);
  if(id==='gz-5424230557c2')await page.screenshot({path:path.join(out,'school-desktop.png')});
 }
 await page.setViewportSize({width:390,height:844});
 await visit('/schools/detail/?id=gz-d88fc5845fdc');await page.locator('#schoolLife').waitFor();await page.locator('.detail-tabs a[href="#schoolLife"]').click();
 check('Mobile school content fits',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 check('Mobile exact campus content',(await page.locator('#schoolLife').innerText()).includes('7人间'));
 await page.screenshot({path:path.join(out,'school-mobile.png')});
 const refs=await (await page.request.get(origin+'/data/school-references.json')).json();
 check('20 campus references published',refs.records.length===20);
 check('17 historical class references published',refs.records.filter(r=>r.classes?.sourceId==='member-class-table-2025-20261014').length===17);
 check('Historical references do not become model inputs',refs.records.every(r=>r.useInModel===false&&r.boarding.verifiedForCurrentYear===false));
 check('No generic membership directory entry',await page.locator('a[href^="/resources/"]').count()===0);
 check('No browser errors',errors.length===0);
}catch(e){checks.push({name:'Execution',pass:false,message:e.message});console.error(e.message);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({origin,at:new Date().toISOString(),checks,errors},null,2));await browser.close();}
