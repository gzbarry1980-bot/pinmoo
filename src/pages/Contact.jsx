import { ContactForm } from '../components/ContactForm.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SITE } from '../data/site.js';

const contactItems = [
  ['公司名称', SITE.company, 'Building2'],
  ['公司地址', SITE.address, 'MapPinned'],
  ['微信 / 手机同号', SITE.phoneDisplay, 'Phone'],
  ['联系说明', SITE.contactNoteWithSite, 'MessageCircle'],
  ['工作时间', SITE.workTime, 'Clock'],
  ['响应说明', SITE.responseTime, 'Send']
];

export function Contact() {
  return (
    <>
      <PageHero title="添加微信，免费获取品牌 GEO 基础报告" subtitle="备注“品牌GEO报告”，发送品牌名称、官网或店铺链接、主要平台和目标市场。品沐会基于公开信息先做一份初步判断。" compact />
      <section className="section contact-section">
        <div className="container contact-grid">
          <Reveal className="contact-info-panel">
            {contactItems.map((item) => (
              <div className="contact-info-row" key={item[0]}>
                <span><Icon name={item[2]} size={26} /></span>
                <div>
                  <h2>{item[0]}</h2>
                  {item[0].includes('手机') ? (
                    <a href={'tel:' + SITE.phone}>{item[1]}</a>
                  ) : item[0] === '公司地址' ? (
                    <><a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer">{item[1]}</a><p className="map-hint">点击查看地图定位</p></>
                  ) : <p>{item[1]}</p>}
                </div>
              </div>
            ))}
            <div className="wechat-qr-card">
              <div className="wechat-qr-crop"><img src="/assets/wechat-qr-mufeng.jpg" alt="添加品沐咨询微信，免费获取品牌 GEO 基础报告" loading="lazy" /></div>
              <div><strong>扫码添加微信，免费领取 GEO 报告</strong><p>微信 / 手机同号：{SITE.phoneDisplay}</p><span>备注“品牌GEO报告”，发送品牌名称、官网或店铺链接、主要平台和目标市场</span></div>
            </div>
            <div className="contact-promise-grid">
              <div><Icon name="Zap" size={24} /><strong>快速沟通</strong><span>直连顾问高效响应</span></div>
              <div><Icon name="Target" size={24} /><strong>明确需求</strong><span>精准匹配解决方案</span></div>
              <div><Icon name="ShieldCheck" size={24} /><strong>24小时内回复</strong><span>工作日内快速跟进</span></div>
            </div>
          </Reveal>
          <Reveal delay={120}><ContactForm /></Reveal>
        </div>
      </section>
      <section className="section contact-bottom-section">
        <div className="container two-question-grid">
          <Reveal className="question-card"><Icon name="CircleUserRound" size={32} /><h2>适合什么品牌咨询？</h2><p>适合有电商增长需求的品牌方，包括：初创品牌、成熟品牌、电商品牌、传统品牌电商化等，无论处于哪个阶段，品沐都提供匹配的解决方案。</p></Reveal>
          <Reveal className="question-card" delay={100}><Icon name="FilePenLine" size={32} /><h2>如何领取品牌 GEO 报告？</h2><p>添加微信 / 手机同号 {SITE.phoneDisplay}，备注“品牌GEO报告”，发送品牌名称、官网或店铺链接、主要平台和目标市场。报告基于公开信息，不承诺虚假排名或 AI 推荐结果。</p></Reveal>
        </div>
      </section>
      <div className="container"><CtaBand button="免费领取 GEO 报告" /></div>
    </>
  );
}
