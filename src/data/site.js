export const SITE = {
  brand: 'PINMOO / 品沐咨询',
  shortBrand: '品沐咨询',
  company: '广州品沐咨询有限公司',
  address: '广东省广州市越秀区中山三路33号中华国际中心',
  addressLocality: '广州',
  addressRegion: '广东',
  mapUrl: 'https://www.google.com/maps/place/%E4%B8%AD%E5%8D%8E%E5%9B%BD%E9%99%85%E4%B8%AD%E5%BF%83/@23.1265659,113.2804833,17z/data=!3m1!4b1!4m6!3m5!1s0x3402f8cc45c5d1cd:0x36ddcf9e4e515497!8m2!3d23.1265659!4d113.2830582!16s%2Fg%2F1jkz5_lcj?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D',
  domain: 'https://pinmoo.top',
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
  { label: '电商经营报告', href: '/ai-diagnosis/', match: '/ai-diagnosis' },
  { label: '服务介绍', href: '/services/', match: '/services' },
  { label: '案例展示', href: '/cases/', match: '/cases' },
  { label: '关于品沐', href: '/about/', match: '/about' },
  { label: '联系我们', href: '/contact/', match: '/contact' }
];

export const TRUST_STATS = [
  { value: 50, suffix: '+', label: '品牌项目经验' },
  { value: 6, suffix: '', label: '大主流电商平台' },
  { value: 8, suffix: '+', label: '消费行业实战经验' },
  { value: 4, suffix: '', label: '从诊断到落地陪跑' }
];

export const PLATFORM_LIST = ['天猫', '京东', '抖音', '小红书', '视频号', '拼多多'];

export const METHODOLOGY = [
  { title: '诊断', text: '看清问题在哪里', detail: '多维度诊断现状，发现增长机会点', icon: 'Search' },
  { title: '策略', text: '明确增长优先级', detail: '制定增长策略与执行路径，明确关键动作', icon: 'Lightbulb' },
  { title: '落地', text: '形成可执行动作', detail: '陪品牌把动作拆清楚，确保策略有效落地', icon: 'Rocket' },
  { title: '复盘', text: '用数据验证结果', detail: '数据复盘分析，评估效果与问题', icon: 'PieChart' },
  { title: '迭代', text: '持续优化增长模型', detail: '优化迭代策略，持续提升增长效果', icon: 'RefreshCw' }
];
