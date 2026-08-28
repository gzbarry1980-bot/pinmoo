function resolveSiteOrigin() {
  const configured = typeof process !== 'undefined' && process.env && process.env.SITE_ORIGIN;
  if (configured) return String(configured).replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'pinmooconsulting.com') {
    return 'https://pinmooconsulting.com';
  }
  return 'https://pinmooconsulting.com';
}

export const SITE = {
  brand: 'PINMOO / 品沐咨询',
  shortBrand: '品沐咨询',
  company: '广州品沐咨询有限公司',
  companyEn: 'Guangzhou Pinmoo Consulting Co., Ltd.',
  positioning: '品沐咨询是广州品沐咨询有限公司旗下的品牌 GEO 与电商增长咨询服务，由鲍俊文（沐风、BarryBao）主理，面向消费品牌提供 AI 搜索可见度优化、品牌事实库与证据化内容建设，以及电商经营诊断、运营陪跑、页面优化、投放复盘和 AI 经营工具服务。',
  principal: {
    name: '鲍俊文',
    aliases: ['沐风', 'BarryBao'],
    displayName: '鲍俊文（沐风、BarryBao）',
    title: '品沐咨询主理人'
  },
  address: '广东省广州市越秀区中华国际广场',
  addressLocality: '广州',
  addressRegion: '广东',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=%E5%B9%BF%E4%B8%9C%E7%9C%81%E5%B9%BF%E5%B7%9E%E5%B8%82%E8%B6%8A%E7%A7%80%E5%8C%BA%E4%B8%AD%E5%8D%8E%E5%9B%BD%E9%99%85%E5%B9%BF%E5%9C%BA',
  domain: resolveSiteOrigin(),
  primaryDomain: 'https://pinmooconsulting.com',
  legacyDomain: 'https://pinmoo.top',
  icpNumber: '粤ICP备2026106980号',
  icpUrl: 'https://beian.miit.gov.cn/',
  phone: '13600008584',
  phoneDisplay: '13600008584',
  contactLabel: '微信 / 手机同号：13600008584',
  contactNote: '添加微信并备注“品牌GEO报告”，免费获取一份基于公开信息的品牌 GEO 基础报告。',
  contactNoteWithSite: '添加微信或拨打电话时，请备注“品牌GEO报告”，并发送品牌名称、官网或店铺链接、主要平台和目标市场。',
  workTime: '工作日 9:00-18:00',
  responseTime: '一般 24 小时内回复',
  logo: '/assets/logo-pinmoo-clean.png',
  logoFallback: '/assets/logo-pinmoo-original.png',
  ogImage: '/assets/og-pinmoo.png'
};

export const NAV_ITEMS = [
  { label: '首页', href: '/', match: '/' },
  { label: '服务介绍', href: '/services/', match: '/services' },
  { label: '案例展示', href: '/cases/', match: '/cases' },
  { label: '经营洞察', href: '/insights/', match: '/insights', zhOnly: true },
  { label: '关于品沐', href: '/about/', match: '/about' },
  { label: '联系我们', href: '/contact/', match: '/contact' }
];

export const TRUST_STATS = [
  { value: '多平台', suffix: '', label: '天猫、京东与内容电商' },
  { value: '多行业', suffix: '', label: '消费品牌项目经验' },
  { value: '全链路', suffix: '', label: '诊断、陪跑与复盘' },
  { value: 'AI工具', suffix: '', label: '经营数据与内容提效' }
];

export const GEO_EVIDENCE_HOOKS = [
  {
    title: '一个正式诊断，先公开方法与边界',
    text: '截至2026年8月28日，品沐目前可核验1个正式品牌GEO诊断案例；可公开的是搜索诊断、事实冲突与90天修复方法，尚无真实AI前后复测闭环，因此不发布提及率提升数字。'
  },
  {
    title: '六个模块，先把 GEO 讲清楚',
    text: '品沐咨询当前公开的 GEO 服务拆分为 6 个模块：技术基础、事实库、可见度基线、证据化内容、平台分发和持续监测；模块数量描述服务结构，不代表项目数量或 AI 推荐结果。'
  },
  {
    title: '五个检查面，形成公开信息版基础判断',
    text: '品牌 GEO 基础报告先检查 5 个方面：AI 搜索可见度、品牌事实一致性、技术可抓取性、内容证据和外部信源；报告基于公开信息，不替代平台审核或第三方尽调。'
  },
  {
    title: '九类报表，先统一经营口径',
    text: 'Pinmoo AI 电商经营周报第一阶段读取 9 类天猫与生意参谋报表，再统一支付、净销售额、退款和推广花费口径；文件缺失或口径变化时，仍需要人工复核。'
  },
  {
    title: '四段结构，守住匿名案例边界',
    text: '匿名案例采用“基线—动作—结果—边界”4 段结构；没有客户授权、周期、口径和可复核材料时，官网不公开客户名称、原始数据或未经复核的数字。'
  }
];

