import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {copy} from './article-copy.mjs';
import {oldCopy} from './old-copy.mjs';
const root=new URL('../../',import.meta.url), dir=new URL('./',import.meta.url);
const plan=JSON.parse(await fs.readFile(new URL('../geo-keyword-plan-2026-10-23/plan-data.json',dir),'utf8'));
const origin='https://pinmooconsulting.com';
const services={title:'品沐咨询公开服务范围与合作方式',url:origin+'/services/'};
const metrics={title:'品沐咨询电商经营指标口径词典',url:origin+'/resources/ecommerce-metrics-dictionary/'};
const sources={
  S1:{...services,readAt:'2026-10-24',supports:'公开服务范围与品牌侧执行分工，不支持具体项目承诺'},
  S2:{...metrics,readAt:'2026-10-24',supports:'经营指标说明，具体口径仍以实际报表定义为准'},
  S3:{title:'Microsoft 支持 文档检查与隐藏信息',url:'https://support.microsoft.com/en-us/office/collab-files/remove-hidden-data-and-personal-information-by-inspecting-documents-presentations-or-workbooks',readAt:'2026-10-24',supports:'工作簿中可能存在隐藏信息；不提供对品沐系统的安全认证'},
  S4:{title:'Google Search Central 以读者为中心的实用内容',url:'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',readAt:'2026-10-24',supports:'Google内容质量理念，不支持国内模型算法和引用效果'},
  S5:{title:'知乎官方创作者手册',url:'https://www.zhihu.com/knowledge-plan/manual',readAt:'2026-10-24',supports:'平台内容形式与读者体验；账号权限和发布状态另行记录'}
};
const platformHeaders={
N01:['先看目标差距来自什么商品和渠道','一项增长安排会占用多少资源','季度预算需要哪些调整条件','复盘结束要留下可继续讨论的决定'],
N03:['按经营问题列出必要资料','脱敏以后哪些关系还要保留','缺少字段会限制哪些判断','发送副本时检查隐藏信息与接收范围'],
N05:['把想增长说成一个具体问题','三家方案先统一讨论范围','请每家标出包含与不包含','询价需求可以从这段话开始填写'],
N07:['交付收到和动作上线分别记录','GMV以外还要解释哪些经营变化','各方责任与外部影响要有记录','结项以后下一步怎样安排'],
N09:['两家店的同款是否具有相同购买条件','后台同名指标先核对定义','沿每家店的实际购买路径找差异','形成两组可以分别验证的动作'],
N10:['先盘点能带到线上的顾客与产品信息','第一批商品承担什么验证任务','按团队能力比较平台方案','试点结束需要留下哪些判断依据'],
N13:['按每单收入和已知支出比较','赠品与折扣还会改变哪些成本','把退款放回原来的组合订单','继续推广前明确组合装的任务'],
N19:['把原话与场景一起保留下来','关键词前面先有一个真实问题','同一个意图优先补到原页面','用新的搜索与咨询记录继续检查']
};
const newArticles=copy.map(c=>{
  const p=plan.articles.find(x=>x.id===c.id);if(!p)throw Error(c.id);
  const sections=c.sections.map((s,i)=>({id:'section-'+(i+1),...s}));
  const words=JSON.stringify(c).length;
  const article={slug:c.slug,category:c.category,title:p.title,shortTitle:p.title,
    summary:c.summary,metaTitle:p.title+'｜品沐咨询',metaDescription:c.summary,
    published:'2026-10-24',updated:'2026-10-24',readTime:`约 ${Math.ceil([c.directAnswer,...c.lead,...sections.flatMap(s=>s.paragraphs)].join('').length/400)} 分钟`,
    contentModel:'CEBA',reviewStatus:'source-reviewed-ai-assisted',storyFormat:true,
    authorName:'品沐咨询',authorType:'Organization',authorRole:'品牌电商增长咨询',
    disclosure:'本文由品沐咨询整理，AI参与结构组织和文字撰写；经营情境及标注的假设数字用于说明方法，不是客户项目实录，具体合作以项目方案为准。',
    businessIntent:p.primaryKeyword,probeIds:['Q-'+c.slug],keywords:[p.primaryKeyword,...p.supportingKeywords,...p.longTailQuestions],
    directAnswer:c.directAnswer,keyPoints:sections.map(s=>s.title),
    evidence:{basis:'服务事实依据公开官网；经营方法为原创分析。假设情境、填空示例和数字演算不代表客户经营结果。',scope:'面向消费品牌负责人、电商团队和服务采购者；需要结合实际产品、资料和团队条件判断。',limits:'不保证销售增长、搜索排名或AI引用；具体平台字段与规则以发布时实际官方说明为准。'},
    sources:[services,metrics,...(c.id==='N03'?[{title:sources.S3.title,url:sources.S3.url}]:[]),...(c.id==='N19'?[{title:sources.S4.title,url:sources.S4.url}]:[])],
    lead:[c.directAnswer,...c.lead],sections,conclusion:sections.at(-1).paragraphs.at(-1),faqs:[],
    relatedServices:c.id==='N13'?['page-conversion-optimization','ecommerce-diagnosis']:['ecommerce-diagnosis','brand-growth-consultant']
  };
  return {id:c.id,group:p.group,article,mainPlatform:p.mainPlatform,secondaryPlatform:p.secondaryPlatform,
    platformTitle:c.platformTitle,platformOpening:c.platformOpening,
    platformHeaders:platformHeaders[c.id],officialUrl:origin+'/insights/'+c.slug+'/',
    officialStatus:'本地成稿，待构建与生产发布',externalStatus:'成稿待发布，未向平台提交',
    keywordIds:plan.keywords.filter(k=>k.targetIds.includes(c.id)).map(k=>k.id),
    oldRelated:p.existingUrl,wordCount:[...article.lead,...sections.flatMap(s=>s.paragraphs)].join('').length};
});
const updates=plan.updates.filter(u=>Object.keys(oldCopy).some(slug=>u.url.endsWith('/'+slug+'/'))).map(u=>({
  ...u,slug:u.url.split('/').filter(Boolean).at(-1),sections:oldCopy[u.url.split('/').filter(Boolean).at(-1)],status:'本地已补充正文与关键词，待生产发布'
}));
const siteModule='// First keyword-plan batch, 2026-10-24. Original copy and explicit hypothetical examples.\n'+
  'export const keywordBatchInsights = '+JSON.stringify(newArticles.map(r=>r.article),null,2)+';\n\n'+
  'const keywordUpdates = '+JSON.stringify(Object.fromEntries(updates.map(u=>[u.slug,{keywords:u.keywords,sections:u.sections}])),null,2)+';\n\n'+
  `export function applyKeywordUpdates(article) {\n  const change = keywordUpdates[article.slug];\n  if (!change) return article;\n  const sources = [...(article.sources || []), ${JSON.stringify(services)}, ${JSON.stringify(metrics)}].filter((source, i, all) => all.findIndex(s => s.url === source.url) === i);\n  return { ...article, sources, keywords: [...new Set([...(article.keywords || []), ...change.keywords])], sections: [...article.sections, ...change.sections], updated: '2026-10-24', authorName: '品沐咨询', authorType: 'Organization', authorRole: '品牌电商增长咨询', reviewStatus: 'source-reviewed-ai-assisted', disclosure: '本文由品沐咨询整理，AI参与资料组织和文字撰写；经营情境用于说明方法，具体服务范围与费用以项目方案为准。' };\n}\n`;
