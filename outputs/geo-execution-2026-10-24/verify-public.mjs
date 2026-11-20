import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {insights} from '../../src/data/insights.js';
const dir=new URL('./',import.meta.url),origin='https://pinmooconsulting.com';
const ledger=JSON.parse(await fs.readFile(new URL('执行与发布台账.json',dir),'utf8'));
const get=async path=>{const r=await fetch(origin+path,{headers:{DNT:'1'},redirect:'manual',signal:AbortSignal.timeout(20000)});return {status:r.status,body:Buffer.from(await r.arrayBuffer())};};
const hash=b=>createHash('sha256').update(b).digest('hex');
const build=JSON.parse((await get('/site-build.json')).body.toString());
const sitemap=(await get('/sitemap.xml')).body.toString();
const results=[];
function authorIsOrganization(html){
  const nodes=[];
  for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
    if(!m[1].includes('application/ld+json'))continue;
    const data=JSON.parse(m[2]);nodes.push(...(data['@graph']||[data]));
  }
  const article=nodes.find(n=>n['@type']==='Article');
  return article?.author?.['@id']===origin+'/#organization'&&!article.editor;
}
for(const item of [...ledger.records.map(r=>({id:r.id,slug:r.article.slug})),...ledger.updates.map(r=>({id:r.id,slug:r.slug}))]){
  await new Promise(r=>setTimeout(r,800));
  const path='/insights/'+item.slug+'/',response=await get(path),html=response.body.toString();
  const local=await fs.readFile(new URL('dist'+path+'index.html',new URL('../../',dir)));
  const article=insights.find(a=>a.slug===item.slug);
  const checks={http200:response.status===200,exactBuiltFile:hash(response.body)===hash(local),title:html.includes(article.title),
    completeNarrative:[...(article.lead||[]),...article.sections.flatMap(s=>s.paragraphs)].every(p=>html.includes(p)),
    canonical:html.includes(`<link rel="canonical" href="${origin}${path}"`),
    articleSchema:html.includes('"@type":"Article"'),aiDisclosure:html.includes(article.disclosure),sitemap:sitemap.includes(origin+path),
    truthfulAuthor:authorIsOrganization(html)};
  results.push({...item,url:origin+path,status:response.status,checks,passed:Object.values(checks).every(Boolean)});
}
for(const path of ['/insights/','/insights/page/7/']){
  await new Promise(r=>setTimeout(r,800));
  const response=await get(path),local=await fs.readFile(new URL('dist'+path+'index.html',new URL('../../',dir)));
  results.push({url:origin+path,status:response.status,passed:response.status===200&&hash(response.body)===hash(local),check:'index equals built HTML'});
}
const receipt={checkedAt:new Date().toISOString(),date:'2026-10-24',build,changedArticles:13,indexes:2,
  passed:build.version==='7458354c1c'&&build.articleCount===84&&results.every(r=>r.passed),results};
try {await fs.copyFile(new URL('复核记录/public-verification.json',dir),new URL('复核记录/public-verification-initial.json',dir),fs.constants?.COPYFILE_EXCL||1);}catch(e){if(!['ENOENT','EEXIST'].includes(e.code))throw e;}
await fs.writeFile(new URL('复核记录/public-verification.json',dir),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({build,passed:receipt.passed,failures:results.filter(r=>!r.passed)}));
if(!receipt.passed)process.exitCode=1;
