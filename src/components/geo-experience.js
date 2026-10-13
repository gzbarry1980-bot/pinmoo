// Shared by the static generator and the optional React preview.
export function geoHero(en = false) {
  const steps = en ? ['Be discovered', 'Win the decision', 'Grow with evidence'] : ['被发现', '形成购买', '持续增长'];
  return `<section class="geo-hero studio-hero"><img class="studio-backdrop" src="/assets/visuals/human-home.webp" width="1672" height="941" alt="" fetchpriority="high"><div class="container geo-hero-content">
    <p class="geo-eyebrow">PINMOO CONSULTING <span>BRAND / COMMERCE / AI</span></p>
    <h1>${en ? 'PINMOO<br><span>China e-commerce growth consulting</span>' : '品沐咨询<br><span>品牌电商增长顾问</span>'}</h1>
    <p class="studio-statement">${en ? 'Find the opportunity.<br>Build what comes next.' : '看清增长机会。<br>把关键动作做扎实。'}</p>
    <p class="geo-hero-description">${en ? 'Strategy diagnosis, product conversion, paid-media review and brand discovery. Practical support for your next business decision.' : '从店铺诊断、商品转化到投放复盘与品牌 GEO，帮助消费品牌看清问题，推进关键经营动作。'}</p>
    <div class="geo-hero-actions"><a class="btn btn-primary" href="${en ? '/en/contact/' : '/contact/'}" data-event="consult_open" data-placement="hero">${en ? 'Discuss your project' : '聊聊你的经营问题'}</a><a class="geo-text-link" href="${en ? '/en/services/' : '/services/'}">${en ? 'Services and deliverables' : '查看服务与交付'} <span aria-hidden="true">↗</span></a></div>
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
  return `<section class="section consulting-offer"><div class="container"><div class="consulting-heading"><div><p class="section-eyebrow">OUR SERVICES</p><h2>${en ? 'The right support.<br>At the right stage.' : '从经营问题出发，<br>找到适合的增长支持。'}</h2></div><p>${en ? 'Clear priorities, practical deliverables and review with your team.' : '诊断报告、页面建议、行动清单与周期复盘。每项合作都明确交付内容、团队分工与下一步。'}</p></div><div class="consulting-mosaic">${items.map((x,i)=>`<a class="consulting-service reveal" href="${x[3]}"><img src="/assets/visuals/brand-${x[2]}.webp?v=people-20260918" alt="" width="1672" height="941" loading="lazy"><div><span>0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></div><span class="consulting-link-arrow" aria-hidden="true">↗</span></a>`).join('')}</div><div class="home-offer-links"><a class="text-link" href="${prefix}/services/">${en ? 'Compare ways to work together' : '比较诊断、专项与陪跑'} ↗</a>${en ? '' : '<details class="home-report-teaser"><summary>免费品牌 GEO 基础报告包含什么？</summary><p>报告结构示意，不代表客户结果：品牌事实核对、官网与公开搜索入口、内容缺口和优先行动。添加微信时备注“品牌GEO报告”。</p><a class="text-link" data-event="report_open" href="/contact/?service=geo-report">免费领取品牌 GEO 基础报告 ↗</a></details>'}</div></div></section>`;
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
  const items = en ? [['Share your question','Send your brand, primary platform and the issue that matters most.'],['Agree the work','Confirm priorities, materials, deliverables and team responsibilities.'],['Act and review','Work through the action plan and review what changed before the next cycle.']] : [['聊清当前问题','发送品牌、主要平台，以及现在最想解决的问题。'],['确认范围与交付','一起判断优先级，明确资料、交付内容与团队分工。'],['执行，再一起复盘','按清单推进关键动作，观察实际变化，安排下一周期。']];
  return `<section class="section geo-process-section"><div class="container"><p class="geo-eyebrow">WORKING TOGETHER</p><h2>${en ? 'Start with a conversation.' : '合作，从一个具体问题开始。'}</h2><div class="geo-process-grid">${items.map((x,i)=>`<article class="reveal"><span>0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></div></section>`;
}
