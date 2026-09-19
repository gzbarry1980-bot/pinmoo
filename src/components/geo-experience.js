// Shared by the static generator and the optional React preview.
export function geoHero(en = false) {
  const steps = en ? ['Be discovered', 'Win the decision', 'Grow with evidence'] : ['被发现', '形成购买', '持续增长'];
  return `<section class="geo-hero studio-hero"><img class="studio-backdrop" src="/assets/visuals/human-home.webp" width="1672" height="941" alt="" fetchpriority="high"><div class="container geo-hero-content">
    <p class="geo-eyebrow">PINMOO CONSULTING <span>BRAND / COMMERCE / AI</span></p>
    <h1>${en ? 'PINMOO<br><span>China e-commerce growth consulting</span>' : '品沐咨询<br><span>品牌电商增长顾问</span>'}</h1>
    <p class="studio-statement">${en ? 'Find the opportunity.<br>Build what comes next.' : '看清增长机会。<br>让下一步，真正发生。'}</p>
    <p class="geo-hero-description">${en ? 'From search visibility and product value to conversion, media efficiency and repeat purchase.' : '从品牌被发现、商品被理解，到成交效率、投放质量与会员复购，帮助品牌把电商增长做成一条完整链路。'}</p>
    <div class="geo-hero-actions"><a class="btn btn-primary" href="${en ? '/en/contact/' : '/contact/'}" data-placement="hero">${en ? 'Discuss China growth' : '预约品牌电商咨询'}</a><a class="geo-text-link" href="${en ? '/china-ecommerce-consulting/' : '/contact/?service=geo-report'}" data-event="report_open" data-placement="hero">${en ? 'Explore our approach' : '免费领取品牌 GEO 基础报告'} <span aria-hidden="true">↗</span></a></div>
    <div class="geo-journey" aria-label="${en ? 'Commerce growth journey' : '品牌电商增长链路'}">${steps.map((step,i) => `<a class="geo-journey-step" href="${en ? '/en/services/' : ['/services/geo-consulting/','/services/page-conversion-optimization/','/services/tmall-jd-consultant/'][i]}" style="--step:${i}"><span>0${i+1}</span><strong>${step}</strong><span class="studio-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
    <p class="geo-hero-note">${en ? 'Start with one concrete business question.' : 'GEO 与 SEO 解决“被发现”，电商经营能力承接“为什么买、如何增长”'}</p>
  </div><span class="studio-image-credit">${en ? 'GROWTH, BY DESIGN / AI visual' : 'GROWTH, BY DESIGN / AI 创意视觉'}</span></section><div class="studio-disciplines"><div class="container"><span>STRATEGY</span><span>${en ? 'Commerce operations' : '电商经营'}</span><span>${en ? 'Brand discovery' : '品牌发现'}</span><span>${en ? 'Conversion' : '成交转化'}</span><span>DATA & AI</span></div></div>`;
}

export function consultingOverview(en = false) {
  const prefix = en ? '/en' : '';
  const items = en ? [
    ['Strategy & operations', 'Find priorities. Put the plan into practice.', 'services', '/en/services/'],
    ['Product & conversion', 'Connect product value with the buying decision.', 'cases', '/en/services/'],
    ['GEO & search visibility', 'Help customers discover and understand your brand.', 'insights', '/china-ecommerce-consulting/']
  ] : [
    ['电商战略与运营陪跑', '找到经营重点，让策略进入日常执行。', 'services', '/services/tmall-jd-consultant/'],
    ['商品表达与成交转化', '让商品价值被理解，让流量更好地承接。', 'cases', '/services/page-conversion-optimization/'],
    ['品牌 GEO 与搜索发现', '从搜索与 AI 问答，建立品牌的发现入口。', 'insights', '/services/geo-consulting/']
  ];
  return `<section class="section consulting-offer"><div class="container"><div class="consulting-heading"><div><p class="section-eyebrow">OUR SERVICES</p><h2>${en ? 'The right support.<br>At the right stage.' : '从经营问题出发，<br>找到适合的增长支持。'}</h2></div><p>${en ? 'Strategy, execution and review work together. Start with the question that matters most to your business.' : '品牌所处的阶段不同，优先事项也不同。品沐把战略、执行和复盘连在一起，从最值得解决的问题开始。'}</p></div><div class="consulting-mosaic">${items.map((x,i)=>`<a class="consulting-service reveal" href="${x[3]}"><img src="/assets/visuals/brand-${x[2]}.webp?v=people-20260918" alt="" width="1672" height="941" loading="lazy"><div><span>0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></div><span class="consulting-link-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></div></section><section class="consulting-request"><div class="container"><h2>${en ? 'A question specific to your brand?' : '你的品牌，需要怎样的支持？'}</h2><a class="btn btn-secondary" href="${prefix}/contact/">${en ? 'Talk with PINMOO' : '聊聊你的经营问题'} <span aria-hidden="true">↗</span></a></div></section><section class="section consulting-approach"><div class="container"><figure><img src="/assets/visuals/brand-about.webp?v=people-20260918" alt="${en ? 'AI illustration of a consulting discussion' : '咨询团队讨论场景示意（AI生成）'}" width="1672" height="941" loading="lazy"><figcaption>${en ? 'AI consulting illustration' : 'AI 咨询场景示意'}</figcaption></figure><div><p class="section-eyebrow">OUR APPROACH</p><h2>${en ? 'Clarity in strategy.<br>Consistency in execution.' : '把复杂问题拆清楚，<br>陪团队把关键动作做扎实。'}</h2><p>${en ? 'We connect platform operations, product communication, media quality and business review into a practical working process.' : '从平台经营、商品页面到内容投放与数据复盘，先统一判断，再明确行动。GEO 帮助品牌被发现，经营能力承接后续的购买与复购。'}</p><ul><li>${en ? 'Priorities based on your business context' : '先判断问题与优先级，再确定合作范围'}</li><li>${en ? 'Clear deliverables and regular reviews' : '明确交付、团队配合和持续复盘节奏'}</li></ul><a class="geo-text-link" href="${prefix}/about/">${en ? 'Meet PINMOO' : '了解品沐的工作方式'} ↗</a></div></div></section>`;
}

export function geoReportPreview(en = false) {
  const items = en ? [
    ['Visibility', 'Can people find the right brand?', 'Check official pages, indexing and the sources appearing in search answers.', ['Official website', 'Search findings', 'Source links']],
    ['Brand facts', 'Does the information agree?', 'Compare company, product and contact information across public sources.', ['Company identity', 'Product details', 'Contact information']],
    ['Next steps', 'What should change first?', 'Separate technical fixes, content gaps and questions for a later measurement.', ['Priority actions', 'Content plan', 'Repeatable questions']]
  ] : [
    ['搜索可见度', '客户问起你时，能找到正确的品牌吗？', '检查官网能否访问与被抓取，记录公开搜索中出现的品牌信息及来源。', ['官网与页面状态', '搜索结果记录', '来源链接']],
    ['品牌信息', '不同渠道，是否在讲同一个品牌？', '对照公司、产品、服务与联系方式，找出容易让客户或 AI 混淆的地方。', ['公司与品牌关系', '产品与服务事实', '官方联系渠道']],
    ['优化建议', '有限的时间，先解决哪些问题？', '把发现整理成优先事项，区分技术修复、内容补充与后续需要复测的问题。', ['优先行动清单', '重点内容建议', '固定复测问题']]
  ];
  return `<section class="section geo-report-section"><div class="container">
    <div class="geo-report-heading"><div><p class="geo-eyebrow">YOUR FIRST GEO REPORT</p><h2>${en ? 'A clearer starting point.' : '先看清问题，再决定投入。'}</h2></div><p>${en ? 'Report structure illustration, not a client result.' : '免费基础报告包含什么？以下为报告结构示意，不代表客户结果。'}</p></div>
    <div class="geo-report-layout"><figure class="geo-report-art"><img src="/assets/visuals/geo-report-structure.webp" width="1200" height="545" loading="lazy" decoding="async" alt="${en ? 'AI-generated illustration of a GEO report structure' : '品牌 GEO 报告结构示意（AI 生成图）'}"><figcaption>${en ? 'AI-generated report structure illustration' : '报告结构示意图 · AI 生成'}</figcaption></figure>
    <div class="geo-report-reader"><nav class="geo-report-tabs" aria-label="${en ? 'Report chapters' : '报告章节'}">${items.map((x,i)=>`<a href="#report-panel-${i}" data-report-tab="${i}" id="report-tab-${i}">${x[0]}</a>`).join('')}</nav>${items.map((x,i)=>`<section id="report-panel-${i}" class="geo-report-panel" data-report-panel="${i}"><span class="geo-report-number">0${i+1} / 03</span><h3>${x[1]}</h3><p>${x[2]}</p><ul>${x[3].map(s=>`<li>${s}</li>`).join('')}</ul></section>`).join('')}</div></div>
  </div></section>`;
}

export function geoProcess(en = false) {
  const items = en ? [['Share your question','Send your brand name, website and the question you want to resolve.'],['Review the findings','Receive a public-information report and discuss priorities.'],['Choose the next step','Agree the scope, deliverables and review dates before starting.']] : [['发来品牌资料','品牌名称、官网或店铺链接，以及你现在最想解决的问题。'],['看报告，聊重点','先拿到公开信息版基础报告，再一起确认最值得优先处理的事项。'],['确认范围，再合作','需要深入推进时，明确交付清单、配合事项和复盘时间。']];
  return `<section class="section geo-process-section"><div class="container"><p class="geo-eyebrow">WORKING TOGETHER</p><h2>${en ? 'Start with a conversation.' : '合作，从一个具体问题开始。'}</h2><div class="geo-process-grid">${items.map((x,i)=>`<article class="reveal"><span>0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></div></section>`;
}
