import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Curated factual summaries of authenticated, user-supplied membership articles.
// Raw articles and screenshots remain private. Never modify admissions or model inputs here.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const base=path.join(root,'guangzhou-zhongkao');
const privateRoot=path.join(base,'research/member-schools-20261014');
const files=await fs.readdir(path.join(privateRoot,'captured'));
const captures=await Promise.all(files.filter(f=>f.endsWith('.json')).map(async file=>({file,...JSON.parse(await fs.readFile(path.join(privateRoot,'captured',file),'utf8'))})));
const byIndex=i=>captures.find(r=>r.file.startsWith(String(i).padStart(2,'0')+'-'));
const rows=[
 // index, exact campus ID, room description, fee per semester, facilities, curriculum/campus summary
 [1,'gz-5424230557c2','6—7人间',650,'独立卫浴、阳台、空调；资料提及洗衣与烘干设施','南山、格致和平行班；资料介绍人文与科学素养融合课程'],
 [2,'gz-503814527dc3','4—6人间',650,'独立卫浴、空调','南山、格致和平行班；与荔湾校区之间有教师交流安排'],
 [3,'gz-198c01489912','6人间',700,'独立卫浴、阳台、空调；公共自习与洗衣设施','奥班、大先强基、大先数理和平行班'],
 [4,'gz-fd2a5311bae4','4人间',700,'双卫生间、阳台、空调及洗衣设施','丘班、中科大创新、大先数理、人文、海航等培养方向'],
 [5,'gz-3a2e51774f57','高一、高二6人间；高三4人间',650,'独立卫浴、空调；热水按用量另计','应元课程体系涵盖基础课程、人文数理阅读和竞赛培优'],
 [6,'gz-96a493c0f2d1','6—8人间',650,'空调、双卫浴、阳台；公共洗衣与浴室设施','大学城校区；资料介绍奥班、国防班、创新班等不同培养方向'],
 [7,'gz-6b8cf4e3bb80','6—8人间',650,'独立卫浴、阳台、空调','竞赛、科创、综合等岭南特色培养方向'],
 [8,'gz-d88fc5845fdc','7人间',650,'公共洗衣房、热水、自习室及视频电话','岭南特色班；按竞赛、科创、综合方向组织课程'],
 [9,'gz-a356b84be321','6—8人间',450,'独立卫生间与洗浴间、空调、热水','元培班和平行班；入学分班与选科后调整分开进行'],
 [10,'gz-284b2b772794','6—8人间',450,'独立卫浴、空调、热水；资料提及洗衣服务','元培班和平行班；与执信路校区分开记录'],
 [11,'gz-39546db6ee78','4—6人间',650,'寄宿生活设施；国际课程收费与普通高中方向不同','外语培养特色；普通高考与国际课程方向需分别了解'],
 [12,'gz-b610fbd1676b','4—6人间',650,'住宿人数另有家长描述为6人，具体安排需询校','奥班、黄埔班、黄埔风班和平行班'],
 [13,'gz-e0c6a89c9e84','4—6人间；资料称首年安排4人间',650,'首年住宿安排不能自动沿用至新年级','2025年首届高中招生；黄埔三航班、黄埔风班和平行班'],
 [14,'gz-d1dab230f119','4—6人间；资料称首年安排4人间',650,'首年住宿安排不能自动沿用至新年级','黄埔班、黄埔风班和平行班'],
 [15,'gz-0a2cc03d55ef','正文记8人间，家长答疑另记6人间',650,'空调、卫浴等住宿设施；人数口径不一致，需核对年级与楼栋','铁英、重点和平行班；资料介绍三个校区有联考和课程协同'],
 [16,'gz-727b6d8ff167','家长答疑描述为6人间',null,'空调、独立卫浴、储物柜与热水；具体年级未明确','寄宿安排与走读申请需询校；铁英、重点和平行班'],
 [17,'gz-9a6f1f35a825','4—6人间',650,'上床下桌、独立卫浴、阳台、空调；楼层自习与洗衣设施','2022年开始高中招生；铁英、重点和平行班'],
 [18,'gz-11fe9a9bc94f','2023年答疑描述为6人间',650,'仅对应历史智谷校区资料，不沿用为智慧城校区条件','2023年资料介绍数信英才、体艺特色方向'],
 [19,'gz-a9afa174ddb3','资料描述改造后为6人间',null,'双独立卫浴、空调、热水与储物设施；改造年份未明确','2023年资料介绍创新班与实验班；园林式校园'],
 [20,'gz-2d5bcaab3eb7','资料称可住宿或走读；未说明人数',null,'高中部位于白云区金沙洲；住宿详情需询校','空天智能、理科创新、文史实验等方向；普高与港澳子弟班口径不同']
];
// Image table was visually reviewed. Preserve contradictions; never interpret enrollment as actual admissions.
const classRows=[
 [3,499,12,'奥班2、大先强基3、大先数理3、平行4',[]],
 [4,520,11,'丘班1、中科大创新1、大先数理2、大先人文1、海航1、平行5',[]],
 [1,825,18,'南山6、格致4，其余平行',['文章另列面向广州计划约670人；招生范围与计划口径不同，未合并人数']],
 [2,500,12,'南山4、格致2，其余平行',[]],
 [5,950,19,'表中应元8，其余平行',['同年学校文章记应元7；两条资料有差异，当前班数需向学校核对']],
 [6,750,15,'奥、00、0、重点、国防、创新、平行等班型',['表中分项相加与总班数不一致，文章明细也存在重复；不推定各班实际人数']],
 [9,500,10,'元培7、平行3',[]],
 [10,700,14,'元培8、平行6',[]],
 [7,650,13,'竞赛方向特色班1、科创1、综合5，其余平行',['原文特色班名称有文字混排，按培养方向概括']],
 [8,550,11,'强基1、科创1、综合6，其余平行',[]],
 [12,650,16,'奥班1、黄埔6、黄埔风4，其余平行',[]],
 [14,400,10,'黄埔2、黄埔风2，其余平行',[]],
 [13,350,8,'黄埔三航2、黄埔风1，其余平行',['同年文章写招生300人，分班表写350人；未采用该人数作为招生计划或实际录取人数']],
 [15,300,7,'铁英3、重点3，其余平行',[]],
 [16,330,8,'铁英2、重点2，其余平行',[]],
 [17,600,14,'铁英4、重点5，其余平行',['原表括号另提13—16班，与总班数有差异；不采用该班号范围']],
 [11,720,16,'重点4、次重点4，其余班型未逐项说明',[]]
];
const schools=JSON.parse(await fs.readFile(path.join(base,'data/schools.json'),'utf8'));
const sources=rows.map(([i])=>{const c=byIndex(i);if(!c)throw new Error('Missing capture '+i);return{id:`member-school-${String(i).padStart(2,'0')}-20261014`,title:c.title,url:c.url,publishedAt:c.text.match(/\d{4}-\d{2}-\d{2}/)?.[0]||null,capturedAt:c.capturedAt,kind:'third-party-member-article',contentSHA256:createHash('sha256').update(c.text).digest('hex'),verification:'extracted_not_officially_verified'};});
const table=byIndex(21);const tableSource={id:'member-class-table-2025-20261014',title:table.title,url:table.url,publishedAt:'2025-09-04',capturedAt:table.capturedAt,kind:'third-party-member-image',imageSHA256:createHash('sha256').update(await fs.readFile(path.join(privateRoot,'2025-class-table.png'))).digest('hex'),verification:'visually_transcribed_not_officially_verified'};
const sourceByIndex=new Map(rows.map(([i],j)=>[i,sources[j]]));
const records=rows.map(([i,schoolId,rooms,semesterFee,facilities,features])=>{
 const s=schools.find(s=>s.id===schoolId);if(!s)throw new Error('Unmatched campus '+schoolId);
 const src=sourceByIndex.get(i),c=classRows.find(r=>r[0]===i);
 const referenceYear=i===18?2023:null;
 return{schoolId,schoolName:s.name,sourceLabel:byIndex(i).title,campusScope:i===18?'智谷校区 · 2023年历史问答':s.name,sourceId:src.id,referenceYear,verification:'third_party_reference',useInModel:false,
  boarding:{rooms,semesterFee,feeUnit:'元/学期',referenceYear,facilities,sourceId:src.id,verifiedForCurrentYear:false,issues:i===8?['同一文章同时出现标准7人间与特色4人间，适用楼栋和年级未明确；不能视作可自由选择。']:i===15?['正文8人间与家长答疑6人间口径不同；不据此承诺具体宿位。']:[]},
  features,classes:c?{year:2025,totalClasses:c[2],summary:c[3],issues:c[4],sourceId:tableSource.id}:i===18?{year:2023,totalClasses:6,summary:'家长答疑介绍零壹、数信与成志等班型',issues:['历史班型；不用于判断当前年级分班'],sourceId:src.id}:i===19?{year:2023,totalClasses:12,summary:'资料介绍创新班1、实验班4；当年按成绩安排分班',issues:['不沿用往年分班门槛'],sourceId:src.id}:i===20?{year:2023,totalClasses:null,summary:'理科创新、文史实验及空天智能等培养方向',issues:['普通高中、港澳子弟和国际方向不能混成同一口径'],sourceId:src.id}:null,
  questions:['当年能否保证宿位，具体住哪个楼栋？','特色班如何选拔，选科后是否重新分班？','收费是否包含热水、洗衣和其他生活费用？'],
  caution:i===18?'原资料同时介绍两个校区规划，生活与收费仅采用明确年份的智谷校区历史问答，未写入智慧城校区。':'资料为第三方整理；文章发布日期不代表每项信息的适用年份。宿位、收费、班型须核对当年安排。'};
});
const publicData={version:'school-reference-20261014',capturedDate:'2026-10-14',scope:'省市属高中栏目：20所学校/校区；不是广州所有高中',note:'学校生活与培养方向参考，不改变报考资格、学费筛选、录取机会或方案评分。全文和原图不公开。',sources:[...sources,tableSource],records};
await fs.writeFile(path.join(base,'data/school-references.json'),JSON.stringify(publicData,null,2)+'\n');
await fs.writeFile(path.join(privateRoot,'normalized-class-table.json'),JSON.stringify({year:2025,source:tableSource,rows:classRows.map(([i,reportedEnrollment,totalClasses,summary,issues])=>({schoolId:rows.find(r=>r[0]===i)[1],sourceSchoolLabel:byIndex(i).title,reportedEnrollment,enrollmentDefinition:'原表招生人数；不等于实际录取人数',actualAdmissions:null,totalClasses,summary,issues}))},null,2)+'\n');
console.log(JSON.stringify({records:records.length,sources:publicData.sources.length,classReferences:classRows.length,modelInputsChanged:false}));
