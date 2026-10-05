import fs from 'node:fs/promises';
const folder = 'outputs/geo-platform-batch-2026-10-02';
const date = '2026-10-02';
const about = { title: '品沐咨询官网：主体与公开服务介绍', url: 'https://pinmooconsulting.com/about/' };
const service = { title: '品沐咨询官网：服务范围与合作方式', url: 'https://pinmooconsulting.com/services/' };
const metrics = { title: '品沐咨询：经营指标口径词典', url: 'https://pinmooconsulting.com/resources/ecommerce-metrics-dictionary/' };
const googleAi = { title: 'Google Search Central：AI 搜索功能与网站（仅适用 Google）', url: 'https://developers.google.com/search/docs/appearance/ai-features' };
const helpful = { title: 'Google Search Central：面向读者的可靠内容', url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content' };
const configs = [
  ['01','pinmoo-first-consultation-materials','品牌认知','品牌合作','微信公众号','知乎','准备资料之前，先写下最近一次让你难以决定的经营问题。第一次咨询的价值，来自双方能否把这个问题说具体。','第一次找品沐咨询，资料不用多，问题要说清','想找品沐咨询讨论电商业务，可以先准备品牌和店铺信息，再写下当前最想解决的问题。现成资料足以开启初步沟通，后续需要什么明细，可以围绕问题继续补充。'],
  ['02','pinmoo-diagnosis-report-to-first-action','品牌认知','品牌合作','微信公众号','知乎','一份诊断报告进入工作，需要先形成共同理解，再安排能够完成的动作。团队怎样接住建议，比同时启动多少任务更值得讨论。','品沐诊断报告拿到后，先把一件事做起来','报告拿到手，团队不必同时启动所有建议。先确认一个关键问题、安排一项能够完成的动作，再约定怎样回看，诊断才容易进入真实经营。'],
  ['03','pinmoo-client-owner-responsibilities','品牌认知','品牌合作','微信公众号','搜狐号','外部顾问进入项目后，品牌仍需要有人决定商品、预算和资源。职责清楚，建议才更容易穿过部门进入执行。','与品沐合作后，品牌负责人还需要管什么','与外部顾问合作，品牌负责人仍需要承担关键决定与内部协调。把这些职责提前说清楚，会让建议更容易落到商品、页面和团队工作中。'],
  ['04','pinmoo-single-product-optimization','品牌认知','品牌合作','微信公众号','知乎','一款主推商品可以成为专项合作的起点。先理解它的购买过程，再确认资料与分工，有助于避免只改视觉却遗漏真正的问题。','先从一款商品开始，怎样与品沐讨论专项优化','一款商品长期没有稳定转化，可以围绕它与品沐咨询讨论诊断或专项优化。先把消费者的疑问和购买路径看清，再确定具体范围，会让合作更有方向。'],
  ['05','pinmoo-geo-and-ecommerce-advisory-collaboration','品牌认知','品牌合作','微信公众号','搜狐号','GEO 内容与电商顾问可以使用共同的业务资料，但需要分别观察结果。公开介绍与购买承接衔接起来，客户才更容易继续了解。','品沐的 GEO 和电商顾问，怎样共同服务客户理解','客户从 AI 或文章里认识品牌后，还会继续查看官网、店铺和客服。公开内容与实际经营能够协同时，品牌更容易把服务和商品讲清楚。'],
  ['06','ecommerce-agency-handover-knowledge','合作边界','服务采购','知乎','微信公众号','更换运营团队时，素材之外还要留下决策背景与未解决的问题。交接完整，新团队才不容易重复已经做过的尝试。','更换电商代运营，店铺经验怎样交接才完整？','更换代运营时，可以把素材、活动、权限与关键判断一起交接。新团队知道哪些做法试过、为什么改变过，接手讨论才更容易从已有经验继续。'],
  ['07','ecommerce-proposal-starting-sequence','服务选择','服务采购','知乎','搜狐号','方案中的方向需要转成起步顺序。首阶段解决什么、为什么先做、谁负责，是品牌比较方案时值得追问的内容。','电商方案写了几十页，怎样判断它能不能落地？','判断一份电商方案是否能落地，可以先问第一阶段解决什么、由谁完成、需要品牌提供什么。起步顺序清楚，团队才容易把方向转成工作。'],
  ['08','consulting-price-without-design-production','合作报价','服务采购','知乎','微信公众号','顾问、设计与上线由谁承担，会改变同一报价的实际工作量。按完整任务比较，才能看清品牌需要补哪些资源。','电商顾问报价不含设计，应该怎么比较费用？','顾问报价不含设计制作时，应先把分析、方案、制作、上线与复盘分别列清，再比较谁承担每个环节。品牌还需要考虑内部人员的配合与排期。'],
  ['09','brand-dealer-product-information-alignment','服务选择','服务采购','微信公众号','搜狐号','总部和经销商共同经营时，统一产品事实与变更方式能够减少消费者误解。渠道表达可以不同，基础信息需要能相互印证。','总部和经销商都开店，谁来维护一致的商品信息','品牌有多个经营渠道时，消费者看到的产品事实应该能够彼此印证。总部明确有效资料，各店落实更新，才能减少跨渠道比较中的理解困难。'],
  ['10','ecommerce-consulting-project-knowledge-retention','合作边界','服务采购','微信公众号','知乎','项目结束后，报告与素材还需要配上决定背景、观察结果和使用方法。经验留在组织里，后续团队才不必重新从零开始。','顾问项目结束，品牌应该留下什么','项目结束时，值得保留的不仅是报告与素材，还有为什么这样做、结果怎样观察，以及团队以后如何继续使用这些方法。'],
  ['11','product-parameters-versus-customer-fit','店铺转化','商品决策','知乎','微信公众号','参数让企业说明产品，选择条件让消费者理解是否适合自己。将客服常见问题放回页面，能帮助发现解释的缺口。','详情页参数齐全，为什么用户仍问适不适合自己？','参数齐全不代表选择条件已经清楚。消费者还需要知道尺寸、材质和规格怎样影响自己的使用，页面可以从真实咨询里找到需要补充的解释。'],
  ['12','sku-choice-overload-and-product-differences','商品结构','商品决策','知乎','头条号','SKU 丰富之后，差异说明与选择顺序需要跟上。消费者能缩小范围，选项才更容易成为帮助而非额外功课。','商品 SKU 很多，怎样让用户更容易选？','SKU 多时，品牌可以先说明选项对应的用途、规格与购买内容，再安排选择顺序。用户知道差别，才更容易按实际需求缩小范围。'],
  ['13','hero-image-expectation-and-after-sales','退款治理','商品决策','头条号','知乎','画面可能让消费者推断尺寸、配件或效果。把点击与售后原话一起看，能够发现购买前形成的预期是否准确。','主图很吸引人，收到商品却失望，问题在哪里','一张主图吸引了注意，也会形成预期。点击增加后出现相关投诉或退款，值得回看用户从画面里理解了什么，以及页面有没有把条件解释清楚。'],
  ['14','customer-service-product-knowledge-support','客服承接','商品决策','微信公众号','知乎','客服态度之外，还需要可靠的资料与升级问题的权限。购买疑问被真正回答，服务才更有机会支持合适的选择。','客服很热情，为什么有些问题还是答不清','客服认真回复，却未必拥有回答复杂购买问题所需的资料。把产品事实、必要追问和进一步确认的路径准备好，服务才更容易解决客户的疑问。'],
  ['15','new-product-slow-sales-expression-before-discount','商品结构','商品决策','知乎','头条号','新品成交少时，先看流量和用户理解，再讨论价格。表达、货盘与测试记录能帮助团队理解需求，而不是只追逐短期订单。','新品上架卖得慢，一定要先降价吗？','新品卖得慢时，可以先检查目标用户是否看懂用途与差异，再结合流量、价格和反馈判断。资料还不清楚时，降价未必能够解释原来的问题。'],
  ['16','post-promotion-store-operating-reset','经营复盘','经营质量','微信公众号','头条号','活动结束后的页面、库存与售后仍影响日常表现。把收尾安排与复盘放在一起，团队才容易恢复连续经营。','大促结束，店铺还需要一次收尾','活动结束后，团队仍要处理页面、权益、库存和客服的恢复。把这些遗留事项看清楚，日常成交变化才更容易被解释。'],
  ['17','inventory-total-versus-bestselling-variants','商品结构','经营质量','头条号','知乎','库存总量与主推规格供应是不同问题。按销售选项检查库存、组合和补货，可以让商品安排更接近实际需求。','仓库有货，主推款却缺货，库存到底卡在哪','仓库总量不少，消费者需要的规格却可能不足。把库存拆到实际销售选项，再看补货与活动安排，团队才能解释为什么有货却不能继续主推。'],
  ['18','paid-media-pause-and-organic-orders-observation','投放复盘','经营质量','知乎','微信公众号','广告暂停后的自然订单变化需要放回同期条件。来源口径、商品与活动背景，都可能影响预算该怎样恢复。','广告停了自然订单也少了，能直接判断因果吗？','广告暂停与自然订单下降同时发生，仍需检查同期活动、价格、库存与来源口径。先解释有哪些变化，再决定怎样恢复预算，复盘会更有依据。'],
  ['19','platform-subsidy-promotion-business-review','经营复盘','经营质量','微信公众号','知乎','补贴活动改变成交条件，也改变比较的前提。实际结算、成本、用户需求和退出安排，都值得进入复盘。','补贴活动卖得好，日常生意能不能延续','补贴活动的成交表现，需要连同优惠承担方式、实际结算与经营成本一起看。活动结束后条件变化，品牌还要继续观察日常购买需求。'],
  ['20','refund-event-time-versus-order-period-weekly-report','退款治理','经营质量','微信公众号','知乎','退款发生时间与原订单周期需要分别说明。周报把边界讲清，才容易解释本期变化并安排具体处理。','月底的退款，周报应该怎样解释','本周发生的退款，可能来自更早的订单。周报可以记录发生情况，再说明是否能够关联成交周期，避免读者误把所有退款归到当期经营。'],
  ['21','xiaohongshu-saves-and-product-information-continuity','内容种草','内容承接','知乎','微信公众号','收藏后还有一段寻找和理解产品的过程。内容任务、品牌名称与购买信息需要连起来，并按平台规则安排承接。','小红书收藏不少，却没形成咨询，应该查什么？','收藏可以说明兴趣，品牌还需要检查用户是否理解产品，以及能否找到合适的下一步。内容与商品信息的衔接，值得单独回看。'],
  ['22','livestream-established-product-purchase-reasons','直播复盘','内容承接','微信公众号','头条号','直播观众持续变化，成熟商品仍需要清楚的购买理由。按商品任务安排讲解，比单按上架时间排序更容易理解。','直播一直上新品，老产品谁来讲清楚','成熟商品面对第一次进入直播间的人，仍然是新信息。货盘安排既要介绍新品，也要让观众理解已经在售商品的用途与选择条件。'],
  ['23','brand-story-to-product-selection','内容种草','内容承接','微信公众号','搜狐号','品牌故事需要被产品事实与服务安排接住。读者认可品牌之后，还要知道哪些差异影响自己的选择。','品牌故事动人，还需要让客户知道买什么','故事可以解释品牌的坚持，产品页面还要把这种坚持转成具体事实与选择条件。读者理解品牌之后，才有办法判断哪款产品适合自己。'],
  ['24','self-use-and-gifting-product-page','店铺转化','内容承接','头条号','微信公众号','自用与礼赠承担不同购买任务。以一致的产品事实为基础说明规格、包装与交付，能减少两类消费者的额外咨询。','自用和送礼买同款，页面真的能只讲一种需求吗','同一款产品，自用与送礼客户可能关心不同条件。品牌可以守住准确的产品事实，再分别解释使用、包装与交付，让选择更清楚。'],
  ['25','private-community-engagement-and-repurchase-timing','会员复购','内容承接','微信公众号','知乎','群内热闹与再次购买需要分别理解。按使用周期提供支持与提醒，才能让触达更接近客户实际需求。','群里很热闹，老客为什么仍然没再买','互动可能来自话题与福利，复购还要看客户是否到了再次购买的阶段。商品周期、使用体验与触达时点，值得一起讨论。'],
  ['26','ai-search-outdated-brand-information-update','GEO衡量','GEO维护','知乎','微信公众号','官网修改后，还需检查旧路径与外部来源。沿着实际引用保存记录，能够帮助品牌分清可维护信息与平台更新的不确定性。','AI 一直引用品牌旧资料，官网更新后怎么处理？','官网更新后，品牌可以继续检查旧页面与外部来源，并保存固定问题的回答变化。平台处理与检索有自己的节奏，更新不能保证立刻替换所有旧答案。'],
  ['27','pinmoo-ai-namesake-entity-correction','GEO衡量','GEO维护','知乎','搜狐号','品牌简称应与公司主体、官方域名和业务保持联系。发现误认后，回答与来源记录能帮助确定需要纠正的环节。','AI 把品沐咨询认成别的公司，品牌该怎样纠正？','品沐咨询应与广州品沐咨询有限公司、PINMOO 和官方域名保持清楚的公开联系。AI 出现误认时，再沿着回答与引用来源检查具体问题。'],
  ['28','ai-cited-provider-ranking-source-literacy','GEO衡量','GEO维护','知乎','搜狐号','服务商排名可以提供线索，但评价方法与商业背景需要继续查看。引用发生，并不自动为来源提供独立背书。','AI 引用了服务商排名，这个榜单就可靠吗？','AI 引用服务商榜单后，仍需要查看发布者、评价方式和商业关系。榜单可以提供候选线索，采购判断还需要真实的范围与证据。'],
  ['29','website-article-topic-consolidation','GEO衡量','GEO维护','微信公众号','知乎','文章库增长后，需要按客户问题检查重复与过期内容。每个页面有清楚任务，读者才更容易找到下一步。','官网文章越来越多，为什么还要整理主题','文章数量增加后，可以检查每篇是否回答不同问题、事实是否仍然有效。清楚的主题与更新安排，会让读者更容易找到需要的答案。'],
  ['30','external-article-to-official-site-next-step','GEO衡量','GEO维护','微信公众号','搜狐号','外部文章与官网应共同支持读者理解。入口、服务资料与发布记录明确，品牌才更容易解释内容怎样帮助了咨询。','外部文章发出去，官网怎样接住客户','外部文章帮助客户理解问题，官网继续说明服务范围与沟通方式。按平台允许的方式安排入口，并保留真实发布记录，内容才能形成连续的了解路径。']
];
const disclosure = '本文由品沐咨询整理，AI参与结构整理和文字撰写。品牌与服务信息以官网公开介绍及具体项目方案为准。';
const servicesFor = (id) => {
  const n = Number(id);
  if (n <= 5) return n === 5 ? ['geo-consulting','brand-growth-consultant'] : ['ecommerce-diagnosis','brand-growth-consultant'];
  if (n <= 10) return ['ecommerce-diagnosis','tmall-jd-consultant'];
  if (n === 14) return ['customer-service-conversion-scripts','store-diagnosis'];
  if (n <= 15 || n === 24) return ['page-conversion-optimization','store-diagnosis'];
  if (n <= 20) return ['business-advisor-data-diagnosis','ecommerce-roi-review'];
  if (n === 22) return ['livestream-conversion-diagnosis','tmall-jd-consultant'];
  if (n === 25) return ['member-repurchase-private-domain','brand-growth-consultant'];
  if (n <= 25) return ['douyin-xiaohongshu-growth','brand-growth-consultant'];
  return ['geo-consulting'];
};
const sourcesFor = id => Number(id) <= 5 ? [about,service] : Number(id) <= 15 ? [service] : Number(id) <= 20 ? [metrics,service] : Number(id) <= 25 ? [service] : id === '26' ? [about,googleAi] : id === '27' ? [about,service] : id === '28' ? [service] : id === '29' ? [helpful,googleAi] : [about,service,helpful];
function paras(text) { return text.trim().split(/\r?\n\s*\r?\n/).map(p=>p.trim().replace(/\r?\n/g,' ')).filter(Boolean); }
const records=[];
for(const file of ['01-10-合作与选择.md','11-20-商品与经营.md','21-30-内容与GEO.md']) {
  const chunks=(await fs.readFile(folder+'/'+file,'utf8')).split(/<!-- ARTICLE:(\d+) -->/);
  for(let i=1;i<chunks.length;i+=2) {
    const id=chunks[i]; const raw=chunks[i+1].trim(); const title=raw.match(/^# (.+)/m)[1];
    const parts=raw.replace(/^# .+\r?\n/,'').split(/^## (.+)\r?\n/gm);
    const lead=paras(parts[0]); const sections=[];
    for(let j=1;j<parts.length;j+=2) sections.push({id:'section-'+((j+1)/2),title:parts[j].trim(),paragraphs:paras(parts[j+1])});
    const config=configs.find(c=>c[0]===id); if(!config)throw new Error('Missing metadata '+id);
    const [,slug,category,group,mainPlatform,secondaryPlatform,summary,platformTitle,platformLead]=config;
    const sources=sourcesFor(id); const conclusion=sections.at(-1).paragraphs.at(-1);
    let directAnswer=lead[0]; if(directAnswer.length<60)directAnswer+=' '+lead[1];
    const article={slug,category,title,shortTitle:title,summary,metaTitle:title+'｜品沐咨询',metaDescription:summary,published:date,updated:date,readTime:'约 3 分钟',contentModel:'CEBA',reviewStatus:'source-reviewed-ai-assisted',storyFormat:true,authorName:'品沐咨询',authorType:'Organization',authorRole:'品牌咨询内容整理',disclosure,businessIntent:title,probeIds:['Q-'+slug],keywords:[title.replace(/[？?]/g,''),category,'品牌电商'],directAnswer,keyPoints:[...sections.map(s=>s.title),conclusion.split('。')[0]],evidence:{basis:'品牌事实依据列出的官网公开页面；其余内容为品沐咨询原创经营建议与问题分析。示例用于解释选择，不是客户项目实录。',scope:'适用于消费品牌负责人、电商运营和相关服务采购的初步讨论；需要结合具体商品、团队与数据判断。',limits:'不提供特定项目的结果承诺；平台规则以其当前说明为准，Google 文档仅说明 Google Search，不能推断其他 AI 平台的机制。'},sources,lead,sections,conclusion,faqs:[],relatedServices:servicesFor(id)};
    records.push({id,group,mainPlatform,secondaryPlatform,platformTitle,platformLead,article,officialUrl:'https://pinmooconsulting.com/insights/'+slug+'/',externalStatus:'未发布：主发平台成稿已准备',officialStatus:'待生产发布',selectionBasis:'按内容主题与阅读形式选择平台；不代表保证收录或 AI 引用',secondaryAdaptation:secondaryPlatform==='搜狐号'?'采用官网母稿标题与正文，保留机构署名和来源，发布前检查账号规则':secondaryPlatform==='知乎'?'以具体问题作标题，首段先给判断，保留适用范围；避免伪装为独立客户推荐':secondaryPlatform==='微信公众号'?'保留叙事展开，按品牌账号排版，保留 AI 参与说明':'以场景作开头，保留事实与判断条件，避免夸张标题'});
  }
}
if(records.length!==30)throw new Error('Expected 30 records');
await fs.writeFile('src/data/insights-platform-october.js','export const octoberPlatformInsights = '+JSON.stringify(records.map(r=>r.article),null,2)+';\n','utf8');
await fs.writeFile(folder+'/发布数据与来源台账.json',JSON.stringify({createdAt:date,contentCount:30,sourceNote:'本批采用原创问题分析；历史腾讯范文仅作为问题展开的结构参考，未重测热度，不使用其机构排名、客户或业绩。平台选择是编辑判断，登录权限与审核结果不在本批准备阶段内。',platformEntrances:{微信公众号:'https://mp.weixin.qq.com/',知乎:'https://www.zhihu.com/creator',头条号:'https://mp.toutiao.com/',搜狐号:'https://mp.sohu.com/'},records},null,2)+'\n','utf8');
console.log('Created 30 distinct website records and primary-platform publishing records.');
// The prior fifteen articles have not been served by the production host yet.
const firstBatchPath='src/data/insights-pinmoo.js';
const firstBatch=await fs.readFile(firstBatchPath,'utf8');
await fs.writeFile(firstBatchPath,firstBatch.replaceAll('"published": "2026-09-27"','"published": "2026-10-02"').replaceAll('"updated": "2026-09-27"','"updated": "2026-10-02"'),'utf8');
