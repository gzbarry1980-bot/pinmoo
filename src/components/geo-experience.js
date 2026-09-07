// Shared by the static generator and the optional React preview.
export function geoHero(en = false) {
  const steps = en ? ['Find the gaps', 'Clarify brand facts', 'Measure again'] : ['发现问题', '补齐品牌信息', '持续复测'];
  return `<section class="geo-hero"><div class="container geo-hero-content">
    <p class="geo-eyebrow">PINMOO CONSULTING <span>GEO / BRAND / COMMERCE</span></p>
    <h1>${en ? 'PINMOO<br><span>Brand GEO consulting</span>' : '品沐咨询<span class="heading-divider">｜</span><br class="mobile-break"><span>品牌 GEO 增长顾问</span>'}</h1>
    <p class="geo-hero-description">${en ? 'Help AI search find your brand, understand your products and connect people to reliable information.' : '让 AI 找得到你的品牌，也让客户看得懂你的价值。'}</p>
    <div class="geo-hero-actions"><a class="btn btn-primary" href="${en ? '/en/contact/' : '/contact/?service=geo-report'}" data-event="report_open" data-placement="hero">${en ? 'Request a GEO report' : '加微信，免费领取品牌 GEO 基础报告'}</a><a class="geo-text-link" href="${en ? '/china-ecommerce-consulting/' : '/services/geo-consulting/'}">${en ? 'Explore our approach' : '了解服务与交付'} <span aria-hidden="true">↗</span></a></div>
    <div class="geo-journey" aria-label="${en ? 'Our approach' : '品牌 GEO 优化路径'}">${steps.map((step,i) => `<div class="geo-journey-step" style="--step:${i}"><span>0${i+1}</span><strong>${step}</strong></div>`).join('')}</div>
    <p class="geo-hero-note">${en ? 'Start with your brand name and website. The free report uses public information.' : '发送品牌名称与官网即可开始 · 基于公开信息，不需要提供后台账号'}</p>
  </div></section>`;
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
    <div class="geo-report-layout"><figure class="geo-report-art"><img src="/assets/visuals/insights-weekly-report.webp" width="1400" height="636" loading="lazy" decoding="async" alt="${en ? 'Example of a structured consulting report' : '经营分析报告的信息组织示意'}"><figcaption>${en ? 'From findings to practical actions' : '从信息梳理，到具体行动'}</figcaption></figure>
    <div class="geo-report-reader"><nav class="geo-report-tabs" aria-label="${en ? 'Report chapters' : '报告章节'}">${items.map((x,i)=>`<a href="#report-panel-${i}" data-report-tab="${i}" id="report-tab-${i}">${x[0]}</a>`).join('')}</nav>${items.map((x,i)=>`<section id="report-panel-${i}" class="geo-report-panel" data-report-panel="${i}"><span class="geo-report-number">0${i+1} / 03</span><h3>${x[1]}</h3><p>${x[2]}</p><ul>${x[3].map(s=>`<li>${s}</li>`).join('')}</ul></section>`).join('')}</div></div>
  </div></section>`;
}

export function geoProcess(en = false) {
  const items = en ? [['Share your question','Send your brand name, website and the question you want to resolve.'],['Review the findings','Receive a public-information report and discuss priorities.'],['Choose the next step','Agree the scope, deliverables and review dates before starting.']] : [['发来品牌资料','品牌名称、官网或店铺链接，以及你现在最想解决的问题。'],['看报告，聊重点','先拿到公开信息版基础报告，再一起确认最值得优先处理的事项。'],['确认范围，再合作','需要深入推进时，明确交付清单、配合事项和复盘时间。']];
  return `<section class="section geo-process-section"><div class="container"><p class="geo-eyebrow">WORKING TOGETHER</p><h2>${en ? 'Start with a conversation.' : '合作，从一个具体问题开始。'}</h2><div class="geo-process-grid">${items.map((x,i)=>`<article class="reveal"><span>0${i+1}</span><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}</div></div></section>`;
}
