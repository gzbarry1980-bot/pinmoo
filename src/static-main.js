import { SITE, NAV_ITEMS, TRUST_STATS, HOME_FAQS, METHODOLOGY, PLATFORM_LIST } from './data/site.js';
import { services, serviceFaqs, serviceModel, serviceModelIntro, serviceModelName, serviceProcess, pricingNote } from './data/services.js';
import { cases, caseFilters, reservedCases, getCaseBySlug } from './data/cases.js';
import { CASE_EN, EN_TEXT, FILTER_EN_TO_CN } from './data/en-text.js';
import { chinaEcommercePage, getLeadPageBySlug, leadPages, leadPathSteps, proofAssets } from './data/lead-pages.js';
import { metricDictionary } from './data/resources.js';
import { getInsightBySlug, insightAuthor, insights } from './data/insights.js';

const root = document.getElementById('root');
const internationalHost = window.location.hostname === 'pinmooconsulting.com' || window.location.hostname === 'www.pinmooconsulting.com';
let requestedPathname = normalizePath(window.location.pathname);
let currentLang = languageForPath(requestedPathname);
let pathname = stripLangPath(requestedPathname);

function normalizePath(value) {
  return (value || '/').replace(/\/+$/, '') || '/';
}

function stripLangPath(value) {
  const path = normalizePath(value);
  if (path === '/en') return '/';
  if (path.indexOf('/en/') === 0) return normalizePath(path.slice(3));
  if (path === '/zh') return '/';
  if (path.indexOf('/zh/') === 0) return normalizePath(path.slice(3));
  return path;
}

function languageForPath(value) {
  const path = normalizePath(value);
  if (internationalHost) {
    return path === '/zh' || path.indexOf('/zh/') === 0 ? 'zh' : 'en';
  }
  return path === '/en' || path.indexOf('/en/') === 0 || path === '/china-ecommerce-consulting' ? 'en' : 'zh';
}

function internationalChinesePath(href) {
  if (href === '/') return '/zh/';
  return '/zh' + href;
}

function localizeHref(href) {
  if (!href || href[0] !== '/' || href.indexOf('//') === 0) return href;
  if (internationalHost) {
    if (href === '/ai-diagnosis/' || href.indexOf('/ai-diagnosis/') === 0) return 'https://agent.pinmoo.top/';
    if (currentLang === 'zh') {
      if (href === '/zh/' || href === '/zh' || href.indexOf('/zh/') === 0) return href;
      if (href.indexOf('/services/') === 0 && href !== '/services/') return '/zh/services/';
      if (href === '/china-ecommerce-consulting/') return '/zh/';
      if (href === '/en/' || href === '/en') return '/zh/';
      if (href.indexOf('/en/') === 0) return internationalChinesePath(href.slice(3));
      return internationalChinesePath(href);
    }
    if (href.indexOf('/insights/') === 0 || href.indexOf('/resources/') === 0) return '/china-ecommerce-consulting/';
    if (href.indexOf('/services/') === 0 && href !== '/services/') return '/china-ecommerce-consulting/';
    if (href === '/en/' || href === '/en') return '/';
    if (href.indexOf('/en/') === 0) return href.slice(3);
    return href;
  }
  if (currentLang !== 'en') return href;
  if (href === '/china-ecommerce-consulting/' || href.indexOf('/insights/') === 0) return href;
  if (href.indexOf('/services/') === 0 && href !== '/services/') {
    const slug = href.split('/')[2];
    if (getLeadPageBySlug(slug)) return '/china-ecommerce-consulting/';
  }
  if (href === '/') return '/en/';
  return '/en' + href;
}

function currentPathForLang(lang) {
  if (internationalHost) {
    if (lang === 'zh') {
      if (pathname === '/china-ecommerce-consulting') return '/zh/';
      return pathname === '/' ? '/zh/' : '/zh' + pathname + '/';
    }
    if (pathname.indexOf('/insights') === 0 || pathname.indexOf('/resources') === 0) return SITE.domain + '/';
    return SITE.domain + (pathname === '/' ? '/' : pathname + '/');
  }
  const isLeadLanding = pathname.indexOf('/services/') === 0 && getLeadPageBySlug(pathname.split('/')[2]);
  if (lang === 'en' && isLeadLanding) return '/china-ecommerce-consulting/';
  if (lang === 'en' && pathname.indexOf('/insights') === 0) return '/en/';
  if (pathname === '/china-ecommerce-consulting') return lang === 'en' ? '/china-ecommerce-consulting/' : '/';
  if (pathname.indexOf('/resources/') === 0) return pathname + '/';
  if (lang === 'en') return pathname === '/' ? '/en/' : '/en' + pathname + '/';
  return pathname === '/' ? '/' : pathname + '/';
}

function isEn() {
  return currentLang === 'en';
}

function icon(name, size) {
  const s = size || 22;
  const paths = {
    ArrowRight: '<path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>',
    BadgeCheck: '<path d="M12 3l2.2 2.1 3-.3.7 2.9 2.5 1.6-1.4 2.7 1.4 2.7-2.5 1.6-.7 2.9-3-.3L12 21l-2.2-2.1-3 .3-.7-2.9-2.5-1.6L5 12 3.6 9.3l2.5-1.6.7-2.9 3 .3L12 3z"/><path d="m8.8 12.1 2.1 2.1 4.4-4.4"/>',
    BarChart3: '<path d="M4 19V9"/><path d="M12 19V5"/><path d="M20 19v-7"/>',
    BookOpen: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5V21"/>',
    BriefcaseBusiness: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 12h18"/>',
    Building2: '<path d="M6 21V4h12v17"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
    CheckCircle2: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
    ChevronDown: '<path d="m6 9 6 6 6-6"/>',
    CircleUserRound: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a7 7 0 0 1 11 0"/>',
    ClipboardList: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    Clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    FilePenLine: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 17l5-5 2 2-5 5H9z"/>',
    GraduationCap: '<path d="M3 8l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
    Image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="2"/><path d="m21 16-5-5L5 19"/>',
    Layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
    Leaf: '<path d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z"/><path d="M5 19c3-5 7-8 14-14"/>',
    Lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4z"/>',
    LineChart: '<path d="M4 19h16"/><path d="m5 15 4-5 4 3 6-8"/>',
    MapPinned: '<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z"/><circle cx="12" cy="10" r="2"/>',
    Menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    MessageCircle: '<path d="M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-5.1A8.5 8.5 0 1 1 21 11.5z"/>',
    MessagesSquare: '<path d="M4 5h12v9H7l-3 3z"/><path d="M9 15h8l3 3V9h-3"/>',
    PackageCheck: '<path d="m12 3 8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/><path d="m9 15 2 2 4-4"/>',
    Phone: '<path d="M22 16.5v3a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 18.7 18.7 0 0 1-5.8-5.8 19 19 0 0 1-3-8.3A2 2 0 0 1 4.7 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.7 9.8a16 16 0 0 0 5.5 5.5l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.2z"/>',
    PieChart: '<path d="M12 3v9h9"/><path d="M21 12a9 9 0 1 1-9-9"/>',
    RefreshCw: '<path d="M20 12a8 8 0 0 1-14.9 4"/><path d="M4 16v5h5"/><path d="M4 12A8 8 0 0 1 18.9 8"/><path d="M20 8V3h-5"/>',
    Rocket: '<path d="M5 15c2-6 7-10 14-10 0 7-4 12-10 14z"/><path d="M9 19l-4 2 2-4"/><circle cx="15" cy="9" r="2"/>',
    Search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    Send: '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>',
    ShieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    ShoppingBag: '<path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    Store: '<path d="M4 10h16l-1-5H5z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    Target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    TrendingUp: '<path d="M3 17h18"/><path d="m4 14 5-5 4 4 7-8"/><path d="M15 5h5v5"/>',
    Users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    X: '<path d="M6 6l12 12M18 6 6 18"/>',
    Zap: '<path d="M13 2 3 14h8l-1 8 10-12h-8z"/>'
  };
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.Target) + '</svg>';
}

function isActive(item) {
  if (item.match === '/') return pathname === '/';
  return pathname.indexOf(item.match) === 0;
}

function logo(cls) {
  const webp = assetWebp(SITE.logo);
  return '<span class="logo-frame ' + cls + '"><picture>' + (webp ? '<source srcset="' + webp + '" type="image/webp">' : '') + '<img src="' + SITE.logo + '" alt="PINMOO 品沐咨询 Logo" decoding="async" fetchpriority="high"></picture></span>';
}

function assetWebp(src) {
  if (!src || !/\.(png|jpe?g)$/i.test(src)) return '';
  return src.replace(/\.(png|jpe?g)$/i, '.webp');
}

function ResponsiveImage(src, alt, loading, attrs) {
  const webp = assetWebp(src);
  const loadingAttr = loading ? ' loading="' + loading + '"' : '';
  const extraAttrs = attrs ? ' ' + attrs : '';
  const img = '<img src="' + src + '" alt="' + alt + '"' + loadingAttr + extraAttrs + '>';
  if (!webp) return img;
  return '<picture><source srcset="' + webp + '" type="image/webp">' + img + '</picture>';
}

function Header() {
  const language = '<div class="language-switch" aria-label="Language switch"><a class="' + (!isEn() ? 'active' : '') + '" href="' + currentPathForLang('zh') + '">中文</a><a class="' + (isEn() ? 'active' : '') + '" href="' + currentPathForLang('en') + '">EN</a></div>';
  const nav = NAV_ITEMS.filter(function(item) { return !item.zhOnly || !isEn(); }).map(function(item) { return '<a class="' + (isActive(item) ? 'active' : '') + '" href="' + localizeHref(item.href) + '">' + (isEn() ? (EN_TEXT[item.label] || item.label) : item.label) + '</a>'; }).join('') + language;
  return '<header class="site-header"><div class="container header-shell"><a class="brand-link" href="' + localizeHref('/') + '" aria-label="PINMOO 品沐咨询首页">' + logo('logo-frame-header') + '</a><nav class="desktop-nav" aria-label="主导航">' + nav + '</nav><div class="header-actions"><a class="header-cta" href="' + localizeHref('/contact/') + '">' + (isEn() ? 'Book' : '预约咨询') + '</a></div><button class="mobile-menu-btn" type="button" aria-label="打开导航" aria-expanded="false">' + icon('Menu', 24) + '</button></div><div class="mobile-nav-panel"><nav aria-label="移动端导航">' + nav + '<a class="mobile-nav-cta" href="' + localizeHref('/contact/') + '">' + (isEn() ? 'Book a Consultation' : '预约咨询') + '</a></nav></div></header>';
}

