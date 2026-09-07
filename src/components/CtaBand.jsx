import { SITE } from '../data/site.js';
import { ButtonLink } from './ButtonLink.jsx';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

export function CtaBand({ title = '你的品牌，下一步该先优化哪里？', text = '发送品牌名称、官网或店铺链接、主要平台和当前问题。品沐会先判断问题所在和行动优先级，再确认是否需要进一步合作。', button = '预约品牌电商咨询' }) {
  return (
    <Reveal className="cta-band-wrap">
      <section className="cta-band">
        <div className="cta-band-icon"><Icon name="MessageCircle" size={34} /></div>
        <div className="cta-band-text">
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <div className="cta-band-contact">
          <strong>{SITE.contactLabel}</strong>
          <span>{SITE.contactNote}</span>
        </div>
        <ButtonLink href="/contact/?service=geo-report" icon={false}>{button}</ButtonLink>
      </section>
    </Reveal>
  );
}
