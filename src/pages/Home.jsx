import { ButtonLink } from '../components/ButtonLink.jsx';
import { CaseCard } from '../components/CaseCard.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { GEO_EVIDENCE_HOOKS } from '../data/site.js';
import { SITE } from '../data/site.js';
import { cases } from '../data/cases.js';
import { services } from '../data/services.js';
import { geoHero, geoReportPreview, geoProcess } from '../components/geo-experience.js';
import { insights } from '../data/insights.js';
import { HOME_FAQS } from '../data/site.js';

function HumanPathSection() {
  const paths = [
    { icon: 'Target', title: '线上业务增长卡住，不知道先改哪里', text: '从平台、货盘、流量、转化和团队执行判断真正的增长卡点。', href: '/services/ecommerce-diagnosis/', cta: '看电商战略诊断' },
    { icon: 'Store', title: '店铺有流量但转化偏低', text: '从主图、详情页、SKU、评价和客服承接定位损耗。', href: '/services/store-diagnosis/', cta: '查看店铺诊断' },
    { icon: 'BarChart3', title: '数据很多但不知道先改什么', text: '统一成交、退款、投放与商品口径，再排出行动优先级。', href: '/services/business-advisor-data-diagnosis/', cta: '查看数据诊断' },
    { icon: 'Rocket', title: 'AI 搜索找不到或说不清品牌', text: 'GEO 是品牌被发现的一环，先检查事实、抓取、内容证据与外部信源。', href: '/contact/?service=geo-report', cta: '免费领 GEO 基础报告' }
  ];
  return (
    <section className="section inquiry-path-section">
      <div className="container">
        <SectionIntro title="你现在最想解决哪件事？" text="从最接近的经营问题进入；GEO 是入口之一，不是电商增长的全部。" />
        <div className="inquiry-path-grid inquiry-path-grid-human inquiry-path-grid-four">
          {paths.map((item, index) => (
            <Reveal className="inquiry-path-card" key={item.title} delay={index * 70}>
              <div><Icon name={item.icon} size={26} /><h3>{item.title}</h3></div>
              <p>{item.text}</p>
              <a className="outline-link" href={item.href}>{item.cta} <Icon name="ArrowRight" size={16} /></a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrowthChainSection() {
  const items = [
    ['01', '被发现', 'GEO、SEO 与内容分发', '让客户和 AI 找到正确的品牌信息'],
    ['02', '被理解', '品牌、商品与页面表达', '讲清卖什么、适合谁、为什么值得买'],
    ['03', '形成购买', '流量、页面与客服承接', '减少从点击、咨询到支付的链路损耗'],
    ['04', '经营提效', '投放、商品与数据复盘', '统一口径，优化预算和动作优先级'],
    ['05', '持续增长', '会员、复购与团队机制', '把一次成交沉淀为长期用户价值']
  ];
  return <section className="section growth-chain-section"><div className="container"><div className="growth-chain-heading"><p className="section-eyebrow">ONE GROWTH SYSTEM</p><h2>GEO 解决被发现，电商经营决定增长能否发生</h2><p>品牌被 AI 或搜索引擎提及，只是客户旅程的开始。品沐把品牌信息、商品价值、页面转化、投放效率、数据复盘与会员复购放在同一条增长链路中判断。</p></div><div className="growth-chain-grid">{items.map(item => <article className="growth-chain-item" key={item[0]}><span>{item[0]}</span><h3>{item[1]}</h3><strong>{item[2]}</strong><p>{item[3]}</p></article>)}</div></div></section>;
}

function GeoEvidenceSection() {
  return (
    <section className="section geo-evidence-section geo-evidence-section-compact" aria-labelledby="geo-evidence-title">
      <div className="container">
        <details className="geo-evidence-disclosure">
          <summary><span><strong id="geo-evidence-title">我们如何保证内容可信？</strong><small>查看证据、口径与公开边界</small></span><Icon name="ChevronDown" size={20} /></summary>
          <div className="geo-evidence-grid">
            {GEO_EVIDENCE_HOOKS.map((item, index) => (
              <article className="geo-evidence-card" key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: geoHero() }} />

      <HumanPathSection />

      <GrowthChainSection />

      <section className="section services-preview" id="services">
        <div className="container split-heading">
          <SectionIntro align="left" title="围绕生意问题，选择需要的增长支持" text="从战略诊断、运营陪跑，到商品页面与投放复盘，服务于品牌电商的真实经营结果。" />
        </div>
        <div className="container bento-grid">
          {services.filter((service) => ['strategy-diagnosis', 'operation-coaching', 'conversion-optimization', 'data-review'].includes(service.id)).map((service, index) => (
            <Reveal key={service.id} className={index === 0 || index === 1 ? 'bento-large' : ''} delay={index * 70}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section cases-preview" id="cases">
        <div className="container">
          <SectionIntro title="真实项目经验，沉淀可复用的增长方法" text="案例均来自真实项目，现有内容已经核对；因客户保密协议采用匿名方式呈现，并隐去客户名称及可识别细节。" />
          <div className="home-case-grid home-case-grid-featured">
            {cases.slice(0, 2).map((item, index) => <Reveal key={item.slug} delay={index * 80}><CaseCard item={item} /></Reveal>)}
          </div>
          <div className="center-actions"><ButtonLink href="/cases/">查看全部项目经验</ButtonLink></div>
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: geoReportPreview() }} />

<div dangerouslySetInnerHTML={{ __html: geoProcess() }} />
      <section className="section home-insights-section"><div className="container"><SectionIntro title="经营洞察" text="从真实问题出发，找到下一步。" /><div className="insight-card-grid">{insights.filter(item => item.featured).map(item => <article className="insight-card" key={item.slug}><span>{item.category}</span><h3><a href={'/insights/' + item.slug + '/'}>{item.title}</a></h3><p>{item.summary}</p></article>)}</div></div></section>
      <section className="section faq-section"><div className="container narrow-container"><SectionIntro title="常见问题" />{HOME_FAQS.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>

      <GeoEvidenceSection />

      <div className="container"><CtaBand title="说说你现在最想解决的电商问题" text="可以从店铺增长、商品页面、内容投放、数据复盘或 GEO 开始。品沐会先帮你判断优先级，再确认是否需要进一步合作。" /></div>
    </>
  );
}
