import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const out=path.resolve('guangzhou-zhongkao/docs/ui-redesign-20261011/codex-fix-evidence');
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await page.route('**/api/access/config',r=>r.fulfill({json:{accessMode:'enforce'}}));
await page.route('**/api/access/session',r=>r.fulfill({json:{authenticated:true,entitled:true}}));
try {
 await page.goto('http://localhost:5174/verify/?new=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.body.dataset.uiReady==='true');
 await page.evaluate(()=>{for(const [key,size] of Object.entries({title:48,body:32,note:28}))document.documentElement.style.setProperty('--zk-font-'+key,size+'px');dispatchEvent(new Event('resize'));});
 await page.waitForTimeout(300);
 const details=await page.evaluate(()=>({bodyFont:getComputedStyle(document.body).fontSize,width:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth),viewport:innerWidth,overflow:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,id:e.id,class:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,text:e.textContent?.slice(0,70)})).filter(e=>e.width>0&&(e.left<-.5||e.right>innerWidth+.5)).slice(0,35)}));
 await page.screenshot({path:path.join(out,'verify-large-text-mobile.png')});
 console.log(JSON.stringify(details,null,2));
 fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify({at:new Date().toISOString(),details,pass:details.bodyFont==='32px'&&details.width<=details.viewport+1},null,2));
 if(details.width>details.viewport+1)process.exitCode=1;
} finally {await browser.close();}
