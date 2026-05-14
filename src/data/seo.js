import { SITE } from './site.js';
import { services, serviceFaqs } from './services.js';
import { cases } from './cases.js';
import { CASE_EN, EN_TEXT } from './en-text.js';

const ORIGIN = SITE.domain;
const logoUrl = ORIGIN + SITE.logo;
const ogUrl = ORIGIN + SITE.ogImage;
const phone = '+86-13600008584';

export const routeMeta = [
  {
    path: '/',
    file: 'index.html',
    title: '品沐咨询 pinmoo｜电商战略咨询与品牌增长陪跑',
    description: '品沐咨询 pinmoo 专注电商战略诊断、平台运营陪跑、商品页面优化、内容种草、投放复盘与私域增长，帮助品牌构建可持续的线上增长路径。',
    name: '首页',
    priority: '1.0',
    changefreq: 'weekly'
  },
  {
    path: '/services/',
    file: 'services/index.html',
    title: '服务介绍｜品沐咨询 PINMOO',
    description: '品沐咨询围绕平台选择、商品结构、内容种草、页面转化、广告投放、直播运营、会员复购等关键环节，提供诊断、策略、陪跑和复盘优化服务。',
    name: '服务介绍',
    priority: '0.9',
    changefreq: 'monthly'
  },
  {
    path: '/cases/',
    file: 'cases/index.html',
    title: '项目经验｜品沐咨询 PINMOO',
    description: '品沐咨询项目经验覆盖茶饮食品、服饰鞋包、营养健康、个护电器、传统企业转型、酒水食品等行业，关注问题拆解、动作落地与持续复盘。',
    name: '项目经验',
    priority: '0.9',
    changefreq: 'monthly'
  },
  {
    path: '/about/',
    file: 'about/index.html',
    title: '关于品沐咨询｜鲍俊文 沐风｜广州品沐咨询有限公司',
    description: '了解广州品沐咨询有限公司及主理人鲍俊文，花名沐风。品沐咨询专注电商战略诊断、平台运营陪跑、品牌增长、店铺诊断、页面优化、内容种草与数据复盘。',
    name: '关于品沐',
    priority: '0.8',
    changefreq: 'monthly'
  },
  {
    path: '/contact/',
    file: 'contact/index.html',
    title: '联系我们｜品沐咨询 PINMOO',
    description: '联系广州品沐咨询有限公司。微信 / 手机同号：13600008584。添加微信请注明来意：电商咨询 / 店铺诊断 / 运营陪跑 / 品牌增长 / 官网咨询。',
    name: '联系我们',
    priority: '0.8',
    changefreq: 'monthly'
  },
  ...cases.map((item) => ({
    path: '/cases/' + item.slug + '/',
    file: 'cases/' + item.slug + '/index.html',
    title: item.title + '｜品沐咨询项目经验',
    description: item.summary,
    name: item.title,
    caseSlug: item.slug,
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
    title: 'About PINMOO Consulting | Guangzhou PINMOO Consulting Co., Ltd.',
    description: 'Learn about Guangzhou PINMOO Consulting and its practical China e-commerce consulting experience across strategy diagnosis, operation coaching, store diagnosis, page optimization, content seeding and data review.',
    name: 'About',
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
    priority: '0.8',
    changefreq: 'monthly',
    lang: 'en',
    alternatePath: '/contact/'
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
      priority: '0.7',
      changefreq: 'monthly',
      lang: 'en',
      alternatePath: '/cases/' + item.slug + '/'
    };
  })
);

export function absolute(pathname) {
  if (pathname === '/') return ORIGIN + '/';
  return ORIGIN + pathname.replace(/\/$/, '');
}

