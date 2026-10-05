import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fetchBytes,parseGeneralAdmissions,parseScoreBands,normalizeSchoolName,idFromName} from './data-lib.mjs';
import {SOURCE_PAGES,BATCH2_PDFS} from './source-config.mjs';
const root='guangzhou-zhongkao', privateDir=`${root}/research/wecom-source-20261005/official`;
await fs.mkdir(privateDir,{recursive:true});
const read=async file=>JSON.parse(await fs.readFile(`${root}/data/${file}`,'utf8'));
const oldAdmissions=await read('admissions.json'), oldBands=await read('score-bands.json'), oldAllocations=await read('allocations-2026.json');
const sources=await read('sources.json');
const refreshedAdmissions=[],refreshedBands=[],sourceEvidence=[];
for(const year of [2024,2025,2026]){
 for(const kind of ['batch3','batch4','scoreBands']){
  const sourceId=`official-${year}-${kind==='scoreBands'?'score-bands':`batch-${kind.slice(-1)}`}`;
  const url=SOURCE_PAGES[year][kind],result=await fetchBytes(url),html=new TextDecoder().decode(result.bytes);
  await fs.writeFile(`${privateDir}/${sourceId}.html`,html);
  const evidence={...sources.find(s=>s.id===sourceId),id:sourceId,url,fetchedAt:new Date().toISOString(),sha256:result.sha256,parserVersion:'1.1.1'};
  sourceEvidence.push(evidence);
  if(kind==='scoreBands')refreshedBands.push(...parseScoreBands(html,year,sourceId));
  else refreshedAdmissions.push(...parseGeneralAdmissions(html,year,Number(kind.slice(-1)),sourceId));
 }
}
const result=await fetchBytes(BATCH2_PDFS[2026]);
await fs.writeFile(`${privateDir}/allocations-2026.pdf`,result.bytes);
const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
const pdf=await pdfjs.getDocument({data:result.bytes}).promise;
const knownNames=[...new Set((await read('schools.json')).map(r=>r.name))];
const outcomes=[];const parseWarnings=[];
for(let number=1;number<=pdf.numPages;number++){
 const page=await pdf.getPage(number);
 const items=(await page.getTextContent()).items.filter(i=>i.str?.trim()).flatMap(i=>{
  const parts=i.str.trim().split(/\s+/);
  // PDF.js sometimes coalesces the two adjacent name cells. Recreate the
  // original cell boundary from its whitespace separator, not from guesses.
  if(i.transform[4]<175&&parts.length===2&&/^(广州市|广东|广州|华南|清华|北京)/.test(parts[0])&&/学校|中学|校区|学院/.test(parts[1]))return [{str:parts[0],x:i.transform[4],y:i.transform[5]},{str:parts[1],x:188.65,y:i.transform[5]}];
  return [{str:i.str.replace(/\s+/g,''),x:i.transform[4],y:i.transform[5]}];
 });
 const anchors=items.filter(i=>i.x<175&&/^(广州市|广东|广州|华南|清华|北京)/.test(i.str)&&i.str.length>=4).sort((a,b)=>b.y-a.y);
 for(let index=0;index<anchors.length;index++){
  const a=anchors[index];
  const top=index===0?a.y+14:(anchors[index-1].y+a.y)/2;
  const bottom=index===anchors.length-1?a.y-24:(a.y+anchors[index+1].y)/2;
  const join=(x1,x2)=>items.filter(i=>i.x>=x1&&i.x<x2&&i.y>bottom&&i.y<=top).sort((a,b)=>b.y-a.y||a.x-b.x).map(i=>i.str).join('');
  const schoolName=normalizeSchoolName(join(0,175)), sourceSchoolName=normalizeSchoolName(join(175,350));
  if(!knownNames.includes(schoolName)||!sourceSchoolName||sourceSchoolName.includes('送生学校')){parseWarnings.push({page:number,schoolName,sourceSchoolName});continue;}
  const num=(x1,x2)=>{const value=join(x1,x2);return /^\d+$/.test(value)?Number(value):null;};
  const cutoffScore=num(350,390),cutoffTieRank=num(390,435),lastCandidateScore=num(435,475),lastVolunteerNo=num(475,510),lastCandidateTieRank=num(510,560);
  if(cutoffScore!==null&&!(cutoffScore>=300&&cutoffScore<=810))throw new Error(`Invalid score page ${number}`);
  outcomes.push({year:2026,batch:2,schoolId:idFromName(schoolName),schoolName,sourceSchoolId:idFromName(sourceSchoolName),sourceSchoolName,candidateType:'户籍生',cutoffScore,cutoffTieRank,lastCandidateScore,lastVolunteerNo,lastCandidateTieRank,status:cutoffScore===null?'no_admitted_candidate':'admitted',quota:null,admittedCount:null,sourceId:'official-2026-batch-2-pdf',sourcePage:number});
 }
}
const unique=new Map();for(const row of outcomes){const key=`${row.schoolId}|${row.sourceSchoolId}`;if(unique.has(key))throw new Error(`Duplicate allocation pair ${key}`);unique.set(key,row);}
const fields=['cutoffScore','cutoffTieRank','lastVolunteerNo','lastCandidateScore','lastCandidateTieRank'];
const key=r=>`${r.year}|${r.batch}|${r.schoolId}|${r.candidateType}|${r.sourceSchoolId||''}`;
function compare(oldRows,newRows){const old=new Map(oldRows.map(r=>[key(r),r]));return {new:newRows.filter(r=>!old.has(key(r))),changed:newRows.filter(r=>old.has(key(r))&&fields.some(f=>r[f]!==old.get(key(r))[f])).map(r=>({before:old.get(key(r)),after:r})),removed:oldRows.filter(r=>!newRows.some(n=>key(n)===key(r)))};}
const comparison=compare(oldAdmissions.filter(r=>r.year>=2024),refreshedAdmissions);
const allocationComparison=compare(oldAllocations,outcomes.filter(r=>r.cutoffScore!==null));
const report={generatedAt:new Date().toISOString(),officialPages:sourceEvidence,admissions:{before:oldAdmissions.filter(r=>r.year>=2024).length,after:refreshedAdmissions.length,...comparison},allocationOutcomes:{rows:outcomes.length,admitted:outcomes.filter(r=>r.cutoffScore!==null).length,noAdmittedCandidate:outcomes.filter(r=>r.cutoffScore===null).length,parseWarnings,comparison:allocationComparison},bands:{before:oldBands.filter(r=>r.year>=2024).length,after:refreshedBands.length}};
await fs.writeFile(`${privateDir}/comparison.json`,JSON.stringify(report,null,2));
await fs.writeFile(`${privateDir}/allocation-outcomes-staged.json`,JSON.stringify(outcomes,null,2));
await fs.writeFile(`${privateDir}/admissions-staged.json`,JSON.stringify(refreshedAdmissions,null,2));
await fs.writeFile(`${privateDir}/bands-staged.json`,JSON.stringify(refreshedBands,null,2));
await fs.writeFile(`${privateDir}/sources-staged.json`,JSON.stringify([...sourceEvidence,{...sources.find(s=>s.id==='official-2026-batch-2-pdf'),fetchedAt:new Date().toISOString(),sha256:result.sha256,parserVersion:'allocation-outcomes-1.0'}],null,2));
console.log(JSON.stringify({admissions:{before:report.admissions.before,after:report.admissions.after,new:comparison.new.length,changed:comparison.changed.length,removed:comparison.removed.length},allocations:{total:outcomes.length,admitted:report.allocationOutcomes.admitted,noAdmission:report.allocationOutcomes.noAdmittedCandidate,new:allocationComparison.new.length,changed:allocationComparison.changed.length,removed:allocationComparison.removed.length,warnings:parseWarnings.length},bands:report.bands}));
