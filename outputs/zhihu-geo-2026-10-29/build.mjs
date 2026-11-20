import { insights } from '../../src/data/insights.js';
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const selected = [
 ['why-company-missing-from-ai-service-search','问AI自己的公司有答案，问服务商却没有：问题出在哪里？','老板输入公司名字，AI能说出业务；换成“有哪些电商顾问公司”，答案里却没有自己。这两次提问不是同一道题：前者是在确认一个已知名称，后者是在帮助客户从需求出发选择服务。'],
 ['what-to-expect-from-geo-service','做GEO收到一张AI推荐截图，品牌该怎样验收？','一张截图可以说明某次回答发生过，不能单独回答项目做了哪些工作。采购前先问清问题如何选择、品牌事实由谁确认、页面怎么修改，以及报告能否追溯原始回答。'],
 ['ai-cited-provider-ranking-source-literacy','AI推荐的服务商榜单，值得直接照着选吗？','看到AI引用榜单时，先打开原文，看发布者、排序依据和商业关系。榜单可以提供候选线索，真正比较服务商仍要回到项目范围、执行分工和交付内容。'],
 ['ai-search-inquiry-fit-service-boundaries','AI带来了询盘，客户却找错服务：内容应该怎么改？','询盘增加之后，另一个问题可能出现：客户想买的服务，恰好不是企业提供的。先区分官网、外部文章、AI回答和客户理解各自说了什么，再决定需要修改哪一处。'],
 ['geo-seo-paid-media-coordination','GEO、SEO和广告都要做吗？品牌先看这三件事','页面不能访问、产品信息说不清、客户需求还没验证，分别需要不同动作。SEO、GEO和广告可以配合，但预算不该只因为新概念出现就从原有渠道全部转走。'],
 ['is-your-brand-ready-for-geo','哪些品牌现在适合做GEO？先看团队能否接住询盘','开始之前先看三个条件：品牌资料是否稳定、客户是否有需要解释的问题、团队能否维护页面并回复咨询。产品和服务仍在频繁变化时，先整理基础信息通常更有价值。'],
 ['choose-geo-consulting-provider','选择GEO服务商，除了看AI推荐截图还能问什么？','比较服务商时，可以请对方拿出可追溯的问题样本、资料整理方式和交付清单。单次回答只是一个观察点，项目验收还应说明责任、原始记录和后续维护。'],
 ['geo-pricing-scope-and-budget','GEO报价为什么差别很大？先对齐这几项工作','同样叫GEO服务，一份报价可能包含网站修改、事实整理和复测，另一份只包含文章。比较总价之前，先看覆盖几个品牌、哪些页面、多久复看，以及谁负责执行。'],
 ['geo-30-60-90-day-acceptance','GEO做了一个月、两个月、三个月，分别该验收什么？','30、60、90天可以作为检查工作进度的节点，不能作为AI一定推荐品牌的期限。先看基线和资料，再看页面与内容，最后用固定问题比较真实回答与询盘记录。'],
 ['compare-ai-search-brand-results','豆包、DeepSeek和元宝怎样比较品牌表现才公平？','不同平台的联网方式、账号状态和回答形式都可能不同。先固定问题与取样方式，分别记录正文提及、品牌事实和实际来源，再讨论每个平台发生了什么。'],
 ['new-product-launch-geo-checklist','新品还没上市，品牌要提前准备哪些公开资料？','新品内容的起点是事实稳定：名称、规格、适用条件、上市状态和售后信息谁来确认。发布前准备好这些资料，比先把新品描述扩写成大量文章更实用。'],
 ['brand-fact-base-for-ai-search','AI总把品牌介绍错？先整理一份能维护的品牌事实表','公司全称、简称、品牌关系、服务范围和联系方式，如果在不同渠道各说各话，读者很难判断哪份资料可信。先做一份有来源、有负责人的事实表，再逐步更新公开页面。'],
 ['geo-content-evidence-checklist','想让AI引用品牌文章，先让读者看得懂并查得到依据','一篇内容能否帮助人理解问题，取决于它是否提供具体判断、来源和适用边界。标题里有GEO或重复品牌名称，都不能代替这些内容，也不能保证被模型引用。'],
 ['geo-evidence-ledger-publication-rules','品牌案例不能公开客户名称，还能怎样整理内容依据？','公开文章需要区分可以展示的事实、需要授权的材料和尚未验证的结果。先建立出处、口径、公开范围与负责人，再决定哪些内容可以写进文章。'],
 ['geo-roi-attribution-for-ecommerce-brands','GEO带来了咨询，品牌怎样判断这笔投入有没有价值？','先把内容上线、AI引用、网站访问、真实询盘和成交分别记录。客户可能多次接触品牌才来咨询；来源不明的线索，不能因为时间接近就全部归给GEO。'],
 ['website-article-topic-consolidation','官网文章越来越多，哪些该合并，哪些值得继续写？','两篇文章标题不同，仍可能回答同一个问题。先看读者任务、实际新增内容和现有访问路径，再决定保留、补充或合并，并为旧链接安排明确去向。'],
 ['external-article-to-official-site-next-step','知乎文章被读到之后，官网怎样接住感兴趣的客户？','读者从外部内容进入官网时，最需要看到的是文章中提到的服务、资料或案例。每个平台的链接规则不同，先保证内容有独立价值，再安排合适的后续入口。'],
 ['pinmoo-ai-namesake-entity-correction','AI把两家同名公司混在一起，品牌该怎么纠正？','发现名称混淆时，先保存具体回答和来源，再对照公司全称、品牌名称、官网与服务范围。纠正公开资料需要时间，不能把一次回答变化当成所有平台都已修复。'],
 ['brand-business-content-for-ai-search','客户从AI找到公司后，怎样判断这家公司能解决什么？','品牌被提及只是开始。客户还会继续判断：这家公司服务谁、处理什么问题、需要自己的团队做什么。把真实服务边界讲清楚，才能帮助合适的人继续了解。'],
 ['why-brand-is-not-found-in-ai-search','品牌在AI搜索里搜不到，先查页面、主体还是引用？','先把问题拆开：是页面无法访问，还是品牌主体不清，或现有内容没有回答客户的问题？记录真实提问与来源，再检查对应环节，避免只凭一次结果推断原因。']
];
const done='ai-search-outdated-brand-information-update';
const duplicate='product-page-purchase-questions';
fs.mkdirSync(path.join(root,'知乎适配稿'),{recursive:true});
const rows=[];
for (let i=0;i<selected.length;i++) {
 const [slug,title,opening]=selected[i], a=insights.find(x=>x.slug===slug); if(!a) throw Error(slug);
 let blocks=[`# ${title}`,opening];
 // Keep the original reasoning and examples. The new opening and title are adapted to the reader's decision.
 for(const s of a.sections||[]) {if(s.id==='practical-next-step') continue; const p=(s.paragraphs||[]).filter(Boolean); if(p.length) blocks.push(`## ${s.title}`, ...p);}
 blocks.push(`原文：品沐咨询官网《${a.title}》\nhttps://pinmooconsulting.com/insights/${slug}/`, `作者：品沐咨询\n本文由品沐咨询整理，AI参与结构组织与文字撰写；文中示例用于说明方法，不代表客户项目实录。`);
 if(a.sources?.length) blocks.push('资料来源：\n'+[...new Map(a.sources.map(s=>[s.url,s])).values()].map(s=>`- [${s.title}](${s.url})`).join('\n'));
 const txt=blocks.join('\n\n')+'\n';
 const file=`${String(i+1).padStart(2,'0')}-${slug}.md`; fs.writeFileSync(path.join(root,'知乎适配稿',file),txt,'utf8');
 rows.push({id:`Z${String(i+1).padStart(2,'0')}`,slug,title,officialTitle:a.title,officialUrl:`https://pinmooconsulting.com/insights/${slug}/`,file:`知乎适配稿/${file}`,state:'已生成待审核；未预约',characters:txt.length});
}
const geo=insights.filter(a=>a.category==='GEO衡量');
if(geo.length!==22||rows.length!==20||new Set(rows.map(x=>x.slug)).size!==20||!geo.every(x=>selected.some(y=>y[0]===x.slug)||[done,duplicate].includes(x.slug))) throw Error('inventory mismatch');
fs.writeFileSync(path.join(root,'清单.json'),JSON.stringify({date:'2026-10-29',articleTotal:insights.length,geoCategory:geo.length,published:[{slug:done,url:'https://zhuanlan.zhihu.com/p/2096900953148494957'}],similar:[{slug:duplicate,reason:'知乎已有详情页参数与选择文章，需比较增量后决定是否另发',url:'https://zhuanlan.zhihu.com/p/2096899254392447746'}],drafts:rows},null,2),'utf8');
console.log(JSON.stringify({total:insights.length,geo:geo.length,already:1,similar:1,drafts:rows.length,minChars:Math.min(...rows.map(x=>x.characters))}));