function Footer() {
  const resourceLink = internationalHost
    ? (isEn() ? '<a href="/china-ecommerce-consulting/">China e-commerce guide</a>' : '<a href="/zh/resources/ecommerce-metrics-dictionary/">\u7ecf\u8425\u6307\u6807\u8bcd\u5178</a>')
    : '<a href="/resources/ecommerce-metrics-dictionary/">' + (isEn() ? 'Metric glossary' : '经营指标词典') + '</a>';
  const links = NAV_ITEMS.filter(function(item) { return !item.zhOnly || !isEn(); }).map(function(item) { return '<a href="' + localizeHref(item.href) + '">' + (isEn() ? (EN_TEXT[item.label] || item.label) : item.label) + '</a>'; }).join('') + resourceLink;
  return '<footer class="site-footer"><div class="container footer-grid"><div class="footer-brand">' + logo('logo-frame-footer') + '<p>' + SITE.company + '</p><p>专注电商战略咨询与品牌增长陪跑</p></div><div><h2>导航链接</h2><div class="footer-links">' + links + '</div></div><div><h2>联系方式</h2><p>' + SITE.contactLabel + '</p><p>' + SITE.address + '</p><p>' + SITE.contactNote + '</p></div></div><div class="footer-bottom">© 2026 ' + SITE.company + '. All rights reserved.</div></footer>';
}

function ButtonLink(label, href, variant, withIcon) {
  return '<a class="btn btn-' + (variant || 'primary') + '" href="' + localizeHref(href || '/contact/') + '"><span>' + label + '</span>' + (withIcon === false ? '' : icon('ArrowRight', 18)) + '</a>';
}

function SectionIntro(title, text, align) {
  return '<div class="reveal section-intro ' + (align === 'left' ? 'section-intro-left' : '') + '"><h2>' + title + '</h2>' + (text ? '<p>' + text + '</p>' : '') + '</div>';
}

function PageHero(title, subtitle, compact, extra, visual) {
  const useVisual = visual && !isEn();
  const visualHtml = useVisual
    ? '<div class="reveal page-hero-visual page-hero-visual-' + visual.key + '"><img src="' + visual.src + '" alt="' + visual.alt + '" width="1400" height="636" decoding="async" fetchpriority="high"></div>'
    : '';
  return '<section class="page-hero ' + (compact ? 'page-hero-compact ' : '') + (useVisual ? 'page-hero-has-visual' : '') + '"><div class="hero-grid-bg"></div><div class="container page-hero-inner"><div class="reveal page-hero-copy"><h1>' + title + '</h1>' + (subtitle ? '<p>' + subtitle + '</p>' : '') + (extra || '') + '</div>' + visualHtml + '</div></section>';
}

function CtaBand(title, text, button) {
  const t = title || '你的品牌，下一步该先优化哪里？';
  const p = text || '留下需求，或直接添加微信联系。我们会从平台、商品、流量、转化和团队执行五个维度，帮你判断最值得优先解决的问题。';
  return '<div class="container"><div class="reveal cta-band-wrap"><section class="cta-band"><div class="cta-band-icon">' + icon('MessageCircle', 34) + '</div><div class="cta-band-text"><h2>' + t + '</h2><p>' + p + '</p></div><div class="cta-band-contact"><strong>' + SITE.contactLabel + '</strong><span>' + SITE.contactNote + '</span></div>' + ButtonLink(button || '预约咨询', '/contact/', 'primary', false) + '</section></div></div>';
}

function HomeInquirySection() {
  const cards = [
    {
      icon: 'Search',
      title: '不知道问题先从哪拆',
      text: '适合增长乏力、团队各说各话、老板需要先判断优先级的品牌。',
      href: '/services/ecommerce-diagnosis/',
      cta: '看电商战略诊断'
    },
    {
      icon: 'Store',
      title: '有流量但成交承接弱',
      text: '适合主图详情页、SKU、客服、评价和店铺首页都需要重新梳理的项目。',
      href: '/services/store-diagnosis/',
      cta: '看店铺诊断'
    },
    {
      icon: 'BarChart3',
      title: '数据很多但复盘不清',
      text: '适合每周要看支付、净销售额、退款、推广 ROI 和商品风险的运营团队。',
      href: '/services/business-advisor-data-diagnosis/',
      cta: '看数据诊断'
    },
    {
      icon: 'MessageCircle',
      title: '想先确认是否值得合作',
      text: '直接添加微信，发品牌、平台、当前问题和希望先看的方向，先做基础判断。',
      href: '/contact/',
      cta: '发起基础诊断'
    }
  ].map(function(item) {
    return '<article class="inquiry-path-card reveal"><div>' + icon(item.icon, 26) + '<h3>' + item.title + '</h3></div><p>' + item.text + '</p><a class="outline-link" href="' + localizeHref(item.href) + '">' + item.cta + ' ' + icon('ArrowRight', 16) + '</a></article>';
  }).join('');
  return '<section class="section inquiry-path-section"><div class="container">' + SectionIntro('先从一个具体问题进入，询盘会更有效', '如果你暂时不知道该买什么服务，可以先按当前最像自己的问题进入。品沐会先帮你判断问题是否清楚、是否值得优先解决、下一步该看哪些资料。') + '<div class="inquiry-path-grid">' + cards + '</div></div></section>';
}

function FirstDiagnosisSection() {
  const items = [
    ['你发来什么', '品牌/店铺名称、主要平台、当前最想解决的问题、可公开的店铺或商品链接。', 'FilePenLine'],
    ['我们先看什么', '平台路径、商品与页面、流量质量、退款风险、客服承接和团队复盘节奏。', 'Target'],
    ['你会得到什么', '一个初步判断：问题优先级、建议先看资料、是否适合进一步诊断或陪跑。', 'CheckCircle2']
  ].map(function(item, index) {
    return '<div class="diagnosis-step reveal"><span>0' + (index + 1) + '</span>' + icon(item[2], 28) + '<h3>' + item[0] + '</h3><p>' + item[1] + '</p></div>';
  }).join('');
  return '<section class="section first-diagnosis-section"><div class="container first-diagnosis-layout"><div class="reveal first-diagnosis-copy"><p class="section-eyebrow">低门槛开始</p><h2>先做一次免费基础判断，再决定是否深入合作</h2><p>很多品牌迟迟没有咨询，是因为不知道该怎么描述问题。你不用先准备完整方案，只要把现状说清楚一点，我们会先帮你判断下一步该从哪里切入。</p>' + ButtonLink('去联系页发起诊断', '/contact/', 'primary', true) + '</div><div class="first-diagnosis-grid">' + items + '</div></div></section>';
}

const serviceLandingById = {
  'strategy-diagnosis': 'ecommerce-diagnosis',
  'operation-coaching': 'tmall-jd-consultant',
  'conversion-optimization': 'page-conversion-optimization',
  'content-seeding': 'douyin-xiaohongshu-growth',
  'data-review': 'ecommerce-roi-review',
  'membership-private-domain': 'member-repurchase-private-domain'
};

function ServiceCard(service) {
  const slug = serviceLandingById[service.id] || 'ecommerce-diagnosis';
  const cta = isEn() ? 'Explore this consulting service' : '了解' + service.title + '方案';
  return '<article class="service-card"><div class="card-icon">' + icon(service.icon, 28) + '</div><h3>' + service.title + '</h3><p>' + service.short + '</p><a href="' + localizeHref('/services/' + slug + '/') + '" class="text-link">' + cta + ' ' + icon('ArrowRight', 16) + '</a></article>';
}

function CaseCard(item) {
  const href = localizeHref('/cases/' + item.slug + '/');
  const enCase = CASE_EN[item.slug];
  const imageAlt = isEn()
    ? (enCase?.industry || item.industry) + ' ' + (enCase?.serviceType || item.serviceType) + ' case study'
    : item.industry + '品牌在' + item.platform + '平台的' + item.serviceType + '项目案例';
  const cta = isEn() ? 'View ' + (enCase?.industry || item.industry) + ' case study' : '查看' + item.industry + '电商优化案例';
  return '<article class="case-card"><a class="case-image" href="' + href + '" aria-label="查看' + item.title + '">' + ResponsiveImage(item.image, imageAlt, 'lazy', 'decoding="async"') + '</a><div class="case-card-body"><div class="tag-row"><span>' + item.industry + '</span><span>' + item.platform + '</span></div><h3><a href="' + href + '">' + item.title + '</a></h3><p>' + item.summary + '</p><a class="outline-link" href="' + href + '">' + cta + ' ' + icon('ArrowRight', 16) + '</a></div></article>';
}

function InsightCard(article) {
  const href = '/insights/' + article.slug + '/';
  return '<article class="insight-card reveal"><div class="insight-card-meta"><span>' + article.category + '</span><time datetime="' + article.updated + '">' + article.updated + '</time></div><h3><a href="' + href + '">' + article.shortTitle + '</a></h3><p>' + article.summary + '</p><div class="insight-card-footer"><span>' + article.readTime + '</span><a class="outline-link" href="' + href + '">阅读' + article.shortTitle + ' ' + icon('ArrowRight', 16) + '</a></div></article>';
}

