import { HOME_FAQS, SITE } from './site.js';
import { services, serviceFaqs } from './services.js';
import { cases } from './cases.js';
import { CASE_EN, EN_TEXT } from './en-text.js';
import { chinaEcommercePage, leadPages } from './lead-pages.js';
import { metricDictionary } from './resources.js';
import { insightAuthor, insights } from './insights.js';

const ORIGIN = SITE.primaryDomain;
const logoUrl = ORIGIN + SITE.logo;
const ogUrl = ORIGIN + SITE.ogImage;
const phone = '+86-' + SITE.phone;
const contentDate = '2026-07-10';

export const routeMeta = [
  {
    path: '/',
    file: 'index.html',
    title: '品牌 GEO 优化｜AI搜索可见度与品牌增长咨询｜品沐咨询',
    description: '品沐咨询帮助消费品牌做 GEO 生成式引擎优化，提升 AI 搜索对品牌的抓取、理解与引用基础；添加微信并备注“品牌GEO报告”，可免费获取一份基于公开信息的品牌 GEO 基础报告。',
    keywords: ['品牌GEO优化', '品牌GEO报告', 'AI搜索可见度', '生成式引擎优化', 'GEO服务', '广州电商咨询公司', '电商战略诊断', '天猫店铺诊断', 'AI经营周报'],
    name: '首页',
    updated: '2026-07-16',
    priority: '1.0',
    changefreq: 'weekly'
  },
  {
    path: '/ai-diagnosis/',
    file: 'ai-diagnosis/index.html',
    title: 'Pinmoo AI 店铺经营诊断工作台｜天猫生意参谋周报自动生成',
    description: 'Pinmoo AI 店铺经营诊断工作台支持上传多份天猫、生意参谋相关 Excel 和 CSV 文件，自动识别经营概览、商品、流量、客户、客服、直播、光合内容、推广计划和退款报表，生成周报预览、Word 导出和微信群发送话术。',
    name: 'Pinmoo AI 店铺经营诊断',
    keywords: ['天猫经营周报', '生意参谋周报', '电商经营诊断', 'AI电商增长', '店铺诊断工具'],
    aiTool: true,
    sitemap: false,
    priority: '0.95',
    changefreq: 'weekly'
  },
  {
    path: '/services/',
    file: 'services/index.html',
    title: '服务介绍｜品沐咨询 PINMOO',
    description: '品沐咨询围绕平台选择、商品结构、内容种草、页面转化、广告投放、直播运营、会员复购等关键环节，提供诊断、策略、陪跑和复盘优化服务。',
    name: '服务介绍',
    updated: '2026-07-16',
    priority: '0.9',
    changefreq: 'monthly'
  },
  ...leadPages.map((page) => ({
    path: '/services/' + page.slug + '/',
    file: 'services/' + page.slug + '/index.html',
    title: page.metaTitle,
    description: page.metaDescription,
    name: page.title,
    leadSlug: page.slug,
    priority: '0.85',
    changefreq: 'monthly'
  })),
  {
    path: metricDictionary.path,
    file: 'resources/' + metricDictionary.slug + '/index.html',
    title: metricDictionary.metaTitle,
    description: metricDictionary.metaDescription,
    name: metricDictionary.title,
    resourceSlug: metricDictionary.slug,
    keywords: metricDictionary.keywords,
    priority: '0.75',
    changefreq: 'monthly'
  },
  {
    path: '/insights/',
    file: 'insights/index.html',
    title: '电商经营洞察｜服务选择、店铺诊断、数据复盘与AI工具｜品沐咨询',
    description: '品沐咨询经营洞察覆盖电商顾问与代运营选择、店铺诊断、商品客服、经营周报、退款投放、AI工具和GEO衡量，提供证据、边界与执行清单。',
    name: '经营洞察',
    keywords: ['电商咨询怎么选', '电商顾问靠谱吗', '店铺诊断', '运营陪跑', '店铺转化率', '经营周报', '退款治理', '投放ROI复盘', 'AI经营周报', 'GEO ROI'],
    insightIndex: true,
    updated: '2026-07-16',
    priority: '0.85',
    changefreq: 'weekly'
  },
  ...insights.map((article) => ({
    path: '/insights/' + article.slug + '/',
    file: 'insights/' + article.slug + '/index.html',
    title: article.metaTitle,
    description: article.metaDescription,
    name: article.title,
    keywords: article.keywords,
    insightSlug: article.slug,
    updated: article.updated,
    priority: '0.8',
    changefreq: 'monthly'
  })),
  {
    path: '/cases/',
    file: 'cases/index.html',
    title: '项目经验｜品沐咨询 PINMOO',
    description: '品沐咨询项目经验覆盖茶饮食品、服饰鞋包、营养健康、个护电器、传统企业转型、酒水食品等行业，关注问题拆解、动作落地与持续复盘。',
    name: '项目经验',
    updated: '2026-07-16',
    priority: '0.9',
    changefreq: 'monthly'
  },
  {
    path: '/about/',
    file: 'about/index.html',
    title: '关于品沐咨询｜鲍俊文 沐风｜广州品沐咨询有限公司',
    description: '品沐咨询是广州品沐咨询有限公司旗下电商增长咨询的简称，由鲍俊文（沐风、BarryBao）主理，面向消费品牌提供电商经营诊断、运营陪跑、页面优化、投放复盘和AI经营工具服务。',
    name: '关于品沐',
    updated: '2026-07-17',
    priority: '0.8',
    changefreq: 'monthly'
  },
  {
    path: '/contact/',
    file: 'contact/index.html',
    title: '联系我们｜品沐咨询 PINMOO',
    description: '联系广州品沐咨询有限公司。添加微信 / 手机同号：13600008584，备注“品牌GEO报告”，发送品牌名称、官网或店铺链接、主要平台和目标市场，可免费获取一份基于公开信息的品牌 GEO 基础报告。',
    name: '联系我们',
    updated: '2026-07-17',
    priority: '0.8',
    changefreq: 'monthly'
  },
  {
    path: '/contact/success/',
    file: 'contact/success/index.html',
    title: '咨询需求已收到｜品沐咨询 PINMOO',
    description: '品沐咨询已收到你的咨询需求。你也可以直接添加微信 / 手机同号 13600008584，并注明来意：电商咨询 / 店铺诊断 / 运营陪跑 / 品牌增长。',
    name: '咨询需求已收到',
    sitemap: false,
    indexable: false,
    priority: '0.2',
    changefreq: 'yearly'
  },
  {
    path: '/china-ecommerce-consulting/',
    file: 'china-ecommerce-consulting/index.html',
    title: chinaEcommercePage.metaTitle,
    description: chinaEcommercePage.metaDescription,
    name: chinaEcommercePage.title,
    leadSlug: chinaEcommercePage.slug,
    priority: '0.9',
    changefreq: 'monthly',
    lang: 'en',
    noHreflang: true
  },
  ...cases.map((item) => ({
    path: '/cases/' + item.slug + '/',
    file: 'cases/' + item.slug + '/index.html',
    title: item.title + '｜品沐咨询项目经验',
    description: item.summary,
    name: item.title,
    caseSlug: item.slug,
    updated: '2026-07-16',
    priority: '0.7',
    changefreq: 'monthly'
  }))
];

