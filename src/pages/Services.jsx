import { ButtonLink } from '../components/ButtonLink.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Faq } from '../components/Faq.jsx';
import { Icon } from '../components/Icon.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { services, serviceFaqs, serviceModel, serviceProcess } from '../data/services.js';

export function Services() {
  return (
    <>
      <PageHero title="从诊断到陪跑，帮品牌建立可持续增长路径" subtitle="品沐咨询围绕电商业务中的平台选择、商品结构、内容种草、页面转化、广告投放、直播运营、会员复购等关键环节，为品牌提供诊断、策略、执行陪跑和复盘优化服务。" />
      <section className="section model-section">
        <div className="container">
          <SectionIntro title="五步增长诊断模型" />
          <div className="model-grid">
            {serviceModel.map((item, index) => (
              <Reveal className="model-card" key={item} delay={index * 70}>
                <span>0{index + 1}</span>
                <Icon name={['Target', 'MapPinned', 'PackageCheck', 'Image', 'LineChart'][index]} size={30} />
                <h3>{item}</h3>
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
                <ButtonLink href="/contact/" className="detail-cta">预约咨询</ButtonLink>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
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
