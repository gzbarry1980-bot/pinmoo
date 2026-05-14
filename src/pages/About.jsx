import { ButtonLink } from '../components/ButtonLink.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { SITE } from '../data/site.js';

const beliefCards = [
  ['以数据为依据', '数据驱动决策，看清真实业务状况', 'ShieldCheck'],
  ['以策略为核心', '找准增长机会点，制定可落地的策略', 'Layers'],
  ['以执行为关键', '拆解到可执行动作，推动落地与协同', 'Target'],
  ['以结果为导向', '持续跟踪与复盘，实现正向增长闭环', 'TrendingUp']
];

const experience = [
  ['前天猫服务站淘宝大学培训基地运营推广板块负责人', 'GraduationCap'],
  ['多年淘宝、天猫、京东等平台运营推广经验', 'Layers'],
  ['服务过茶饮、服饰、营养品、个护电器、快消品等多个消费行业', 'ShoppingBag'],
  ['擅长店铺诊断、主图详情页优化、投放复盘、会员运营、内容种草与全域电商规划', 'Image'],
  ['长期输出品牌增长、电商运营和代运营避坑相关内容', 'FilePenLine']
];

const workSteps = [
  ['看数据', '分析店铺、平台、商品、流量、转化、退款和用户反馈。', 'BarChart3'],
  ['找问题', '判断问题发生在货盘、页面、流量、内容、客服、价格还是团队执行。', 'Search'],
  ['定动作', '把建议拆成可执行事项，明确优先级、负责人和复盘周期。', 'Target'],
  ['陪跑复盘', '通过周报、月报、会议和专项优化，持续跟进结果。', 'RefreshCw']
];

const fitBrands = ['已经在线上经营，但增长遇到瓶颈的品牌', '准备从0到1搭建电商业务的传统企业', '有产品但缺少平台打法和内容策略的团队', '有运营团队，但缺少外部顾问和复盘机制的品牌', '想优化退款率、转化率、投放效率和会员复购的项目'];

export function About() {
  return (
    <>
      <PageHero title="关于品沐咨询" subtitle="一家更懂电商实战的品牌增长咨询伙伴。" />
      <section className="section about-brand-section">
        <div className="container about-brand-grid">
          <Reveal className="brand-showcase">
            <span className="logo-frame about-logo-frame"><img src={SITE.logo} alt="PINMOO 品沐咨询 Logo" /></span>
            <h2>品沐咨询是谁？</h2>
            <p>广州品沐咨询有限公司是一家专注电商战略咨询、平台运营陪跑和品牌增长服务的咨询机构，长期服务消费品牌、传统企业和新消费项目，围绕天猫、京东、抖音、小红书、视频号、拼多多等主流平台，帮助品牌建立更清晰、更可执行的线上增长路径。</p>
          </Reveal>
          <Reveal delay={120}>
            <h2>我们相信，电商增长不是靠单点动作，而是靠系统协同。</h2>
            <p>很多品牌不是没有努力做电商，而是平台选择、货盘结构、内容表达、页面转化、广告投放、客服承接和复盘机制之间没有形成闭环。品沐咨询的价值，就是帮助品牌把复杂问题拆清楚，把关键动作排出优先级，并通过持续陪跑推动落地。</p>
            <div className="belief-grid">
              {beliefCards.map((item) => <div className="belief-card" key={item[0]}><Icon name={item[2]} size={26} /><strong>{item[0]}</strong><span>{item[1]}</span></div>)}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="section principal-section">
        <div className="container principal-card">
          <Reveal className="principal-info">
            <div className="profile-mark"><Icon name="CircleUserRound" size={72} /></div>
            <div>
              <h2>鲍俊文｜沐风</h2>
              <p className="role-lines">广州品沐咨询有限公司主理人<br />品沐咨询创始顾问<br />电商运营与品牌增长顾问</p>
              <p>鲍俊文，花名沐风，广州品沐咨询有限公司主理人，长期深耕电商运营、平台推广与品牌增长咨询。曾任前天猫服务站淘宝大学培训基地运营推广板块负责人，拥有多年淘宝、天猫、京东等主流平台运营经验，曾为多个茶饮、服饰、营养品、个护电器、快消品等品牌提供店铺诊断、平台规划、活动复盘、页面优化、内容种草与运营陪跑服务。</p>
            </div>
          </Reveal>
          <div className="experience-grid">
            {experience.map((item, index) => <Reveal className="experience-card" key={item[0]} delay={index * 60}><Icon name={item[1]} size={30} /><p>{item[0]}</p></Reveal>)}
          </div>
        </div>
      </section>
      <section className="section work-style-section">
        <div className="container">
          <SectionIntro title="我们如何陪品牌一起解决问题？" />
          <div className="work-steps">
            {workSteps.map((item, index) => <Reveal className="work-step" key={item[0]} delay={index * 70}><span>0{index + 1}</span><Icon name={item[2]} size={28} /><h3>{item[0]}</h3><p>{item[1]}</p></Reveal>)}
          </div>
        </div>
      </section>
      <section className="section fit-section">
        <div className="container fit-grid">
          <Reveal><h2>什么样的品牌适合找品沐？</h2></Reveal>
          <Reveal className="fit-list" delay={100}>{fitBrands.map((item) => <p key={item}><Icon name="CheckCircle2" size={18} />{item}</p>)}</Reveal>
        </div>
      </section>
      <div className="container"><CtaBand title="想进一步了解品沐如何帮你的品牌？" text="预约咨询，我们会尽快与你沟通品牌现状和当前最值得优先解决的问题。" /></div>
    </>
  );
}
