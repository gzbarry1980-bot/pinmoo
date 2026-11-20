import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const dir = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await fs.readFile(path.join(dir, 'plan-data.json'), 'utf8'));
const wb = Workbook.create();
const palette = { ink: '#243247', navy: '#173F63', light: '#EDF3F8', accent: '#9B702C', muted: '#65758A', amber: '#FFF4D6' };
const cols = n => { let s=''; for(;n>0;n=Math.floor((n-1)/26)) s=String.fromCharCode(65+(n-1)%26)+s; return s; };
const text = v => v instanceof Date ? v : Array.isArray(v) ? v.join('\n') : v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v;

function makeSheet(name, title, headers, rows, widths, tableName, options={}) {
  const sh = wb.worksheets.add(name);
  sh.showGridLines = false;
  sh.tabColor = name === '选题计划' ? palette.navy : name === '说明与来源' ? '#8A8F98' : '#6F8FA8';
  const end = rows.length + 6;
  const last = cols(headers.length);
  sh.getRange(`A1:${last}${end}`).format.font = { name: 'Arial', size: 10, color: palette.ink };
  sh.getRange(`A1:${last}${end}`).format.verticalAlignment = 'center';
  sh.getRange('A2').values = [[title]];
  sh.getRange('A2').format.font = { name: 'Arial', size: 16, bold: true, color: palette.navy };
  sh.getRange(`A3:${last}3`).format.borders = { bottom: { style: 'thin', color: '#B2C5D7' } };
  sh.getRange('A4').values = [[options.note ?? '规划日期：2026-10-24。搜索量与引用热度未测。']];
  sh.getRange('A4').format.font = { italic: true, color: palette.muted, size: 10 };
  sh.getRange(`A6:${last}${end}`).values = [headers, ...rows.map(row=>row.map(text))];
  sh.getRange(`A6:${last}6`).format = {
    fill: palette.navy,
    font: { name:'Arial', size:10, color:'#FFFFFF', bold:true },
    horizontalAlignment:'center', verticalAlignment:'center', wrapText:true,
    borders: { insideVertical:{style:'thin',color:'#FFFFFF'} },
  };
  sh.getRange(`A7:${last}${end}`).format.wrapText = true;
  sh.getRange(`A7:${last}${end}`).format.verticalAlignment = 'top';
  sh.getRange(`A6:${last}6`).format.rowHeight = 32;
  sh.getRange(`A7:${last}${end}`).format.rowHeight = options.rowHeight ?? 85;
  widths.forEach((width,i)=>sh.getRange(`${cols(i+1)}1:${cols(i+1)}${end}`).format.columnWidth = width);
  rows.forEach((row,i)=>{
    const lineCount=Math.max(...row.map((value,c)=>String(text(value)).split('\n').reduce((sum,line)=>{
      const units=[...line].reduce((n,ch)=>n+(ch.charCodeAt(0)>255?2:1),0);
      return sum+Math.max(1,Math.ceil(units/Math.max(6,widths[c]-2)));
    },0)));
    sh.getRange(`A${i+7}:${last}${i+7}`).format.rowHeight=Math.max(28,lineCount*13+9);
  });
  for(let r=7;r<=end;r++) if(r%2===1) sh.getRange(`A${r}:${last}${r}`).format.fill = '#F3F6F9';
  const table=sh.tables.add(`A6:${last}${end}`,true,tableName);
  table.showFilterButton=true;
  sh.freezePanes.freezeRows(6);
  sh.freezePanes.freezeColumns(options.freezeColumns ?? 2);
  return sh;
}

