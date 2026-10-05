import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ZK_TEST_URL||'http://localhost:5174';
const browser=await chromium.launch({headless:true});
const checks=[],errors=[];
const details={deviceCount:1,maxDevices:2,remainingDevices:1};
async function scenario(name,response,sessionActive=false){
 const context=await browser.newContext(),page=await context.newPage();let redeemed=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));
 await page.route('**/api/access/session',r=>r.fulfill({json:redeemed&&sessionActive?{authenticated:true,entitled:true,accessSource:'serial',serial:details}:{authenticated:false,entitled:false}}));
 await page.route('**/api/access/serial/redeem',async r=>{redeemed=true;await r.fulfill(response);});
 await page.goto(base+'/unlock/?returnTo=%2Fverify%2F%3Fresume%3D1');
 await page.locator('#serialCode').fill('FIXTURE-ONLY');await page.locator('#serialForm button[type=submit]').click();
 await page.waitForFunction(()=>!document.querySelector('#serialForm button[type=submit]').disabled);
 const unlocked=name==='confirmed-session';assert.equal(await page.locator('#serialEntitledPanel').isVisible(),unlocked);
 if(unlocked){assert.match(await page.locator('#serialDeviceStatus').innerText(),/1\/2.*1/);await page.reload();await page.locator('#serialEntitledPanel').waitFor({state:'visible'});await page.locator('#serialEntitledPanel a').click();await page.waitForURL('**/verify/?resume=1');await page.waitForFunction(()=>window.ZhongkaoAccess?.getState().resolved);assert.equal(await page.locator('.gate-veil').count(),0);}
 else{assert.ok(await page.locator('#serialStatus').innerText());assert.equal(await page.locator('#serialForm').isVisible(),true);}
 checks.push(name);await context.close();
}
try{
 // Deliberately invalid syntax is rejected before binding or writing a serial audit.
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/unlock/');
 const health=await page.evaluate(async()=>{const r=await fetch('/api/access/health');return {status:r.status,type:r.headers.get('content-type'),body:await r.json()};});
 assert.equal(health.status,200);assert.equal(health.body.ok,true);assert.equal(health.body.service,'zhongkao-access');checks.push('real-service-read-only-health');
 await page.locator('#serialCode').fill('CONNECTION-CHECK-NOT-A-REAL-KEY');await page.locator('#serialForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#serialForm button[type=submit]').disabled);
 assert.equal(await page.locator('#serialEntitledPanel').isVisible(),false);assert.match(await page.locator('#serialStatus').innerText(),/格式不正确/);checks.push('invalid-format-no-binding');await page.close();
 await scenario('html-200-rejected',{status:200,contentType:'text/html',body:'<html>Home</html>'});
 await scenario('empty-json-rejected',{json:{}});
 await scenario('third-device-denied',{status:409,json:{error:'该序列号已绑定两台设备；第3台需要新序列号。',code:'SERIAL_DEVICE_LIMIT'}});
 await scenario('successful-redeem-without-session-stays-locked',{json:{ok:true,entitled:true,...details}});
 await scenario('confirmed-session',{json:{ok:true,entitled:true,...details}},true);
 assert.deepEqual(errors,[]);
 const evidence={status:'passed',checkedAt:new Date().toISOString(),base,checks,errors,actualActivation:'none; only invalid syntax sent to live service; successful scenarios use isolated HTTP fixtures'};
 console.log(JSON.stringify(evidence,null,2));await fs.writeFile(new URL('../../guangzhou-zhongkao/docs/qa-20261005/unlock-results.json',import.meta.url),JSON.stringify(evidence,null,2));
}finally{await browser.close();}