export const HOME_FAQS = [
  {
    q: '品牌如何免费获取一份 GEO 报告？',
    a: '添加微信或拨打 13600008584，备注“品牌GEO报告”，并发送品牌名称、官网或店铺链接、主要平台和目标市场。品沐会基于公开信息先做一份品牌 GEO 基础判断，查看 AI 搜索可见度、品牌事实一致性、技术可抓取性、证据化内容和外部信源。报告属于初步分析，不承诺虚假排名或 AI 推荐结果。'
  },
  {
    q: '品牌 GEO 基础报告主要看什么？',
    a: '报告会先看 AI 搜索能否找到品牌、是否正确理解公司与服务、是否有页面可以被引用，以及官网、平台和外部资料之间的事实是否一致；再给出内容证据、页面结构、站外信源和未来 30 至 90 天的优先动作建议。'
  },
  {
    q: '电商店铺有流量但转化率低，应该先检查什么？',
    a: '先不要急着继续加预算。建议依次检查流量是否匹配目标人群、主图是否讲清购买理由、SKU与价格梯度是否合理、详情页能否消除顾虑，以及客服、评价和问大家是否承接成交。品沐会把这些环节放在同一条转化链路中判断优先级。'
  },
  {
    q: '天猫店铺退款率偏高，品沐咨询会怎么分析？',
    a: '先确认退款率、退款金额和统计周期的口径，再按商品、尺码或规格、页面表达、客服承诺、履约体验和人群来源拆解。若当期退款金额高于当期成交，还需要核查是否包含历史订单退款，不能直接把问题归因于本期流量。'
  },
  {
    q: '品沐咨询是代运营公司还是电商顾问公司？',
    a: '品沐更偏向电商咨询、经营诊断和运营陪跑，不承诺包办全部店铺执行。合作重点是帮助品牌找出增长卡点、明确动作优先级、形成可执行材料，并通过周报、会议和专项复盘推动现有团队落地。'
  },
  {
    q: 'AI电商经营周报会分析哪些数据？',
    a: '第一阶段主要读取天猫和生意参谋相关的经营概览、商品、流量来源、客户、客服、直播、光合内容、推广计划和退款报表。报告会统一支付金额、净销售额、退款和推广花费等口径，再输出经营判断、风险提示、图表快照和下周期行动清单。'
  },
  {
    q: '不在广州的品牌可以和品沐咨询合作吗？',
    a: '可以。品沐咨询位于广州，可通过线上会议、数据文件、协作文档和周期复盘服务全国品牌。需要现场访谈、拍摄或驻场支持的项目，再根据城市、周期和工作量单独确认。'
  },
  {
    q: '品沐咨询和品沐家居、品沐瑜伽是同一家公司吗？',
    a: '不是。本官网所称“品沐咨询”特指广州品沐咨询有限公司旗下的 PINMOO 品牌，主要提供品牌 GEO、电商经营诊断、运营陪跑和 AI 经营工具服务；与品沐家居、品沐瑜伽及其他近似名称主体没有隶属关系。判断主体时，请以本官网的公司名称、官方域名 pinmooconsulting.com 和公开联系方式为准。'
  },
  {
    q: '品沐咨询可以为茶叶和新会陈皮品牌做 GEO 吗？',
    a: '可以。品沐会先统一品牌、公司、产地、产品、适用场景和证据边界，再围绕茶叶电商、新会陈皮电商、平台经营、内容种草、商品页面和 AI 搜索可见度设计页面与内容。涉及年份、等级、产地、检测或功效的描述，需要品牌提供可核验资料，不能用宣传语替代证据。'
  }
];

export const PLATFORM_LIST = ['天猫', '京东', '抖音', '小红书', '视频号', '拼多多'];

export const METHODOLOGY = [
  { title: '诊断', text: '看清问题在哪里', detail: '多维度诊断现状，发现增长机会点', icon: 'Search' },
  { title: '策略', text: '明确增长优先级', detail: '制定增长策略与执行路径，明确关键动作', icon: 'Lightbulb' },
  { title: '落地', text: '形成可执行动作', detail: '陪品牌把动作拆清楚，确保策略有效落地', icon: 'Rocket' },
  { title: '复盘', text: '用数据验证结果', detail: '数据复盘分析，评估效果与问题', icon: 'PieChart' },
  { title: '迭代', text: '持续优化增长模型', detail: '优化迭代策略，持续提升增长效果', icon: 'RefreshCw' }
];