routeMeta.push(
  {
    path: '/en/',
    file: 'en/index.html',
    title: 'PINMOO Consulting | China E-commerce Strategy and Brand Growth',
    description: 'PINMOO Consulting helps brands sell products in China through e-commerce strategy diagnosis, platform operation coaching, product page optimization, content seeding, advertising review and private domain growth.',
    name: 'Home',
    priority: '1.0',
    changefreq: 'weekly',
    lang: 'en',
    alternatePath: '/'
  },
  {
    path: '/en/services/',
    file: 'en/services/index.html',
    title: 'Services | PINMOO Consulting',
    description: 'PINMOO provides China e-commerce diagnosis, strategy, operation coaching and review across platform selection, product mix, content seeding, page conversion, ads, livestream and membership growth.',
    name: 'Services',
    priority: '0.9',
    changefreq: 'monthly',
    lang: 'en',
    alternatePath: '/services/'
  },
  {
    path: '/en/cases/',
    file: 'en/cases/index.html',
    title: 'Case Studies | PINMOO Consulting',
    description: 'PINMOO case studies cover apparel, tea and food, nutrition, personal-care devices, traditional enterprise transformation, wine, FMCG and local lifestyle projects.',
    name: 'Case Studies',
    priority: '0.9',
    changefreq: 'monthly',
    lang: 'en',
    alternatePath: '/cases/'
  },
  {
    path: '/en/about/',
    file: 'en/about/index.html',
    title: 'About PINMOO Consulting | Guangzhou Pinmoo Consulting Co., Ltd.',
    description: 'Learn about Guangzhou Pinmoo Consulting Co., Ltd. and its practical China e-commerce consulting services across strategy diagnosis, operation coaching, store diagnosis, page optimization, content seeding and data review.',
    name: 'About',
    updated: '2026-07-17',
    priority: '0.8',
    changefreq: 'monthly',
    lang: 'en',
    alternatePath: '/about/'
  },
  {
    path: '/en/contact/',
    file: 'en/contact/index.html',
    title: 'Contact | PINMOO Consulting',
    description: 'Contact PINMOO Consulting. WeChat / mobile: 13600008584. Please mention your purpose, such as e-commerce consulting, store diagnosis, operation coaching or brand growth.',
    name: 'Contact',
    updated: '2026-07-17',
    priority: '0.8',
    changefreq: 'monthly',
    lang: 'en',
    alternatePath: '/contact/'
  },
  {
    path: '/en/contact/success/',
    file: 'en/contact/success/index.html',
    title: 'Inquiry Received | PINMOO Consulting',
    description: 'PINMOO has received your inquiry. You can also add WeChat / mobile 13600008584 and mention your purpose.',
    name: 'Inquiry Received',
    sitemap: false,
    indexable: false,
    priority: '0.2',
    changefreq: 'yearly',
    lang: 'en',
    alternatePath: '/contact/success/'
  },
  {
    path: '/en/china-ecommerce-consulting/',
    file: 'en/china-ecommerce-consulting/index.html',
    title: chinaEcommercePage.metaTitle,
    description: chinaEcommercePage.metaDescription,
    name: chinaEcommercePage.title,
    leadSlug: chinaEcommercePage.slug,
    canonicalPath: '/china-ecommerce-consulting/',
    sitemap: false,
    duplicate: true,
    priority: '0.2',
    changefreq: 'monthly',
    lang: 'en',
    noHreflang: true
  },
  ...cases.map((item) => {
    const en = CASE_EN[item.slug] || {};
    return {
      path: '/en/cases/' + item.slug + '/',
      file: 'en/cases/' + item.slug + '/index.html',
      title: (en.title || item.title) + ' | PINMOO Consulting Case Study',
      description: en.summary || item.summary,
      name: en.title || item.title,
      caseSlug: item.slug,
      updated: '2026-07-16',
      priority: '0.7',
      changefreq: 'monthly',
      lang: 'en',
      alternatePath: '/cases/' + item.slug + '/'
    };
  })
);