function HomeInsightsSection() {
  if (isEn()) return '';
  const cards = insights.map(InsightCard).join('');
  return '<section class="section home-insights-section"><div class="container">' + SectionIntro('经营洞察：把数据变成可以执行的判断', '围绕经营周报、退款治理和投放复盘，沉淀品沐在项目中反复使用的方法、口径和执行清单。') + '<div class="insight-card-grid">' + cards + '</div><div class="center-actions">' + ButtonLink('查看全部经营洞察', '/insights/', 'secondary', true) + '</div></div></section>';
}

function AiWeeklyReportSection() {
  if (isEn()) return '';
  const workspaceHref = internationalHost ? localizeHref('/contact/') : 'https://agent.pinmoo.top/';
  const workspaceLabel = internationalHost ? '咨询AI经营周报方案' : '查看AI经营周报工作台';
  const modules = [
    ['读取数据', '经营概览、商品、流量、客户、客服、直播、推广计划与退款报表'],
    ['统一口径', '区分支付金额、店铺绩效净销售额、退款金额与推广计划花费'],
    ['形成判断', '同时检查成交规模、退款风险、付费流量质量、商品表现与转化承接'],
    ['输出动作', '生成图表快照、品牌方周报、Word文档、微信群话术和下周期行动清单']
  ].map(function(item, index) {
    return '<div class="ai-report-step"><span>0' + (index + 1) + '</span><div><strong>' + item[0] + '</strong><p>' + item[1] + '</p></div></div>';
  }).join('');
  return '<section class="section ai-report-evidence-section"><div class="container ai-report-evidence-grid"><div class="reveal ai-report-evidence-copy"><p class="section-eyebrow">PINMOO AI WEEKLY REPORT</p><h2>AI电商经营周报不是自动写总结，而是先统一数据口径</h2><p>品沐的第一阶段工作流面向天猫与生意参谋数据。系统负责识别文件和组织报告，顾问方法负责解释口径、判断风险与安排动作，避免只根据销售额或整体ROI下结论。</p><div class="ai-report-steps">' + modules + '</div><div class="ai-report-actions"><a class="btn btn-primary" href="' + workspaceHref + '">' + workspaceLabel + ' ' + icon('ArrowRight', 18) + '</a><a class="text-link" href="' + localizeHref('/services/tmall-business-weekly-report/') + '">了解天猫经营周报服务 ' + icon('ArrowRight', 16) + '</a></div></div><div class="reveal ai-report-evidence-visual"><img src="/assets/visuals/insights-weekly-report.webp" alt="天猫生意参谋AI电商经营周报的退款、投放ROI、流量质量和商品结构分析示例" width="1400" height="636" loading="lazy" decoding="async"></div></div></section>';
}

function HomeFaqSection() {
  if (isEn()) return '';
  const items = HOME_FAQS.map(function(item, index) {
    return '<div class="faq-item ' + (index === 0 ? 'open' : '') + '"><button type="button"><span>' + item.q + '</span>' + icon('ChevronDown', 18) + '</button><div class="faq-answer"><p>' + item.a + '</p></div></div>';
  }).join('');
  return '<section class="section home-faq-section"><div class="container home-faq-grid"><div class="reveal home-faq-intro"><p class="section-eyebrow">DIRECT ANSWERS</p><h2>品牌做电商时，常见问题先直接回答</h2><p>这些回答基于品沐在店铺诊断、经营复盘和运营陪跑中反复遇到的问题。具体项目仍需结合平台、类目、统计周期和团队执行能力判断。</p><a class="text-link" href="' + localizeHref('/contact/') + '">带着具体问题咨询品沐 ' + icon('ArrowRight', 16) + '</a></div><div class="faq-list">' + items + '</div></div></section>';
}

function DashboardVisual() {
  return '<div class="dashboard-visual" aria-label="电商数据看板示意图"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="growth-arrow"></div><div class="metric-card metric-main"><span>净销售额趋势</span><strong>¥ 11,936,420</strong><em>+16.8%</em><svg viewBox="0 0 260 80" role="img" aria-label="增长趋势线"><polyline points="6,62 38,48 70,52 102,45 136,50 170,38 205,34 250,12" fill="none" stroke="#255BFF" stroke-width="5" stroke-linecap="round"></polyline><path d="M6 72 C70 38,120 72,250 22 L250 80 L6 80 Z" fill="rgba(74,91,255,.12)"></path></svg></div><div class="metric-card metric-roi"><span>付费 ROI</span><strong>3.42</strong><em>计划级拆解</em></div><div class="metric-card metric-donut"><span>流量结构</span><div class="donut"></div></div><div class="metric-card metric-rate"><span>退款治理</span><strong>4.21%</strong><div class="bars"><i></i><i></i><i></i><i></i><i></i></div></div></div>';
}

function Home() {
  const stats = TRUST_STATS.map(function(item, index) { const names = ['BadgeCheck', 'Layers', 'BriefcaseBusiness', 'Users']; return '<div class="reveal stat-card"><span class="stat-icon">' + icon(names[index], 30) + '</span><div class="stat-copy"><strong><span class="stat-number">' + item.value + item.suffix + '</span></strong><span>' + item.label + '</span></div></div>'; }).join('');
  const serviceGrid = services.map(function(service, index) { return '<div class="reveal ' + (index === 0 || index === 1 ? 'bento-large' : '') + '">' + ServiceCard(service) + '</div>'; }).join('');
  const methods = METHODOLOGY.map(function(step, index) { return '<div class="reveal method-step"><span class="step-index">0' + (index + 1) + '</span><div class="method-icon">' + icon(step.icon, 32) + '</div><h3>' + step.title + '</h3><strong>' + step.text + '</strong><p>' + step.detail + '</p></div>'; }).join('');
  const previewCases = cases.slice(0, 4).map(function(item) { return '<div class="reveal">' + CaseCard(item) + '</div>'; }).join('');
  const heroVisual = isEn()
    ? DashboardVisual()
    : '<div class="hero-editorial-visual"><picture><source media="(min-width: 561px)" srcset="/assets/visuals/home-growth-dashboard.webp"><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="电商净销售额、投放回报与退款治理数据看板示意图" width="1400" height="748" decoding="async" fetchpriority="high"></picture></div>';
  return '<section class="home-hero"><div class="hero-grid-bg"></div><div class="container home-hero-inner"><div class="reveal hero-copy"><p class="hero-kicker">' + (isEn() ? 'China e-commerce diagnosis / consulting' : '广州电商咨询 / 免费基础诊断') + '</p><h1>先找准电商增长卡点，再决定怎么花钱</h1><p class="hero-subtitle">品沐咨询帮助品牌从平台、商品、页面、投放、客服、直播和复购中找出真正影响增长的环节，先判断优先级，再进入诊断、陪跑或专项优化。</p><p class="hero-support">你可以先发来品牌、平台和当前问题，我们会做一次基础判断：问题是否清楚、资料是否足够、下一步该从哪里切入。</p><div class="hero-actions">' + ButtonLink('免费基础诊断', '/contact/', 'primary', false) + ButtonLink('查看服务介绍', '/services/', 'secondary', false) + '</div><div class="hero-proof-row"><span>24小时内回复</span><span>先判断是否适合合作</span><span>不做绝对增长承诺</span></div></div><div class="reveal hero-visual-wrap">' + heroVisual + '</div></div></section><section class="section trust-section"><div class="container">' + SectionIntro('服务多个消费品牌，覆盖主流电商平台', '覆盖天猫、京东、抖音、小红书、视频号、拼多多等主流平台，服务行业包括茶饮、服饰、营养品、个护电器、快消品、酒水等。') + '<div class="stats-grid">' + stats + '</div></div></section>' + HomeInquirySection() + '<section class="section services-preview" id="services"><div class="container split-heading">' + SectionIntro('围绕品牌电商增长，我们提供从诊断到落地的系统服务', '把平台、商品、内容、投放、转化和复购放在同一套增长链路里看，而不是只解决单点问题。', 'left') + '</div><div class="container bento-grid">' + serviceGrid + '</div></section>' + AiWeeklyReportSection() + FirstDiagnosisSection() + '<section class="section method-section"><div class="container">' + SectionIntro('我们用一套可落地的方法，拆解电商增长问题', '品沐咨询不是只给方向，而是通过诊断、策略、执行陪跑和复盘机制，把复杂的电商增长问题拆成可执行动作。') + '<div class="method-line">' + methods + '</div></div></section><section class="section cases-preview" id="cases"><div class="container">' + SectionIntro('真实项目经验，沉淀可复用的增长方法', '每一个项目，都来自品牌在平台经营、内容表达、页面转化、投放复盘或用户承接中的真实问题。') + '<div class="home-case-grid">' + previewCases + '</div><div class="center-actions">' + ButtonLink('查看全部项目经验', '/cases/', 'primary', true) + '</div></div></section>' + HomeInsightsSection() + HomeFaqSection() + '<section class="section about-preview"><div class="container about-preview-grid"><div class="reveal"><h2>更懂实战，也懂 AI 工具的电商增长伙伴</h2><p>品沐咨询是一家面向传统品牌与电商企业的AI电商增长顾问公司，基于多年天猫、京东、抖音、小红书、私域运营经验，结合大模型工具，帮助企业完成从经营诊断、内容生产、客服承接、私域激活到数据复盘的全链路数字化升级。</p>' + ButtonLink('了解品沐咨询与顾问背景', '/about/', 'primary', true) + '</div><div class="reveal office-visual"><img src="/assets/about-brand.svg" alt="广州品沐咨询有限公司的电商实战与AI工具协同方法" loading="lazy"></div></div></section>' + CtaBand('不确定该先做诊断、陪跑还是页面优化？', '先把品牌、平台和当前问题发给我们。品沐会先帮你做基础判断，再建议是否进入正式诊断或专项合作。', '免费基础诊断');
}

