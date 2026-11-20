import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const online=process.argv.includes('--online'),origin=online?'https://zhongkao.pinmooconsulting.com':'http://localhost:5174';
const out=path.resolve('guangzhou-zhongkao/docs/school-integration-20261013',online?'online-browser':'local-browser');fs.mkdirSync(out,{recursive:true});
const {chromium}=(await import(pathToFileURL('C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/playwright-core/index.js').href)).default;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
const results=[],errors=[];p.on('pageerror',e=>errors.push(e.message));const check=(name,pass)=>{results.push({name,pass});console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)throw new Error(name);};let last=0;
async function go(route){if(online){const delay=11000-(Date.now()-last);if(delay>0)await new Promise(r=>setTimeout(r,delay));last=Date.now();}await p.goto(origin+route,{waitUntil:'networkidle'});}
try{
 for(const route of ['/','/schools/','/my/','/admissions/']){await go(route);check('No separate resource entry at '+route,await p.locator('a[href^="/resources/"]').count()===0&&!(await p.locator('body').innerText()).includes('中考资料库'));}
 await go('/schools/detail/?id=gz-ec1a75c75160');await p.locator('.school-quick-facts').waitFor();
 check('School information remains integrated',await p.locator('.school-quick-facts dl>div').count()===6&&await p.locator('#history').count()===1);
 check('School outcome reference remains in this school',(await p.locator('#outcomes').innerText()).includes('90%'));
 check('No generic external school directory panel',await p.locator('#schoolMemberReferences').count()===0&&await p.locator('a[href*="khs1y.xetslk.com/s/2QQ0dZ"]').count()===0);
 check('Mobile school page fits',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(out,'school-mobile.png')});
 await go('/resources/');check('Old bookmark goes directly to school search',new URL(p.url()).pathname==='/schools/');
 check('Public build excludes external membership directory',!fs.existsSync('dist/zhongkao/data/member-resources.json')&&!fs.existsSync('dist/zhongkao/resource-library.js'));
 check('No browser errors',errors.length===0);
}catch(e){results.push({name:'Execution',pass:false,message:e.message});console.error(e);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({origin,at:new Date().toISOString(),results,errors},null,2));await browser.close();}
