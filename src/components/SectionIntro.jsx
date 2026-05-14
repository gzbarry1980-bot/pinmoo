import { Reveal } from './Reveal.jsx';

export function SectionIntro({ eyebrow, title, text, align = 'center' }) {
  const classes = 'section-intro ' + (align === 'left' ? 'section-intro-left' : '');
  return (
    <Reveal className={classes}>
      {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </Reveal>
  );
}
