// Read only publicly rendered pages; never bypass login or membership checks.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const data=JSON.parse(fs.readFileSync('guangzhou-zhongkao/data/member-resources.json','utf8'));
const out=path.resolve('guangzhou-zhongkao/research/member-resources-20261012');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const c=await browser.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});
const p=await c.newPage(),records=[];
try{
 for(const record of data.records){
  let result={id:record.id,title:record.title,url:record.url,checkedAt:new Date().toISOString(),status:'not_read'};
  try{
   const response=await p.goto(record.url,{waitUntil:'domcontentloaded',timeout:25000});await p.waitForTimeout(2500);
   const text=(await p.locator('body').innerText({timeout:5000})).trim();
   const gated=/登录|登入|会员专享|购买后|开通会员|订阅后|暂未购买|立即购买|无权|权限/.test(text);
   result={...result,httpStatus:response?.status(),finalURL:p.url(),pageTitle:await p.title(),status:gated?'access_or_membership_prompt':text.length>50?'public_preview_only':'empty_or_client_rendered',preview:text.slice(0,3000)};
   await p.screenshot({path:path.join(out,record.id+'.png')});
  }catch(e){result.status='browser_error';result.error=e.message.split('\n')[0];}
  records.push(result);console.log(record.id+': '+result.status+(result.pageTitle?' / '+result.pageTitle:''));
  fs.writeFileSync(path.join(out,'access-audit.json'),JSON.stringify({at:new Date().toISOString(),scope:'Public rendered pages only; no login, purchase, full-text extraction or access-control bypass',records},null,2));
 }
}finally{await browser.close();}
