import { SITE } from '../data/site.js';
import { ButtonLink } from './ButtonLink.jsx';
import { Icon } from './Icon.jsx';
import { Reveal } from './Reveal.jsx';

export function CtaBand({ title = '添加微信，免费获取一份品牌 GEO 基础报告', text = '发送品牌名称、官网或店铺链接、主要平台和目标市场。品沐会基于公开信息先做一份品牌 GEO 基础判断，帮助你看清 AI 搜索可见度、事实一致性和下一步优化方向。', button = '免费领取 GEO 报告' }) {
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