function organizationNode() {
  return {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORIGIN + '/#organization',
    name: SITE.company,
    alternateName: ['PINMOO', '品沐咨询', 'pinmoo consulting', 'pinmooconsulting'],
    legalName: SITE.company,
    url: ORIGIN + '/',
    logo: logoUrl,
    image: ogUrl,
    telephone: phone,
    areaServed: ['中国', '广东', '广州', '天猫', '京东', '抖音', '小红书', '视频号', '拼多多'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: '广州',
      addressRegion: '广东',
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
    description: '广州品沐咨询有限公司专注电商战略咨询、平台运营陪跑、品牌增长、店铺诊断、页面优化、内容种草、投放复盘与私域会员运营。'
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ORIGIN + '/#website',
    url: ORIGIN + '/',
    name: 'PINMOO 品沐咨询',
    inLanguage: 'zh-CN',
    publisher: { '@id': ORIGIN + '/#organization' }
  };
}

function breadcrumbNode(meta) {
  const homeName = meta.lang === 'en' ? 'Home' : '首页';
  const caseName = meta.lang === 'en' ? 'Case Studies' : '项目经验';
  const casePath = meta.lang === 'en' ? '/en/cases/' : '/cases/';
  const items = [{ '@type': 'ListItem', position: 1, name: homeName, item: meta.lang === 'en' ? absolute('/en/') : ORIGIN + '/' }];
  if (meta.path !== '/') {
    if (meta.path.startsWith('/cases/') && meta.path !== '/cases/') {
      items.push({ '@type': 'ListItem', position: 2, name: '项目经验', item: absolute('/cases/') });
      items.push({ '@type': 'ListItem', position: 3, name: meta.name, item: absolute(meta.path) });
    } else if (meta.path.startsWith('/en/cases/') && meta.path !== '/en/cases/') {
      items.push({ '@type': 'ListItem', position: 2, name: caseName, item: absolute(casePath) });
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
    url: ORIGIN + '/services'
  }));
}

function itemListNode(meta) {
  if (meta.path === '/services/') {
    return {
      '@type': 'ItemList',
      '@id': ORIGIN + '/services/#service-list',
      name: '品沐咨询核心服务',
      itemListElement: services.map((service, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: { '@id': ORIGIN + '/services/#' + service.id, name: service.title }
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
  return null;
}

function faqNode(meta) {
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
  if (meta.path !== '/about/') return null;
  return {
    '@type': 'Person',
    '@id': ORIGIN + '/about/#mufeng',
    name: '鲍俊文',
    alternateName: ['沐风', '鲍俊文｜沐风'],
    jobTitle: '电商运营与品牌增长顾问',
    image: ORIGIN + '/assets/mufeng-profile.jpg',
    worksFor: { '@id': ORIGIN + '/#organization' },
    description: '鲍俊文，花名沐风，广州品沐咨询有限公司主理人，长期深耕电商运营、平台推广与品牌增长咨询。',
    knowsAbout: ['电商咨询', '天猫运营', '京东运营', '抖音电商', '小红书种草', '店铺诊断', '页面优化', '投放复盘', '会员运营']
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
    url: ORIGIN + '/contact',
    mainEntity: { '@id': ORIGIN + '/#organization' }
  };
}

function webPageNode(meta) {
  return {
    '@type': meta.caseSlug ? 'Article' : meta.path === '/contact/' ? 'ContactPage' : meta.path === '/about/' ? 'AboutPage' : meta.path === '/cases/' ? 'CollectionPage' : 'WebPage',
    '@id': absolute(meta.path) + '#webpage',
    url: absolute(meta.path),
    name: meta.title,
    description: meta.description,
    inLanguage: meta.lang === 'en' ? 'en' : 'zh-CN',
    isPartOf: { '@id': ORIGIN + '/#website' },
    about: { '@id': ORIGIN + '/#organization' },
    breadcrumb: { '@id': absolute(meta.path) + '#breadcrumb' }
  };
}

export function jsonLdForRoute(meta) {
  const graph = [organizationNode(), websiteNode(), webPageNode(meta), breadcrumbNode(meta)];
  if (meta.path === '/' || meta.path === '/services/') graph.push(...serviceNodes());
  const optional = [itemListNode(meta), faqNode(meta), personNode(meta), caseArticleNode(meta), contactNode(meta)].filter(Boolean);
  graph.push(...optional);
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function metaTagsForRoute(meta) {
  return {
    title: meta.title,
    description: meta.description,
    canonical: absolute(meta.path),
    ogTitle: meta.title,
    ogDescription: meta.description,
    ogUrl: absolute(meta.path),
    ogImage: meta.caseSlug ? ORIGIN + cases.find((entry) => entry.slug === meta.caseSlug)?.image : ogUrl
  };
}
