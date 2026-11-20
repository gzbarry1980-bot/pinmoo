// Held-out school thresholds, not individual admission-probability calibration.
import fs from 'node:fs';
import path from 'node:path';
import {estimatePercentile,estimateScore} from '../../guangzhou-zhongkao/score-distribution.js';
import {YEAR_WEIGHTS} from '../../guangzhou-zhongkao/engine.js';
const root=path.resolve('guangzhou-zhongkao/data'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const admissions=read('admissions.json'),bands=read('score-bands.json');
const byYear=y=>bands.filter(r=>r.year===y),key=r=>[r.schoolId,r.batch,r.candidateType,r.scope].join('|');
const quantile=(rows,q)=>{const sorted=[...rows].sort((a,b)=>a.value-b.value),total=sorted.reduce((s,r)=>s+r.weight,0);let cumulative=0;for(const r of sorted){cumulative+=r.weight/total;if(cumulative>=q)return r.value;}return sorted.at(-1)?.value;};
const results=[];
for(const year of [2024,2025,2026]){
 const rows=[];
 for(const target of admissions.filter(r=>r.year===year&&[3,4].includes(r.batch))){
  const training=admissions.filter(r=>r.year<year&&key(r)===key(target)&&byYear(r.year).length);
  const mapped=training.map(r=>({value:estimatePercentile(r.cutoffScore,byYear(r.year)),weight:YEAR_WEIGHTS[r.year]||.01})).filter(r=>r.value!==null);
  if(mapped.length<2)continue;
  const prediction=estimateScore(quantile(mapped,.5),byYear(year)),actual=target.cutoffScore;
  const interval=[estimateScore(quantile(mapped,.8),byYear(year)),estimateScore(quantile(mapped,.2),byYear(year))];
  rows.push({schoolId:target.schoolId,schoolName:target.schoolName,batch:target.batch,candidateType:target.candidateType,scope:target.scope,year,trainingYears:training.map(r=>r.year),prediction,actual,error:prediction-actual,interval,covered:actual>=interval[0]&&actual<=interval[1]});
 }
 results.push({year,records:rows.length,meanAbsoluteError:rows.length?rows.reduce((s,r)=>s+Math.abs(r.error),0)/rows.length:null,medianAbsoluteError:rows.length?quantile(rows.map(r=>({value:Math.abs(r.error),weight:1})),.5):null,historicalRangeCoverage:rows.length?rows.filter(r=>r.covered).length/rows.length:null,rows});
}
const output=path.resolve('guangzhou-zhongkao/docs/decision-upgrade-20261013');fs.mkdirSync(output,{recursive:true});
const report={at:new Date().toISOString(),method:'For each held-out year, only earlier same-school/campus, batch, candidate category and scope records train the estimate. Held-out official score bands translate ranks to scores, so this is conditional on a known score distribution, not a pre-exam forecast.',limits:['Published bands use linear interpolation; one-point ranks are not observed.','This tests school threshold drift only, not actual individual admission or calibrated probabilities.','New schools, unmatched campuses and fewer than two training years are excluded.','No training weights or public admission records are altered.'],results};
fs.writeFileSync(path.join(output,'threshold-backtest.json'),JSON.stringify(report,null,2));
for(const r of results)console.log(JSON.stringify({year:r.year,records:r.records,meanAbsoluteError:r.meanAbsoluteError,medianAbsoluteError:r.medianAbsoluteError,historicalRangeCoverage:r.historicalRangeCoverage}));