export function absolute(pathname) {
  if (SITE.domain === SITE.primaryDomain) {
    return pathname === '/' ? ORIGIN + '/' : ORIGIN + pathname;
  }

  if (pathname === '/ai-diagnosis/' || pathname.startsWith('/ai-diagnosis/')) {
    return 'https://agent.pinmoo.top/';
  }
  if (pathname === '/en/' || pathname === '/en') return ORIGIN + '/';
  if (pathname.startsWith('/en/')) return ORIGIN + pathname.slice(3);
  if (pathname === '/china-ecommerce-consulting/') return ORIGIN + pathname;

  const primaryPath = pathname === '/' ? '/zh/' : '/zh' + pathname;
  return ORIGIN + primaryPath;
}

function routeImage(meta) {
  if (meta.caseSlug) {
    const item = cases.find((entry) => entry.slug === meta.caseSlug);
    if (item?.image) return ORIGIN + item.image;
  }
  return ogUrl;
}

function routeKeywords(meta) {
  if (meta.keywords?.length) return meta.keywords.join(', ');
  const resourcePage = resourcePageForMeta(meta);
  if (resourcePage?.keywords?.length) return resourcePage.keywords.join(', ');
  if (meta.leadSlug) {
    const leadPage = leadPageForMeta(meta);
    if (leadPage?.searchIntent?.length) return leadPage.searchIntent.join(', ');
  }
  if (meta.caseSlug) {
    const item = cases.find((entry) => entry.slug === meta.caseSlug);
    if (item) return [item.industry, item.serviceType, item.platform, '电商咨询', '项目经验', 'PINMOO'].join(', ');
  }
  if (meta.insightSlug) {
    const article = insights.find((entry) => entry.slug === meta.insightSlug);
    if (article) return article.keywords.join(', ');
  }
  return meta.lang === 'en'
    ? 'PINMOO Consulting, China e-commerce consulting, Tmall consultant, JD consultant, Douyin, Xiaohongshu'
    : '品沐咨询, PINMOO, 电商咨询, 电商诊断, 天猫运营顾问, 京东运营顾问, 抖音电商, 小红书种草, GEO服务, AI搜索优化';
}