function Services() {
  const model = serviceModel.map(function(item, index) { const names = ['Target','MapPinned','PackageCheck','Image','LineChart']; return '<div class="reveal model-card"><span>' + item.code + '</span>' + icon(names[index], 30) + '<small>' + item.title + '</small><h3>' + item.name + '</h3><p>' + item.text + '</p></div>'; }).join('');
  const details = services.map(function(service) { return '<div class="reveal service-detail-card"><div class="service-detail-head"><div class="card-icon">' + icon(service.icon, 30) + '</div><div><h2>' + service.title + '</h2><p>' + service.short + '</p></div></div><div class="service-detail-columns"><div><h3>适合谁</h3><ul>' + service.fit.map(li).join('') + '</ul></div><div><h3>解决什么问题</h3><ul>' + service.problems.map(li).join('') + '</ul></div><div><h3>主要服务内容</h3><ul>' + service.content.map(li).join('') + '</ul></div><div><h3>交付成果</h3><ul>' + service.deliverables.map(li).join('') + '</ul></div></div><div class="service-fee"><strong>费用参考</strong><p>' + service.fee + '</p><span>' + pricingNote + '</span></div><div class="detail-cta">' + ButtonLink('预约咨询', '/contact/', 'primary', true) + '</div></div>'; }).join('');
  const process = serviceProcess.map(function(item, index) { return '<div class="reveal process-card"><span>0' + (index + 1) + '</span>' + icon(item.icon, 30) + '<h3>' + item.title + '</h3><p>' + item.text + '</p></div>'; }).join('');
  const faqs = serviceFaqs.map(function(item, index) { return '<div class="faq-item ' + (index === 0 ? 'open' : '') + '"><button type="button"><span>' + item.q + '</span>' + icon('ChevronDown', 18) + '</button><div class="faq-answer"><p>' + item.a + '</p></div></div>'; }).join('');
  return PageHero('从诊断到陪跑，帮品牌建立可持续增长路径', '品沐咨询围绕电商业务中的平台选择、商品结构、内容种草、页面转化、广告投放、直播运营、会员复购等关键环节，为品牌提供诊断、策略、执行陪跑和复盘优化服务。', false, '', { key: 'services', src: '/assets/visuals/service-growth-path.webp', alt: '从诊断、策略、陪跑到复盘的电商增长路径示意图' }) + LeadEntrySection() + '<section class="section model-section"><div class="container">' + SectionIntro(serviceModelName, serviceModelIntro) + '<div class="model-grid">' + model + '</div></div></section><section class="section service-detail-section"><div class="container">' + SectionIntro('我们提供的核心服务') + '<div class="service-detail-list">' + details + '</div></div></section>' + ProofSection() + '<section class="section process-section"><div class="container">' + SectionIntro('我们如何陪品牌一起解决问题？') + '<div class="process-grid">' + process + '</div></div></section><section class="section faq-section"><div class="container narrow-container">' + SectionIntro('常见问题') + '<div class="faq-list">' + faqs + '</div></div></section>' + CtaBand('想知道你的品牌下一步该先优化哪里？', '从专业诊断开始，帮你找到增长突破口。');
}

function li(item) { return '<li>' + item + '</li>'; }

function LeadPageCard(page) {
  return '<article class="lead-card reveal"><span>' + page.eyebrow + '</span><h3>' + page.title + '</h3><p>' + page.subtitle + '</p><a class="outline-link" href="' + localizeHref('/services/' + page.slug + '/') + '">查看诊断方案 ' + icon('ArrowRight', 16) + '</a></article>';
}

function LeadEntrySection() {
  if (isEn()) {
    return '<section class="section lead-entry-section"><div class="container">' + SectionIntro('Enter by Search Intent', 'For overseas or cross-border brands, the clearest entry point is to evaluate how your products should be sold in China.') + '<div class="lead-card-grid lead-card-grid-single"><article class="lead-card reveal"><span>China e-commerce entry</span><h3>How to Sell Products in China</h3><p>Clarify platform priority, product messaging, content seeding, store conversion and next-step actions for China e-commerce.</p><a class="outline-link" href="' + localizeHref('/china-ecommerce-consulting/') + '">View China Entry Page ' + icon('ArrowRight', 16) + '</a></article></div></div></section>';
  }
  const cards = leadPages.map(LeadPageCard).join('');
  return '<section class="section lead-entry-section"><div class="container">' + SectionIntro('按问题进入，更快找到适合你的咨询方案', '不同品牌卡住的位置不一样。你可以直接从当前最像自己的问题进入，先看诊断重点、交付物和适合场景。') + '<div class="lead-card-grid">' + cards + '</div></div></section>';
}

function ProofSection() {
  if (isEn()) {
    const cards = [
      ['Diagnosis Memo', 'ClipboardList', 'Clarify platform, product, traffic, conversion and team execution issues before scaling.', ['Current status', 'Core issues', 'Priority']],
      ['Action Roadmap', 'CheckCircle2', 'Turn strategic advice into tasks, owners and review cycles.', ['Actions', 'Owners', 'Review rhythm']],
      ['Page Messaging', 'Image', 'Improve product pages, hero images, SKU logic and conversion messaging.', ['Hero image', 'Detail page', 'Conversion']],
      ['Review Mechanism', 'BarChart3', 'Use data review to improve campaigns, content, ads and store conversion.', ['Data review', 'Meeting rhythm', 'Iteration']]
    ].map(function(item) {
      return '<article class="proof-card reveal"><div class="card-icon">' + icon(item[1], 26) + '</div><h3>' + item[0] + '</h3><p>' + item[2] + '</p><div>' + item[3].map(function(point) { return '<span>' + point + '</span>'; }).join('') + '</div></article>';
    }).join('');
    return '<section class="section proof-section"><div class="container">' + SectionIntro('Practical Deliverables, Not Just Advice', 'PINMOO focuses on materials that can be discussed, assigned, executed and reviewed by your team.') + '<div class="proof-grid">' + cards + '</div></div></section>';
  }
  const cards = proofAssets.map(function(item) {
    return '<article class="proof-card reveal"><div class="card-icon">' + icon(item.icon, 26) + '</div><h3>' + item.title + '</h3><p>' + item.text + '</p><div>' + item.points.map(function(point) { return '<span>' + point + '</span>'; }).join('') + '</div></article>';
  }).join('');
  return '<section class="section proof-section"><div class="container">' + SectionIntro('不是只给建议，而是给能推进执行的交付物', '客户需要的不只是“方向感”，还需要能被团队拿去开会、分工、复盘和迭代的材料。') + '<div class="proof-grid">' + cards + '</div></div></section>';
}

function LeadPathSection() {
  if (isEn()) {
    const steps = [
      ['Find the Issue', 'Enter from a search page, service page or case study that matches your current challenge.'],
      ['Check Fit', 'Review methods, deliverables, fee references and case experience.'],
      ['Book Diagnosis', 'Submit your inquiry or add WeChat and mention your purpose.'],
      ['Start Conversation', 'Clarify platform priority, product messaging and next-step actions.']
    ].map(function(item, index) {
      return '<div class="path-step reveal"><span>0' + (index + 1) + '</span><h3>' + item[0] + '</h3><p>' + item[1] + '</p></div>';
    }).join('');
    return '<section class="section lead-path-section"><div class="container">' + SectionIntro('A Clear Inquiry Path', 'From a matched problem to a practical diagnosis, every step is designed to reduce vague communication.') + '<div class="lead-path-grid">' + steps + '</div></div></section>';
  }
  const steps = leadPathSteps.map(function(item, index) {
    return '<div class="path-step reveal"><span>0' + (index + 1) + '</span><h3>' + item.title + '</h3><p>' + item.text + '</p></div>';
  }).join('');
  return '<section class="section lead-path-section"><div class="container">' + SectionIntro('一条清晰的咨询路径，减少无效沟通', '从相似问题进入，到基础诊断，再到具体合作方案，每一步都尽量清楚、可判断。') + '<div class="lead-path-grid">' + steps + '</div></div></section>';
}

const relatedCaseSlugsByLead = {
  'ecommerce-diagnosis': ['traditional-enterprise-ecommerce-launch', 'wine-store-diagnosis', 'tea-brand-platform-synergy'],
  'store-diagnosis': ['wine-store-diagnosis', 'womenswear-refund-optimization', 'personal-care-device-positioning'],
  'tmall-jd-consultant': ['tea-brand-platform-synergy', 'children-nutrition-compliance', 'traditional-enterprise-ecommerce-launch'],
  'douyin-xiaohongshu-growth': ['tea-brand-platform-synergy', 'camping-local-life-operation', 'personal-care-device-positioning'],
  'page-conversion-optimization': ['personal-care-device-positioning', 'children-nutrition-compliance', 'womenswear-refund-optimization'],
  'brand-growth-consultant': ['tea-brand-platform-synergy', 'consumer-goods-membership-growth', 'traditional-enterprise-ecommerce-launch'],
  'tmall-business-weekly-report': ['tea-brand-platform-synergy', 'wine-store-diagnosis', 'womenswear-refund-optimization'],
  'tmall-refund-rate-analysis': ['womenswear-refund-optimization', 'children-nutrition-compliance', 'wine-store-diagnosis'],
  'ecommerce-roi-review': ['tea-brand-platform-synergy', 'wine-store-diagnosis', 'traditional-enterprise-ecommerce-launch'],
  'livestream-conversion-diagnosis': ['personal-care-device-positioning', 'tea-brand-platform-synergy', 'camping-local-life-operation'],
  'customer-service-conversion-scripts': ['womenswear-refund-optimization', 'consumer-goods-membership-growth', 'personal-care-device-positioning'],
  'member-repurchase-private-domain': ['consumer-goods-membership-growth', 'camping-local-life-operation', 'tea-brand-platform-synergy'],
  'business-advisor-data-diagnosis': ['wine-store-diagnosis', 'tea-brand-platform-synergy', 'womenswear-refund-optimization'],
  'ai-ecommerce-growth-consultant': ['traditional-enterprise-ecommerce-launch', 'tea-brand-platform-synergy', 'consumer-goods-membership-growth']
};

