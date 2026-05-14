import { ContactForm } from '../components/ContactForm.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SITE } from '../data/site.js';

const contactItems = [
  ['公司名称', SITE.company, 'Building2'],
  ['微信 / 手机同号', SITE.phoneDisplay, 'Phone'],
  ['联系说明', SITE.contactNoteWithSite, 'MessageCircle'],
  ['工作时间', SITE.workTime, 'Clock'],
  ['响应说明', SITE.responseTime, 'Send']
];

export function Contact() {
  return (
    <>
      <PageHero title="联系我们" subtitle="如果你正在思考品牌电商下一步怎么做，可以先和品沐聊一聊。" compact />
      <section className="section contact-section">
        <div className="container contact-grid">
          <Reveal className="contact-info-panel">
            {contactItems.map((item) => (
              <div className="contact-info-row" key={item[0]}>
                <span><Icon name={item[2]} size={26} /></span>
                <div>
                  <h2>{item[0]}</h2>
                  {item[0].includes('手机') ? <a href={'tel:' + SITE.phone}>{item[1]}</a> : <p>{item[1]}</p>}
                </div>
              </div>
            ))}
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
          <Reveal className="question-card" delay={100}><Icon name="FilePenLine" size={32} /><h2>是否可以先做基础诊断？</h2><p>可以。我们提供免费基础诊断服务，帮助你快速了解店铺现状与增长机会，再决定是否深入合作。</p></Reveal>
        </div>
      </section>
      <div className="container"><CtaBand button="提交咨询需求" /></div>
    </>
  );
}
