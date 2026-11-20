import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const output='guangzhou-zhongkao/docs/qa-20261005-form-layout';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));
await page.route('**/api/access/session',r=>r.fulfill({json:{authenticated:true,entitled:true,accessSource:'serial',serial:{deviceCount:1,maxDevices:2,remainingDevices:1}}}));
const routes=['/','/special/?mode=talent','/special/?mode=autonomous','/quota/','/verify/','/direction/','/target/','/schools/','/schools/detail/?id=gz-17ac15270cde','/plans/','/my/','/unlock/','/privacy/'];
try{
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});
  for(const route of routes){
   await page.goto(`http://localhost:5174${route}`);
   await page.locator('.site-nav').waitFor();
   await page.waitForTimeout(500);
   await page.locator('details').evaluateAll(items=>items.forEach(el=>el.open=true));
   await page.waitForTimeout(150);
   const layout=await page.evaluate(()=>{
    const failures=[];
    for(const field of document.querySelectorAll('label[hidden],.region-legacy-field'))if(field.getClientRects().length)failures.push(`hidden field displayed ${field.textContent.trim()}`);
    for(const group of document.querySelectorAll('.profile-grid,.direction-form,.qualification-form,.filter-bar,.filters,.quota-grid,.quota-slots,.quota-details,.autonomous-checker-form,.talent-project-picker')){
     const rows=new Map();
     for(const label of group.querySelectorAll(':scope>label.aligned-field')){
      if(!label.getClientRects().length)continue;
      const control=label.querySelector(':scope>input,:scope>select');
      const key=Math.round(label.getBoundingClientRect().top), row=rows.get(key)||[];
      row.push({id:control.id,top:control.getBoundingClientRect().top});rows.set(key,row);
      if(control.getBoundingClientRect().width>label.getBoundingClientRect().width+2)failures.push(`control overflow ${control.id}`);
     }
     for(const row of rows.values())if(Math.max(...row.map(r=>r.top))-Math.min(...row.map(r=>r.top))>2)failures.push(`misaligned ${JSON.stringify(row)}`);
    }
    return {failures,overflow:document.documentElement.scrollWidth>innerWidth+2};
   });
   assert.deepEqual(layout.failures,[],`${width} ${route}`);
   assert.equal(layout.overflow,false,`${width} ${route}: page overflow`);
   checks.push({width,route,status:'passed'});
   if(route.includes('special/?mode=talent')){
    await page.locator('#talentProject').selectOption('足球');
    await page.locator('#viewMatchedSchools').click();
    assert.ok(await page.locator('#schoolGrid .school-card').count()>0);
    await page.locator('#talentProjectPicker').scrollIntoViewIfNeeded();
    await page.screenshot({path:`${output}/talent-${width}.png`});
   }
  }
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(`${output}/results.json`,JSON.stringify({status:'passed',checks,errors,access:'isolated fixture; no real serial activation',completedAt:new Date().toISOString()},null,2));
 console.log(JSON.stringify({status:'passed',pages:checks.length,errors}));
}finally{await browser.close();}
