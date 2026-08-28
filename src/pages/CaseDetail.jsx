import { ButtonLink } from '../components/ButtonLink.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';

function DetailBlock({ icon, title, children }) {
  return (
    <Reveal className="detail-block">
      <div className="detail-title"><Icon name={icon} size={24} /><h2>{title}</h2></div>
      {children}
    </Reveal>
  );
}

export function CaseDetail({ item }) {
  return (
    <>
      <section className="case-detail-hero">
        <div className="hero-grid-bg" />
        <div className="container case-detail-hero-inner">
          <Reveal>
            <a className="back-link" href="/cases/">返回项目经验</a>
            <h1>{item.title}</h1>
            <p>{item.summary}</p>
            <div className="case-meta-chips">
              <span>{item.industry}</span>
              <span>{item.platform}</span>
              <span>{item.serviceType}</span>
            </div>
          </Reveal>
          <Reveal className="case-detail-image" delay={120}>
            <img src={item.image} alt={item.industry + '项目经验示意图'} />
          </Reveal>
        </div>
      </section>
      <section className="section case-detail-section">
        <div className="container case-detail-layout">
          <div className="case-detail-main">
            <Reveal className="case-privacy-note">
              <strong>匿名案例说明</strong>
              <p>本案例来自真实项目，现有公开内容已经核对；依据客户资料保密与公开授权边界，客户名称及可识别细节已隐去。</p>
            </Reveal>
            {item.evidence && (
              <Reveal className="insight-evidence case-evidence">
                <span>证据与公开边界</span>
                <h2>这项案例依据什么公开？</h2>
                <dl>
                  <div><dt>数据截止</dt><dd>{item.evidence.asOf}</dd></div>
                  <div><dt>证据状态</dt><dd>{item.evidence.level}</dd></div>
                  <div><dt>判断依据</dt><dd>{item.evidence.basis}</dd></div>
                  <div><dt>公开边界</dt><dd>{item.evidence.boundary}</dd></div>
                </dl>
              </Reveal>
            )}
            <DetailBlock icon="BookOpen" title="项目背景"><p>{item.background}</p></DetailBlock>
            <DetailBlock icon="ShieldCheck" title="核心问题"><ul>{item.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul></DetailBlock>
            <DetailBlock icon="Search" title="诊断发现"><p>{item.diagnosis}</p></DetailBlock>
            <DetailBlock icon="Target" title="解决方向"><ul>{item.solutions.map((solution) => <li key={solution}>{solution}</li>)}</ul></DetailBlock>
            <DetailBlock icon="TrendingUp" title="阶段成果"><p>{item.result}</p></DetailBlock>
            <DetailBlock icon="Lightbulb" title="项目启发"><p>{item.insight}</p></DetailBlock>
          </div>
          <aside className="case-detail-aside">
            <Reveal className="aside-card">
              <h2>项目概览</h2>
              <dl>
                <div><dt>行业</dt><dd>{item.industry}</dd></div>
                <div><dt>平台</dt><dd>{item.platform}</dd></div>
                <div><dt>核心问题</dt><dd>{item.serviceType}</dd></div>
                {item.caseId && <div><dt>案例编号</dt><dd>{item.caseId}</dd></div>}
              </dl>
            </Reveal>
            <Reveal className="aside-card highlight-card" delay={80}>
              <h2>服务亮点</h2>
              {item.highlights.map((highlight, index) => (
                <div className="highlight-row" key={highlight}>
                  <span>{index + 1}</span>
                  <p>{highlight}</p>
                </div>
              ))}
            </Reveal>
            <Reveal className="aside-card" delay={120}>
              <p>{item.cta}</p>
              <ButtonLink href="/contact/" icon={false}>预约咨询</ButtonLink>
            </Reveal>
          </aside>
        </div>
      </section>
      <div className="container"><CtaBand title="如果你的品牌也面临类似问题，可以预约一次基础诊断。" text={item.cta} /></div>
    </>
  );
}
