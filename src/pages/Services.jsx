import { ButtonLink } from '../components/ButtonLink.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Faq } from '../components/Faq.jsx';
import { Icon } from '../components/Icon.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { leadPages, proofAssets } from '../data/lead-pages.js';
import { geoServiceModules, pricingNote, services, serviceFaqs, serviceModel, serviceModelIntro, serviceModelName, serviceProcess } from '../data/services.js';

function LeadEntrySection() {
  return (
    <section className="section lead-entry-section">
      <div className="container">
        <SectionIntro title="按问题进入，更快找到适合你的咨询方案" text="不同品牌卡住的位置不一样。你可以直接从当前最像自己的问题进入，先看诊断重点、交付物和适合场景。" />
        <div className="lead-card-grid">
          {leadPages.map((page) => (
            <Reveal className="lead-card" key={page.slug}>
              <span>{page.eyebrow}</span>
              <h3>{page.title}</h3>
              <p>{page.subtitle}</p>
              <a className="outline-link" href={`/services/${page.slug}/`}>查看诊断方案 <Icon name="ArrowRight" size={16} /></a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function GeoServiceModulesSection() {
  return (
    <section className="section geo-service-section">
      <div className="container">
        <SectionIntro title="GEO 服务可以拆成六个模块" text="GEO 不是在页面里堆几个 AI 关键词，而是把可抓取性、事实一致性、可引用内容、外部信源和持续测量连接起来。可以按当前缺口选择单项，也可以按 90 天计划组合推进。" />
        <div className="geo-service-grid">
          {geoServiceModules.map((item, index) => (
            <Reveal className="geo-service-card" key={item.code} delay={index * 60}>
              <div className="geo-service-topline"><span>{item.code}</span><Icon name={item.icon} size={25} /></div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <strong>交付：{item.deliverable}</strong>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="section proof-section">
      <div className="container">
        <SectionIntro title="不是只给建议，而是给能推进执行的交付物" text="客户需要的不只是“方向感”，还需要能被团队拿去开会、分工、复盘和迭代的材料。" />
        <div className="proof-grid">
          {proofAssets.map((item) => (
            <Reveal className="proof-card" key={item.title}>
              <div className="card-icon"><Icon name={item.icon} size={26} /></div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <div>{item.points.map((point) => <span key={point}>{point}</span>)}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Services() {
  return (
    <>
      <PageHero title="从诊断到陪跑，帮品牌建立可持续增长路径" subtitle="品沐咨询围绕电商业务中的平台选择、商品结构、内容种草、页面转化、广告投放、直播运营、会员复购等关键环节，为品牌提供诊断、策略、执行陪跑和复盘优化服务。" />
      <LeadEntrySection />
      <section className="section model-section">
        <div className="container">
          <SectionIntro title={serviceModelName} text={serviceModelIntro} />
          <div className="model-grid">
            {serviceModel.map((item, index) => (
              <Reveal className="model-card" key={item.code} delay={index * 70}>
                <span>{item.code}</span>
                <Icon name={['Target', 'MapPinned', 'PackageCheck', 'Image', 'LineChart'][index]} size={30} />
                <small>{item.title}</small>
                <h3>{item.name}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section service-detail-section">
        <div className="container">
          <SectionIntro title="我们提供的核心服务" />
          <div className="service-detail-list">
            {services.map((service, index) => (
              <Reveal className="service-detail-card" key={service.id} delay={index * 70}>
                <div className="service-detail-head">
                  <div className="card-icon"><Icon name={service.icon} size={30} /></div>
                  <div><h2>{service.title}</h2><p>{service.short}</p></div>
                </div>
                <div className="service-detail-columns">
                  <div><h3>适合谁</h3><ul>{service.fit.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h3>解决什么问题</h3><ul>{service.problems.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h3>主要服务内容</h3><ul>{service.content.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h3>交付成果</h3><ul>{service.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>
                </div>
                <div className="service-fee">
                  <strong>合作范围</strong>
                  <p>{service.fee}</p>
                  <span>{pricingNote}</span>
                </div>
                <ButtonLink href="/contact/" className="detail-cta">预约咨询</ButtonLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <GeoServiceModulesSection />
      <ProofSection />
      <section className="section process-section">
        <div className="container">
          <SectionIntro title="我们如何陪品牌一起解决问题？" />
          <div className="process-grid">
            {serviceProcess.map((item, index) => (
              <Reveal className="process-card" key={item.title} delay={index * 70}>
                <span>0{index + 1}</span>
                <Icon name={item.icon} size={30} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section faq-section">
        <div className="container narrow-container">
          <SectionIntro title="常见问题" />
          <Faq items={serviceFaqs} />
        </div>
      </section>
      <div className="container"><CtaBand title="想知道你的品牌下一步该先优化哪里？" text="从专业诊断开始，帮你找到增长突破口。" /></div>
    </>
  );
}