async function finish(previews, counts) {
  wb.recalculate();
  const inspection = await wb.inspect({kind:'workbook,sheet,table',maxChars:7000,tableMaxRows:2,tableMaxCols:4,tableMaxCellChars:90});
  const errors = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:50},summary:'Final formula error scan',maxChars:3000});
  await fs.writeFile(path.join(dir,'workbook-inspection.txt'),inspection.ndjson+'\n'+errors.ndjson,'utf8');
  for(const [name,range,label] of previews) {
    if(process.argv.includes('--updated') && !['keywords','keywords-details','sources','notes'].includes(label)) continue;
    const preview = await wb.render({sheetName:name,range,scale:1.4,format:'png'});
    await fs.writeFile(path.join(dir,`preview-${label}.png`),new Uint8Array(await preview.arrayBuffer()));
  }
  const outputPath=path.join(dir,'品沐咨询-GEO新选题与关键词规划-2026-10-24.xlsx');
  const xlsx=await SpreadsheetFile.exportXlsx(wb);
  await xlsx.save(outputPath);
  await fs.writeFile(path.join(dir,'workbook-check.json'),JSON.stringify({date:'2026-10-24',...counts,outputPath,formulaErrorInspection:errors.ndjson},null,2),'utf8');
  console.log(JSON.stringify({outputPath,...counts}));
}

// Final field mappings are set against plan-data.json, whose content is maintained by the planning task.
const articles = data.articles;
const keywords = data.keywords;
const updates = data.updates;
const sources = data.sources;
if(!Array.isArray(articles) || !Array.isArray(keywords) || !Array.isArray(updates) || !Array.isArray(sources)) throw new Error('plan-data.json must provide articles, keywords, updates and sources arrays');

if(new Set(articles.map(a=>a.id)).size !== articles.length) throw new Error('Duplicate article ID');
if(new Set(keywords.map(k=>k.term.trim())).size !== keywords.length) throw new Error('Duplicate keyword');
if(new Set(updates.map(u=>u.id)).size !== updates.length) throw new Error('Duplicate update ID');
const targets=new Set([...articles,...updates].map(x=>x.id));
for(const k of keywords) for(const t of k.targetIds) if(!targets.has(t)) throw new Error(`Unknown keyword target ${t}`);
const sourceIds=new Set(sources.map(s=>s.id));
for(const item of [...articles,...keywords,...updates]) for(const id of item.sourceIds.split(';')) if(!sourceIds.has(id)) throw new Error(`Unknown source ${id}`);

const articleRows=articles.map(a=>[
  a.id,a.title,a.group,a.priority,a.primaryKeyword,a.supportingKeywords,a.longTailQuestions,
  a.intent,a.difference,a.outline,a.evidence,a.existingTitle,a.existingUrl,
  a.mainPlatform,a.secondaryPlatform,a.websiteAction,a.sourceIds,a.status,
]);
const shArticles=makeSheet('选题计划','品沐咨询 GEO 新选题规划',
  ['编号','文章选题','分组','优先级','主关键词','相关关键词','长尾问题','搜索意图','与旧文的区别','内容大纲','成稿所需依据','关联旧文','关联网址','主发平台','次发平台','官网安排','来源ID','编写与发布状态'],
  articleRows,[10,48,16,10,28,28,40,18,45,38,42,40,65,13,13,40,18,28],'NewArticlePlan',
  {rowHeight:100,note:`2026-10-24 规划。${articles.length} 个候选新题，P0 为首批 ${articles.filter(a=>a.priority==='P0').length} 篇；正文待写。`});
shArticles.getRange(`D7:D${articles.length+6}`).conditionalFormats.add('containsText',{text:'P0',format:{fill:'#FFF0CE',font:{bold:true,color:'#7D5415'}}});
shArticles.getRange(`D7:D${articles.length+6}`).dataValidation={rule:{type:'list',values:['P0','P1','P2']}};
shArticles.getRange(`R7:R${articles.length+6}`).format.fill=palette.amber;
shArticles.getRange(`R7:R${articles.length+6}`).dataValidation={rule:{type:'list',values:['规划完成，正文未生成、未发布','正文起草中，未发布','正文待审阅，未发布','平台稿已准备，未发布','已发布，待补公开链接']}};