function relatedLeadPages(page) {
  const sameService = leadPages.filter(function(item) {
    return item.slug !== page.slug && item.serviceId === page.serviceId;
  });
  const fallback = leadPages.filter(function(item) {
    return item.slug !== page.slug && item.serviceId !== page.serviceId;
  });
  return sameService.concat(fallback).slice(0, 4);
}

function RelatedLeadCard(page) {
  return '<a class="related-lead-card" href="' + localizeHref('/services/' + page.slug + '/') + '"><span>' + page.eyebrow + '</span><strong>' + page.title + '</strong><small>' + page.searchIntent.slice(0, 2).join(' / ') + '</small></a>';
}

function RelatedLeadSection(page) {
  const related = relatedLeadPages(page).map(RelatedLeadCard).join('');
  return '<div class="reveal detail-block related-lead-block"><div class="detail-title">' + icon('Layers', 24) + '<h2>还可以一起看的诊断入口</h2></div><div class="related-lead-grid">' + related + '</div></div>';
}

function relatedCasesForLead(page) {
  const slugs = relatedCaseSlugsByLead[page.slug] || [];
  const picked = slugs.map(function(slug) { return getCaseBySlug(slug); }).filter(Boolean);
  cases.forEach(function(item) {
    if (picked.length >= 3) return;
    if (!picked.some(function(existing) { return existing.slug === item.slug; })) picked.push(item);
  });
  return picked.slice(0, 3);
}

function LandingPage(page) {
  const intent = page.searchIntent.map(function(item) { return '<span>' + item + '</span>'; }).join('');
  const pain = page.painPoints.map(li).join('');
  const diagnosis = page.diagnosis.map(li).join('');
  const deliverables = page.deliverables.map(function(item) { return '<div>' + icon('CheckCircle2', 18) + '<span>' + item + '</span></div>'; }).join('');
  const faqs = page.faq.map(function(item) { return '<div class="faq-item"><button type="button"><span>' + item.q + '</span>' + icon('ChevronDown', 18) + '</button><div class="faq-answer"><p>' + item.a + '</p></div></div>'; }).join('');
  const related = relatedCasesForLead(page).map(function(item) { return '<div class="reveal">' + CaseCard(item) + '</div>'; }).join('');
  const serviceParam = encodeURIComponent(page.title);
  return PageHero(page.title, page.subtitle, false, '<div class="lead-keywords">' + intent + '</div>') +
    '<section class="section landing-section"><div class="container landing-layout"><div class="landing-main">' +
    '<div class="reveal detail-block"><div class="detail-title">' + icon('Search', 24) + '<h2>你可能正遇到这些问题</h2></div><ul>' + pain + '</ul></div>' +
    '<div class="reveal detail-block"><div class="detail-title">' + icon('Target', 24) + '<h2>品沐会重点诊断什么</h2></div><ul>' + diagnosis + '</ul></div>' +
    '<div class="reveal detail-block"><div class="detail-title">' + icon('ClipboardList', 24) + '<h2>可能获得的交付物</h2></div><div class="deliverable-grid">' + deliverables + '</div></div>' +
    RelatedLeadSection(page) +
    '<div class="reveal detail-block"><div class="detail-title">' + icon('ShieldCheck', 24) + '<h2>合作边界说明</h2></div><p>品沐不做“保证增长”“百分百提升”这类绝对承诺。我们更重视诊断依据、行动优先级、执行节奏和复盘机制，帮助品牌提高增长决策的清晰度和确定性。</p></div>' +
    '</div><aside class="landing-aside"><div class="aside-card reveal"><h2>适合先做什么？</h2><p>' + page.proof + '</p><a class="btn btn-primary" href="' + localizeHref('/contact/?service=' + serviceParam) + '"><span>预约基础诊断</span></a></div><div class="aside-card reveal"><h2>联系方式</h2><p>' + SITE.contactLabel + '</p><p>' + SITE.contactNote + '</p></div></aside></div></section>' +
    ProofSection() +
    '<section class="section cases-preview"><div class="container">' + SectionIntro('相关项目经验', '先看相似问题如何被拆解，再判断是否适合预约一次基础诊断。') + '<div class="home-case-grid">' + related + '</div></div></section>' +
    '<section class="section faq-section"><div class="container narrow-container">' + SectionIntro('常见问题') + '<div class="faq-list">' + faqs + '</div></div></section>' +
    CtaBand('想判断这个问题是否值得优先解决？', '预约一次基础诊断，我们会从平台、商品、流量、转化和团队执行五个维度先帮你看清楚。', '预约基础诊断');
}

function ChinaEcommercePage() {
  const page = chinaEcommercePage;
  const intent = page.searchIntent.map(function(item) { return '<span>' + item + '</span>'; }).join('');
  const pain = page.painPoints.map(li).join('');
  const diagnosis = page.diagnosis.map(li).join('');
  const deliverables = page.deliverables.map(function(item) { return '<div>' + icon('CheckCircle2', 18) + '<span>' + item + '</span></div>'; }).join('');
  const faqs = page.faq.map(function(item) { return '<div class="faq-item"><button type="button"><span>' + item.q + '</span>' + icon('ChevronDown', 18) + '</button><div class="faq-answer"><p>' + item.a + '</p></div></div>'; }).join('');
  return PageHero(page.title, page.subtitle, false, '<div class="lead-keywords">' + intent + '</div>') +
    '<section class="section landing-section"><div class="container landing-layout"><div class="landing-main">' +
    '<div class="reveal detail-block"><div class="detail-title">' + icon('Search', 24) + '<h2>Common Entry Questions</h2></div><ul>' + pain + '</ul></div>' +
    '<div class="reveal detail-block"><div class="detail-title">' + icon('Target', 24) + '<h2>What PINMOO Diagnoses</h2></div><ul>' + diagnosis + '</ul></div>' +
    '<div class="reveal detail-block"><div class="detail-title">' + icon('ClipboardList', 24) + '<h2>What You Can Get</h2></div><div class="deliverable-grid">' + deliverables + '</div></div>' +
    '</div><aside class="landing-aside"><div class="aside-card reveal"><h2>Talk to PINMOO</h2><p>Use this page if you are evaluating how to enter or grow in China e-commerce.</p><a class="btn btn-primary" href="' + localizeHref('/contact/?service=China%20e-commerce%20consulting') + '"><span>Book a Diagnosis</span></a></div><div class="aside-card reveal"><h2>Contact</h2><p>WeChat / Mobile: ' + SITE.phoneDisplay + '</p><p>Please mention: China e-commerce consulting.</p></div></aside></div></section>' +
    '<section class="section faq-section"><div class="container narrow-container">' + SectionIntro('FAQ') + '<div class="faq-list">' + faqs + '</div></div></section>' +
    CtaBand('How should your brand sell products in China?', 'Book a basic diagnosis and we will help clarify platform priority, product messaging and next-step actions.', 'Book a Diagnosis');
}

function MetricTermCard(term, index) {
  const aliases = term.aliases.map(function(alias) { return '<span>' + alias + '</span>'; }).join('');
  return '<article class="metric-term-card reveal" id="term-' + (index + 1) + '"><div class="metric-term-head"><span class="metric-term-index">0' + (index + 1) + '</span><div><small>' + term.category + '</small><h2>' + term.name + '</h2></div></div><div class="metric-aliases" aria-label="' + term.name + '常见说法">' + aliases + '</div><p class="metric-definition">' + term.definition + '</p><div class="metric-term-grid"><div><strong>' + icon('BookOpen', 18) + '周报使用</strong><p>' + term.reportUse + '</p></div><div><strong>' + icon('ShieldCheck', 18) + '注意口径</strong><p>' + term.caution + '</p></div><div><strong>' + icon('Target', 18) + '建议动作</strong><p>' + term.action + '</p></div></div></article>';
}

function ResourceMetricDictionary() {
  const chips = metricDictionary.keywords.map(function(item) { return '<span>' + item + '</span>'; }).join('');
  const intro = metricDictionary.introPoints.map(function(item, index) {
    return '<div class="metric-intro-card reveal"><span>0' + (index + 1) + '</span><p>' + item + '</p></div>';
  }).join('');
  const terms = metricDictionary.terms.map(MetricTermCard).join('');
  const faqs = metricDictionary.faqs.map(function(item) {
    return '<div class="faq-item"><button type="button"><span>' + item.q + '</span>' + icon('ChevronDown', 18) + '</button><div class="faq-answer"><p>' + item.a + '</p></div></div>';
  }).join('');
  const anchors = metricDictionary.terms.map(function(term, index) {
    return '<a href="#term-' + (index + 1) + '">' + term.name + '</a>';
  }).join('');
  return PageHero(metricDictionary.title, metricDictionary.subtitle, false, '<p class="hero-kicker">' + metricDictionary.eyebrow + '</p><div class="lead-keywords">' + chips + '</div>') +
    '<section class="section metric-dictionary-section"><div class="container metric-intro-grid">' + intro + '</div><div class="container metric-dictionary-layout"><div class="metric-dictionary-main">' +
    SectionIntro('经营报告先统一口径，再讨论增长动作', '支付金额、净销售额、退款率和投放 ROI 都不是孤立指标。品沐咨询在周报中会先说明口径，再结合商品、页面、客服、推广、直播和老客运营判断下一步动作。', 'left') +
    '<div class="metric-term-list">' + terms + '</div></div><aside class="metric-dictionary-aside"><div class="aside-card reveal metric-anchor-card"><h2>指标目录</h2><div>' + anchors + '</div></div><div class="aside-card reveal metric-side-card"><h2>适合搭配查看</h2><p>如果你已经有生意参谋、推广、退款或直播数据，可以先体验经营诊断，再判断哪些指标值得重点追踪。</p><a class="outline-link" href="' + localizeHref('/ai-diagnosis/') + '">体验 AI 经营诊断 ' + icon('ArrowRight', 16) + '</a><a class="outline-link" href="' + localizeHref('/services/tmall-business-weekly-report/') + '">查看经营周报服务 ' + icon('ArrowRight', 16) + '</a><a class="outline-link" href="' + localizeHref('/services/business-advisor-data-diagnosis/') + '">查看数据诊断入口 ' + icon('ArrowRight', 16) + '</a></div></aside></div></section>' +
    '<section class="section faq-section"><div class="container narrow-container">' + SectionIntro('指标口径常见问题') + '<div class="faq-list">' + faqs + '</div></div></section>' +
    CtaBand('想把指标口径落到你自己的店铺数据里？', '可以先上传经营数据生成一版周报预览，再看哪些问题需要优先拆解到商品、页面、客服、推广、直播和老客运营。', '体验经营报告');
}

