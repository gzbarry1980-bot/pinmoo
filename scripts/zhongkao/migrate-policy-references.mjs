// Mechanical migration of year consumers and browser cache versions. Safe to run again.
import fs from 'node:fs/promises';
import path from 'node:path';
const base=path.resolve('guangzhou-zhongkao');
for(const name of ['experience.js','intent-planner.js','dynamic-ui.js','quota/quota.js']){
  const file=path.join(base,name);let text=await fs.readFile(file,'utf8');
  const modulePath=name.includes('/')?'../policy-context.js':'./policy-context.js';
  if(!text.includes("from '"+modulePath+"'"))text=`import {latestAdmissionYear,defaultForecastYear} from '${modulePath}';\n`+text;
  text=text.replaceAll('data.manifest.latestPolicyYear','latestAdmissionYear(data.manifest)')
    .replaceAll('dataset.manifest.latestPolicyYear','latestAdmissionYear(dataset.manifest)')
    .replaceAll('manifest.latestPolicyYear+1','defaultForecastYear(manifest)');
  if(name==='experience.js')text=text.replace('当前政策口径为2026年；预测新年度规则未发布时，暂按2026规则模拟。','${policyContext({targetYear:defaultForecastYear(data.manifest)},data.manifest).notice}');
  if(name==='experience.js'){
   text=text.replace(/import \{latestAdmissionYear,defaultForecastYear(?:,policyContext)?\}/,'import {latestAdmissionYear,defaultForecastYear,policyContext,analysisIsCurrent}');
   text=text.replace('const r=p.result,old=r&&r.dataVersion!==data.manifest.version','const r=p.result,old=r&&!analysisIsCurrent(r,data.manifest)');
   text=text.replace('数据已有更新，请重新评估','数据或模型已更新，请重新评估');
   text=text.replace("step=${r?'analysis':'plan'}", "step=${r&&!old?'analysis':'plan'}");
   text=text.replace('items=ws.plans.filter(p=>ids.includes(p.id));', 'items=ws.plans.filter(p=>ids.includes(p.id)).map(p=>({...p,result:analysisIsCurrent(p.result,data.manifest)?p.result:null}));');
  }
  await fs.writeFile(file,text);
}
for(const name of ['app.js','experience.js','dynamic-ui.js','home.js','intent-planner.js','quota/quota.js']){
 const file=path.join(base,name);let text=await fs.readFile(file,'utf8');
 text=text.replace(/(school-service|intent-planner|decision-experience|parent-copy)\.js(?:\?v=[\w-]+)?(?=['"])/g,'$1.js?v=20261018-policy');
 await fs.writeFile(file,text);
}
const routes=['index.html','verify/index.html','direction/index.html','target/index.html','schools/index.html','schools/detail/index.html','schools/compare/index.html','admissions/index.html','plans/index.html','plans/compare/index.html','my/index.html','quota/index.html'];
for(const route of routes){
 const file=path.join(base,route);let text=await fs.readFile(file,'utf8');
 text=text.replace(/(app|home|experience|dynamic-ui|quota)\.js\?v=[\w-]+/g,'$1.js?v=20261018-policy');
 await fs.writeFile(file,text);
}
console.log('Migrated year references and cache versions');