const intentById=new Map(articles.map(a=>[a.id,a.intent]));
const usage={主关键词:'自然标题、首段',相关关键词:'解释相关概念的正文段落',长尾问题:'段落、小标题与复测提问',旧文补词:'更新原页面相关段落',历史监测问题:'历史问题对照与复测'};
const keywordRows=keywords.map(k=>[
  k.id,k.term,k.group,k.role,
  k.targetIds.length ? [...new Set(k.targetIds.map(id=>intentById.get(id)??'已有主题补充'))].join('；') : '历史问题对应现有页面',
  k.targetIds,k.targetUrls,k.source,k.sourceIds,k.searchVolume,usage[k.role]??'按目标文章意图自然使用',k.note,
]);
const shKeywords=makeSheet('关键词库','可用关键词与完整问题',
  ['编号','关键词或完整问题','主题分组','词条类型','目标意图','目标文章ID','承接页面URL','来源分类','来源ID','搜索量','建议用法','来源说明'],
  keywordRows,[10,47,23,17,25,15,74,29,18,11,30,55],'KeywordLibrary',
  {rowHeight:62,note:`共 ${keywords.length} 条去重词条。H 为历史原始问题，E 为已有内容或意图扩展，N 为编辑候选；搜索量均未测。`});
shKeywords.getRange(`J7:J${keywords.length+6}`).format.fill='#FFF5DD';

const shUpdates=makeSheet('旧文补词','保留原网址的补词计划',
  ['编号','现有文章','补充关键词','更新动作','现有网址','来源ID','执行状态'],
  updates.map(u=>[u.id,u.title,u.keywords,u.action,u.url,u.sourceIds,u.status]),
  [10,48,42,58,74,20,30],'ExistingArticleUpdates',
  {rowHeight:125,note:`${updates.length} 篇旧文集中补充品牌词、地域词与采购问题。方案已列出，网站正文尚未修改。`});
shUpdates.getRange(`G7:G${updates.length+6}`).format.fill=palette.amber;

const shSources=makeSheet('说明与来源','规划口径与来源',
  ['来源ID','资料名称','网址或归档位置','资料日期','适用范围'],
  sources.map(s=>[s.id,s.title,s.url,new Date(`${s.date}T00:00:00Z`),s.scope]),
  [10,39,78,16,70],'PlanningSources',
  {rowHeight:73,note:'来源用于确认原始问题、现有主题与公开事实。未提供当前搜索量、竞争难度或实时热度。',freezeColumns:1});
shSources.getRange(`D7:D${sources.length+6}`).setNumberFormat('yyyy-mm-dd');
const notesStart=sources.length+10;
shSources.getRange(`A${notesStart}`).values=[['编写与使用说明']];
shSources.getRange(`A${notesStart}`).format.font={name:'Arial',size:13,bold:true,color:palette.navy};
shSources.getRange(`A${notesStart+1}:E${notesStart+data.notes.length}`).format.font={name:'Arial',size:10,color:palette.ink};
shSources.getRange(`A${notesStart+1}:E${notesStart+data.notes.length}`).format.rowHeight=27;
data.notes.forEach((note,i)=>shSources.getRange(`A${notesStart+1+i}`).values=[[`${i+1}. ${note}`]]);

await finish([
  ['选题计划','A1:G10','articles'],
  ['选题计划','H6:R9','article-details'],
  ['关键词库','A1:G11','keywords'],
  ['关键词库','H6:L11','keywords-details'],
  ['旧文补词','A1:G10','updates'],
  ['说明与来源',`A1:E${sources.length+6}`,'sources'],
  ['说明与来源',`A${notesStart}:E${notesStart+data.notes.length}`,'notes'],
],{articles:articles.length,keywords:keywords.length,updates:updates.length,sources:sources.length,priorities:articles.reduce((a,x)=>(a[x.priority]=(a[x.priority]??0)+1,a),{})});
