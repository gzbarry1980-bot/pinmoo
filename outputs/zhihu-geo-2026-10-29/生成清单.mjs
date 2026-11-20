import { insights } from '../../src/data/insights.js';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'清单.json'),'utf8'));
const published={
 'ai-search-outdated-brand-information-update':'https://zhuanlan.zhihu.com/p/2096900953148494957',
 'product-parameters-versus-customer-fit':'https://zhuanlan.zhihu.com/p/2096899254392447746',
 'sku-choice-overload-and-product-differences':'https://zhuanlan.zhihu.com/p/2096900537425966138',
 'pinmoo-diagnosis-data-minimization':'https://zhuanlan.zhihu.com/p/2098919663426090215',
 'ecommerce-consulting-procurement-brief':'https://zhuanlan.zhihu.com/p/2098920047922225794',
 'ecommerce-project-acceptance-beyond-gmv':'https://zhuanlan.zhihu.com/p/2098920372372517256',
 'tmall-jd-same-product-conversion-diagnosis':'https://zhuanlan.zhihu.com/p/2098920642888348595',
 'customer-language-to-article-keywords':'https://zhuanlan.zhihu.com/p/2098920945087943137'
};
const slots=['12:30','15:30','18:30','21:00'];
for(let i=0;i<manifest.drafts.length;i++) {
 const row=manifest.drafts[i]; row.proposedTime=`2026-${i<12?'10':'11'}-${String(i<12?29+Math.floor(i/4):1+Math.floor((i-12)/4)).padStart(2,'0')} ${slots[i%4]}`;
 row.state=i===0?'知乎有草稿；定时提交未确认':'本地改写稿；未提交知乎';
 if(i===0)row.draftUrl='https://zhuanlan.zhihu.com/p/2099077009699821178/edit';
}
const bySlug=new Map(manifest.drafts.map(x=>[x.slug,x]));
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const csv=rows=>rows.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
let inventory=[['官网文章','分类','官网链接','知乎现状','处理建议','知乎链接/稿件']];
for (const a of insights) {
 const draft=bySlug.get(a.slug);
 let state=published[a.slug]?'有发布回执':a.slug==='product-page-purchase-questions'?'与已发文章高度相近，需复核':'未查到对应回执';
 let recommendation=draft?'GEO专题；已调整标题、开头，保留官网论述':a.slug==='ai-search-outdated-brand-information-update'?'已经发布，不重复':a.slug==='product-page-purchase-questions'?'已有相似文章，先比较增量':a.category==='茶叶电商'&&a.title.includes('GEO')?'GEO关联专题，后续评估':'其他经营主题；不计入22篇GEO衡量专题，后续逐篇筛选';
 inventory.push([a.title,a.category,`https://pinmooconsulting.com/insights/${a.slug}/`,state,recommendation,published[a.slug]||draft?.file||'']);
}
fs.writeFileSync(path.join(dir,'官网88篇与知乎对照.csv'),'\ufeff'+csv(inventory),'utf8');
fs.writeFileSync(path.join(dir,'20篇知乎排期.csv'),'\ufeff'+csv([['编号','知乎标题','官网原文','建议时间(北京时间)','实际状态','稿件','知乎草稿或公开链接'],...manifest.drafts.map(x=>[x.id,x.title,x.officialUrl,x.proposedTime,x.state,x.file,x.draftUrl||''])]),'utf8');
fs.writeFileSync(path.join(dir,'清单.json'),JSON.stringify(manifest,null,2),'utf8');
const table=manifest.drafts.map(x=>`| ${x.id} | ${x.proposedTime} | ${x.title} | ${x.state} |`).join('\n');
const md=`# 官网GEO文章知乎改写与排期\n\n编制日期：2026年10月29日，时间为北京时间。\n\n## 盘点范围\n\n官网10月28日公网验收版本 f9a4d54cc9 为88篇文章；本地当前源码也是88篇。本次未重新完成全站公网验收。按官网分类字段“GEO衡量”统计22篇，并不代表其余66篇都与GEO无关：其中茶叶品牌GEO等关联主题仍需后续单独评估。知乎账号登录态当前显示11篇文章，其中8篇与现有官网内容有明确回执；另外3篇为账号原有文章，不应简单计算为官网同步数。\n\n22篇GEO专题中，1篇“AI引用旧资料”已在知乎发布；1篇商品页购买问题与既有详情页文章高度相近，留待比较；余20篇生成知乎适配初稿。每篇独立调整了标题和开头，正文保留官网已发布的核心论述，并删除重复的模板化补充段。原稿、出处、AI参与说明均保留；不把这一轮初稿当成已做完独立人工审校，也不把AI引用效果当成已发生。\n\n## 建议排期\n\n以下为建议时间，按每天4篇安排；并非平台已接受预约，也不是流量最佳时间的保证。正式提交前须核对作者账号、全文、重复主题、事实和知乎AI声明。页面内容重复的稿件可合并或顺延。\n\n| 编号 | 建议时间 | 知乎标题 | 当前状态 |\n|---|---|---|---|\n${table}\n\n知乎编辑器显示定时只能设置未来30分钟至48小时。Z01曾选择10月29日12:30并点击提交，但后台仍显示为普通草稿，未取得预约成功回执；不要据此认为已经定时，也不要在状态未查清时重复提交。草稿入口：https://zhuanlan.zhihu.com/p/2099077009699821178/edit 。\n\n22篇专题统计：已发布1，需查重1，已生成适配初稿20；这三类相加为22。8篇已有官网对应知乎回执涵盖其他经营主题，不能与22篇做简单相加。公众号的3篇Word仍按用户自行发布安排。\n\n## 文件\n\n- [20篇逐篇排期](./20篇知乎排期.csv)\n- [官网88篇与知乎对照](./官网88篇与知乎对照.csv)\n- [第一篇适配稿](./知乎适配稿/01-why-company-missing-from-ai-service-search.md)\n- [此前5篇知乎发布回执](../zhihu-first-batch-2026-10-28/发布回执.md)\n\n每次提交后记录平台实际状态和回执：本地稿、知乎草稿、已预约、审核中、公开发布分别填写。无法确认状态的稿件须先查草稿箱、定时列表及公开主页，不盲目重发。\n`;
fs.writeFileSync(path.join(dir,'知乎改写与发布计划.md'),md,'utf8');
console.log(JSON.stringify({inventory:inventory.length-1,geo:manifest.geoCategory,drafts:manifest.drafts.length,planned:manifest.drafts.map(x=>x.proposedTime),pending:20}));
