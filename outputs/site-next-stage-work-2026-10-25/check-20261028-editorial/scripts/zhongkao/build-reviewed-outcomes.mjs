import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const base=path.resolve('guangzhou-zhongkao'),raw=path.join(base,'research/wecom-source-20261005');
// Visually transcribed from the saved original screenshots, not from unreviewed OCR.
// Columns are 2025:600/special, 2024:600/special, 2023:600/special. Blank stays null.
const rows=[
 ['华附石牌','gz-198c01489912',['81.90%',null,'75%+',null,'80%+','99.50%'],0,'石牌校区'],
 ['省实荔湾','gz-5424230557c2',['81%','超90%','80%+',null,'82.94%','96.00%'],0,'荔湾校区'],
 ['二中','gz-3a2e51774f57',['71%+',null,'60%',null,'69.20%','97%+'],0,'原表未说明班型与分母'],
 ['广附','gz-96a493c0f2d1',['65%','96%','60%+',null,'59.90%','96%+'],0,'原表未细分校区'],
 ['执信越秀','gz-a356b84be321',['55%','94%','55%+','95%','60%+','90%+'],0,'原表标注越秀；是否合并其他校区尚未确认'],
 ['广雅荔湾','gz-6b8cf4e3bb80',['400人左右','超90%','57%','95%+','60%','96%+'],0,'荔湾校区'],
 ['广雅花都','gz-d88fc5845fdc',['近30%','超90%','100人','90%',null,null],0,'花都校区'],
 ['六中海珠','gz-b610fbd1676b',['51.80%','93.30%','41%',null,'41.21%','90%+'],0,'海珠校区'],
 ['广外','gz-39546db6ee78',['65%+','98%','74%','99.60%','60%+','96%+'],0,'广州外国语学校，不是天河外国语'],
 ['协和','gz-a9afa174ddb3',[null,'重点班96%',null,null,null,null],0,'仅有重点班数据，不能代表全校'],
 ['侨中','gz-2d5bcaab3eb7',[null,null,null,null,null,'30%左右'],0,'原表未说明是否含港澳班'],
 ['5中本部','gz-3ffdae4a2e72',['178人','91.20%','24%','85%','182人','84%左右'],0,'本部，不含金碧校区'],
 ['5中金碧','gz-0ef96b413381',['21人','51.60%',null,null,null,null],0,'金碧校区'],
 ['97中','gz-0f05b24c70f2',[null,'38%',null,null,null,'26%'],0,'原表未细分校区，不自动沿用至其他校区'],
 ['南武本部','gz-e46ea8053870',['59人','71.10%','42人','72.30%',null,'65.00%'],0,'本部，不含岭南画派校区'],
 ['南武岭南画派','gz-c12b967bf504',['12人',null,null,null,null,null],0,'岭南画派纪念校区'],
 ['7中本部','gz-8310deb2ea5a',['180人+','90%左右','180人+','90%左右','30.73%','90.39%'],1,'本部，不含其他校区'],
 ['16中本部','gz-ec1a75c75160',[null,'90%+',null,'85.30%','31.48%','80.00%'],1,'本部，不含水荫校区'],
 ['培正','gz-79a8dd8dc065',[null,null,null,'68.00%','16.80%','60.00%'],1,'原表未说明班型与分母'],
 ['3中','gz-044aabdc6232',[null,'近60%','37人','55.15%',null,'46.50%'],1,'原表未说明班型与分母'],
 ['育才','gz-81902b3f8aec',['15人','42.60%',null,'38.20%',null,'44.80%'],1,'原表未说明班型与分母'],
 ['16中水荫','gz-7e4ccac84bc9',[null,null,null,'40%左右',null,null],1,'水荫校区，不含本部'],
 ['真光本部','gz-d93473f23283',['168人','73%左右','122人','72.40%','160人+','70.00%'],1,'本部，不含其他校区'],
 ['4中','gz-f13c506ad0ce',[null,null,null,'36%','36人+','33%左右'],1,'原表未细分校区'],
 ['1中','gz-6030e3e82113',[null,'37.60%',null,null,'30人+','27%'],1,'原表未细分校区'],
 ['西关外国语','gz-37ecf29eda89',[null,null,null,null,null,'43%'],1,'普通高中方向，原表未说明分母'],
 ['真光汾水','gz-b24c8ca363ab',[null,null,null,null,null,'7%左右'],1,'汾水校区'],
 ['南海中学','gz-5c6ec516124f',[null,null,null,null,null,'7%左右'],1,'原表未说明班型与分母'],
 ['西关培英','gz-5b1c632c0aea',[null,null,null,null,null,'7%左右'],1,'原表未说明班型与分母'],
 ['天外','gz-bebacfbd3819',['50%+','96.20%','61.60%','95%+','51%','90%+'],1,'原表未细分校区，不移植至新校区'],
 ['广中','gz-53982052dcc7',['194人','85.20%','29.41%','85%左右','214人','80%+'],1,'原表未细分校区'],
 ['天中','gz-bcfe78433eae',['105人','71.89%',null,null,'61人','48.59%'],1,'原表未细分校区'],
 ['113中','gz-61981727b151',['33人','48%','19人','48.86%','51人','48.19%'],1,'原表未细分校区，不移植至其他校区'],
 ['89中','gz-ad42ba26282e',[null,null,null,null,null,'37%'],2,'原表未说明班型与分母'],
 ['奥林匹克中学','gz-eff8e0690790',['17人','40.50%',null,null,null,'36.70%'],2,'原表未说明班型与分母'],
 ['75中','gz-89976c80ab47',[null,null,null,null,null,'32%左右'],2,'原表未说明班型与分母'],
 ['玉岩','gz-0eebefaa93e8',['150人+',null,null,'80%','21.34%','72%'],2,'原表未说明班型与分母'],
 ['86中','gz-69ec77e6c53d',['70人+','接近70%',null,'62.50%',null,'60%左右'],2,'原表未说明班型与分母'],
 ['北师大广实','gz-17ac15270cde',['19人','44.60%',null,'30%左右',null,'49.33%'],2,'北京师范大学广州实验学校'],
 ['黄埔开元','gz-68f2e691e9a0',['6人',null,null,'24.30%',null,null],2,'黄埔区开元学校'],
 ['科学城中学','gz-05cb9dd5648e',['11人',null,null,null,null,'25%左右'],2,'原表未说明班型与分母'],
 ['培英云城','gz-36a40bf707ec',[null,null,null,'近70%',null,null],2,'白云新城校区；原表简称云城'],
 ['大同中学','gz-6304fc4cbefc',[null,'28.60%',null,'35%',null,null],2,'原表未说明班型与分母'],
 ['仲元','gz-601ef3343da5',['150人+','89%左右','150人+','85%','22.22%','82%'],3,'原表未说明班型与分母'],
 ['番禺中学','gz-37d974269f94',[null,null,null,'41%','12%','37%'],3,'原表未说明班型与分母'],
 ['象贤','gz-537a0a7b946c',[null,null,null,null,null,'25%'],3,'普通高中方向'],
 ['大龙','gz-5a61f83d1160',[null,'8.10%',null,null,null,null],3,'原表未说明班型与分母'],
 ['南村中学','gz-ae239104e547',[null,null,null,null,null,'29人'],3,'原表特控列为人数，不是比例'],
 ['南沙广附','gz-c5297257f160',['53人','52.60%','12.80%','57.30%','8.33%','36%'],3,'南沙实验学校，不是大学城校区'],
 ['南沙天元','gz-5cc46321ec5e',['54人','接近45%',null,'55%','6.25%','35%'],3,'南沙天元学校'],
 ['南沙华附','gz-524a67309dff',[null,'80人',null,'32%',null,'27%'],3,'华南师范大学附属南沙中学，不是石牌／知识城'],
 ['东涌中学','gz-91a1244c0567',[null,null,null,'42人',null,null],4,'原表特控列为人数，不是比例'],
 ['秀全','gz-0b36f446a971',['57人','57%',null,'60%+',null,null],4,'秀全中学'],
 ['增城中学','gz-985849148729',[null,'54.10%',null,'54.50%','69人','41%'],4,'增城中学'],
 ['增城广附','gz-ef96f6edf9cc',[null,'47.50%',null,null,null,null],4,'广大附中增城实验中学'],
 ['增城一中','gz-e06abc629a4f',[null,null,null,'13.20%',null,null],4,'增城区第一中学'],
 ['新塘中学','gz-7b23af080db1',['3人',null,null,null,null,null],4,'原表未说明班型与分母'],
 ['永和中学','gz-e4d08e5bef11',['3人','12%',null,null,null,null],4,'原表未说明班型与分母'],
 ['黄广','gz-fa0f6a7cb5a2',['56%','96%',null,'93%',null,'98%'],5,'原表未拆分公费、普通及国际方向'],
 ['黄广附属','gz-502edaee8019',[null,'81%',null,'70%+',null,'80.30%'],5,'原表未拆分公费与普通方向'],
 ['天省实验','gz-b372e6724412',[null,null,null,null,null,'82.23%'],5,'原表未拆分公费与普通方向'],
 ['华美','gz-d80042199eeb',[null,null,'19人','54%',null,'20.91%'],5,'原表未说明是否含国际与港澳方向'],
 ['庆丰实验','gz-cc5c0129cd54',['10人左右',null,null,null,null,null],5,'原表未说明班型与分母']
];
const schools=JSON.parse(await fs.readFile(path.join(base,'data/schools.json'),'utf8'));
const sources=await Promise.all(Array.from({length:6},async(_,i)=>({
 id:`wecom-outcomes-p${i}-20261018`,title:'广州高中近三年出口成绩统计（第三方整理）',
 url:'https://doc.weixin.qq.com/sheet/e3_AfAADQZTAL0CNhjDFgOVxRmKenuj0',
 sourceType:'第三方整理',capturedAt:'2026-10-05',transcriptionReviewedAt:'2026-10-18',
 imageSHA256:createHash('sha256').update(await fs.readFile(path.join(raw,`screenshots/s04-h0-p${String(i).padStart(3,'0')}.png`))).digest('hex'),
 verification:'visually_checked_transcription',officialVerification:'not_verified',
 note:'核对的是原表转录；学校原始公告、分母和特殊班型口径尚未核实。'
})));
const metricKind=value=>!value?null:/人/.test(value)?'count':/%/.test(value)?'rate':'unspecified';
const yearsFor=cells=>[2025,2024,2023].map((year,i)=>({year,score600:cells[i*2],specialControl:cells[i*2+1],score600Kind:metricKind(cells[i*2]),specialControlKind:metricKind(cells[i*2+1]),denominator:null})).filter(y=>y.score600||y.specialControl);
const sourceConflicts={
 '执信越秀':['会员文章的2025年55%指标提及两校区合计；原表却标越秀，校区范围存在冲突，不能据此评价单一校区。'],
 '协和':['2025数据仅为重点班，不能作为全校特控率。'],
 '省实荔湾':['第三方文章2025年写接近83%、原表写81%；2024年文章写82.94%、原表写80%+，数据有差异，尚未取得学校原始公告。'],
 '二中':['第三方文章2023年写特控率95.5%、原表写97%+；原始公告及统计范围待核对。'],
 '广附':['第三方文章2025年写600分以上占比62.5%、原表写65%；未按任一数字认定学校真实表现。']
};
const records=rows.map(([label,schoolId,cells,frame,campusScope])=>{
 const school=schools.find(s=>s.id===schoolId);if(!school)throw new Error(`Unknown exact school ID ${schoolId}`);
 return{schoolId,schoolName:school.name,sourceSchoolLabel:label,campusScope,sourceId:sources[frame].id,verification:'third_party_transcription_reviewed',useInModel:false,years:yearsFor(cells),issues:sourceConflicts[label]||[]};
});
const aggregateRecords=[{id:'tieyi-three-campuses-2023-2025',schoolId:null,schoolIds:['gz-0a2cc03d55ef','gz-727b6d8ff167','gz-9a6f1f35a825'],sourceSchoolLabel:'铁一（三校）',campusScope:'原表三校合计；不代表任一单校区，也不证明新校区当年已有毕业生',scopeType:'multiple_campuses',sourceId:sources[0].id,verification:'third_party_transcription_reviewed',useInModel:false,years:yearsFor(['30%左右','90%+','30%左右','90%左右','30%','92%']),issues:['原表把三校作为一行，不拆算各校区人数或比例。']}];
const existing=JSON.parse(await fs.readFile(path.join(base,'data/school-outcomes.json'),'utf8'));
for(const old of existing.records||[])if(!records.some(r=>r.schoolId===old.schoolId))records.push(old);
const preserveSourceIds=new Set(records.map(r=>r.sourceId).filter(id=>!sources.some(s=>s.id===id)));
sources.push(...(existing.sources||[]).filter(s=>preserveSourceIds.has(s.id)));
const output={schemaVersion:'1.1.0',version:'school-outcomes-20261018',reviewedAt:'2026-10-18',note:'历史第三方统计，仅核对转录。人数、比例、重点班和校区合计保留原口径；不进入录取模型或学校质量排名。',sources,records,aggregateRecords};
await fs.writeFile(path.join(base,'data/school-outcomes.json'),JSON.stringify(output,null,2)+'\n');
const report={reviewedAt:'2026-10-18',schoolRecords:records.length,aggregateRecords:aggregateRecords.length,yearRows:records.reduce((sum,r)=>sum+r.years.length,0),modelInputsChanged:false,officialVerification:'not_verified',pendingLabels:['海实（待精确学校身份确认）','广外外校（待精确学校身份确认）','为明（多校区未明）','广理实验（待精确学校身份确认）','海珠中学（待历史学校名称确认）'],blankCellsNotImputed:true};
await fs.mkdir(path.join(base,'docs/phase-one-20261018'),{recursive:true});
await fs.writeFile(path.join(base,'docs/phase-one-20261018/outcome-review-summary.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
