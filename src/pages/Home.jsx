import { ButtonLink } from '../components/ButtonLink.jsx';
import { CaseCard } from '../components/CaseCard.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { DashboardVisual } from '../components/DashboardVisual.jsx';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { StatCounter } from '../components/StatCounter.jsx';
import { METHODOLOGY, TRUST_STATS } from '../data/site.js';
import { SITE } from '../data/site.js';
import { cases } from '../data/cases.js';
import { services } from '../data/services.js';

function GeoReportOfferSection() {
  return (
    <section className="section geo-report-offer-section">
      <div className="container geo-report-offer">
        <Reveal className="geo-report-offer-copy">
          <p className="section-eyebrow">FREE BRAND GEO REPORT</p>
          <h2>添加微信，免费获取一份品牌 GEO 基础报告</h2>
          <p>如果你想知道品牌为什么不容易被 AI 搜索看见、理解或引用，先把品牌官网或店铺链接发给品沐。</p>
          <ul className="geo-report-offer-list">
            <li><Icon name="Search" size={20} />AI 搜索可见度、品牌事实一致性与技术可抓取性</li>
            <li><Icon name="FilePenLine" size={20} />页面内容、FAQ、案例和外部信源的证据缺口</li>
            <li><Icon name="Target" size={20} />未来 30 至 90 天可优先执行的 GEO 动作</li>
          </ul>
          <div className="geo-report-offer-actions">
            <ButtonLink href="/contact/?service=geo-report" icon={false}>查看领取方式</ButtonLink>
            <span>{SITE.contactLabel}</span>
          </div>
        </Reveal>
        <Reveal className="geo-report-offer-card" delay={120}>
          <div className="wechat-qr-crop"><img src="/assets/wechat-qr-mufeng.jpg" alt="添加品沐咨询微信，免费获取品牌 GEO 基础报告" loading="lazy" /></div>
          <div>
            <strong>添加微信时备注</strong>
            <code>品牌GEO报告</code>
            <p>同时发送：品牌名称、官网或店铺链接、主要平台、目标市场。</p>
          </div>
        </Reveal>
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
            <p className="hero-kicker">品牌 GEO 优化 / 免费领取 GEO 报告</p>
            <h1>让 AI 搜索看见、理解并引用你的品牌</h1>
            <p className="hero-subtitle">品沐咨询帮助品牌做 GEO：从技术可抓取性、品牌事实库、证据化内容到平台分发与可见度监测，建立更容易被 AI 理解和引用的增长基础。</p>
            <p className="hero-support">添加微信并备注“品牌GEO报告”，可免费获取一份基于公开信息的品牌 GEO 基础报告。</p>
            <div className="hero-actions">
              <ButtonLink href="/contact/?service=geo-report" icon={false}>免费领取品牌 GEO 报告</ButtonLink>
              <ButtonLink href="/services/geo-consulting/" variant="secondary" icon={false}>查看 GEO 服务</ButtonLink>
            </div>
            <div className="hero-proof-row"><span>公开信息版报告</span><span>微信备注：品牌GEO报告</span><span>不承诺虚假推荐</span></div>
          </Reveal>
          <Reveal className="hero-visual-wrap" delay={120}>
            <DashboardVisual />
          </Reveal>
        </div>
      </section>

      <GeoReportOfferSection />

      <section className="section trust-section">
        <div className="container">
          <SectionIntro title="服务多个消费品牌，覆盖主流电商平台" text="覆盖天猫、京东、抖音、小红书、视频号、拼多多等主流平台，服务行业包括茶饮、服饰、营养品、个护电器、快消品、酒水等。" />
          <div className="stats-grid">
            {TRUST_STATS.map((item, index) => (
              <Reveal className="stat-card" key={item.label} delay={index * 80}>
                <Icon name={index === 0 ? 'BadgeCheck' : index === 1 ? 'Layers' : index === 2 ? 'BriefcaseBusiness' : 'Users'} size={30} />
                <div className="stat-copy">
                  <strong>{typeof item.value === 'number' ? <StatCounter value={item.value} suffix={item.suffix} /> : item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section services-preview" id="services">
        <div className="container split-heading">
          <SectionIntro align="left" title="先把品牌 GEO 基础做好，再放大电商增长" text="围绕 AI 搜索可见度、品牌事实、证据化内容与电商经营数据，提供从 GEO 到增长执行的系统服务。" />
        </div>
        <div className="container bento-grid">
          {services.map((service, index) => (
            <Reveal key={service.id} className={index === 0 || index === 1 ? 'bento-large' : ''} delay={index * 70}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section method-section">
        <div className="container">
          <SectionIntro title="我们用一套可落地的方法，拆解电商增长问题" text="品沐咨询不是只给方向，而是通过诊断、策略、执行陪跑和复盘机制，把复杂的电商增长问题拆成可执行动作。" />
          <div className="method-line">
            {METHODOLOGY.map((step, index) => (
              <Reveal className="method-step" key={step.title} delay={index * 80}>
                <span className="step-index">0{index + 1}</span>
                <div className="method-icon"><Icon name={step.icon} size={32} /></div>
                <h3>{step.title}</h3>
                <strong>{step.text}</strong>
                <p>{step.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section cases-preview" id="cases">
        <div className="container">
          <SectionIntro title="真实项目经验，沉淀可复用的增长方法" text="案例均来自真实项目，现有内容已经核对；因客户保密协议采用匿名方式呈现，并隐去客户名称及可识别细节。" />
          <div className="home-case-grid">
            {cases.slice(0, 4).map((item, index) => <Reveal key={item.slug} delay={index * 80}><CaseCard item={item} /></Reveal>)}
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

      <div className="container"><CtaBand /></div>
    </>
  );
}
