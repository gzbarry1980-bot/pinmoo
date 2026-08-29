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
      <section className="home-hero">
        <div className="hero-grid-bg" />
        <div className="container home-hero-inner">
          <Reveal className="hero-copy">
            <p className="hero-kicker">品牌 GEO 咨询与电商增长顾问</p>
            <h1>让你的品牌在 AI 搜索里<br />更容易被找到和说清楚</h1>
            <p className="hero-subtitle">品沐帮助消费品牌统一官网、平台与公开资料中的品牌事实，补齐可引用内容，并持续检查 AI 是否找得到、理解对、引用准。</p>
            <p className="hero-support">不知道从哪里开始？把品牌官网或店铺链接发来，先获取一份公开信息版 GEO 基础报告。</p>
            <div className="hero-actions">
              <ButtonLink href="/contact/?service=geo-report" icon={false}>免费领取品牌 GEO 报告</ButtonLink>
              <ButtonLink href="/services/geo-consulting/" variant="secondary" icon={false}>查看 GEO 服务</ButtonLink>
            </div>
            <div className="hero-proof-row"><span>无需整理复杂资料</span><span>发送品牌名称与官网</span><span>工作日 24 小时内回复</span></div>
          </Reveal>
          <Reveal className="hero-visual-wrap" delay={120}>
            <DashboardVisual />
          </Reveal>
        </div>
      </section>

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

      <section className="section cases-preview" id="cases">
        <div className="container">
          <SectionIntro title="真实项目经验，沉淀可复用的增长方法" text="案例均来自真实项目，现有内容已经核对；因客户保密协议采用匿名方式呈现，并隐去客户名称及可识别细节。" />
          <div className="home-case-grid home-case-grid-featured">
            {cases.slice(0, 2).map((item, index) => <Reveal key={item.slug} delay={index * 80}><CaseCard item={item} /></Reveal>)}
          </div>
          <div className="center-actions"><ButtonLink href="/cases/">查看全部项目经验</ButtonLink></div>
        </div>
      </section>

      <section className="section about-preview">
        <div className="container about-preview-grid">
          <Reveal>
            <h2>懂品牌 GEO，也懂电商实战</h2>
            <p>{SITE.positioning}</p>
            <ButtonLink href="/about/">了解品沐</ButtonLink>
          </Reveal>
          <Reveal className="office-visual" delay={120}>
            <img src="/assets/about-brand.png" alt="品沐咨询品牌展示" loading="lazy" />
          </Reveal>
        </div>
      </section>

      <GeoEvidenceSection />

      <div className="container"><CtaBand /></div>
    </>
  );
}
