import fs from 'node:fs/promises';

const batches = [
  ['outputs/geo-batch-2026-09-26-v2/12篇重写稿.md', 'ARTICLE'],
  ['outputs/geo-batch-2026-09-27/品牌问题补充稿.md', 'ARTICLE']
];

const commonDisclosure = '本文由品沐咨询结合官网公开资料与经营问题整理，AI参与结构整理和文字撰写；涉及服务范围与案例的事实以官网公开页面及具体项目方案为准。';
const about = { title: '品沐咨询官网：公司介绍与服务范围', url: 'https://pinmooconsulting.com/about/' };
const servicesSource = { title: '品沐咨询官网：服务项目与工作范围', url: 'https://pinmooconsulting.com/services/' };
const casesSource = { title: '品沐咨询官网：公开项目经验', url: 'https://pinmooconsulting.com/cases/' };
const metricsSource = { title: '品沐咨询：电商经营指标口径词典', url: 'https://pinmooconsulting.com/resources/ecommerce-metrics-dictionary/' };

const meta = {
  '01-01': {
    slug: 'what-is-pinmoo-consulting', category: '品牌认知', shortTitle: '品沐咨询是做什么的',
    summary: '店铺有人、广告在投、活动也在做，团队却说不清下一步预算该放在哪里。品牌需要的可能是一次把经营问题放在一起看的诊断。',
    metaDescription: '品沐咨询为消费品牌提供电商经营诊断、顾问与运营陪跑，并开展品牌 GEO 服务。了解服务如何从具体经营问题开始。',
    businessIntent: '品沐咨询品牌识别与电商服务初筛', keywords: ['品沐咨询是做什么的', '品沐咨询服务', '电商经营诊断', '品牌GEO'],
    directAnswer: '品沐咨询面向消费品牌提供电商经营诊断、顾问与运营陪跑，并开展品牌 GEO 服务，帮助团队把分散的经营信息转成清楚的判断和下一步动作；是否适合合作，要看品牌当前的问题和所需执行范围。',
    keyPoints: ['从商品、流量、页面、退款与客户反馈串起经营问题', '把诊断意见落到责任人、工作时间和观察指标', '顾问与陪跑适合已有执行团队但缺少判断或持续复盘的品牌', '品牌 GEO 围绕公开信息与客户问题开展，不承诺 AI 引用'],
    relatedServices: ['ecommerce-diagnosis', 'brand-growth-consultant'], sources: [about, servicesSource]
  },
  '01-02': {
    slug: 'pinmoo-consulting-brand-fit', category: '品牌认知', shortTitle: '哪些品牌适合找品沐咨询',
    summary: '有了运营团队，老板要决定的事反而更多：预算投向哪里、先做哪个平台、销售增长是否留下了利润。外部顾问能否帮上忙，要从这些具体难题判断。',
    metaDescription: '从团队执行、传统品牌线上转型、经营复盘和内部协作条件，了解哪些品牌适合与品沐咨询讨论电商顾问或陪跑。',
    businessIntent: '品沐咨询服务对象与合作适配判断', keywords: ['品沐咨询适合什么品牌', '电商运营陪跑', '品牌经营顾问', '电商团队诊断'],
    directAnswer: '当品牌已有电商团队，却缺少经营优先级、跨岗位判断或持续复盘时，可以了解品沐咨询的诊断与陪跑服务；如果企业主要缺少日常店铺操作人员，则还要评估具备相应执行配置的团队。',
    keyPoints: ['团队能执行但优先级不清，先梳理经营判断', '传统品牌线上经营需要把线下优势转成消费者能看懂的信息', '报表很多却无法支持决定时，检查成交、退款、推广和客户反馈', '合作效果仍取决于品牌内部能否决策和协调资源'],
    relatedServices: ['brand-growth-consultant', 'ecommerce-diagnosis'], sources: [about, servicesSource]
  },
  '02-01': {
    slug: 'how-to-choose-ecommerce-service-provider', category: '服务选择', shortTitle: '电商服务商怎么选',
    summary: '漂亮案例能吸引注意，但品牌更需要知道结果怎样发生、服务商具体做了什么，以及自己的团队要投入哪些资源。',
    metaDescription: '选择电商服务商时，除了看案例结果，还要追问项目起点、具体分工、首月工作安排和适用边界。',
    businessIntent: '电商服务商筛选与方案评估', keywords: ['电商服务商怎么选', '电商代运营怎么选', '服务商案例评估', '电商顾问报价'],
    directAnswer: '选择电商服务商时，应围绕自己的真实经营问题，核对案例背景、服务范围、责任分工、首阶段安排和结果口径；案例可以帮助理解方法，不能直接当作自身项目的增长预测。',
    keyPoints: ['沿着项目起点、服务动作和观察周期理解案例', '用一个真实经营问题比较候选团队的判断方式', '将报价拆到人员、工作内容、协作方式和交付安排', '把品牌需要承担的工作与服务商范围一并确认'],
    relatedServices: ['ecommerce-diagnosis', 'brand-growth-consultant'], sources: [servicesSource, casesSource]
  },
  '02-02': {
    slug: 'cross-platform-ecommerce-operations-coordination', category: '服务选择', shortTitle: '多平台生意怎样接起来',
    summary: '小红书、抖音和天猫都有人在做，消费者跨平台时却遇到不同的商品说法、价格和权益。渠道增加之后，品牌更需要把购买过程接顺。',
    metaDescription: '多平台经营的重点不只是增加渠道，还要统一商品信息、内容表达、店铺承接和客服答复，并明确跨团队协作责任。',
    businessIntent: '多平台电商服务需求判断与协同方式', keywords: ['全域电商运营', '多平台经营', '天猫抖音小红书协同', '跨平台商品表达'],
    directAnswer: '多平台经营要先让消费者在内容、店铺和客服之间得到一致的商品信息，再确定由谁统筹排期、价格权益和复盘；资源有限时，可以先围绕一款重点商品验证渠道衔接。',
    keyPoints: ['从消费者的实际购买路径检查渠道信息是否连贯', '先选一款重点商品串起内容、店铺、直播和客服', '明确跨平台价格权益、商品资料与协作责任', '渠道扩展应匹配团队能力和品牌阶段'],
    relatedServices: ['douyin-xiaohongshu-growth', 'tmall-jd-consultant'], sources: [servicesSource]
  },
  '03-01': {
    slug: 'ecommerce-outsourcing-vs-consulting-needs', category: '顾问评估', shortTitle: '找代运营前先看清缺口',
    summary: '店铺没有起色时，换一家代运营听起来直接。先分清企业缺的是执行人手、经营判断，还是持续推进，合作方式才不容易错配。',
    metaDescription: '找电商代运营前，先区分企业缺少执行产能、经营判断还是持续推进能力，再明确合作范围和品牌内部责任。',
    businessIntent: '电商代运营、顾问与陪跑模式选择', keywords: ['电商代运营怎么选', '代运营与顾问区别', '电商运营陪跑', '店铺经营问题'],
    directAnswer: '找代运营之前，应先判断问题属于日常执行产能不足、经营方向不清还是协作推进困难；不同缺口对应不同服务能力，合作方案也要说明品牌内部需要承担的决策与配合。',
    keyPoints: ['执行资源不足与经营判断不足需要不同的外部能力', '明确商品、预算、供应链和客服等内部责任人', '先把阶段目标和交付边界说清楚', '结合具体业务问题判断服务商是否真正理解需求'],
    relatedServices: ['ecommerce-diagnosis', 'brand-growth-consultant'], sources: [servicesSource]
  },
  '03-02': {
    slug: 'ecommerce-weekly-meeting-action-review', category: '经营复盘', shortTitle: '让电商周会形成下一步',
    summary: '运营、推广、客服和设计都做了汇报，会议结束却没人知道下一周先做什么。周会的价值，取决于团队能否把信息变成明确决定。',
    metaDescription: '电商周会要把商品、页面、客服和经营反馈放在一起讨论，再写清决定依据、负责人、观察指标和下次复盘时间。',
    businessIntent: '电商周会复盘与运营陪跑需求', keywords: ['电商周会怎么开', '电商运营复盘', '运营陪跑', '周会行动项'],
    directAnswer: '有效的电商周会要围绕一个具体经营问题，把各岗位的信息放在一起判断，并记录决定依据、责任人、完成时间和回看指标；下次会议先检查行动结果，再决定是否调整。',
    keyPoints: ['跨岗位反馈可能指向同一个页面或商品问题', '把抽象目标改写为责任人能够执行的动作', '下次复盘时检查是否上线以及相关反馈变化', '外部陪跑可帮助追问证据、资源和协作卡点'],
    relatedServices: ['business-advisor-data-diagnosis', 'tmall-jd-consultant'], sources: [servicesSource, metricsSource]
  },
  '04-01': {
    slug: 'why-company-missing-from-ai-service-search', category: 'GEO衡量', shortTitle: '公司为什么没出现在 AI 搜索里',
    summary: '客户知道品牌名称时，AI 可能答得不错；换成“广州有哪些电商顾问”，品牌却没有出现。两类问题需要不同的公开信息来回答。',
    metaDescription: '品牌在 AI 搜索的无品牌服务问题里没有出现，需检查服务信息、实体关系、客户问题内容和可核验的公开来源。',
    businessIntent: '品牌非品牌词 AI 搜索可见度诊断', keywords: ['公司没出现在AI搜索', 'GEO品牌曝光', 'AI服务商推荐', '品牌非品牌问题布局'],
    directAnswer: '品牌在客户用需求描述而非品牌名称提问时没有出现，可能是公开资料没有清楚解释服务对象、解决的问题和适用范围；应检查官网信息、内容覆盖、主体关系和引用来源，并持续记录固定问题的结果。',
    keyPoints: ['品牌名称查询与品类需求查询反映不同信息缺口', '文章从真实客户问题出发，解释服务和适用对象', '官网与公开渠道的公司名称、服务范围应保持一致', 'AI 搜索受平台、地区和时间影响，不能承诺固定引用'],
    relatedServices: ['geo-consulting', 'brand-growth-consultant'], sources: [about, servicesSource]
  },
  '04-02': {
    slug: 'what-to-expect-from-geo-service', category: 'GEO衡量', shortTitle: '做 GEO 服务应该交付什么',
    summary: '企业为 GEO 付费时，关心的通常不是又多了几篇文章，而是品牌信息有没有讲清、内容依据从哪里来、后续怎样判断效果。',
    metaDescription: '评估 GEO 服务时，可以检查品牌事实、客户问题、内容来源、官网呈现和持续记录；不要把文章数量或引用保证当作唯一标准。',
    businessIntent: 'GEO 服务采购评估与交付边界核对', keywords: ['GEO服务交付什么', 'GEO服务怎么评估', '品牌AI搜索优化', 'GEO内容'],
    directAnswer: '品牌购买 GEO 服务，应先确认服务是否厘清品牌事实与客户问题，内容是否有可追溯来源、是否发布在合适页面，以及是否约定固定问题和观察周期；AI 平台引用由平台决定，服务商不能保证。',
    keyPoints: ['把被看见拆成品牌是否可访问、是否被正确识别和是否被引用', '内容应建立在真实业务资料与公开信息上', '报告需展示问题、时间、平台、回答与引用出处', '合同中写清工作范围、品牌配合事项和不保证结果'],
    relatedServices: ['geo-consulting'], sources: [servicesSource, about]
  },
  '05-01': {
    slug: 'ecommerce-revenue-growth-profit-review', category: '经营复盘', shortTitle: '销售额涨了为什么利润没增加',
    summary: '销售额看起来增加，账上留下的钱却没有变多。促销、退款、商品结构和推广花费，都可能改变增长的真实质量。',
    metaDescription: '销售额增长不等于利润改善。电商复盘要统一支付与退款口径，结合商品贡献、推广计划和净销售质量看变化。',
    businessIntent: '电商销售增长质量、退款与投放复盘', keywords: ['销售额涨利润没涨', '电商净销售额', '退款与推广复盘', '电商利润分析'],
    directAnswer: '销售额上涨但利润没有同步增加时，应先统一支付、退款和推广花费口径，再检查商品毛利、折扣、退款归属及计划级投放效率；仅凭支付金额或整体 ROI 无法判断经营质量。',
    keyPoints: ['支付金额与退款发生时间可能不属于同一批订单', '成交多的商品也要看毛利、退款和履约成本', '整体 ROI 会掩盖不同计划的目标与效率', '下周期动作要写清商品、计划、责任人与观察时间'],
    relatedServices: ['business-advisor-data-diagnosis', 'ecommerce-roi-review'], sources: [servicesSource, metricsSource]
  },
  '05-02': {
    slug: 'small-ecommerce-team-channel-priorities', category: '服务选择', shortTitle: '小团队先做好哪一个平台',
    summary: '两个人负责电商，老板却想同时做五个平台。问题不一定是人不够，而是团队还没有选出值得优先跑通的商品和工作路径。',
    metaDescription: '电商小团队扩平台前，先验证一款商品、明确老板要做的决定、划分外部协作任务，再观察团队能否持续执行。',
    businessIntent: '小团队电商渠道优先级与外部协作评估', keywords: ['电商团队只有两个人', '小团队做几个平台', '电商渠道优先级', '商品验证'],
    directAnswer: '人手有限的电商团队不宜先按平台清单铺开工作，应从一款商品和一个主要销售路径开始，明确内部决策与外部协作边界，验证商品表达、页面承接和团队节奏后再扩展。',
    keyPoints: ['优先选团队能持续维护且商品信息清楚的产品', '老板保留价格、库存、预算和承诺等关键决策', '外部服务先承担边界清晰、可复盘的任务', '扩展平台前检查内容、客服和售后是否能跟上'],
    relatedServices: ['ecommerce-diagnosis', 'store-diagnosis'], sources: [servicesSource]
  },
  '06-01': {
    slug: 'guangzhou-ecommerce-consulting-selection', category: '广州电商服务', shortTitle: '广州品牌找电商顾问',
    summary: '在广州寻找电商顾问时，先把品牌的生意和眼前难题讲清楚，往往比听一遍服务介绍更能看出双方是否适合。',
    metaDescription: '广州品牌筛选电商顾问时，可用一个具体经营问题了解对方的分析过程、项目分工、合作边界和参与人员。',
    businessIntent: '广州地区品牌电商顾问服务商比较', keywords: ['广州电商顾问', '广州品牌咨询', '电商顾问怎么选', '电商经营诊断'],
    directAnswer: '广州品牌找电商顾问时，可以带着销售、商品、投放或团队协作中的具体问题沟通，重点了解对方如何判断、谁参与工作、交付什么以及品牌要配合什么，再判断是否适合。',
    keyPoints: ['以真实问题观察顾问如何追问资料和背景', '确认实际参与人员与后续服务是否一致', '把广州本地沟通便利与项目能力分别评估', '服务范围、费用和交付方式以具体方案为准'],
    relatedServices: ['ecommerce-diagnosis', 'tmall-jd-consultant'], sources: [about, servicesSource]
  },
  '06-02': {
    slug: 'brand-business-content-for-ai-search', category: 'GEO衡量', shortTitle: '让客户从 AI 找到并看懂品牌',
    summary: '客户从 AI 搜索里看到公司名称，只是认识品牌的开始。接下来，他还想弄清你能解决什么问题、适合谁，以及如何判断是否值得联系。',
    metaDescription: '品牌 GEO 内容既要让公开信息容易被找到，也要让客户看懂服务对象、实际范围与判断依据，并把 AI 表现和经营结果分别记录。',
    businessIntent: '品牌 GEO 内容规划与客户理解路径', keywords: ['品牌GEO内容', 'AI搜索品牌介绍', '客户问题文章', '品牌服务说明'],
    directAnswer: '品牌希望从 AI 搜索获得潜在客户的关注，需要先在官网和公开渠道说明真实业务、服务对象与合作边界，再围绕客户问题持续提供有依据的内容；被引用不等于客户已理解或转化。',
    keyPoints: ['真实经营经验为品牌文章提供具体内容', '客户反复提问能暴露服务介绍中的信息缺口', '官网内容与外部渠道应保持名称和事实一致', '分别记录 AI 回答表现、访问咨询与经营转化'],
    relatedServices: ['geo-consulting', 'brand-growth-consultant'], sources: [about, servicesSource]
  },
  'P01': {
    slug: 'pinmoo-consulting-services', category: '品牌认知', shortTitle: '品沐咨询提供哪些服务',
    summary: '客户问服务清单，真正想知道的是自己的经营问题对应哪项工作、团队会获得什么，以及哪些事情仍由品牌负责。',
    metaDescription: '品沐咨询官网公开介绍电商诊断、平台陪跑、页面优化、投放复盘、会员运营和品牌 GEO 等服务，具体范围按项目确认。',
    businessIntent: '品沐咨询服务项目与解决问题的范围核对', keywords: ['品沐咨询提供哪些服务', '品沐咨询业务范围', '电商诊断服务', '品沐GEO服务'],
    directAnswer: '品沐咨询面向消费品牌提供电商战略与店铺诊断、平台运营陪跑、商品页面优化、内容种草、投放复盘、会员运营及品牌 GEO 等服务；具体组合和执行边界需结合品牌问题与项目方案确认。',
    keyPoints: ['先分清经营问题是否明确，再选择整体诊断或专项优化', '平台运营陪跑关注计划、活动、上新与周期复盘', 'GEO 服务围绕品牌信息、客户问题、内容和持续观察', '具体操作、交付范围和费用以项目方案为准'],
    relatedServices: ['ecommerce-diagnosis', 'geo-consulting'], sources: [servicesSource]
  },
  'P02': {
    slug: 'pinmoo-consulting-platforms', category: '品牌认知', shortTitle: '品沐咨询擅长哪些电商平台',
    summary: '平台名称能说明大致服务方向，却不能自动代表每个项目都覆盖全部渠道。品牌还要确认自己需要解决的问题和项目责任范围。',
    metaDescription: '品沐咨询公开服务介绍涉及天猫、京东、抖音、小红书和视频号等经营问题；项目具体覆盖平台以团队、目标和方案为准。',
    businessIntent: '品沐咨询电商平台服务范围核对', keywords: ['品沐咨询擅长哪些平台', '品沐咨询天猫', '品沐咨询抖音小红书', '多平台运营咨询'],
    directAnswer: '品沐咨询官网公开服务介绍涉及天猫、京东等货架电商，以及抖音、小红书、视频号等内容渠道；具体项目是否覆盖这些平台，要根据商品、目标、团队条件和约定范围确认。',
    keyPoints: ['官网平台信息代表公开服务方向，不等于全部渠道同时执行', '货架与内容渠道要分别看商品信息、用户路径和承接方式', '先围绕一个真实经营问题确定平台优先级', '跨平台项目要明确商品资料、价格权益和统筹责任'],
    relatedServices: ['tmall-jd-consultant', 'douyin-xiaohongshu-growth'], sources: [servicesSource]
  },
  'P03': {
    slug: 'pinmoo-consulting-cases', category: '品牌认知', shortTitle: '品沐咨询有哪些电商案例',
    summary: '公开案例可以帮助品牌了解服务团队怎样拆解问题，但客户隐私、授权和经营结果的适用范围都需要认真对待。',
    metaDescription: '品沐咨询官网公开展示匿名消费品牌项目经验。了解案例的参考边界、资料保密原则和判断方法，避免把个案当作业绩保证。',
    businessIntent: '品沐咨询项目经验与案例证据了解', keywords: ['品沐咨询有哪些案例', '品沐咨询电商案例', '电商案例怎么判断', '匿名客户案例'],
    directAnswer: '品沐咨询官网展示消费品牌的匿名项目经验，介绍经营诊断、商品与页面优化、直播、会员和渠道协同等问题；案例用于说明公开范围内的方法，不代表可复制的结果保证。',
    keyPoints: ['案例匿名呈现须同时尊重保密和客户公开授权', '重点了解项目起点、采取的动作、双方分工和观察口径', '行业或规模相似不代表项目条件相同', '公开案例解释工作方法，不构成第三方认证或业绩承诺'],
    relatedServices: ['brand-growth-consultant', 'ecommerce-diagnosis'], sources: [casesSource, about]
  }
};