await fs.writeFile(new URL('src/data/insights-keyword-batch.js',root),siteModule);
for(const folder of ['官网完整稿','平台发布稿','平台Word','配套工具','复核记录'])await fs.mkdir(new URL(folder+'/',dir),{recursive:true});
function asMarkdown(r,platform=false){
  const a=r.article;
  const lead=platform?[r.platformOpening,...a.lead.slice(1)]:a.lead;
  const sectionCopy=a.sections.map((s,i)=>({...s,title:platform?r.platformHeaders[i]:s.title}));
  return ['# '+(platform?r.platformTitle:a.title),'',...lead.flatMap(p=>[p,'']),
    ...sectionCopy.flatMap(s=>['## '+s.title,'',...s.paragraphs.flatMap(p=>[p,''])]),
    ...(platform?[]:['## 继续阅读','',`[${plan.articles.find(p=>p.id===r.id).existingTitle}](${r.oldRelated})`,'']),
    '作者：品沐咨询','发布日期：2026-10-24','',a.disclosure,'','资料来源：','',
    ...a.sources.map(s=>`- [${s.title}](${s.url})`),''].join('\n');
}
const combined=[];
for(const r of newArticles){
  const filename=r.id+'-'+r.article.slug+'.md';
  const master=asMarkdown(r),platform=asMarkdown(r,true);
  await fs.writeFile(new URL('官网完整稿/'+filename,dir),master);
  await fs.writeFile(new URL('平台发布稿/'+filename,dir),platform);
  r.masterFile='官网完整稿/'+filename;r.platformFile='平台发布稿/'+filename;
  r.masterSha256=createHash('sha256').update(master).digest('hex');r.platformSha256=createHash('sha256').update(platform).digest('hex');
  combined.push(platform);
}
await fs.writeFile(new URL('首批8篇平台文章合订本.md',dir),combined.join('\n\n---\n\n'));
const csv=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const headers=['编号','文章题目','主发平台','平台版标题','可选次发','官网URL','官网状态','外部平台状态','关键词','平台稿路径'];
const rows=newArticles.map(r=>[r.id,r.article.title,r.mainPlatform,r.platformTitle,r.secondaryPlatform,r.officialUrl,r.officialStatus,r.externalStatus,r.article.keywords.join('；'),r.platformFile]);
await fs.writeFile(new URL('逐篇发布清单.csv',dir),'\uFEFF'+[headers,...rows].map(row=>row.map(csv).join(',')).join('\r\n')+'\r\n');
const toolRows={
 'N05-电商咨询询价需求书.csv':[['项目','品牌填写','服务商回复','备注'],...['品牌与主要平台','本次经营问题','店铺与商品范围','统计周期与资料','需要的判断和交付','品牌配合负责人','设计制作范围','账户操作范围','会议与复盘安排','不包含项','变更处理方式','报价与付款条件','验收方式'].map(t=>[t,'','',''])],
 'N19-客户原话到关键词.csv':[['记录日期','资料来源','购买阶段','去标识原话','商品场景','主要顾虑','可回答问题','候选关键词','实际资料依据','已有承接URL或新题','后续观察'],['','','','','','','','','','','']],
 'N13-组合装贡献核对.csv':[['项目','单品订单实际值','组合订单实际值','口径与归属说明'],...['实际收入','优惠及承担方式','商品成本','赠品成本','平台相关费用','包装物流','可对应获客费用','退款对应的原订单','其他支出与分摊','资料缺项','已列项目后的贡献 不是完整利润'].map(t=>[t,'','',''])]
};
for(const [name,rows] of Object.entries(toolRows))await fs.writeFile(new URL('配套工具/'+name,dir),'\uFEFF'+rows.map(row=>row.map(csv).join(',')).join('\r\n')+'\r\n');
const ledger={date:'2026-10-24',planFile:'../geo-keyword-plan-2026-10-23/plan-data.json',scope:'第一批8篇及5篇旧文，其他16篇和7篇旧文仍待下一批',baseline:{articleCount:76,version:'419102dd02',sourceCommit:'962cb09'},records:newArticles,updates,sources:Object.values(sources),publication:{website:'待发布',external:'未提交',independentReview:'未经过人工审阅；本轮为同一助手第二遍事实与表达复核'}};
await fs.writeFile(new URL('执行与发布台账.json',dir),JSON.stringify(ledger,null,2)+'\n');
console.log(JSON.stringify({articles:newArticles.map(r=>({id:r.id,characters:r.wordCount,platform:r.mainPlatform})),updates:updates.map(u=>u.id)}));

