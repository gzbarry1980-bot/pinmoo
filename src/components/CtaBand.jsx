import { SITE } from '../data/site.js';
import { ButtonLink } from './ButtonLink.jsx';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

export function CtaBand({ title = '你的品牌，下一步该先优化哪里？', text = '留下需求，或直接添加微信联系。我们会从平台、商品、流量、转化和团队执行五个维度，帮你判断最值得优先解决的问题。', button = '预约咨询' }) {
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
        <ButtonLink href="/contact/" icon={false}>{button}</ButtonLink>
      </section>
    </Reveal>
  );
}
