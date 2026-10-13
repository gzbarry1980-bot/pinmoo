import { SITE, HOME_FAQS } from '../data/site.js';
import { services, serviceFaqs } from '../data/services.js';
import { CASE_EN, EN_TEXT } from '../data/en-text.js';
import { cases } from '../data/cases.js';
import { practicalResources, resourceLibrary } from '../data/practical-resources.js';
import { geoHero, consultingOverview, geoProcess } from './geo-experience.js';

export function escapeMarkup(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

const hrefFor = (href, en) => en ? '/en' + href : href;
const link = (label, href, secondary = false, attrs = '') => `<a class="btn btn-${secondary ? 'secondary' : 'primary'}" href="${href}" ${attrs}>${label}</a>`;
const intro = (title, text = '') => `<div class="section-intro section-intro-left"><h2>${title}</h2>${text ? `<p>${text}</p>` : ''}</div>`;
const section = (cls, content, id = '') => `<section class="section ${cls}"${id ? ` id="${id}"` : ''}><div class="container">${content}</div></section>`;

export function insightCardMarkup(article) {
  const href = '/insights/' + article.slug + '/';
  return `<article class="insight-card reveal"><div class="insight-card-meta"><span>${escapeMarkup(article.category)}</span><time datetime="${article.updated}">${article.updated}</time></div><h3><a href="${href}">${escapeMarkup(article.shortTitle)}</a></h3><p>${escapeMarkup(article.summary)}</p><div class="insight-card-footer"><span>${escapeMarkup(article.readTime)}</span><a class="outline-link" aria-label="阅读全文：${escapeMarkup(article.shortTitle)}" href="${href}">阅读全文 <span aria-hidden="true">↗</span></a></div></article>`;
}

export function problemPaths(en = false) {
  const entries = en ? [
    ['Growth has stalled', 'Find the constraint across platforms, products, conversion and team execution.', '/en/services/'],
    ['Traffic is not converting', 'Review product messaging, buying objections and store handoffs.', '/en/services/'],
    ['Media spend is hard to judge', 'Connect campaign costs, conversion and refund quality.', '/en/services/'],
    ['The brand is difficult to find', 'Check public brand facts, content and search discovery.', '/china-ecommerce-consulting/']
  ] : [
    ['增长卡住，先改哪里？', '从平台、货盘和团队节奏判断优先事项。', '/services/ecommerce-diagnosis/'],
    ['有流量，为什么没成交？', '检查商品表达、页面顾虑与客服承接。', '/services/store-diagnosis/'],
    ['有成交，投入是否值得？', '一起看推广计划、退款与净销售贡献。', '/services/ecommerce-roi-review/'],
    ['品牌为什么难被找到？', '先梳理品牌事实、公开内容与搜索入口。', '/services/geo-consulting/']
  ];
  return section('problem-path-section', intro(en ? 'What needs attention first?' : '从你正在面对的问题开始。', en ? 'Choose the question closest to your business.' : '找到相似的问题，了解我们会怎样判断、交付和推进。') + `<div class="problem-path-grid">${entries.map((x, i) => `<a class="problem-path reveal" href="${x[2]}"><span class="path-number">0${i + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p><span class="path-action">${en ? 'Explore the approach' : '看看怎么解决'} <span aria-hidden="true">↗</span></span></a>`).join('')}</div>`);
}

export function previewCases(en = false) {
  const selected = ['womenswear-refund-optimization', 'personal-care-device-positioning', 'chenpi-brand-geo-diagnosis'];
  return selected.map(slug => {
    const item = cases.find(entry => entry.slug === slug);
    const view = en ? { ...item, ...CASE_EN[slug] } : item;
    const stage = slug === 'chenpi-brand-geo-diagnosis' ? (en ? 'Diagnosis and roadmap' : '诊断与实施规划') : (en ? 'Qualitative project experience' : '定性项目经验');
    return `<article class="case-card reveal"><a class="case-image-link" href="${hrefFor('/cases/' + slug + '/', en)}"><img src="${item.image.replace(/\.png$/, '.webp')}" alt="${escapeMarkup(view.industry + ' ' + view.serviceType)}" width="640" height="360" loading="lazy" decoding="async"></a><div class="case-card-body"><span class="case-stage">${stage}</span><h3><a href="${hrefFor('/cases/' + slug + '/', en)}">${escapeMarkup(view.title)}</a></h3><p>${escapeMarkup(view.summary)}</p><a class="text-link" href="${hrefFor('/cases/' + slug + '/', en)}">${en ? 'Read the project' : '查看问题与行动'} <span aria-hidden="true">↗</span></a></div></article>`;
  }).join('');
}

export function homePage(en = false, articleCards = '') {
  const questions = en ? [
    { q: 'Can we begin with one business question?', a: 'Yes. Share your brand, primary platform and current issue. We will discuss the priorities, materials and scope before proposing an engagement.' },
    { q: 'Who carries out the work?', a: 'PINMOO provides diagnosis, practical recommendations and review support. Your team and PINMOO agree who owns each action and whether production or operational execution is included.' },
    { q: 'How does GEO fit into e-commerce growth?', a: 'GEO supports brand discovery and accurate public information. Product messaging, conversion, paid media and retention still need their own operating work.' }
  ] : [HOME_FAQS[4], HOME_FAQS[2], HOME_FAQS[3], HOME_FAQS[6], HOME_FAQS[5], HOME_FAQS[0], HOME_FAQS[1], HOME_FAQS[8], HOME_FAQS[7]];
  const faq = questions.map(item => `<details class="customer-faq"><summary>${escapeMarkup(item.q)}</summary><p>${escapeMarkup(item.a)}</p></details>`).join('');
  const consult = `<div class="home-contact-close"><div><h3>${en ? 'Tell us what your brand is working on.' : '说说你的品牌，和最想解决的问题。'}</h3><p>${en ? 'Brand name, website or store, primary platform and one current question.' : '品牌名称、官网或店铺、主要平台，再加一个当前问题即可。'}</p><a href="tel:${SITE.phone}">${en ? 'WeChat / mobile' : '微信 / 手机同号'}：${SITE.phoneDisplay}</a></div>${link(en ? 'Discuss your project' : '聊聊经营问题', hrefFor('/contact/', en), false, 'data-event="consult_open"')}</div>`;
  const articles = en ? `<p>Explore the platforms, product messaging and store operations involved in entering the China market.</p>${link('Read the China market guide', '/china-ecommerce-consulting/', true)}` : `<div class="insight-card-grid">${articleCards}</div><div class="reading-resource-entry"><div><h3>让下次经营复盘更有准备。</h3><p>周会、退款、投放与品牌事实自查，四份模板可以直接使用。</p></div>${link('查看实用资料', resourceLibrary.path, true)}${link('浏览全部文章', '/insights/', true)}</div>`;
  return geoHero(en) + problemPaths(en) + consultingOverview(en) +
    section('cases-preview', intro(en ? 'The problem, the work, the experience.' : '相似的问题，具体的行动。', en ? 'Anonymised project experience; the published cases distinguish diagnosis from qualitative outcomes.' : '从项目背景、诊断发现到实际行动，了解我们的工作方式。案例依据客户资料保密与公开授权边界匿名呈现。') + `<div class="home-case-grid home-case-grid-featured">${previewCases(en)}</div><div class="center-actions">${link(en ? 'Explore projects' : '查看项目经验', hrefFor('/cases/', en), true)}</div>`, 'cases') +
    geoProcess(en) + section('home-insights-section', intro(en ? 'Practical reading for your next decision.' : '读完之后，知道下一步怎么做。', en ? 'Start with a useful guide.' : '精选经营方法与资料，帮助团队讨论问题、统一口径、安排动作。') + articles) +
    section('home-faq-section', `<div class="home-faq-grid"><div><p class="section-eyebrow">WORK WITH PINMOO</p><h2>${en ? 'Before we start.' : '开始合作前，你可能想了解。'}</h2><p>${en ? 'Clear expectations help us focus on the work.' : '先了解服务边界与配合方式，再讨论适合你的合作范围。'}</p><a class="text-link" href="${hrefFor('/about/', en)}">${en ? 'Meet PINMOO' : '认识顾问与工作方式'} ↗</a></div><div>${faq}</div></div>${consult}${en ? '' : '<details class="home-evidence-note"><summary>我们如何保证内容可信？</summary><p>品牌信息以公司公开资料为准；匿名案例保留实际项目的公开范围。诊断规划、定性项目经验和真实量化结果分别说明，AI提及与搜索排名需要持续复测。</p></details>'}`);
}

export function workingOptions(en = false) {
  const rows = en ? [
    ['One diagnosis', 'You need to identify the issue first', 'Current situation, key products and available reports', 'Diagnosis and priority actions', 'Check that findings have evidence and actions have owners'],
    ['A focused improvement', 'A product, page, campaign or GEO issue is already clear', 'Relevant materials and a person responsible for execution', 'Focused recommendations and a review plan', 'Review agreed deliverables and measured changes'],
    ['Ongoing coaching', 'Your team needs regular outside review', 'Business goals, regular data and team participation', 'Working rhythm, action follow-up and periodic reviews', 'Track actions, issues and next-cycle decisions']
  ] : [
    ['一次诊断', '先判断问题出在哪里', '品牌现状、重点商品与已有报表', '诊断结论与优先级行动清单', '结论有依据，动作有负责人'],
    ['专项改善', '商品、页面、投放或GEO问题已明确', '相关资料与具体执行负责人', '专项建议、交付材料与复测安排', '按约定交付物与真实变化验收'],
    ['持续陪跑', '已有团队，需要外部判断与推进节奏', '经营目标、周期数据与团队配合', '会议节奏、动作跟进与周期复盘', '跟踪完成动作、遗留问题与下周期决策']
  ];
  return section('working-options-section', intro(en ? 'Choose a way to work together.' : '按当前阶段，确定合作方式。', en ? 'Scope, timing and fees are agreed around your materials and needs.' : '从一次诊断开始，也可以针对一个问题深入推进。周期与费用根据资料、平台和交付范围确认。') + `<div class="comparison-scroll" role="region" aria-label="${en ? 'Engagement comparison' : '合作方式对照'}" tabindex="0"><table class="working-options"><thead><tr>${(en ? ['Engagement', 'When it fits', 'What to prepare', 'What you receive', 'How to review'] : ['合作方式', '适合的阶段', '准备什么', '拿到什么', '怎样验收']).map(x => `<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((x, i) => `<${i === 0 ? 'th scope="row"' : 'td'}>${x}</${i === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</tbody></table></div><p class="cooperation-boundary">${en ? 'PINMOO clarifies priorities and deliverables. Your team owns the agreed operating actions; design, production and account execution are included only when specified.' : '品沐负责诊断、策略、交付建议与复盘支持；品牌团队负责约定的经营执行。设计制作、账户代操作等事项，按项目另行明确分工。'}</p>`);
}

export function servicesContent(en = false) {
  const translate = value => en ? EN_TEXT[value] || value : value;
  const groups = en ? [
    ['Strategy & operations', 'Understand the constraint and set the working rhythm.', 'Diagnosis, priorities and action tracking.'],
    ['Product & retention', 'Connect product value, buying decisions and repeat purchase.', 'Page recommendations, customer questions and retention planning.'],
    ['Media & business review', 'Compare spending with conversion and sales quality.', 'Campaign review, metric definitions and next-cycle actions.'],
    ['Brand search & GEO', 'Make public information clearer and easier to discover.', 'Brand fact base, content priorities and repeatable questions.']
  ] : [
    ['经营诊断与策略', '看清平台、商品与团队的增长卡点。', '交付：诊断结论、优先级与行动清单。'],
    ['商品转化与复购', '让购买理由、页面承接与老客运营连起来。', '交付：页面建议、客服问题与复购方案。'],
    ['投放复盘与经营提效', '统一花费、成交与退款口径，安排预算和动作。', '交付：计划复盘、经营周报与跟进清单。'],
    ['品牌搜索与GEO', '帮助品牌被找到，并被准确理解。', '交付：品牌事实库、内容建议与固定复测问题。']
  ];
  const order = ['strategy-diagnosis', 'operation-coaching', 'conversion-optimization', 'content-seeding', 'data-review', 'membership-private-domain', 'geo-consulting'];
  const englishNames = ['Strategy diagnosis', 'Operations coaching', 'Product and page optimization', 'Content and seeding strategy', 'Advertising and data review', 'Membership and retention', 'GEO and AI search visibility'];
  const englishShorts = ['Find priorities across platforms, products, traffic and team execution.', 'Build an operating rhythm and review process with your team.', 'Clarify product value and address questions before and after purchase.', 'Connect content discovery with store conversion.', 'Review campaign costs, conversion and refund quality together.', 'Plan customer segments, benefits and repeat-purchase handoffs.', 'Align public brand facts, useful content and repeatable measurement.'];
  const slugs = ['ecommerce-diagnosis', 'tmall-jd-consultant', 'page-conversion-optimization', 'douyin-xiaohongshu-growth', 'ecommerce-roi-review', 'member-repurchase-private-domain', 'geo-consulting'];
  const details = order.map((id, i) => {
    const item = services.find(service => service.id === id);
    const fields = en && id === 'geo-consulting' ? [
      ['When it fits', ['Public brand information is inconsistent or hard to discover.']],
      ['Work involved', ['Technical and content review, brand facts, useful answers and repeatable measurement.']],
      ['Deliverables', ['A fact base, priority actions, content plan and recorded mention, accuracy and citation checks.']]
    ] : en ? [
      ['When it fits', item.fit.map(translate)], ['Work involved', item.content.map(translate)], ['Deliverables', item.deliverables.map(translate)]
    ] : [['适合谁', item.fit], ['主要工作', item.content], ['交付成果', item.deliverables]];
    return `<details class="service-detail-card"><summary class="service-detail-summary"><div><h3>${en ? englishNames[i] : item.title}</h3><p>${en ? englishShorts[i] : item.short}</p></div><span class="detail-toggle" aria-hidden="true">+</span></summary><div class="service-detail-body"><div class="service-detail-columns">${fields.map(([title, values]) => `<div><h4>${title}</h4><ul>${values.map(x => `<li>${escapeMarkup(x)}</li>`).join('')}</ul></div>`).join('')}</div>${link(en ? 'Discuss this service' : '查看专项服务', en ? '/en/contact/' : '/services/' + slugs[i] + '/', true)}</div></details>`;
  }).join('');
  const faqs = en ? [
    { q: 'Can we start with one diagnosis?', a: 'Yes. We agree the question, available materials and deliverables before deciding whether deeper work is needed.' },
    { q: 'Do you guarantee growth or AI recommendations?', a: 'No. We agree practical work and measurement. Outcomes depend on products, resources, execution, platforms and available sources.' }
  ] : serviceFaqs;
  return problemPaths(en) + section('service-capabilities-section', intro(en ? 'Four connected areas of support.' : '四个方向，连接品牌经营。') + `<div class="service-capabilities">${groups.map((x, i) => `<article><span>0${i + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p><strong>${x[2]}</strong></article>`).join('')}</div>`) + workingOptions(en) +
    section('service-detail-section', intro(en ? 'Explore the scope of each service.' : '进一步了解各项服务。', en ? 'Open a service to see the work and deliverables.' : '展开查看适合对象与交付内容，或进入专项页了解具体问题。') + `<div class="service-detail-list">${details}</div>`, 'core-services') +
    section('service-proof-section', intro(en ? 'See how a recommendation becomes an action.' : '看看一条建议如何进入执行。') + `<div class="deliverable-example"><p class="section-eyebrow">${en ? 'DELIVERABLE STRUCTURE EXAMPLE' : '交付结构示意'}</p><h3>${en ? 'A product receives traffic but conversion is weak.' : '一款商品有流量，但成交承接偏弱。'}</h3><ol>${(en ? ['Check traffic relevance and buying objections.', 'Assign page messaging and customer-service changes.', 'Confirm owners, dates and metric definitions.', 'Compare conversion and refund quality after the change.'] : ['核对人群匹配、购买顾虑与数据口径。', '拆成页面表达、SKU说明与客服承接动作。', '明确负责人、完成时间和复测指标。', '对照改版后的转化与退款质量，再安排下一轮。']).map(x => `<li>${x}</li>`).join('')}</ol><p>${en ? 'This is an illustration of the working method, not a client result.' : '以上为工作方法示意，不代表客户数据或结果。'}</p></div>${link(en ? 'View project experience' : '看项目中的实际行动', hrefFor('/cases/', en), true)}`) +
    section('faq-section', intro(en ? 'Questions before working together.' : '合作前的常见问题。') + `<div class="customer-faq-list">${faqs.map(item => `<details class="customer-faq"><summary>${escapeMarkup(item.q)}</summary><p>${escapeMarkup(item.a)}</p></details>`).join('')}</div>`) +
    section('service-contact-section', `<div class="home-contact-close"><div><h2>${en ? 'Which issue should we look at first?' : '先聊一个最值得解决的问题。'}</h2><p>${en ? 'Share your brand, platform and current question.' : '发送品牌、主要平台与当前问题，一起判断合适的范围。'}</p></div>${link(en ? 'Discuss your project' : '咨询经营问题', hrefFor('/contact/', en), false, 'data-event="consult_open"')}</div>`);
}

export function contactContent(en = false) {
  const report = en ? ['Consistency of public brand and company facts', 'Official website access and visible content', 'Public search entries and sources', 'Content and evidence gaps', 'Priorities and questions for later measurement'] : ['公司与品牌事实是否一致', '官网是否可访问、正文是否清楚', '公开搜索入口与来源记录', '内容和证据需要补充的地方', '优先行动与后续复测问题'];
  const message = en ? 'Brand: ___; website or store: ___; primary platform: ___; current issue: ___; next-stage objective: ___.' : '品牌名称：___；官网或店铺：___；主要平台：___；当前最想解决的问题：___；下一阶段目标：___。';
  const map = en ? SITE.mapUrl : 'https://map.baidu.com/search/' + encodeURIComponent(SITE.address);
  return section('contact-section', `<div class="contact-upgrade-grid"><div class="contact-conversation"><p class="section-eyebrow">LET'S TALK</p><h2>${en ? 'Start with one question.' : '从一个经营问题开始。'}</h2><p>${en ? 'Send your brand name, primary platform and the question you most want to resolve.' : '可以聊店铺增长、商品页面、投放、会员复购或GEO。先发送品牌、平台和当前问题即可。'}</p><p class="contact-phone-label">${en ? 'WeChat / mobile' : '微信 / 手机同号'}</p><a class="contact-big-phone" href="tel:${SITE.phone}">${SITE.phoneDisplay}</a><div class="contact-actions"><button type="button" class="btn btn-primary geo-copy-button" data-copy-wechat="${SITE.phone}">${en ? 'Copy WeChat' : '复制微信号'}</button>${link(en ? 'Call' : '拨打电话', 'tel:' + SITE.phone, true)}</div><p class="copy-status" role="status" aria-live="polite"></p><div class="contact-message"><h3>${en ? 'A message you can start with' : '发来这些信息，沟通更具体。'}</h3><p id="inquiryTemplate0">${message}</p><button type="button" class="copy-template-button" data-copy-target="inquiryTemplate0"><span>${en ? 'Copy this message' : '复制咨询说明'}</span></button></div><dl class="contact-office"><div><dt>${en ? 'Company' : '公司'}</dt><dd>${en ? SITE.companyEn : SITE.company}</dd></div><div><dt>${en ? 'Office' : '办公地址'}</dt><dd>${en ? 'Zhonghua International Plaza, Yuexiu District, Guangzhou' : SITE.address} <a href="${map}" target="_blank" rel="noopener noreferrer">${en ? 'Open map search' : '地图搜索'} ↗</a></dd></div><div><dt>${en ? 'Hours' : '工作时间'}</dt><dd>${en ? 'Weekdays 9:00–18:00; usually reply within 24 hours' : SITE.workTime + '；' + SITE.responseTime}</dd></div></dl></div><aside class="contact-wechat"><h2>${en ? 'Meet us on WeChat.' : '微信里，聊得更具体。'}</h2><figure><img src="/assets/wechat-qr-mufeng.jpg" alt="${en ? 'PINMOO WeChat QR code' : '品沐咨询微信二维码'}" width="320" height="420" loading="lazy"><figcaption>${en ? 'Scan or save the QR code' : '扫码或保存二维码，添加品沐咨询'}</figcaption></figure><details class="contact-report-details"><summary>${en ? 'Free brand GEO report' : '免费品牌 GEO 基础报告'}</summary><p>${en ? 'Mention “brand GEO report” and share your website or store. The public-information review covers:' : '添加微信时备注“品牌GEO报告”，发送官网或店铺。公开信息版基础报告主要看：'}</p><ul>${report.map(x => `<li>${x}</li>`).join('')}</ul><p class="report-boundary">${en ? 'AI mention and citation results are included only when actual tests have been performed and recorded. In-depth implementation is scoped separately.' : 'AI平台的提及与引用结果以实际测试记录为准；深入实施与持续监测另行确认范围。'}</p></details><a class="text-link" data-event="report_open" href="${en ? '/china-ecommerce-consulting/' : '/services/geo-consulting/'}">${en ? 'Explore brand discovery' : '了解GEO专项服务'} ↗</a></aside></div>`);
}

export function resourceCards() {
  return practicalResources.map(item => `<article class="practical-resource-card"><p class="section-eyebrow">${item.id.toUpperCase().replaceAll('-', ' / ')}</p><h3><a href="${resourceLibrary.path}#${item.id}">${item.title}</a></h3><p>${item.description}</p><a class="text-link" href="/downloads/${item.filename}" download data-event="resource_download">下载表格 <span aria-hidden="true">↓</span></a></article>`).join('');
}

export function resourceLibraryContent() {
  return section('resource-library-section', `<p class="resource-intro">四份空白工作表，配套填写方法与口径说明。无需登录，可直接下载为CSV，用Excel或其他表格工具打开。</p><nav class="resource-jump" aria-label="资料目录">${practicalResources.map(x => `<a href="#${x.id}">${x.title}</a>`).join('')}</nav>${practicalResources.map(item => `<article class="resource-detail" id="${item.id}"><div class="resource-detail-heading"><div><p class="section-eyebrow">PRACTICAL RESOURCES</p><h2>${item.title}</h2><p>${item.description}</p></div>${link('下载表格', '/downloads/' + item.filename, false, 'download data-event="resource_download"')}</div><div class="resource-guidance"><div><h3>怎么使用</h3><p>${item.use}</p></div><div><h3>先确认口径</h3><p>${item.boundary}</p></div></div><details class="resource-fields"><summary>预览表格字段</summary><ul>${item.headers.map(x => `<li>${escapeMarkup(x)}</li>`).join('')}</ul></details><a class="text-link" href="/insights/${item.article}/">阅读配套方法 ↗</a></article>`).join('')}<div class="reading-resource-entry"><div><h2>报表里的数字，先对齐含义。</h2><p>支付金额、净销售额、退款与推广ROI，需要注明各自的数据来源和周期。</p></div>${link('查看经营指标词典', '/resources/ecommerce-metrics-dictionary/', true)}</div>`);
}

export function aboutContent(en = false) {
  const steps = en ? [
    ['Read the business context', 'Start with goals, products, platforms and available reports.'],
    ['Find the priority', 'Connect conversion, media, refunds and team execution before recommending changes.'],
    ['Make the work concrete', 'Agree deliverables, responsibilities and dates with your team.'],
    ['Review and improve', 'Return to the same question and metric definitions after the actions.']
  ] : [
    ['看清经营现状', '结合品牌目标、商品、平台与已有资料，先理解问题。'],
    ['判断优先级', '把转化、投放、退款与团队执行放在一起，找到关键环节。'],
    ['把动作拆具体', '明确交付、团队分工、负责人和完成时间。'],
    ['持续复盘', '对照同一个问题与指标口径，安排下一周期的改善。']
  ];
  return section('about-principal-section', `<div class="about-principal-layout"><figure><img src="/assets/mufeng-profile.jpg" alt="${en ? 'Bao Junwen, principal of PINMOO' : SITE.principal.displayName}" width="360" height="360" loading="lazy"></figure><div><p class="section-eyebrow">MEET YOUR ADVISOR</p><h2>${en ? 'Bao Junwen / Mufeng / BarryBao' : SITE.principal.displayName}</h2><p class="about-principal-role">${en ? 'Principal of PINMOO Consulting' : SITE.principal.title}</p><p>${en ? 'PINMOO supports consumer brands with e-commerce diagnosis, operations coaching, product-page recommendations, paid-media review and business tools.' : '主理品沐咨询，面向消费品牌提供电商经营诊断、运营陪跑、页面优化、投放复盘和AI经营工具服务。'}</p><p>${en ? 'We help your team clarify the next decision and connect it to practical work. GEO supports discovery alongside conversion, media and repeat-purchase operations.' : '从平台选择、货盘与商品表达，到客服承接、数据复盘和会员复购，帮助团队把下一步做清楚。GEO与SEO支持品牌发现，经营工作承接购买与持续增长。'}</p>${link(en ? 'Discuss your question' : '和顾问聊聊你的问题', hrefFor('/contact/', en), false, 'data-event="consult_open"')}</div></div>`) +
    section('about-method-section', intro(en ? 'How we work with your team.' : '顾问方法，进入团队的日常工作。') + `<div class="service-capabilities">${steps.map((x, i) => `<article><span>0${i + 1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div>`) +
    section('about-fit-section', `<div class="about-fit-layout"><div><h2>${en ? 'When outside support is useful.' : '这些阶段，适合引入外部顾问。'}</h2><ul>${(en ? ['Preparing an e-commerce channel with an existing product base.', 'An online brand needs to identify why growth has stalled.', 'An operating team needs clearer priorities and regular review.'] : ['已有产品基础，准备搭建电商渠道。', '已经在线上经营，需要判断增长卡点。', '已有运营团队，需要外部判断、专项支持与复盘节奏。']).map(x => `<li>${x}</li>`).join('')}</ul></div><div><h2>${en ? 'See the work before deciding.' : '先了解工作，再决定合作。'}</h2><p>${en ? 'Read an anonymised project or compare the service scope and deliverables.' : '从匿名项目中的问题、行动与阶段成果，了解品沐的工作方式；也可以比较合作形式的交付与分工。'}</p>${link(en ? 'Project experience' : '查看项目经验', hrefFor('/cases/', en), true)} ${link(en ? 'Service scope' : '比较服务与交付', hrefFor('/services/', en), true)}</div></div>`) +
    section('about-company-section', `<h2>${en ? 'Official company information' : '公司与官方信息'}</h2><dl class="contact-office"><div><dt>${en ? 'Company' : '公司名称'}</dt><dd>${en ? SITE.companyEn : SITE.company}</dd></div><div><dt>${en ? 'Brand' : '品牌'}</dt><dd>PINMOO / ${en ? 'Pinmoo Consulting' : '品沐咨询'}</dd></div><div><dt>${en ? 'Office' : '办公地址'}</dt><dd>${en ? 'Zhonghua International Plaza, Yuexiu District, Guangzhou, China' : SITE.address}</dd></div><div><dt>${en ? 'Contact' : '公开联系'}</dt><dd><a href="tel:${SITE.phone}">${SITE.phoneDisplay}</a></dd></div></dl><details class="home-evidence-note"><summary>${en ? 'Company identity and public case boundaries' : '公司名称与案例公开说明'}</summary><p>${en ? 'This website represents Guangzhou Pinmoo Consulting Co., Ltd. Similar names do not imply an affiliation. Client cases are anonymised; public results follow their evidence and disclosure scope.' : '本官网代表广州品沐咨询有限公司，与其他近似名称主体不能据名称推断隶属关系。项目按客户保密与公开授权边界匿名呈现，阶段成果依据实际资料说明。'}</p></details>`);
}
