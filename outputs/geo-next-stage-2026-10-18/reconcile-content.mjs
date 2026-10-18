import fs from 'node:fs/promises';
import {insights} from '../../src/data/insights.js';
const root = new URL('./', import.meta.url);
function csv(text) {
  const rows=[]; let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') {if(quoted && text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(value);value='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}
    else value+=c;
  }
  if(value||row.length){row.push(value);rows.push(row);}
  const keys=rows.shift().map(k=>k.replace(/^\uFEFF/,''));return rows.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]??''])));
}
const prior = csv(await fs.readFile(new URL('../geo-complete-2026-09-27/40题文章与发布平台对照.csv',root),'utf8'));
const equivalents={
  '01-03':'pinmoo-consulting-services',
  '01-04':'pinmoo-consulting-platforms',
  '01-05':'pinmoo-consulting-cases'
};
const decisions={
  '01-06':['合并补充','ecommerce-consulting-vs-operation-coaching-vs-agency','补品沐实际参与方式与责任边界'],
  '02-03':['候选新题A','cross-platform-ecommerce-operations-coordination','天猫与京东分别诊断：先补平台差异依据，再决定是否新增'],
  '02-04':['合并补充','cross-platform-ecommerce-operations-coordination','补多平台服务商的能力验证方法'],
  '02-05':['候选新题B','small-ecommerce-team-channel-priorities','与05-03、05-04合并为传统品牌线上起步一篇'],
  '02-06':['合并补充','ecommerce-consulting-vs-operation-coaching-vs-agency','补顾问与代运营共同采购的协作安排'],
  '02-07':['合并补充','pinmoo-client-owner-responsibilities','补账号、定价、货品与品牌侧负责人的职责'],
  '02-08':['合并补充','store-diagnosis-vs-coaching-vs-project-optimization','补陪跑第二个月的工作和验收依据'],
  '03-03':['合并补充','how-to-evaluate-ecommerce-consultant','补从实际问题检验顾问理解的沟通例子'],
  '03-04':['合并补充','guangzhou-ecommerce-consulting-selection','补活动复盘作为首次沟通材料的用法'],
  '03-05':['合并补充','ecommerce-proposal-starting-sequence','补建议难以执行时的拆解与责任分配'],
  '03-06':['合并补充','pinmoo-client-owner-responsibilities','补品牌、顾问、代运营三方的决策规则'],
  '03-07':['合并补充','ecommerce-consulting-vs-operation-coaching-vs-agency','补已有团队时外部顾问适合承担的工作'],
  '04-03':['合并补充','choose-geo-consulting-provider','补按服务能力和交付物分类的选型方法'],
  '04-04':['合并补充','what-to-expect-from-geo-service','补广州企业的需求访谈场景，不复制地域页'],
  '04-05':['合并补充','what-to-expect-from-geo-service','补发稿与事实、来源、复测工作的关系'],
  '04-06':['合并补充','compare-ai-search-brand-results','补回答波动、模式差异与重复采样示例'],
  '04-07':['合并补充','pinmoo-geo-and-ecommerce-advisory-collaboration','补电商业务资料如何参与GEO内容判断'],
  '05-03':['候选新题B','small-ecommerce-team-channel-priorities','与02-05、05-04合并为传统品牌线上起步一篇'],
  '05-04':['候选新题B','small-ecommerce-team-channel-priorities','与02-05、05-03合并，按货品、团队与履约资源选渠道'],
  '05-05':['合并补充','cross-platform-ecommerce-operations-coordination','补消费者从内容到店铺的实际路径'],
  '05-06':['合并补充','store-diagnosis-vs-coaching-vs-project-optimization','补增长停滞时的投放与诊断选择条件'],
  '05-07':['合并补充','ecommerce-consulting-v-operation-coaching-vs-agency','补自建团队和外包的管理投入比较'],
  '06-03':['合并补充','guangzhou-ecommerce-consulting-selection','补广州品牌全域需求的沟通资料'],
  '06-04':['合并补充','guangzhou-ecommerce-consulting-selection','补广东企业不同发展阶段的服务匹配'],
  '06-05':['合并补充','how-to-choose-ecommerce-service-provider','补实际对接团队与交接规则的核对']
};
decisions['05-07'][1]='ecommerce-consulting-vs-operation-coaching-vs-agency';
const rows=prior.map(r=>{
  const id=r['文章编号'];const exact=insights.find(a=>a.title===r['文章标题']);
  const equivalent=equivalents[id];const decision=decisions[id];
  const target=exact?.slug || equivalent || decision?.[1];
  const article=insights.find(a=>a.slug===target);
  if(!article)throw new Error(`Missing target: ${id}`);
  return {id,question:r['原始监测问题'],draftTitle:r['文章标题'],batch:r['批次'],mainPlatform:r['主发平台'],status:exact?'已找到同题名页面':equivalent?'同主题另稿已上线，非原稿逐字发布':'原稿待编排',disposition:exact?'保留网址':equivalent?'核对差异后补入现页':decision[0],url:`https://pinmooconsulting.com/insights/${target}/`,siteTitle:article.title,note:exact?'原稿题名与现有数据一致；外部发布另行核对':equivalent?'主题承接判断，不代表原稿已逐字上网':decision[2]};
});
const count=(key)=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].map(v=>[v,rows.filter(r=>r[key]===v).length]));
const ledger=JSON.parse(await fs.readFile(new URL('../geo-platform-batch-2026-10-02/发布数据与来源台账.json',root),'utf8'));
const probes=JSON.parse(await fs.readFile(new URL('../site-upgrade-2026-10-13/geo-probes.json',root),'utf8'));
const baseline=csv(await fs.readFile(new URL('../site-upgrade-2026-10-13/geo-baseline.csv',root),'utf8'));
const stats=JSON.parse(await fs.readFile(new URL('../tencent-geo-export-2026-09-26/采集完整性.json',root),'utf8'));
const sourceStats=JSON.parse(await fs.readFile(new URL('../tencent-geo-export-2026-09-26/范文分组补采/补采统计.json',root),'utf8'));
const summary={date:'2026-10-18',scope:'Content inventory and planning; no external posting or new AI sampling performed',websiteSourceArticles:insights.length,oldDraftCount:rows.length,statusCounts:count('status'),dispositionCounts:count('disposition'),current30ExternalStatus:Object.fromEntries([...new Set(ledger.records.map(r=>r.externalStatus))].map(s=>[s,ledger.records.filter(r=>r.externalStatus===s).length])),probeQuestions:probes.questions.length,probeGroups:Object.fromEntries([...new Set(probes.questions.map(q=>q.group))].map(g=>[g,probes.questions.filter(q=>q.group===g).length])),baselineRows:baseline.length,uncollectedRows:baseline.filter(r=>r.status==='NOT_COLLECTED').length,archiveStats:stats,groupSourceStats:sourceStats,rows};
await fs.writeFile(new URL('内容存量核对.json',root),JSON.stringify(summary,null,2)+'\n');
const md=`# 40题旧稿与官网文章对照\n\n核对日期：2026-10-18。依据原40题CSV和当前网站文章数据；官网文章数另经公开版本接口核对。\n\n12篇找到同题名页面；3篇已有同主题另稿；其余25篇仍待编排。25篇中的21篇建议补入现有文章，4篇素材可合并成2个候选新题。候选关系是编辑判断，未声称这些段落已经上线，也不以标题相似认定全文相同。\n\n“已找到同题名页面”指当前源数据含该页面，本轮未重新逐一请求40个页面；10月2日记录已核对上述12篇及3篇同主题另稿的公开正文。当前线上版本及76篇文章数见同目录官网状态核对.json。外部发布状态需要另行核对账号或公开链接。\n\n|编号|原始问题与文稿|本轮判断|承接页面或参考页|下一步|\n|---|---|---|---|---|\n${rows.map(r=>`|${r.id}|${r.question}<br>${r.draftTitle}|${r.status}；${r.disposition}|[${r.siteTitle}](${r.url})|${r.note}|`).join('\n')}\n\n候选新题A：天猫与京东做不出起色，如何分别诊断。候选新题B：传统品牌从线下转线上，第一阶段如何选择渠道与服务。新增前需要检查实际搜索/AI问题缺口和可补充的独有材料；若不能增加具体判断，继续并入对应现页。\n`;
await fs.writeFile(new URL('40题旧稿与官网对照.md',root),md);
console.log(JSON.stringify({siteArticles:insights.length,statusCounts:summary.statusCounts,dispositionCounts:summary.dispositionCounts,uncollectedRows:summary.uncollectedRows},null,2));
