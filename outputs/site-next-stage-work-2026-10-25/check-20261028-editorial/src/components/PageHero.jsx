import { Reveal } from './Reveal.jsx';
import { pageVisual } from './page-visual.js';

export function PageHero({ title, subtitle, children, compact = false }) {
  const classes = 'page-hero ' + (compact ? 'page-hero-compact' : '');
  return (
    <section className={classes}>
      <img className="page-brand-backdrop" src={pageVisual(window.location.pathname)} alt="" decoding="async" fetchPriority="high" />
      <div className="container page-hero-inner">
        <Reveal>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </Reveal>
      </div>
      <span className="page-visual-credit">AI 品牌创意视觉</span>
    </section>
  );
}