function leadPageForMeta(meta) {
  if (!meta.leadSlug) return null;
  return leadPages.find((page) => page.slug === meta.leadSlug) || (meta.leadSlug === chinaEcommercePage.slug ? chinaEcommercePage : null);
}

function resourcePageForMeta(meta) {
  if (meta.resourceSlug === metricDictionary.slug) return metricDictionary;
  return null;
}

function insightForMeta(meta) {
  if (!meta.insightSlug) return null;
  return insights.find((article) => article.slug === meta.insightSlug) || null;
}

function organizationNode() {
  return {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORIGIN + '/#organization',
    name: SITE.company,
    alternateName: ['PINMOO', '品沐咨询', SITE.companyEn, 'pinmoo consulting', 'pinmooconsulting'],
    legalName: SITE.company,
    url: ORIGIN + '/',
    logo: logoUrl,
    image: ogUrl,
    telephone: phone,
    hasMap: SITE.mapUrl,
    knowsAbout: ['电商战略诊断', '天猫与京东运营', '生意参谋数据诊断', '电商经营周报', '退款治理', '投放 ROI 复盘', '页面转化优化', '会员复购与私域运营', 'GEO 生成式引擎优化', 'AI 搜索可见度', '品牌事实库与证据化内容'],
    areaServed: ['中国', '广东', '广州', '天猫', '京东', '抖音', '小红书', '视频号', '拼多多'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address,
      addressLocality: SITE.addressLocality,
      addressRegion: SITE.addressRegion,
      addressCountry: 'CN'
    },
    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: phone,
      contactType: 'customer service',
      availableLanguage: ['zh-CN'],
      areaServed: 'CN'
    }],
    slogan: '让电商增长更有章法',
    description: SITE.positioning,
    potentialAction: {
      '@type': 'CommunicateAction',
      name: '免费领取品牌 GEO 基础报告',
      target: ORIGIN + '/contact/?service=geo-report'
    }
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ORIGIN + '/#website',
    url: ORIGIN + '/',
    name: 'PINMOO 品沐咨询',
    inLanguage: 'zh-CN',
    publisher: { '@id': ORIGIN + '/#organization' },
    hasPart: [
      {
        '@type': 'CreativeWork',
        '@id': ORIGIN + '/llms.txt#summary',
        name: 'PINMOO AI-readable summary',
        url: ORIGIN + '/llms.txt',
        encodingFormat: 'text/plain'
      },
      {
        '@type': 'CreativeWork',
        '@id': ORIGIN + '/llms-full.txt#context',
        name: 'PINMOO full AI context',
        url: ORIGIN + '/llms-full.txt',
        encodingFormat: 'text/markdown'
      },
      {
        '@type': 'DataFeed',
        '@id': ORIGIN + '/ai-context.json#data',
        name: 'PINMOO structured AI context',
        url: ORIGIN + '/ai-context.json',
        encodingFormat: 'application/json'
      },
      {
        '@type': 'DataFeed',
        '@id': ORIGIN + '/knowledge-index.json#data',
        name: 'PINMOO e-commerce knowledge index',
        url: ORIGIN + '/knowledge-index.json',
        encodingFormat: 'application/json'
      }
    ]
  };
}

