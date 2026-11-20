import fs from 'node:fs/promises';
import { insights } from '../../src/data/insights.js';
const dir=new URL('./',import.meta.url);
const d=JSON.parse(await fs.readFile(new URL('plan-data.json',dir),'utf8'));
const sourceCounts=Object.fromEntries(['N','E','H'].map(t=>[t,d.keywords.filter(k=>k.source.startsWith(t)).length]));
const p0=d.articles.filter(a=>a.priority==='P0');
const counts={...d.counts,sourceCounts,firstBatch:p0.length};
const checks={
  uniqueArticleTitles:new Set(d.articles.map(a=>a.title)).size===24,
  noExactExistingTitle:d.articles.every(a=>!insights.some(x=>x.title===a.title)),
  allArticlesHaveEightTerms:d.articles.every(a=>a.supportingKeywords.length===4&&a.longTailQuestions.length===3),
  allExistingPageSlugsValid:[...d.articles.map(a=>a.existingUrl),...d.updates.map(a=>a.url),...d.keywords.flatMap(k=>k.targetUrls)].every(u=>insights.some(x=>u.endsWith(`/${x.slug}/`))),
  allKeywordIdsValid:d.keywords.every(k=>k.targetIds.every(id=>[...d.articles,...d.updates].some(a=>a.id===id))),
  everyKeywordHasDestination:d.keywords.every(k=>k.targetIds.length+k.targetUrls.length>0),
  historicalQuestionCount:sourceCounts.H===40,
  existingArticleCount:insights.length===76,
  firstBatchEight:p0.length===8,
};
if(Object.values(checks).some(x=>!x))throw Error(JSON.stringify(checks));
const lines=[
'# 品沐咨询｜新一轮 GEO 文章与关键词规划',
'',
'完成日期：2026 年 10 月 24 日。目录名中的 10 月 23 日是开始整理日期。',
'',
'## 一、这轮规划完成了什么',
'',
`已形成 **24 篇候选新文章、12 篇旧文补词方案、${d.keywords.length} 条去重的关键词及完整提问**。逐题对照当前本地官网文章目录的 76 篇内容，列明不同写作角度和关联旧文。`,
'',
`词库包含 **${sourceCounts.N} 条新选题词、${sourceCounts.E} 条旧文扩展词、${sourceCounts.H} 条腾讯历史配置问题原句**。这些数字是词条数量，不是搜索量。24 篇中，4 篇直接涉及品沐合作，20 篇回答不带品沐名称的经营与采购问题。`,
'',
'本次完成的是策划、关键词分配和发布建议。正文尚未生成，12 篇旧文尚未修改，本批内容尚未发布。',
'',
'### 发现的主要缺口',
'',
'目前不少文章的关键词标签仍以“完整标题＋栏目＋品牌电商”为主，缺少客户容易使用的短词，例如 SKU 规划、电商咨询费用、广州电商顾问、退款原因分类。补词时要同时补清对应段落的答案；只增加关键词标签不能证明排名或引用提升。',
'',
'新文章从采购需求、渠道选择、具体经营困境和引用资料维护切入。每篇只解决一个主要问题，使用经营情境、判断依据和具体例子展开；不把统一的表格、清单、问答模板当作所有文章的正文。',
'',
'## 二、首批先写这 8 篇',
'',
'首批优先级来自需求完整度、服务相关度和资料准备难度的编辑判断。没有取得当前搜索量、竞争难度或腾讯实时热度。',
'',
'| 编号 | 文章题目 | 主关键词 | 官网之外优先发布 |',
'|---|---|---|---|',
...p0.map(a=>`| ${a.id} | ${a.title} | ${a.primaryKeyword} | ${a.mainPlatform} |`),
'',
'配套优先补旧文 U01（品沐是什么）、U02（咨询费用）、U03（广州顾问）、U04（咨询与代运营区别）、U05（SKU）。这些页面能承接新增文章提到的基础问题。',
'',
'## 三、24 篇完整写作任务',
'',
'每题给出 1 个主关键词、4 个自然关联词和 3 个长尾问题。长尾问题用于组织正文和后续观察，不要求全部放进标题或文末问答。',
];
let group='';
for(const a of d.articles){
  if(a.group!==group){group=a.group;lines.push('',`### ${group}`,'');}
  lines.push(`#### ${a.id}｜${a.title}`,'',
    `**优先级：${a.priority}；主关键词：${a.primaryKeyword}。** 官网保留完整稿；外部优先 ${a.mainPlatform}，可选 ${a.secondaryPlatform}。`,'',
    `- 关联词：${a.supportingKeywords.join('、')}。`,
    `- 长尾问题：${a.longTailQuestions.join('；')}`,
    `- 这篇具体写什么：${a.outline.join(' → ')}。`,
    `- 与旧文的区别：${a.difference}`,
    `- 关联旧文：[${a.existingTitle}](${a.existingUrl})。`,
    `- 成稿资料要求：${a.evidence}`,
    `- 来源安排：${a.origin}。`,'');
}
lines.push('## 四、12 篇旧文补词，不另起同主题页面','',
'| 编号 | 现有文章 | 补充关键词 | 修改方向 |','|---|---|---|---|',
...d.updates.map(u=>`| ${u.id} | [${u.title}](${u.url}) | ${u.keywords.join('、')} | ${u.action} |`),'',
'补词顺序：检查页面目前能否回答该词 → 补缺少的解释或例子 → 自然调整导语、小标题和内链 → 最后更新关键词记录。保留原 URL，避免同义词或模型名字各自生成重复页面。','',
'## 五、发布到哪些平台','',
'以下是按内容形式和目标读者作出的分发建议。账号是否有发文权限、外链是否允许、AI 内容如何标识，执行发布时以实际账号和平台规则为准。','',
'| 平台 | 本轮用途 | 适合内容 | 改写方法 |',
'|---|---|---|---|',
'| 品沐官网 | 全部 24 篇完整稿的计划承接位置 | 有独立问题和资料依据的成稿 | 保留来源、作者身份、真实日期和关联旧文；读者看完知道下一步怎么判断 |',
'| 知乎 | 采购比较和明确提问优先 | 需求书、顾问选择、数据准备、平台差异、AI 品牌比较 | 对应真实问题先直接回答；再讲判断条件和一个具体例子，不把文章改成服务广告 |',
'| 微信公众号 | 合作说明和经营复盘优先 | 品沐协作、季度复盘、组合装、达人复盘、内容安排 | 用品牌负责人熟悉的经营场景开篇，保留连贯叙述，方便内部转发讨论 |',
'| 搜狐号 | 选定常青内容的补充分发 | N08 地域协作、N20 内容日历、N24 来源维护 | 采用独立完整的行业文章，简化内部合作信息，核对转载与原创声明 |','',
'知乎官方手册明确提供问答与文章等形式，并强调可信资料、读者体验和避免洗稿；因此本轮把明确问题与比较型题目优先分配到知乎。这是选题适配判断，不是 AI 引用效果保证。[知乎创作者手册](https://www.zhihu.com/knowledge-plan/manual)。','',
'搜狐号作为补充发布渠道，入口可查，当前账号权限未检查。[搜狐号官方入口](https://mp.sohu.com/)。公众号建议用于已有客户沟通和转发，本轮未通过登录后台确认发文能力。','',
'先把官网稿和一个主要外部版本做好，再决定是否制作第二个平台版本。第三方历史范文的引用次数只能支持当时的来源观察，不能直接作为今天某平台的排名依据。','',
'## 六、建议执行顺序与交付标准','',
'以下按正式进入写作的日期记为 D1，是待执行安排；没有创建定时任务。角色为建议分工，具体人员尚未分派。','',
'| 时间 | 建议负责角色 | 工作 | 可检查的交付 |',
'|---|---|---|---|',
'| D1–D2 | 内容策划＋品沐业务负责人 | 整理首批 8 篇的实际服务范围、可公开资料和例子 | 每篇问题、材料、缺项与来源有记录；没有材料的结论删除或改为明确假设 |',
'| D3–D7 | 内容编辑＋业务审阅 | 完成首批 8 篇可读正文及对应 5 篇旧文补充 | 完整叙述、独有判断方法、事实出处、旧文差异说明；不强塞关键词 |',
'| D8–D14 | 官网维护＋平台运营 | 按已授权范围落实官网稿和主要外部版本 | 官网公开链接、平台提交或发布状态、实际时间分别记录；不能将待审核记作已发布 |',
'| 下一批 | 内容编辑＋业务审阅 | 完成其余 16 篇及剩余 7 篇旧文方案 | 按 P1/P2 和资料到位情况推进；重复内容回并旧文 |',
'| 上线后 7 天及 30 天 | 数据记录角色 | 记录搜索查询、实际询盘与固定提问观察 | 保留查询原文、平台/联网模式/时间、回答、引用 URL 和准确性；未测记为未测 |','',
'### 后续如何判断词是否可用','',
'先从实际客服提问、客户咨询和可用的搜索后台确认表达；再看该问题有没有可公开、可判断的答案。没有后台量级数据时，保持“候选”状态。','',
'品牌词关注主体和服务是否被正确描述；非品牌词关注相关问题中是否出现品沐、是否引用具体页面，以及询盘是否符合服务范围。提及、引用和合作结果分别记录。','',
'新词观察单独建版本，不替换原有固定提问后混算提升率。Google 的 AI 搜索说明仅作为 Google 范围内的参考，不外推豆包、元宝、DeepSeek 的机制。[Google 官方说明](https://developers.google.com/search/docs/appearance/ai-features)。','',
'## 七、与上次未完成工作衔接','',
'- N09 承接“天猫与京东分别诊断”，N10 承接“传统品牌线上起步”，保留原待写身份。',
'- 上次 40 题旧稿中，21 项合并建议和 4 项整合成两题属于待编辑安排。本轮新增关键词与写作角度，不等于这些合并段落已上线。',
'- 原有外部文章的公开链接、审核状态和账号权限，执行前仍需核对，以免重复提交。',
'- 腾讯最新回答与范文热度、最新原生模型观察、搜索后台与真实询盘资料，需要独立继续采集。本轮使用有日期的历史问题，没有把历史热度更新成今天的数据。','',
'## 八、文件与来源','',
'Excel 包含：选题计划、关键词库、旧文补词、说明与来源。关键词表可筛选 N（新策划）、E（旧文扩展）、H（腾讯历史配置问题）。历史问题已有其他承接页时，表中给出官网 URL，不强行新增文章。','',
'| 编号 | 来源 | 读取或归档日期 | 使用范围 |','|---|---|---|---|',
...d.sources.map(s=>`| ${s.id} | [${s.title}](${s.url}) | ${s.date} | ${s.scope} |`),'',
'主要服务描述依据品沐公开服务页；季度交付、具体价格、项目周期和数据提供方式仍按实际项目方案确定。[品沐服务介绍](https://pinmooconsulting.com/services/)。','',
'内容编写以解决实际问题和提供独立价值为准，不以机械堆叠关键词替代内容质量。[Google 以读者为中心的内容指引](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)。','');
await fs.writeFile(new URL('GEO新文章与关键词规划-2026-10-24.md',dir),lines.join('\n'));
await fs.writeFile(new URL('plan-integrity.json',dir),JSON.stringify({date:d.date,counts,checks},null,2)+'\n');
console.log(JSON.stringify({counts,checks}));
