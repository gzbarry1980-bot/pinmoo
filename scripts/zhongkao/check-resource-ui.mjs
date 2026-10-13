import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const out=path.resolve('guangzhou-zhongkao/docs/resources-20261012');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[];const check=(name,pass)=>{results.push({name,pass});console.log((pass?'PASS ':'FAIL ')+name);if(!pass)throw new Error(name);};
const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
async function go(route){await p.goto('http://localhost:5174'+route,{waitUntil:'networkidle'});}
try{
 await go('/');check('Homepage retains four task entries',await p.locator('.home-start-option').count()===4);check('Homepage resource link is reachable',await p.locator('.home-school-search a[href="/resources/"]').count()===1);
 await p.locator('.home-school-search a[href="/resources/"]').click();await p.locator('.resource-card').first().waitFor();check('All ten entries render',await p.locator('.resource-card').count()===10);
 check('Cards are direct links with no nested controls',await p.locator('.resource-card').evaluateAll(es=>es.every(e=>e.tagName==='A'&&!e.querySelector('button,a')&&e.target==='_blank'&&e.rel.includes('noopener'))));
 await p.getByRole('button',{name:'选学校',exact:true}).click();check('School filter shows two entries',await p.locator('.resource-card').count()===2);
 await p.getByRole('button',{name:'全部',exact:true}).click();await p.fill('#resourceQuery','试卷');check('Keyword search works',await p.locator('.resource-card').count()===1);
 await p.fill('#resourceQuery','不存在的内容');check('No-result state is clear',await p.locator('#resourceGrid').innerText()==='没有找到，换个关键词试试。');await p.fill('#resourceQuery','');
 await p.locator('.resource-access-note > summary').click();check('Original membership boundary is clear',(await p.locator('.resource-access-note').innerText()).includes('本系统解锁不包含原平台会员权限'));
 await p.screenshot({path:path.join(out,'resources-access-note-mobile.png')});await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'resources-mobile.png')});
 await go('/schools/detail/?id=gz-ec1a75c75160');await p.locator('#schoolMemberReferences').waitFor();check('School overview offers reference directory',await p.locator('#schoolMemberReferences a[href="https://khs1y.xetslk.com/s/2QQ0dZ"]').count()===1);
 check('General directory is not labeled a verified school article',(await p.locator('#schoolMemberReferences').innerText()).includes('先打开学校目录'));
 await p.locator('#schoolMemberReferences').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'school-reference-mobile.png')});
 for(const width of [360,390,430,1440]){await p.setViewportSize({width,height:844});await go('/resources/');await p.locator('.resource-card').first().waitFor();check('Resource layout fits '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await go('/resources/?category='+encodeURIComponent('选学校'));await p.locator('.resource-card').first().waitFor();check('Category deep link restores filtering',await p.locator('.resource-card').count()===2);
 check('Disclaimer remains present',(await p.locator('.disclaimer').innerText()).includes('本系统仅供参考'));check('No script errors',errors.length===0);
}catch(e){console.log('FAIL '+e.message);results.push({name:'Execution',pass:false,details:e.message});process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'ui-results.json'),JSON.stringify({at:new Date().toISOString(),scope:'Local resource UI; no authentication, serial or membership mutations',results,errors},null,2));await browser.close();}
