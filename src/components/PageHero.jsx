import { Reveal } from './Reveal.jsx';

export function PageHero({ title, subtitle, children, compact = false }) {
  const classes = 'page-hero ' + (compact ? 'page-hero-compact' : '');
  return (
    <section className={classes}>
      <div className="hero-grid-bg" />
      <div className="container page-hero-inner">
        <Reveal>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
