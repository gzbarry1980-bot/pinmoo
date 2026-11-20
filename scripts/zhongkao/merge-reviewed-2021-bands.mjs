// Values transcribed and visually checked against the saved official image.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const dir='guangzhou-zhongkao/data',research='guangzhou-zhongkao/research/phase-two-20261025';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const counts=[240,775,1779,3276,5431,8029,10959,14190,17534,21031,24624,28142,31684,35071,38442,41709,44909,47943,50876,53658,56291,58911,61256,63493,65601,67555,69380,71112,72684,74138,75465,76690,77826,78812,79800,80665];
const percents=[.27,.86,1.96,3.62,6,8.87,12.10,15.67,19.37,23.23,27.20,31.08,34.99,38.73,42.46,46.06,49.60,52.95,56.19,59.26,62.17,65.06,67.65,70.12,72.45,74.61,76.63,78.54,80.27,81.88,83.35,84.70,85.95,87.04,88.13,89.09];
const sourceId='official-2021-score-bands',asset='https://gzzk.gz.gov.cn/img/0/446/446492/7405010.png';
const bytes=fs.readFileSync(research+'/2021-score-bands.png'),sha256=createHash('sha256').update(bytes).digest('hex');
const additions=counts.map((c,i)=>({year:2021,score:750-i*10,cumulative:c,cumulativeRatio:percents[i]/100,sourceId}));
if(additions.length!==36||additions.some((r,i)=>i&&(!(r.cumulative>additions[i-1].cumulative)||!(r.cumulativeRatio>additions[i-1].cumulativeRatio))))throw new Error('Invalid reviewed bands');
const bands=read(dir+'/score-bands.json'),old=bands.filter(r=>r.year===2021);
if(old.length){if(JSON.stringify(old)!==JSON.stringify(additions))throw new Error('Existing 2021 bands differ; refuse overwrite');console.log('Reviewed 2021 bands already merged');process.exit(0);}
const manifest=read(dir+'/manifest.json'),sources=read(dir+'/sources.json'),index=sources.findIndex(s=>s.id===sourceId);
if(index<0)throw new Error('Missing official source');
const before=research+'/before-bands-merge';fs.mkdirSync(before,{recursive:true});
for(const f of ['score-bands.json','manifest.json','sources.json'])if(!fs.existsSync(before+'/'+f))fs.copyFileSync(dir+'/'+f,before+'/'+f);
const next=[...additions,...bands];
sources[index]={...sources[index],title:'2021年广州市中考分数段统计表（含各项政策性加分）',parserVersion:'official-image-reviewed-1.0',imageEvidence:{url:asset,sha256,reviewedAt:'2026-10-25',rows:36,method:'visual_transcription_crosscheck',ratioPrecision:'official two-decimal percentages; total population not inferred'}};
manifest.version='20261025-'+createHash('sha256').update(JSON.stringify({next,previous:manifest.version})).digest('hex').slice(0,8);
manifest.generatedAt=new Date().toISOString();manifest.coverage['2021'].scoreBands=36;manifest.counts.scoreBands=next.length;
write(dir+'/score-bands.json',next);write(dir+'/sources.json',sources);write(dir+'/manifest.json',manifest);
write(research+'/reviewed-2021-bands.json',{sourceId,asset,sha256,reviewedAt:'2026-10-25',records:additions,previousRecordsUnchanged:bands.length});
write('guangzhou-zhongkao/docs/flow-upgrade-20261025/bands-merge-receipt.json',{version:manifest.version,sourceId,sha256,added:36,preserved:bands.length,remainingMissing:'2021 batch3/batch4 and 2022 batch3',officialRoundedPercentagesPreserved:true});
console.log(JSON.stringify({version:manifest.version,added:36,totalBands:next.length}));
