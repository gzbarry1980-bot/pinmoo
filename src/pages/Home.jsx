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
    { icon: 'Rocket', title: 'AI 搜索找不到或说不清品牌', text: '先检查品牌事实、技术抓取、内容证据与外部信源。', href: '/contact/?service=geo-report', cta: '免费领 GEO 基础报告' },
    { icon: 'Store', title: '店铺有流量但转化偏低', text: '从主图、详情页、SKU、评价和客服承接定位损耗。', href: '/services/store-diagnosis/', cta: '查看店铺诊断' },
    { icon: 'BarChart3', title: '数据很多但不知道先改什么', text: '统一成交、退款、投放与商品口径，再排出行动优先级。', href: '/services/business-advisor-data-diagnosis/', cta: '查看数据诊断' }
  ];
  return (
    <section className="section inquiry-path-section">
      <div className="container">
        <SectionIntro title="你现在最想解决哪件事？" text="从最接近的问题进入，不需要先理解所有服务名称。" />
        <div className="inquiry-path-grid inquiry-path-grid-human">
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

      <section className="section services-preview" id="services">
        <div className="container split-heading">
          <SectionIntro align="left" title="先把品牌 GEO 基础做好，再放大电商增长" text="围绕 AI 搜索可见度、品牌事实、证据化内容与电商经营数据，提供从 GEO 到增长执行的系统服务。" />
        </div>
        <div className="container bento-grid">
          {services.filter((service) => ['geo-consulting', 'conversion-optimization', 'data-review'].includes(service.id)).map((service, index) => (
            <Reveal key={service.id} className={index === 0 || index === 1 ? 'bento-large' : ''} delay={index * 70}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: geoReportPreview() }} />
      <section className="section cases-preview" id="cases">
        <div className="container">
          <SectionIntro title="真实项目经验，沉淀可复用的增长方法" text="案例均来自真实项目，现有内容已经核对；因客户保密协议采用匿名方式呈现，并隐去客户名称及可识别细节。" />
          <div className="home-case-grid home-case-grid-featured">
            {cases.slice(0, 2).map((item, index) => <Reveal key={item.slug} delay={index * 80}><CaseCard item={item} /></Reveal>)}
          </div>
          <div className="center-actions"><ButtonLink href="/cases/">查看全部项目经验</ButtonLink></div>
        </div>
      </section>

<div dangerouslySetInnerHTML={{ __html: geoProcess() }} />
      <section className="section home-insights-section"><div className="container"><SectionIntro title="经营洞察" text="从真实问题出发，找到下一步。" /><div className="insight-card-grid">{insights.filter(item => item.featured).map(item => <article className="insight-card" key={item.slug}><span>{item.category}</span><h3><a href={'/insights/' + item.slug + '/'}>{item.title}</a></h3><p>{item.summary}</p></article>)}</div></div></section>
      <section className="section faq-section"><div className="container narrow-container"><SectionIntro title="常见问题" />{HOME_FAQS.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>

      <GeoEvidenceSection />

      <div className="container"><CtaBand /></div>
    </>
  );
}
