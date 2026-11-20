import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const out=path.resolve('guangzhou-zhongkao/research/member-resources-20261012');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const c=await browser.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});const p=await c.newPage();
const results=[];
try{
 await p.goto('https://khs1y.xetslk.com/s/2QQ0dZ',{waitUntil:'domcontentloaded'});await p.waitForTimeout(1800);
 results.push({step:'school-directory',url:p.url(),title:await p.title(),text:await p.locator('body').innerText()});
 await p.getByText('省市属高中',{exact:true}).click();await p.waitForTimeout(2500);
 const text=await p.locator('body').innerText();results.push({step:'province-city-directory',url:p.url(),title:await p.title(),text:text.slice(0,6000),links:await p.locator('a[href]').evaluateAll(es=>es.map(e=>({text:e.innerText,href:e.href})).filter(x=>x.text.trim()))});
 if(!/登录|开通|购买|订阅|会员专享|无权|权限/.test(text)){
  const targets=p.getByText(/广雅/);if(await targets.count()){await targets.first().click();await p.waitForTimeout(2000);results.push({step:'guangya-entry',url:p.url(),title:await p.title(),text:(await p.locator('body').innerText()).slice(0,4500)});}
 }
 console.log(JSON.stringify(results,null,2));
}finally{fs.writeFileSync(path.join(out,'school-catalog-audit.json'),JSON.stringify({at:new Date().toISOString(),scope:'Normal UI navigation of public directory only; no login or membership bypass',results},null,2));await browser.close();}
