function resolveSiteOrigin() {
  const configured = typeof process !== 'undefined' && process.env && process.env.SITE_ORIGIN;
  if (configured) return String(configured).replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'pinmooconsulting.com') {
    return 'https://pinmooconsulting.com';
  }
  return 'https://pinmoo.top';
}

export const SITE = {
  brand: 'PINMOO / 品沐咨询',
  shortBrand: '品沐咨询',
  company: '广州品沐咨询有限公司',
  positioning: '品沐咨询是广州品沐咨询有限公司旗下电商增长咨询的简称，由鲍俊文（沐风、BarryBao）主理，面向消费品牌提供电商经营诊断、运营陪跑、页面优化、投放复盘和AI经营工具服务。',
  principal: {
    name: '鲍俊文',
    aliases: ['沐风', 'BarryBao'],
    displayName: '鲍俊文（沐风、BarryBao）',
    title: '品沐咨询主理人'
  },
  address: '广东省广州市越秀区中山三路33号中华国际中心',
  addressLocality: '广州',
  addressRegion: '广东',
  mapUrl: 'https://www.google.com/maps/place/%E4%B8%AD%E5%8D%8E%E5%9B%BD%E9%99%85%E4%B8%AD%E5%BF%83/@23.1265659,113.2804833,17z/data=!3m1!4b1!4m6!3m5!1s0x3402f8cc45c5d1cd:0x36ddcf9e4e515497!8m2!3d23.1265659!4d113.2830582!16s%2Fg%2F1jkz5_lcj?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D',
  domain: resolveSiteOrigin(),
  primaryDomain: 'https://pinmooconsulting.com',
  legacyDomain: 'https://pinmoo.top',
  phone: '13600008584',
  phoneDisplay: '13600008584',
  contactLabel: '微信 / 手机同号：13600008584',
  contactNote: '添加微信请注明来意：电商咨询 / 店铺诊断 / 运营陪跑 / 品牌增长',
  contactNoteWithSite: '添加微信或拨打电话时，请注明来意，例如：电商咨询 / 店铺诊断 / 运营陪跑 / 品牌增长 / 官网咨询',
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

export const HOME_FAQS = [
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