function breadcrumbNode(meta) {
  const homeName = meta.lang === 'en' ? 'Home' : '首页';
  const caseName = meta.lang === 'en' ? 'Case Studies' : '项目经验';
  const casePath = meta.lang === 'en' && !meta.international ? '/en/cases/' : '/cases/';
  const serviceName = meta.lang === 'en' ? 'Services' : '服务介绍';
  const servicePath = meta.lang === 'en' && !meta.international ? '/en/services/' : '/services/';
  const items = [{ '@type': 'ListItem', position: 1, name: homeName, item: meta.lang === 'en' && !meta.international ? absolute('/en/') : ORIGIN + '/' }];
  if (meta.path !== '/') {
    if (meta.path.startsWith('/cases/') && meta.path !== '/cases/') {
      items.push({ '@type': 'ListItem', position: 2, name: caseName, item: absolute(casePath) });
      items.push({ '@type': 'ListItem', position: 3, name: meta.name, item: absolute(meta.path) });
    } else if (meta.path.startsWith('/resources/')) {
      items.push({ '@type': 'ListItem', position: 2, name: meta.name, item: absolute(meta.path) });
    } else if (meta.path.startsWith('/insights/') && meta.path !== '/insights/') {
      items.push({ '@type': 'ListItem', position: 2, name: '经营洞察', item: absolute('/insights/') });
      items.push({ '@type': 'ListItem', position: 3, name: meta.name, item: absolute(meta.path) });
    } else if (meta.path.startsWith('/en/cases/') && meta.path !== '/en/cases/') {
      items.push({ '@type': 'ListItem', position: 2, name: caseName, item: absolute(casePath) });
      items.push({ '@type': 'ListItem', position: 3, name: meta.name, item: absolute(meta.path) });
    } else if (meta.path.startsWith('/services/') && meta.path !== '/services/') {
      items.push({ '@type': 'ListItem', position: 2, name: serviceName, item: absolute(servicePath) });
      items.push({ '@type': 'ListItem', position: 3, name: meta.name, item: absolute(meta.path) });
    } else if (meta.path.startsWith('/en/services/') && meta.path !== '/en/services/') {
      items.push({ '@type': 'ListItem', position: 2, name: serviceName, item: absolute(servicePath) });
      items.push({ '@type': 'ListItem', position: 3, name: meta.name, item: absolute(meta.path) });
    } else {
      items.push({ '@type': 'ListItem', position: 2, name: meta.name, item: absolute(meta.path) });
    }
  }
  return {
    '@type': 'BreadcrumbList',
    '@id': absolute(meta.path) + '#breadcrumb',
    itemListElement: items
  };
}

function serviceNodes() {
  return services.map((service) => ({
    '@type': 'Service',
    '@id': ORIGIN + '/services/#' + service.id,
    name: service.title,
    serviceType: service.title,
    description: service.short,
    provider: { '@id': ORIGIN + '/#organization' },
    areaServed: '中国',
    audience: service.fit.map((name) => ({ '@type': 'Audience', name })),
    url: ORIGIN + '/services/'
  }));
}