function InsightTable(table) {
  if (!table) return '';
  const head = table.headers.map(function(item) { return '<th scope="col">' + item + '</th>'; }).join('');
  const rows = table.rows.map(function(row) { return '<tr>' + row.map(function(item, index) { return index === 0 ? '<th scope="row">' + item + '</th>' : '<td>' + item + '</td>'; }).join('') + '</tr>'; }).join('');
  return '<div class="insight-table-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function InsightSection(section, index) {
  const paragraphs = (section.paragraphs || []).map(function(item) { return '<p>' + item + '</p>'; }).join('');
  const bullets = section.bullets?.length ? '<ul>' + section.bullets.map(li).join('') + '</ul>' : '';
  return '<section class="insight-section reveal" id="' + section.id + '"><span class="insight-section-index">0' + (index + 1) + '</span><h2>' + section.title + '</h2>' + paragraphs + bullets + InsightTable(section.table) + '</section>';
}

function InsightFaq(article) {
  if (!article.faqs?.length) return '';
  const items = article.faqs.map(function(item) { return '<div class="faq-item"><button type="button"><span>' + item.q + '</span>' + icon('ChevronDown', 18) + '</button><div class="faq-answer"><p>' + item.a + '</p></div></div>'; }).join('');
  return '<section class="insight-section insight-faq reveal"><h2>常见问题</h2><div class="faq-list">' + items + '</div></section>';
}

function InsightRelatedServices(article) {
  const cards = article.relatedServices.map(function(slug) {
    const page = getLeadPageBySlug(slug);
    if (!page) return '';
    return '<a class="insight-related-card" href="/services/' + page.slug + '/"><span>相关服务</span><strong>' + page.title + '</strong><p>' + page.subtitle + '</p>' + icon('ArrowRight', 18) + '</a>';
  }).join('');
  return '<section class="section insight-related-section"><div class="container"><div class="insight-related-head"><h2>继续解决这个经营问题</h2><a href="/services/">查看全部服务</a></div><div class="insight-related-grid">' + cards + '<a class="insight-related-card" href="/resources/ecommerce-metrics-dictionary/"><span>指标工具</span><strong>电商经营指标口径词典</strong><p>统一支付金额、净销售额、退款率、推广花费和 ROI 等常见口径。</p>' + icon('ArrowRight', 18) + '</a></div></div></section>';
}

function InsightsPage() {
  const cards = insights.map(InsightCard).join('');
  return PageHero('经营洞察', '用真实经营问题组织内容：先解释数据口径，再给出判断方法和可执行清单。', false, '', { key: 'insights', src: '/assets/visuals/insights-weekly-report.webp', alt: '电商经营周报、退款治理、流量质量和商品结构分析示意图' }) +
    '<section class="section insights-index-section"><div class="container"><div class="insights-index-intro reveal"><p class="section-eyebrow">PINMOO METHOD</p><h2>不是追热点，而是沉淀可以反复使用的经营方法</h2><p>这里聚焦品牌方和电商运营团队经常遇到的具体问题。每篇内容都标明适用范围、关键口径和行动建议，方便团队直接用于周报、复盘和项目沟通。</p></div><div class="insight-card-grid">' + cards + '</div></div></section>' +
    CtaBand('有具体数据，但还不确定问题在哪里？', '把品牌、平台、统计周期和当前最想解决的问题发给品沐，我们先帮你判断资料是否足够、下一步该从哪里切入。', '免费基础诊断');
}

function InsightDetail(article) {
  const toc = article.sections.map(function(section, index) { return '<a href="#' + section.id + '"><span>0' + (index + 1) + '</span>' + section.title.replace(/^第[^：]+：/, '') + '</a>'; }).join('');
  const sections = article.sections.map(InsightSection).join('');
  const points = article.keyPoints.map(li).join('');
  const evidence = article.evidence ? '<section class="insight-evidence reveal" aria-labelledby="evidenceTitle"><span>证据说明</span><h2 id="evidenceTitle">本文依据与适用边界</h2><dl><div><dt>判断依据</dt><dd>' + article.evidence.basis + '</dd></div><div><dt>适用范围</dt><dd>' + article.evidence.scope + '</dd></div><div><dt>使用限制</dt><dd>' + article.evidence.limits + '</dd></div></dl></section>' : '';
  return '<article class="insight-article"><header class="insight-article-hero"><div class="hero-grid-bg"></div><div class="container insight-article-hero-inner"><div class="reveal"><a class="back-link" href="/insights/">返回经营洞察</a><div class="insight-article-labels"><span>' + article.category + '</span><span>' + article.readTime + '</span></div><h1>' + article.title + '</h1><p>' + article.summary + '</p><div class="insight-byline"><strong>' + insightAuthor.name + '｜' + insightAuthor.alternateName + '</strong><span>' + insightAuthor.role + '</span><time datetime="' + article.updated + '">更新于 ' + article.updated + '</time></div></div></div></header>' +
    '<section class="section insight-article-body"><div class="container insight-article-layout"><div class="insight-article-main"><section class="insight-answer-box reveal" aria-labelledby="directAnswerTitle"><div>' + icon('Lightbulb', 28) + '<h2 id="directAnswerTitle">核心结论</h2></div><p>' + article.directAnswer + '</p><ul>' + points + '</ul></section>' + evidence + sections + '<section class="insight-conclusion reveal"><span>品沐观点</span><h2>复盘结论</h2><p>' + article.conclusion + '</p></section>' + InsightFaq(article) + '<section class="insight-author-card reveal"><img src="/assets/mufeng-profile.jpg" alt="鲍俊文 沐风" loading="lazy"><div><span>本文顾问</span><h2>' + insightAuthor.name + '｜' + insightAuthor.alternateName + '</h2><p>' + insightAuthor.role + '。长期从事天猫、京东等平台运营推广、店铺诊断、数据复盘和品牌增长咨询。</p><a href="/about/">了解顾问背景 ' + icon('ArrowRight', 16) + '</a></div></section></div><aside class="insight-toc"><div><strong>本文目录</strong>' + toc + '</div><div class="insight-toc-contact"><strong>需要结合数据判断？</strong><p>发来品牌、平台和当前问题，先做一次基础判断。</p><a href="/contact/">预约咨询</a></div></aside></div></section>' + InsightRelatedServices(article) + '</article>';
}

function ContactSuccess() {
  return PageHero(isEn() ? 'Inquiry Received' : '已收到你的咨询需求', isEn() ? 'You can also add WeChat / mobile 13600008584 and mention your purpose. We will reply as soon as possible.' : '你也可以直接添加微信 / 手机同号 13600008584，并注明来意，我们会尽快回复。', true) +
    '<section class="section success-section"><div class="container success-grid"><div class="reveal detail-block"><div class="detail-title">' + icon('CheckCircle2', 28) + '<h2>' + (isEn() ? 'Next Step' : '下一步') + '</h2></div><p>' + (isEn() ? 'If the request is urgent, add WeChat directly and mention China e-commerce consulting, store diagnosis, operation coaching or brand growth.' : '如果比较着急，可以直接扫码或添加微信，并注明来意：电商咨询 / 店铺诊断 / 运营陪跑 / 品牌增长。') + '</p><div class="success-actions">' + ButtonLink(isEn() ? 'Back to Services' : '继续查看服务', '/services/', 'secondary', false) + ButtonLink(isEn() ? 'View Case Studies' : '查看项目经验', '/cases/', 'primary', false) + '</div></div><div class="reveal wechat-qr-card success-qr"><div class="wechat-qr-crop"><img src="/assets/wechat-qr-mufeng.jpg" alt="沐风微信二维码" loading="lazy"></div><div><strong>' + (isEn() ? 'Scan to Add WeChat' : '扫码添加微信') + '</strong><p>' + SITE.phoneDisplay + '</p><span>' + SITE.contactNote + '</span></div></div></div></section>' +
    LeadPathSection();
}

function renderCaseGrid(filter) {
  const normalizedFilter = isEn() ? (FILTER_EN_TO_CN[filter] || filter) : filter;
  const list = !normalizedFilter || normalizedFilter === '全部' ? cases : cases.filter(function(item) { return item.tags.indexOf(normalizedFilter) >= 0 || item.industry === normalizedFilter || item.serviceType.indexOf(normalizedFilter) >= 0; });
  const html = list.map(function(item) {
    const filters = [item.industry].concat(item.tags || []).join('|');
    return '<div class="reveal is-visible" data-case-filters="' + filters + '">' + CaseCard(item) + '</div>';
  }).join('');
  return isEn() ? translateEnglish(html) : html;
}