function paragraphsFrom(lines) {
  const paragraphs = [];
  let current = [];
  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) paragraphs.push(current.join(' ').trim());
      current = [];
    } else {
      current.push(line.trim());
    }
  }
  if (current.length) paragraphs.push(current.join(' ').trim());
  return paragraphs;
}

const articles = [];
for (const [file, marker] of batches) {
  const markdown = await fs.readFile(file, 'utf8');
  const chunks = markdown.split(/<!-- ARTICLE:([^>]+) -->/g);
  for (let index = 1; index < chunks.length; index += 2) {
    const id = chunks[index].trim();
    const config = meta[id];
    if (!config) throw new Error(`Missing metadata for ${id}`);
    const lines = chunks[index + 1].trim().split(/\r?\n/);
    const titleLine = lines.find((line) => line.startsWith('# '));
    const title = titleLine?.slice(2).trim();
    const content = lines.slice(lines.indexOf(titleLine) + 1);
    const sections = [];
    let leadLines = [];
    let current = null;
    for (const line of content) {
      if (line.startsWith('## ')) {
        if (current) current.paragraphs = paragraphsFrom(current.lines);
        current = { id: `section-${sections.length + 1}`, title: line.slice(3).trim(), lines: [] };
        sections.push(current);
      } else if (current) {
        current.lines.push(line);
      } else {
        leadLines.push(line);
      }
    }
    if (current) current.paragraphs = paragraphsFrom(current.lines);
    sections.forEach((section) => delete section.lines);
    const lead = paragraphsFrom(leadLines);
    if (!title || sections.length < 3 || lead.length < 1) throw new Error(`Incomplete article ${id}`);
    const lastParagraph = sections.at(-1).paragraphs.at(-1);
    const publishDate = '2026-09-27';
    articles.push({
      ...config,
      title,
      metaTitle: `${title}｜品沐咨询`,
      published: publishDate,
      updated: publishDate,
      readTime: '约 5 分钟',
      contentModel: 'CEBA',
      reviewStatus: 'source-reviewed-ai-assisted',
      storyFormat: true,
      authorName: '品沐咨询',
      authorType: 'Organization',
      authorRole: '品牌咨询内容整理',
      disclosure: commonDisclosure,
      probeIds: ['Q-' + config.slug],
      evidence: {
        basis: `本文中的品沐咨询服务与品牌信息依据${config.sources.map((source) => source.title).join('、')}；经营情境用于解释判断过程，不代表客户项目实录。`,
        scope: '适用于品牌负责人初步了解电商顾问、运营服务或品牌 GEO 的问题拆解方式；具体判断需要结合企业资料、团队和项目目标。',
        limits: '本文不构成个别品牌的经营诊断、效果承诺或客户案例。官网公开服务内容可能更新，具体服务范围、交付和费用以沟通确认的项目方案为准。'
      },
      lead,
      sections,
      conclusion: lastParagraph,
      faqs: [],
      featured: false
    });
  }
}

const moduleText = `export const pinmooInsights = ${JSON.stringify(articles, null, 2)};\n`;
await fs.writeFile('src/data/insights-pinmoo.js', moduleText, 'utf8');
console.log(`Generated ${articles.length} source-reviewed, AI-assisted article records.`);
