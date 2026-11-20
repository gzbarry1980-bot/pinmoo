import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='guangzhou-zhongkao',out=root+'/research/phase-two-20261025',docs=root+'/docs/flow-upgrade-20261025';
for(const p of [out,docs])fs.mkdirSync(p,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2));
const sources=[
 ['2021-b3-public','https://gzzk.gz.gov.cn/img/0/449/449513/7411656.png',2021,3],
 ['2021-b3-private','https://gzzk.gz.gov.cn/img/0/449/449511/7411656.png',2021,3],
 ['2021-b4-public','https://gzzk.gz.gov.cn/img/0/450/450144/7415208.png',2021,4],
 ['2021-b4-private','https://gzzk.gz.gov.cn/img/0/450/450145/7415208.png',2021,4],
 ['2022-b3-public','https://gzzk.gz.gov.cn/img/0/687/687966/8424121.png',2022,3],
 ['2022-b3-private-projects','https://gzzk.gz.gov.cn/img/0/687/687888/8424121.png',2022,3],
 ['2021-score-bands','https://gzzk.gz.gov.cn/img/0/446/446492/7405010.png',2021,null]
];
const evidence=[];
for(const [id,url,year,batch]of sources){
 const file=path.join(out,id+'.png');const row={id,url,year,batch,file,status:'not_fetched',useInModel:false};
 if(process.argv.includes('--fetch'))try{if(!fs.existsSync(file)){const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('HTTP '+response.status);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.readUInt32BE(0)!==0x89504e47)throw new Error('Not PNG');fs.writeFileSync(file,bytes);}row.sha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex');row.status='original_saved';console.log(id+': original saved');}catch(e){row.status='fetch_failed';row.error=e.message;console.log(id+': '+e.message);}
 if(process.argv.includes('--ocr')&&fs.existsSync(file))try{const ocrPath=path.join(out,id+'.ocr.json');if(!fs.existsSync(ocrPath)){const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','scripts/zhongkao/ocr-member-image.ps1','-ImagePath',path.resolve(file)],{encoding:'utf8',timeout:60000,maxBuffer:8e6});if(result.status!==0)throw new Error(result.stderr);write(ocrPath,JSON.parse(result.stdout.replace(/^\uFEFF/,'')));}row.ocrFile=ocrPath;row.status='ocr_awaiting_visual_review';console.log(id+': OCR staged');}catch(e){row.ocrError=e.message;}
 if(fs.existsSync(file)){row.sha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(row.status==='not_fetched')row.status='original_saved';}
 if(id==='2021-score-bands'&&fs.existsSync(researchReceipt())){const receipt=read(researchReceipt());if(receipt.sha256===row.sha256){row.status='visually_reviewed_and_merged';row.useInModel=true;row.promotedRows=receipt.added;}}
 evidence.push(row);
}
const promoted=evidence.reduce((n,r)=>n+(r.promotedRows||0),0);
function researchReceipt(){return docs+'/bands-merge-receipt.json';}
write(out+'/official-images.json',{checkedAt:'2026-10-25',items:evidence,recordsPromoted:promoted});
const review=read(root+'/research/wecom-source-20261005/reconciliation-admissions.json');
const pending=review.records.filter(r=>r.status!=='consistent');
write(out+'/reconciliation-worklist.json',pending.map((r,i)=>({taskId:'D02-'+String(i+1).padStart(3,'0'),...r,nextAction:r.status==='review_required'?'核对原图数字与官方同口径记录':'核对校名、校区、项目、年份和考生类别',resolution:'pending_evidence',useInModel:false})));
const refs=read(root+'/data/school-references.json'),schools=read(root+'/data/schools.json');
write(out+'/current-school-facts-worklist.json',refs.records.map(r=>{const s=schools.find(s=>s.id===r.schoolId);return {taskId:'D04-'+r.schoolId,schoolId:r.schoolId,schoolName:s?.name,targetYear:2027,campusAddress:s?.campusAddress||null,currentYearBoarding:null,currentYearTuition:null,currentYearBoardingFee:null,historicalReferenceId:r.sourceId,officialSourceURL:null,officialPublishedAt:null,status:'awaiting_current_year_official_source',questions:r.questions};}));
write(docs+'/data-work-summary.json',{date:'2026-10-25',officialImages:evidence.map(({file,ocrFile,...r})=>r),pendingRows:pending.length,reviewRequired:review.reviewRequired,unmatched:review.unmatched,schoolFactsQueue:refs.records.length,recordsPromoted:promoted,rawResearchIsPrivate:true});
console.log('Worklist: '+pending.length+' reference rows, '+refs.records.length+' campus fact sheets');