function Cases() {
  const industry = ['服饰', '茶饮', '营养', '个护', '酒水'].map(function(item, index) { return '<span>' + icon(['ShoppingBag','Leaf','ShieldCheck','Zap','Store'][index], 20) + item + '</span>'; }).join('');
  const filters = caseFilters.map(function(item) { return '<button type="button" class="' + (item === '全部' ? 'active' : '') + '" data-filter="' + item + '">' + item + '</button>'; }).join('');
  return PageHero('项目经验', '每一个项目，都来自品牌在平台经营、内容表达、页面转化、投放复盘或用户承接中的真实问题。我们更关注问题如何被拆解，动作如何被落地，结果如何被持续复盘。', false, '<div class="case-hero-badge">精选案例</div><div class="case-hero-industries">' + industry + '</div>', { key: 'cases', src: '/assets/visuals/case-project-experience.webp', alt: '服饰、茶饮、营养品、个护和酒水行业项目经验示意图' }) + '<section class="section cases-page-section"><div class="container"><div class="filter-row" role="group" aria-label="案例筛选标签">' + filters + '</div><div class="cases-grid" id="casesGrid">' + renderCaseGrid('全部') + '</div></div></section>' + CtaBand('你的品牌，也许正卡在类似的问题上', '无论是店铺转化低、退款率高、投放效率不稳定，还是多平台运营缺少节奏，品沐咨询都可以先帮你做一次基础诊断，判断当前最值得优先解决的问题。');
}

function DetailBlock(iconName, title, content) {
  return '<div class="reveal detail-block"><div class="detail-title">' + icon(iconName, 24) + '<h2>' + title + '</h2></div>' + content + '</div>';
}

function CaseDetail(item) {
  const chips = '<div class="case-meta-chips"><span>' + item.industry + '</span><span>' + item.platform + '</span><span>' + item.serviceType + '</span></div>';
  const main = DetailBlock('BookOpen', '项目背景', '<p>' + item.background + '</p>') + DetailBlock('ShieldCheck', '核心问题', '<ul>' + item.problems.map(li).join('') + '</ul>') + DetailBlock('Search', '诊断发现', '<p>' + item.diagnosis + '</p>') + DetailBlock('Target', '解决方向', '<ul>' + item.solutions.map(li).join('') + '</ul>') + DetailBlock('TrendingUp', '阶段成果', '<p>' + item.result + '</p>') + DetailBlock('Lightbulb', '项目启发', '<p>' + item.insight + '</p>');
  const highlights = item.highlights.map(function(h, index) { return '<div class="highlight-row"><span>' + (index + 1) + '</span><p>' + h + '</p></div>'; }).join('');
  const detailImageAlt = isEn()
    ? ((CASE_EN[item.slug]?.industry || item.industry) + ' ' + (CASE_EN[item.slug]?.serviceType || item.serviceType) + ' consulting case study')
    : item.industry + '品牌在' + item.platform + '平台的' + item.serviceType + '咨询案例';
  return '<section class="case-detail-hero"><div class="hero-grid-bg"></div><div class="container case-detail-hero-inner"><div class="reveal"><a class="back-link" href="' + localizeHref('/cases/') + '">返回项目经验</a><h1>' + item.title + '</h1><p>' + item.summary + '</p>' + chips + '</div><div class="reveal case-detail-image">' + ResponsiveImage(item.image, detailImageAlt, '', 'decoding="async" fetchpriority="high"') + '</div></div></section><section class="section case-detail-section"><div class="container case-detail-layout"><div class="case-detail-main">' + main + '</div><aside class="case-detail-aside"><div class="reveal aside-card"><h2>项目概览</h2><dl><div><dt>行业</dt><dd>' + item.industry + '</dd></div><div><dt>平台</dt><dd>' + item.platform + '</dd></div><div><dt>核心问题</dt><dd>' + item.serviceType + '</dd></div></dl></div><div class="reveal aside-card highlight-card"><h2>服务亮点</h2>' + highlights + '</div><div class="reveal aside-card"><p>' + item.cta + '</p>' + ButtonLink('预约咨询', '/contact/', 'primary', false) + '</div></aside></div></section>' + CtaBand('如果你的品牌也面临类似问题，可以预约一次基础诊断。', item.cta);
}

function About() {
  const belief = [['以数据为依据','数据驱动决策，看清真实业务状况','ShieldCheck'],['以策略为核心','找准增长机会点，制定可落地的策略','Layers'],['以执行为关键','拆解到可执行动作，推动落地与协同','Target'],['以结果为导向','持续跟踪与复盘，实现正向增长闭环','TrendingUp']].map(function(item) { return '<div class="belief-card">' + icon(item[2], 26) + '<strong>' + item[0] + '</strong><span>' + item[1] + '</span></div>'; }).join('');
  const exp = [['前天猫服务站淘宝大学培训基地运营推广板块负责人','GraduationCap'],['多年淘宝、天猫、京东等平台运营推广经验','Layers'],['服务过茶饮、服饰、营养品、个护电器、快消品等多个消费行业','ShoppingBag'],['擅长店铺诊断、主图详情页优化、投放复盘、会员运营、内容种草与全域电商规划','Image'],['长期输出品牌增长、电商运营和代运营避坑相关内容','FilePenLine']].map(function(item) { return '<div class="reveal experience-card">' + icon(item[1], 30) + '<p>' + item[0] + '</p></div>'; }).join('');
  const steps = [['看数据','分析店铺、平台、商品、流量、转化、退款和用户反馈。','BarChart3'],['找问题','判断问题发生在货盘、页面、流量、内容、客服、价格还是团队执行。','Search'],['定动作','把建议拆成可执行事项，明确优先级、负责人和复盘周期。','Target'],['陪跑复盘','通过周报、月报、会议和专项优化，持续跟进结果。','RefreshCw']].map(function(item, index) { return '<div class="reveal work-step"><span>0' + (index + 1) + '</span>' + icon(item[2], 28) + '<h3>' + item[0] + '</h3><p>' + item[1] + '</p></div>'; }).join('');
  const fits = ['已经在线上经营，但增长遇到瓶颈的品牌','准备从0到1搭建电商业务的传统企业','有产品但缺少平台打法和内容策略的团队','有运营团队，但缺少外部顾问和复盘机制的品牌','想优化退款率、转化率、投放效率和会员复购的项目'].map(function(item) { return '<p>' + icon('CheckCircle2', 18) + item + '</p>'; }).join('');
  return PageHero('关于品沐咨询', '一家结合电商实战与 AI 工具的增长顾问公司。', false, '', { key: 'about', src: '/assets/visuals/about-consulting-system.webp', alt: '品沐咨询以数据、策略、执行和结果构建电商增长协同体系示意图' }) + '<section class="section about-brand-section"><div class="container about-brand-grid"><div class="reveal brand-showcase">' + logo('about-logo-frame') + '<h2>品沐咨询是谁？</h2><p>品沐咨询是一家面向传统品牌与电商企业的AI电商增长顾问公司，基于多年天猫、京东、抖音、小红书、私域运营经验，结合大模型工具，帮助企业完成从经营诊断、内容生产、客服承接、私域激活到数据复盘的全链路数字化升级。</p></div><div class="reveal"><h2>我们相信，电商增长不是靠单点动作，而是靠系统协同。</h2><p>很多品牌不是没有努力做电商，而是平台选择、货盘结构、内容表达、页面转化、广告投放、客服承接和复盘机制之间没有形成闭环。品沐咨询的价值，就是帮助品牌把复杂问题拆清楚，把关键动作排出优先级，并通过持续陪跑推动落地。</p><div class="belief-grid">' + belief + '</div></div></div></section><section class="section principal-section"><div class="container principal-card"><div class="reveal principal-info"><div class="profile-mark profile-photo"><img src="/assets/mufeng-profile.jpg" alt="鲍俊文｜沐风个人照片" loading="lazy"></div><div><h2>鲍俊文｜沐风</h2><p class="role-lines">广州品沐咨询有限公司主理人<br>品沐咨询创始顾问<br>电商运营与品牌增长顾问</p><p>鲍俊文，花名沐风，广州品沐咨询有限公司主理人，长期深耕电商运营、平台推广与品牌增长咨询。曾任前天猫服务站淘宝大学培训基地运营推广板块负责人，拥有多年淘宝、天猫、京东等主流平台运营经验，曾为多个茶饮、服饰、营养品、个护电器、快消品等品牌提供店铺诊断、平台规划、活动复盘、页面优化、内容种草与运营陪跑服务。</p></div></div><div class="experience-grid">' + exp + '</div></div></section><section class="section work-style-section"><div class="container">' + SectionIntro('我们如何陪品牌一起解决问题？') + '<div class="work-steps">' + steps + '</div></div></section><section class="section fit-section"><div class="container fit-grid"><div class="reveal"><h2>什么样的品牌适合找品沐？</h2></div><div class="reveal fit-list">' + fits + '</div></div></section>' + CtaBand('想进一步了解品沐如何帮你的品牌？', '预约咨询，我们会尽快与你沟通品牌现状和当前最值得优先解决的问题。');
}

function ContactForm() {
  const intents = ['电商咨询', '店铺诊断', '运营陪跑', '品牌增长', '官网咨询'].map(function(item) { return '<span>' + item + '</span>'; }).join('');
  const servicesList = services.map(function(service) { return '<li>' + icon(service.icon, 20) + '<span>' + service.title + '</span></li>'; }).join('');
  const templates = [
    ['基础诊断', '品牌/店铺：___；主要平台：天猫/京东/抖音/小红书；当前问题：有流量但转化低/退款高/投放不稳；希望先看：店铺诊断。'],
    ['经营周报', '我们有生意参谋/推广/退款数据，想生成一版品牌方可读的经营周报，重点看净销售额、退款、流量结构和下周期动作。'],
    ['运营陪跑', '品牌目前有运营团队，但缺少外部复盘和优先级判断，想了解月度顾问陪跑如何合作。']
  ].map(function(item) {
    return '<article><strong>' + item[0] + '</strong><p>' + item[1] + '</p></article>';
  }).join('');
  return '<section class="contact-direct-panel" aria-labelledby="wechatConsultTitle"><div class="form-heading">' + icon('MessageCircle', 26) + '<h2 id="wechatConsultTitle">扫码添加微信，直接预约咨询</h2></div><div class="direct-qr-block"><div class="wechat-qr-crop direct-qr"><img src="/assets/wechat-qr-mufeng.jpg" alt="沐风微信二维码" loading="lazy"></div><div><strong>微信 / 手机同号：' + SITE.phoneDisplay + '</strong><p>添加微信或拨打电话时，请注明来意，我们会更快判断你的需求并安排沟通。</p><div class="direct-intents">' + intents + '</div><a class="direct-phone-link" href="tel:' + SITE.phone + '">' + icon('Phone', 18) + '拨打电话</a></div></div><div class="direct-service-box"><h3>可以直接咨询这些问题</h3><ul>' + servicesList + '</ul></div><div class="inquiry-template-box"><h3>不知道怎么开口，可以直接这样发</h3><div>' + templates + '</div></div><p class="direct-note">建议添加微信后，至少发送：品牌/店铺名称、所在平台、当前最想解决的问题、希望先看的方向。</p></section>';
}

