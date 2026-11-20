import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assertDataset,gradientIndex} from './data-lib.mjs';
const dir='guangzhou-zhongkao/data', research='guangzhou-zhongkao/research/wecom-source-20261005';
const read=async path=>JSON.parse(await fs.readFile(path,'utf8'));
const write=async(path,value)=>fs.writeFile(path,JSON.stringify(value,null,2)+'\n');
const report=await read(`${research}/official/comparison.json`);
if(report.admissions.changed.length||report.admissions.removed.length||report.allocationOutcomes.comparison.changed.length||report.allocationOutcomes.comparison.removed.length||report.allocationOutcomes.parseWarnings.length)throw new Error('Unresolved official-source differences; merge refused');
const model=await read(`${research}/official/model-allocations-staged.json`);
const outcomes=await read(`${research}/official/allocation-outcomes-staged.json`);
const old=await read(`${dir}/allocations-2026.json`),manifest=await read(`${dir}/manifest.json`),schools=await read(`${dir}/schools.json`),sourceSchools=await read(`${dir}/source-schools.json`),sources=await read(`${dir}/sources.json`),lines=await read(`${dir}/control-lines.json`);
const pair=r=>`${r.schoolId}|${r.sourceSchoolId}`;
const fields=['cutoffScore','cutoffTieRank','lastVolunteerNo','lastCandidateScore','lastCandidateTieRank'];
const modelByPair=new Map(model.map(r=>[pair(r),r])),outcomesByPair=new Map(outcomes.map(r=>[pair(r),r]));
if(modelByPair.size!==model.length||outcomesByPair.size!==outcomes.length)throw new Error('Duplicate source-school pair');
for(const row of old)if(!modelByPair.has(pair(row))||fields.some(f=>modelByPair.get(pair(row))[f]!==row[f]))throw new Error('Existing official record would be changed');
for(const row of model)if(!outcomesByPair.has(pair(row))||fields.some(f=>outcomesByPair.get(pair(row))[f]!==row[f]))throw new Error('Independent PDF parsers disagree');
const schoolIds=new Set(schools.map(s=>s.id));if(outcomes.some(r=>!schoolIds.has(r.schoolId)))throw new Error('Unknown school identifier');
for(const row of model)row.gradientIndex=gradientIndex(row.cutoffScore,lines[2026]);
const allAllocations=[];for(const year of manifest.years)allAllocations.push(...(year===2026?model:await read(`${dir}/allocations-${year}.json`)));
assertDataset({admissions:await read(`${dir}/admissions.json`),allocations:allAllocations,bands:await read(`${dir}/score-bands.json`),schools,lines});
const sourceMap=new Map(sourceSchools.map(s=>[s.id,s]));for(const row of outcomes)if(!sourceMap.has(row.sourceSchoolId))sourceMap.set(row.sourceSchoolId,{id:row.sourceSchoolId,name:row.sourceSchoolName,district:null});
const sourceEvidence=await read(`${research}/official/sources-staged.json`);for(const refreshed of sourceEvidence){const index=sources.findIndex(s=>s.id===refreshed.id);if(index<0)throw new Error('Unknown official source');sources[index]=refreshed;}
const counts={records:outcomes.length,admitted:model.length,noAdmittedCandidate:outcomes.length-model.length};
const quotaDataset={schemaVersion:'1.0.0',year:2026,generatedAt:new Date().toISOString(),parserVersion:'allocation-outcomes-1.0',sourceId:'official-2026-batch-2-pdf',sourceUrl:sourceEvidence.find(s=>s.id==='official-2026-batch-2-pdf').url,sourceSha256:sourceEvidence.find(s=>s.id==='official-2026-batch-2-pdf').sha256,counts,notes:['空白分数表示该初中与高中组合当年没有考生被录取，不等于0分。','历史录取结果不等于当年分配计划；没有记录也不能认定没有名额。','空白结果只用于学校资料，不进入录取机会模型。'],records:outcomes};
const ocr=await read(`${research}/reconciliation-admissions.json`);
const summary={schemaVersion:'1.0.0',generatedAt:new Date().toISOString(),officialSourceIds:sourceEvidence.map(s=>s.id),quota:counts,admissionRefresh:{records:report.admissions.after,changed:0,years:[2024,2025,2026]},referenceReview:{consistent:ocr.consistent,needsReview:ocr.reviewRequired,unmatched:ocr.unmatched,note:'第三方资料只用于查漏。未确认的OCR、推测分段和不同口径的升学成绩不进入模型。'},allocationSchools:[...new Set(outcomes.map(r=>r.schoolId))].map(schoolId=>({schoolId,admittedSourceSchools:outcomes.filter(r=>r.schoolId===schoolId&&r.status==='admitted').length,noAdmittedSourceSchools:outcomes.filter(r=>r.schoolId===schoolId&&r.status==='no_admitted_candidate').length})),rules:['录取数据以官方表为准；同一学校的校区、年份、批次、考生类别和来源初中分别处理。','资料中的推测版逐分排名不替换官方分数段数据。','高中出口成绩缺少明确年份、分母与独立来源时，不纳入学校排名或机会评分。']};
const digest=createHash('sha256').update(JSON.stringify({model,sources,counts})).digest('hex').slice(0,8);
manifest.version=`20261005-${digest}`;manifest.generatedAt=new Date().toISOString();manifest.coverage['2026'].batch2=model.length;manifest.counts.allocations=allAllocations.length;manifest.counts.sourceSchools=sourceMap.size;manifest.counts.allocationOutcomes2026=outcomes.length;manifest.evidenceSummary='evidence-summary.json';
const snapshot=`${research}/before-merge`;await fs.mkdir(snapshot,{recursive:true});
for(const file of ['allocations-2026.json','manifest.json','sources.json','source-schools.json']){
 const target=`${snapshot}/${file}`;if(!(await fs.stat(target).catch(()=>null)))await fs.copyFile(`${dir}/${file}`,target);
}
// A >15% repair is permitted only here after two independent parsers agree,
// all prior records remain byte-for-field unchanged, and source IDs validate.
// The regular scheduled update drift gate is deliberately not disabled.
await write(`${dir}/allocations-2026.json`,model);
await write(`${dir}/allocation-outcomes-2026.json`,quotaDataset);
await write(`${dir}/source-schools.json`,[...sourceMap.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh')));
await write(`${dir}/sources.json`,sources);
await write(`${dir}/evidence-summary.json`,summary);
await write(`${dir}/manifest.json`,manifest);
await write(`${research}/merge-receipt.json`,{mergedAt:new Date().toISOString(),version:manifest.version,old2026Records:old.length,new2026Records:model.length,added:model.length-old.length,counts,unchangedOldRecords:old.length,independentParserAgreement:true,rawMemberContentPublished:false,scheduledDriftGateDisabled:false});
console.log(JSON.stringify({version:manifest.version,added:model.length-old.length,quota:counts,totalAllocations:allAllocations.length,sourceSchools:sourceMap.size}));