function leadServiceNode(meta) {
  const leadPage = leadPageForMeta(meta);
  if (!leadPage) return null;
  const parent = services.find((service) => service.id === leadPage.serviceId);
  return {
    '@type': 'Service',
    '@id': absolute(meta.path) + '#service',
    name: leadPage.title,
    serviceType: parent?.title || leadPage.title,
    category: parent?.title,
    description: leadPage.metaDescription || meta.description,
    url: absolute(meta.path),
    provider: { '@id': ORIGIN + '/#organization' },
    areaServed: ['中国', '天猫', '京东', '抖音', '小红书', '私域'],
    audience: [
      { '@type': 'BusinessAudience', name: '品牌方' },
      { '@type': 'BusinessAudience', name: '电商运营服务商' },
      { '@type': 'BusinessAudience', name: '电商运营负责人' }
    ],
    keywords: leadPage.searchIntent.join(', '),
    isPartOf: parent ? { '@id': ORIGIN + '/services/#' + parent.id } : { '@id': ORIGIN + '/#website' },
    potentialAction: {
      '@type': 'CommunicateAction',
      name: meta.lang === 'en' ? 'Book a diagnosis' : '预约基础诊断',
      target: absolute('/contact/')
    }
  };
}

function itemListNode(meta) {
  if (meta.path === '/services/') {
    return {
      '@type': 'ItemList',
      '@id': ORIGIN + '/services/#service-list',
      name: '品沐咨询服务与诊断入口',
      itemListElement: leadPages.map((page, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absolute('/services/' + page.slug + '/'),
        name: page.title,
        description: page.metaDescription,
        keywords: page.searchIntent.join(', ')
      }))
    };
  }
  if (meta.path === '/cases/') {
    return {
      '@type': 'ItemList',
      '@id': ORIGIN + '/cases/#case-list',
      name: '品沐咨询项目经验',
      itemListElement: cases.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absolute('/cases/' + item.slug + '/'),
        name: item.title,
        description: item.summary
      }))
    };
  }
  if (meta.path === '/en/cases/') {
    return {
      '@type': 'ItemList',
      '@id': ORIGIN + '/en/cases/#case-list',
      name: 'PINMOO Consulting Case Studies',
      itemListElement: cases.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absolute('/en/cases/' + item.slug + '/'),
        name: CASE_EN[item.slug]?.title || item.title,
        description: CASE_EN[item.slug]?.summary || item.summary
      }))
    };
  }
  if (meta.path === '/insights/') {
    return {
      '@type': 'ItemList',
      '@id': ORIGIN + '/insights/#article-list',
      name: '品沐咨询电商经营洞察',
      itemListElement: insights.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absolute('/insights/' + article.slug + '/'),
        name: article.title,
        description: article.summary
      }))
    };
  }
  return null;
}

function faqNode(meta) {
  if (meta.lang !== 'en' && meta.path === '/') {
    return {
      '@type': 'FAQPage',
      '@id': absolute(meta.path) + '#faq',
      mainEntity: HOME_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    };
  }
  const insight = insightForMeta(meta);
  if (insight?.faqs?.length) {
    return {
      '@type': 'FAQPage',
      '@id': absolute(meta.path) + '#faq',
      mainEntity: insight.faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    };
  }
  const resourcePage = resourcePageForMeta(meta);
  if (resourcePage?.faqs?.length) {
    return {
      '@type': 'FAQPage',
      '@id': absolute(meta.path) + '#faq',
      mainEntity: resourcePage.faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    };
  }
  const leadPage = leadPageForMeta(meta);
  if (leadPage) {
    return {
      '@type': 'FAQPage',
      '@id': absolute(meta.path) + '#faq',
      mainEntity: leadPage.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    };
  }
  if (meta.path !== '/services/') return null;
  return {
    '@type': 'FAQPage',
    '@id': ORIGIN + '/services/#faq',
    mainEntity: serviceFaqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };
}

