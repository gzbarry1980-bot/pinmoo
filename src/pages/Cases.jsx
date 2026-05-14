import { useMemo, useState } from 'react';
import { CaseCard } from '../components/CaseCard.jsx';
import { CtaBand } from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import { PageHero } from '../components/PageHero.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { caseFilters, cases, reservedCases } from '../data/cases.js';

export function Cases() {
  const [filter, setFilter] = useState('全部');
  const filtered = useMemo(() => {
    if (filter === '全部') return cases;
    return cases.filter((item) => item.tags.includes(filter) || item.industry === filter || item.serviceType.includes(filter));
  }, [filter]);

  return (
    <>
      <PageHero title="项目经验" subtitle="每一个项目，都来自品牌在平台经营、内容表达、页面转化、投放复盘或用户承接中的真实问题。我们更关注问题如何被拆解，动作如何被落地，结果如何被持续复盘。">
        <div className="case-hero-industries">
          {['服饰', '茶饮', '营养', '个护', '酒水'].map((item, index) => <span key={item}><Icon name={['ShoppingBag', 'Leaf', 'ShieldCheck', 'Zap', 'Store'][index]} size={20} />{item}</span>)}
        </div>
      </PageHero>
      <section className="section cases-page-section">
        <div className="container">
          <div className="filter-row" role="group" aria-label="案例筛选标签">
            {caseFilters.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
          <div className="cases-grid">
            {filtered.map((item, index) => <Reveal key={item.slug} delay={index * 70}><CaseCard item={item} /></Reveal>)}
          </div>
          <Reveal className="reserved-card">
            <h2>二期案例预留</h2>
            <p>后续可继续扩展更多项目经验，目前首版先展示 6 个脱敏案例。</p>
            <div>{reservedCases.map((item) => <span key={item}>{item}</span>)}</div>
          </Reveal>
        </div>
      </section>
      <div className="container"><CtaBand title="你的品牌，也许正卡在类似的问题上" text="无论是店铺转化低、退款率高、投放效率不稳定，还是多平台运营缺少节奏，品沐咨询都可以先帮你做一次基础诊断，判断当前最值得优先解决的问题。" /></div>
    </>
  );
}