function Contact() {
  const contactItems = [['公司名称', SITE.company, 'Building2'], ['公司地址', SITE.address, 'MapPinned'], ['微信 / 手机同号', SITE.phoneDisplay, 'Phone'], ['联系说明', SITE.contactNoteWithSite, 'MessageCircle'], ['工作时间', SITE.workTime, 'Clock'], ['响应说明', SITE.responseTime, 'Send']].map(function(item) {
    const content = item[0].indexOf('手机') >= 0 ? '<a href="tel:' + SITE.phone + '">' + item[1] + '</a>' : item[0] === '公司地址' ? '<a href="' + SITE.mapUrl + '" target="_blank" rel="noopener">' + item[1] + '</a><p class="map-hint">点击查看地图定位</p>' : '<p>' + item[1] + '</p>';
    return '<div class="contact-info-row"><span>' + icon(item[2], 26) + '</span><div><h2>' + item[0] + '</h2>' + content + '</div></div>';
  }).join('');
  return PageHero('联系我们', '先发来品牌、平台和当前问题。品沐会做一次基础判断，帮你确认下一步适合做店铺诊断、经营周报、运营陪跑还是专项优化。', true, '', { key: 'contact', src: '/assets/visuals/contact-diagnosis-flow.webp', alt: '从品牌现状、所在平台和当前问题到店铺诊断、经营周报、运营陪跑及专项优化的咨询流程示意图' }) + '<section class="section contact-section"><div class="container contact-grid"><div class="reveal contact-info-panel">' + contactItems + '<div class="wechat-qr-card"><div class="wechat-qr-crop"><img src="/assets/wechat-qr-mufeng.jpg" alt="沐风微信二维码" loading="lazy"></div><div><strong>扫码添加微信</strong><p>微信 / 手机同号：' + SITE.phoneDisplay + '</p><span>添加微信请注明来意：电商咨询 / 店铺诊断 / 运营陪跑 / 品牌增长</span></div></div><div class="contact-promise-grid"><div>' + icon('Zap', 24) + '<strong>快速沟通</strong><span>直连顾问高效响应</span></div><div>' + icon('Target', 24) + '<strong>明确需求</strong><span>精准匹配解决方案</span></div><div>' + icon('ShieldCheck', 24) + '<strong>24小时内回复</strong><span>工作日内快速跟进</span></div></div></div><div class="reveal">' + ContactForm() + '</div></div></section><section class="section contact-bottom-section"><div class="container two-question-grid"><div class="reveal question-card">' + icon('CircleUserRound', 32) + '<h2>适合什么品牌咨询？</h2><p>适合有电商增长需求的品牌方，包括：初创品牌、成熟品牌、电商品牌、传统品牌电商化等。尤其适合增长遇到瓶颈、转化不稳、退款偏高、投放复盘不清或团队需要外部顾问的项目。</p></div><div class="reveal question-card">' + icon('FilePenLine', 32) + '<h2>是否可以先做基础诊断？</h2><p>可以。基础诊断先判断问题是否清楚、资料是否足够、下一步是否值得进入正式诊断或陪跑，避免一上来就做大方案。</p></div></div></section>' + CtaBand('你的品牌，下一步该先优化哪里？', '直接扫码或添加微信联系。我们会从平台、商品、流量、转化和团队执行五个维度，帮你判断最值得优先解决的问题。', '扫码咨询');
}

function FloatingContact() {
  const compact = pathname.indexOf('/insights') === 0 ? ' floating-contact-compact' : '';
  return '<div class="floating-contact' + compact + '"><button type="button" class="floating-button" aria-label="打开微信咨询" aria-expanded="false">' + icon('MessageCircle', 20) + '<span>微信咨询</span></button><div class="floating-panel" hidden><div class="floating-qr-crop"><img src="/assets/wechat-qr-mufeng.jpg" alt="沐风微信二维码" loading="lazy"></div><strong>' + SITE.contactLabel + '</strong><p>' + SITE.contactNote + '</p><a href="tel:' + SITE.phone + '">拨打电话</a></div></div>';
}

function renderPage() {
  if (pathname === '/') return Home();
  if (pathname === '/contact/success') return ContactSuccess();
  if (pathname === '/china-ecommerce-consulting') return ChinaEcommercePage();
  if (pathname === '/resources/ecommerce-metrics-dictionary') return ResourceMetricDictionary();
  if (pathname === '/insights') return InsightsPage();
  if (pathname.indexOf('/insights/') === 0) {
    const article = getInsightBySlug(pathname.split('/')[2]);
    if (article) return InsightDetail(article);
  }
  if (pathname === '/services') return Services();
  if (pathname.indexOf('/services/') === 0) {
    const page = getLeadPageBySlug(pathname.split('/')[2]);
    if (page) return LandingPage(page);
  }
  if (pathname === '/cases') return Cases();
  if (pathname === '/about') return About();
  if (pathname === '/contact') return Contact();
  if (pathname.indexOf('/cases/') === 0) {
    const item = getCaseBySlug(pathname.split('/')[2]);
    if (item) return CaseDetail(item);
  }
  return Home();
}

function addCaseTranslations(entries) {
  cases.forEach(function(item) {
    const en = CASE_EN[item.slug];
    if (!en) return;
    [['title','title'], ['industry','industry'], ['serviceType','serviceType'], ['platform','platform'], ['summary','summary'], ['background','background'], ['diagnosis','diagnosis'], ['result','result'], ['insight','insight'], ['cta','cta']].forEach(function(pair) {
      if (item[pair[0]] && en[pair[1]]) entries.push([item[pair[0]], en[pair[1]]]);
    });
    ['problems', 'solutions', 'highlights'].forEach(function(key) {
      (item[key] || []).forEach(function(value, index) {
        if (en[key] && en[key][index]) entries.push([value, en[key][index]]);
      });
    });
  });
}

function translateEnglish(html) {
  const entries = Object.entries(EN_TEXT);
  addCaseTranslations(entries);
  entries.sort(function(a, b) { return b[0].length - a[0].length; });
  let next = html;
  services.forEach(function(service) {
    if (EN_TEXT[service.short]) next = next.split(service.short).join(EN_TEXT[service.short]);
  });
  entries.forEach(function(pair) {
    next = next.split(pair[0]).join(pair[1]);
  });
  next = next.replace(/<html lang="zh-CN">/g, '<html lang="en">');
  return next;
}

export function renderSite(route) {
  requestedPathname = normalizePath(route || '/');
  currentLang = languageForPath(requestedPathname);
  pathname = stripLangPath(requestedPathname);
  const html = Header() + '<main id="main-content">' + renderPage() + '</main>' + Footer() + FloatingContact();
  const localizedHtml = internationalHost
    ? html.replace(/href="(\/[^"#?]*)"/g, function(match, href) { return 'href="' + localizeHref(href) + '"'; })
    : html;
  return isEn() ? translateEnglish(localizedHtml) : localizedHtml;
}

root.innerHTML = renderSite(requestedPathname);
initInteractions();

function initInteractions() {
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobilePanel = document.querySelector('.mobile-nav-panel');
  function onScroll() { header.classList.toggle('site-header-scrolled', window.scrollY > 18); }
  onScroll();
  window.addEventListener('scroll', onScroll);
  if (menuBtn && mobilePanel) {
    menuBtn.addEventListener('click', function() {
      const open = mobilePanel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.innerHTML = icon(open ? 'X' : 'Menu', 24);
      document.body.classList.toggle('menu-open', open);
    });
  }
  initReveal();
  initFaq();
  initFilters();
  initFloating();
}

function initReveal() {
  const nodes = Array.from(document.querySelectorAll('.reveal'));
  if (!('IntersectionObserver' in window)) { nodes.forEach(function(node) { node.classList.add('is-visible'); }); return; }
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  nodes.forEach(function(node, index) {
    node.style.transitionDelay = Math.min(index % 6, 5) * 60 + 'ms';
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) {
      node.classList.add('is-visible');
      return;
    }
    observer.observe(node);
  });
}

function initFaq() {
  document.querySelectorAll('.faq-item button').forEach(function(button) {
    button.addEventListener('click', function() { button.closest('.faq-item').classList.toggle('open'); });
  });
}

function initFilters() {
  const row = document.querySelector('.filter-row');
  const grid = document.getElementById('casesGrid');
  if (!row || !grid) return;
  row.addEventListener('click', function(event) {
    const btn = event.target.closest('button[data-filter]');
    if (!btn) return;
    row.querySelectorAll('button').forEach(function(item) { item.classList.remove('active'); });
    btn.classList.add('active');
    grid.innerHTML = renderCaseGrid(btn.dataset.filter);
  });
}

function initFloating() {
  const wrap = document.querySelector('.floating-contact');
  if (!wrap) return;
  const button = wrap.querySelector('.floating-button');
  const panel = wrap.querySelector('.floating-panel');
  button.addEventListener('click', function() {
    const open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });
}