function personNode(meta) {
  return {
    '@type': 'Person',
    '@id': ORIGIN + '/about/#mufeng',
    name: '鲍俊文',
    alternateName: ['沐风', 'BarryBao'],
    jobTitle: '品沐咨询主理人',
    image: ORIGIN + '/assets/mufeng-profile.jpg',
    worksFor: { '@id': ORIGIN + '/#organization' },
    description: '鲍俊文，公开别名沐风、BarryBao，主理品沐咨询，面向消费品牌提供电商经营诊断、运营陪跑、页面优化、投放复盘和AI经营工具服务。',
    url: ORIGIN + '/about/',
    knowsAbout: ['电商咨询', '天猫运营', '京东运营', '抖音电商', '小红书种草', '店铺诊断', '经营周报', '退款治理', '页面优化', '投放复盘', '会员运营', 'GEO 生成式引擎优化', 'AI 搜索可见度']
  };
}

function insightArticleNode(meta) {
  const article = insightForMeta(meta);
  if (!article) return null;
  return {
    '@type': 'Article',
    '@id': absolute(meta.path) + '#article',
    headline: article.title,
    description: article.summary,
    image: ogUrl,
    datePublished: article.published,
    dateModified: article.updated,
    inLanguage: 'zh-CN',
    articleSection: article.category,
    keywords: article.keywords.join(', '),
    author: { '@id': ORIGIN + '/about/#mufeng' },
    editor: { '@id': ORIGIN + '/about/#mufeng' },
    publisher: { '@id': ORIGIN + '/#organization' },
    mainEntityOfPage: absolute(meta.path),
    about: article.keywords,
    abstract: article.directAnswer,
    creditText: insightAuthor.disclosure,
    isAccessibleForFree: true
  };
}

function caseArticleNode(meta) {
  if (!meta.caseSlug) return null;
  const item = cases.find((entry) => entry.slug === meta.caseSlug);
  if (!item) return null;
  const en = meta.lang === 'en' ? CASE_EN[item.slug] : null;
  return {
    '@type': 'Article',
    '@id': absolute(meta.path) + '#article',
    headline: en?.title || item.title,
    description: en?.summary || item.summary,
    image: ORIGIN + item.image,
    author: { '@id': ORIGIN + '/#organization' },
    publisher: { '@id': ORIGIN + '/#organization' },
    mainEntityOfPage: absolute(meta.path),
    articleSection: en?.industry || item.industry,
    keywords: [en?.industry || item.industry, en?.serviceType || item.serviceType, en?.platform || item.platform, meta.lang === 'en' ? 'China e-commerce consulting' : '电商咨询', meta.lang === 'en' ? 'case study' : '项目经验', 'PINMOO'].join(', '),
    about: [en?.industry || item.industry, en?.serviceType || item.serviceType, en?.platform || item.platform]
  };
}

function contactNode(meta) {
  if (meta.path !== '/contact/') return null;
  return {
    '@type': 'ContactPage',
    '@id': ORIGIN + '/contact/#contact-page',
    name: '联系品沐咨询',
    url: ORIGIN + '/contact/',
    mainEntity: { '@id': ORIGIN + '/#organization' }
  };
}

function softwareApplicationNode(meta) {
  if (!meta.aiTool) return null;
  return {
    '@type': 'SoftwareApplication',
    '@id': absolute(meta.path) + '#software',
    name: 'Pinmoo AI 店铺经营诊断工作台',
    alternateName: ['Pinmoo AI', '电商经营周报自动生成工具', '天猫生意参谋周报工具'],
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: absolute(meta.path),
    creator: { '@id': ORIGIN + '/#organization' },
    description: meta.description,
    featureList: [
      '上传多份天猫、生意参谋相关 Excel 和 CSV 文件',
      '自动识别经营概览、商品、流量来源、客户、客服、直播、光合内容、推广计划和退款等报表',
      '标准化核心指标并生成经营周报预览',
      '支持导出 Word 和复制微信群发送话术',
      '保留支付、退款、净销售额、流量结构、每日销售、商品风险和推广 ROI 的基础图表快照'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '品牌方、电商运营服务商、电商运营负责人'
    },
    keywords: routeKeywords(meta)
  };
}

