import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {insights} from '../../src/data/insights.js';
const dir=new URL('./',import.meta.url);
const ledger=JSON.parse(await fs.readFile(new URL('执行与发布台账.json',dir),'utf8'));
const receipt=JSON.parse(await fs.readFile(new URL('复核记录/public-verification.json',dir),'utf8'));
const sourceSynced=ledger.sourceSync?.commit==='f11e7430957b92112d80d8780eaaf855d0a118ac';
if(!receipt.passed)throw Error('Public verification must pass before publication status is updated');
for(const r of ledger.records){r.officialStatus='已发布；公网完整正文及文件哈希已核对';r.wordFile='平台Word/'+r.id+'-'+r.article.slug+'.docx';r.wordSha256=createHash('sha256').update(await fs.readFile(new URL(r.wordFile,dir))).digest('hex');}
for(const u of ledger.updates){u.status='已发布；原URL保留，新增2节正文与关键词';u.currentSections=insights.find(a=>a.slug===u.slug).sections.length;}
ledger.publication.website='已发布8篇、更新5篇，官网共84篇；13篇正文及2个索引页面公网核对通过';
ledger.publication.version=receipt.build.version;ledger.publication.checkedAt=receipt.checkedAt;
ledger.publication.github=sourceSynced?'用户明确授权后，3个源文件已提交并推送至GitHub main；阿里云源码快进到同一提交f11e743，工作区干净':'自动审批拒绝GitHub main推送；3个源文件保留本地，服务器源码及GitHub未同步';
ledger.remaining={newArticles:16,oldUpdates:7,externalPosts:8};
await fs.writeFile(new URL('执行与发布台账.json',dir),JSON.stringify(ledger,null,2)+'\n');
const csv=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const headers=['编号','文章题目','主发平台','平台版标题','可选次发','官网URL','官网状态','外部平台状态','关键词','平台稿路径'];
const rows=ledger.records.map(r=>[r.id,r.article.title,r.mainPlatform,r.platformTitle,r.secondaryPlatform,r.officialUrl,r.officialStatus,r.externalStatus,r.article.keywords.join('；'),r.platformFile]);
await fs.writeFile(new URL('逐篇发布清单.csv',dir),'\uFEFF'+[headers,...rows].map(row=>row.map(csv).join(',')).join('\r\n')+'\r\n');
const plan=JSON.parse(await fs.readFile(new URL('../geo-keyword-plan-2026-10-23/plan-data.json',dir),'utf8'));
const tasks=[['编号','任务类型','标题','本轮状态','官网URL'],...plan.articles.map(a=>{const r=ledger.records.find(x=>x.id===a.id);return[a.id,'新增文章',a.title,r?'官网已发布；平台稿待发布':'待下一批写作',r?.officialUrl||''];}),...plan.updates.map(a=>[a.id,'旧文优化',a.title,ledger.updates.some(x=>x.id===a.id)?'官网已更新':'待下一批优化',a.url])];
await fs.writeFile(new URL('全计划执行进度.csv',dir),'\uFEFF'+tasks.map(row=>row.map(csv).join(',')).join('\r\n')+'\r\n');
const updateText=['# 首批五篇旧文优化记录','','日期：2026-10-24。以下内容已随官网版本 7458354c1c 发布，原网址保留。',''];
for(const u of ledger.updates){updateText.push(`## ${u.id} ${u.title}`,'',u.url,'',`新增关键词：${u.keywords.join('、')}`,'',...u.sections.flatMap(s=>['### '+s.title,'',...s.paragraphs.flatMap(p=>[p,''])]));}
await fs.writeFile(new URL('五篇旧文优化记录.md',dir),updateText.join('\n'));
const readme=[
'# 品沐咨询首批 GEO 文章执行交付','',
'日期：2026 年 10 月 24 日。首批 8 篇新文章及 5 篇旧文补充已发布到品沐官网，总文章数由 76 增至 84。','',
'官网版本：7458354c1c。已从公网读取 13 篇完整正文和 2 个索引页面，与本地构建文件哈希一致；页面标题、canonical、Article结构化数据、机构署名、AI参与说明和地图记录均已核对。另以浏览器打开组合装文章检查实际页面。','',
'8 篇平台稿尚未提交到外部平台。主发建议为 5 篇知乎、3 篇微信公众号；发布前按实际账号要求设置原生 AI 声明，检查重复标题、外链和审核状态。','',
'| 编号 | 官网完整文章 | 主发平台 |','|---|---|---|',
...ledger.records.map(r=>`| ${r.id} | [${r.article.title}](${r.officialUrl}) | ${r.mainPlatform} |`),'',
'文件说明：平台Word目录含 8 份可编辑的单篇 Word，每篇两页；平台发布稿含调整过标题、开篇和小标题的 Markdown；官网完整稿保留正文与关联旧文；配套工具含可填写的需求书、组合装贡献核对及客户原话记录表。CSV 发布清单可以用 Excel 打开。','',
'Word 经本机 WPS 转为 PDF，再渲染全部 16 页检查。文档中的情境和组合装数字已标明示例性质，没有使用客户私有数据或虚构经营成果。','',
'本轮新增的 8 篇内容使用品沐咨询机构署名，保留 AI 参与说明。正文围绕具体经营问题展开，经营方法、服务事实和假设情境均保留对应边界。','',
'剩余工作：16 篇新文章、7 篇旧文优化及本批 8 篇外部发布。全计划执行进度.csv 保留每项实际状态；后续搜索及 AI 引用效果需要按观察窗口另行记录，未把上线当作效果提升。','',
sourceSynced?'源码同步已完成：用户明确授权后，仅提交并推送 src/data/insights-keyword-batch.js、src/data/insights.js、src/data/reading-paths.js 这三个源文件。GitHub main 与阿里云官网源码均为 f11e7430957b92112d80d8780eaaf855d0a118ac，服务器工作区干净，官网仍为 84 篇文章版本。此前自动审批拒绝事项已在取得指定仓库与分支授权后解决。':'源码同步：自动审批拒绝向 GitHub 仓库 gzbarry1980-bot/pinmoo 的 main 分支推送，理由是当前授权未明确指定目的地与推送。官网已按既有授权独立发布到阿里云，三处源码修改保留本地。GitHub 与服务器源码尚未同步；下一次从旧源码部署前需先处理，避免覆盖本批文章。','',
'生产版本保留：/var/www/pinmoo-releases/20261024-geo-7458354c1c；上一版 /var/www/pinmoo-releases/20261024-human-419102dd02 未删除。本轮只切换官网静态版本，没有变更 Nginx 主站配置。',''
];
await fs.writeFile(new URL('执行结果与发布说明.md',dir),readme.join('\n'));
await fs.writeFile(new URL('复核记录/最终状态.json',dir),JSON.stringify({date:'2026-10-24',website:{version:'7458354c1c',newArticles:8,updatedArticles:5,totalArticles:84,verifiedPages:15,passed:true},external:{prepared:8,submitted:0,published:0},documents:{docx:8,renderedPages:16,visuallyReviewed:true},remaining:ledger.remaining,github:ledger.publication.github},null,2)+'\n');
console.log(JSON.stringify({version:receipt.build.version,websiteNew:8,websiteUpdated:5,total:84,externalPrepared:8,remaining:ledger.remaining}));
