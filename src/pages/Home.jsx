import { ButtonLink } from '../components/ButtonLink.jsx';
import { CaseCard } from '../components/CaseCard.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { DashboardVisual } from '../components/DashboardVisual.jsx';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { StatCounter } from '../components/StatCounter.jsx';
import { METHODOLOGY, SITE, TRUST_STATS } from '../data/site.js';
import { cases } from '../data/cases.js';
import { services } from '../data/services.js';

export function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-grid-bg" />
        <div className="container home-hero-inner">
          <Reveal className="hero-copy">
            <h1>让电商增长更有章法</h1>
            <p className="hero-subtitle">品沐咨询专注电商战略诊断与运营陪跑，帮助品牌从平台、商品、内容、投放到转化，搭建可持续增长路径。</p>
            <p className="hero-support">不只给建议，更陪品牌把增长路径拆清楚、跑起来、复盘出结果。</p>
            <div className="hero-actions">
              <ButtonLink href="/contact/" icon={false}>免费诊断</ButtonLink>
              <ButtonLink href="/cases/" variant="secondary" icon={false}>查看案例</ButtonLink>
            </div>
          </Reveal>
          <Reveal className="hero-visual-wrap" delay={120}>
            <DashboardVisual />
          </Reveal>
        </div>
      </section>

      <section className="section trust-section">
        <div className="container">
          <SectionIntro title="服务多个消费品牌，覆盖主流电商平台" text="覆盖天猫、京东、抖音、小红书、视频号、拼多多等主流平台，服务行业包括茶饮、服饰、营养品、个护电器、快消品、酒水等。" />
          <div className="stats-grid">
            {TRUST_STATS.map((item, index) => (
              <Reveal className="stat-card" key={item.label} delay={index * 80}>
                <Icon name={index === 0 ? 'BadgeCheck' : index === 1 ? 'Layers' : index === 2 ? 'BriefcaseBusiness' : 'Users'} size={30} />
                <strong><StatCounter value={item.value} suffix={item.suffix} /></strong>
                <span>{item.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section services-preview" id="services">
        <div className="container split-heading">
          <SectionIntro align="left" title="围绕品牌电商增长，我们提供从诊断到落地的系统服务" text="把平台、商品、内容、投放、转化和复购放在同一套增长链路里看，而不是只解决单点问题。" />
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
          <SectionIntro title="真实项目经验，沉淀可复用的增长方法" text="每一个项目，都来自品牌在平台经营、内容表达、页面转化、投放复盘或用户承接中的真实问题。" />
          <div className="home-case-grid">
            {cases.slice(0, 4).map((item, index) => <Reveal key={item.slug} delay={index * 80}><CaseCard item={item} /></Reveal>)}
          </div>
          <div className="center-actions"><ButtonLink href="/cases/">查看全部项目经验</ButtonLink></div>
        </div>
      </section>

      <section className="section about-preview">
        <div className="container about-preview-grid">
          <Reveal>
            <h2>更懂实战的电商咨询伙伴</h2>
            <p>广州品沐咨询有限公司长期关注品牌在线上渠道的真实增长问题，从平台选择、货盘规划、内容表达、页面转化到数据复盘，帮助品牌把电商业务做得更清晰、更有章法。</p>
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