function definedTermSetNode(meta) {
  const resourcePage = resourcePageForMeta(meta);
  if (!resourcePage) return null;
  return {
    '@type': 'DefinedTermSet',
    '@id': absolute(meta.path) + '#terms',
    name: resourcePage.title,
    description: resourcePage.metaDescription,
    url: absolute(meta.path),
    inLanguage: 'zh-CN',
    publisher: { '@id': ORIGIN + '/#organization' },
    hasDefinedTerm: resourcePage.terms.map((term) => ({
      '@type': 'DefinedTerm',
      '@id': absolute(meta.path) + '#term-' + encodeURIComponent(term.name),
      name: term.name,
      alternateName: term.aliases,
      description: term.definition,
      termCode: term.category,
      inDefinedTermSet: { '@id': absolute(meta.path) + '#terms' }
    }))
  };
}

function webPageNode(meta) {
  const resourcePage = resourcePageForMeta(meta);
  const insight = insightForMeta(meta);
  const node = {
    '@type': resourcePage || meta.insightIndex ? 'CollectionPage' : meta.path === '/contact/' ? 'ContactPage' : meta.path === '/about/' ? 'AboutPage' : meta.path === '/cases/' ? 'CollectionPage' : 'WebPage',
    '@id': absolute(meta.path) + '#webpage',
    url: absolute(meta.path),
    name: meta.title,
    description: meta.description,
    inLanguage: meta.lang === 'en' ? 'en' : 'zh-CN',
    isPartOf: { '@id': ORIGIN + '/#website' },
    about: { '@id': ORIGIN + '/#organization' },
    breadcrumb: { '@id': absolute(meta.path) + '#breadcrumb' },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: routeImage(meta)
    },
    dateModified: meta.updated || contentDate,
    keywords: routeKeywords(meta)
  };
  if (meta.aiTool) node.mainEntity = { '@id': absolute(meta.path) + '#software' };
  if (meta.leadSlug) node.mainEntity = { '@id': absolute(meta.path) + '#service' };
  if (meta.caseSlug) node.mainEntity = { '@id': absolute(meta.path) + '#article' };
  if (insight) node.mainEntity = { '@id': absolute(meta.path) + '#article' };
  if (resourcePage) {
    node.mainEntity = { '@id': absolute(meta.path) + '#terms' };
    node.mentions = resourcePage.terms.map((term) => term.name);
  }
  return node;
}

export function jsonLdForRoute(meta) {
  const graph = [organizationNode(), websiteNode(), webPageNode(meta), breadcrumbNode(meta)];
  if (meta.path === '/' || meta.path === '/services/') graph.push(...serviceNodes());
  const optional = [itemListNode(meta), leadServiceNode(meta), faqNode(meta), personNode(meta), caseArticleNode(meta), insightArticleNode(meta), contactNode(meta), softwareApplicationNode(meta), definedTermSetNode(meta)].filter(Boolean);
  graph.push(...optional);
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function metaTagsForRoute(meta) {
  const canonicalPath = meta.canonicalPath || meta.path;
  return {
    title: meta.title,
    description: meta.description,
    canonical: absolute(canonicalPath),
    ogTitle: meta.title,
    ogDescription: meta.description,
    ogUrl: absolute(canonicalPath),
    ogImage: routeImage(meta),
    keywords: routeKeywords(meta)
  };
}

export function imageForRoute(meta) {
  return routeImage(meta);
}
