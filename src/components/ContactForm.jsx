import { useState } from 'react';
import { SITE } from '../data/site.js';
import { Icon } from './Icon.jsx';

const intents = ['品牌GEO报告', 'GEO技术审计', 'AI搜索可见度', '电商咨询', '官网咨询'];

const reportChecks = [
  ['Search', 'GEO 生成式引擎优化'],
  ['Target', '电商战略诊断'],
  ['Layers', '平台运营陪跑'],
  ['PackageCheck', '商品与页面优化'],
  ['FilePenLine', '内容与种草策略'],
  ['BarChart3', '投放与数据复盘'],
  ['Users', '会员与私域运营']
];

const templates = [
  ['品牌GEO报告', '品牌名称：___；官网或店铺链接：___；主要平台：天猫/京东/抖音/小红书；目标市场：___；希望先看：品牌 GEO 可见度与内容优化。'],
  ['经营周报', '您好，我们有生意参谋、推广和退款数据，想生成一版品牌方可读的经营周报，重点看净销售额、退款、流量结构和下周期动作。'],
  ['运营陪跑', '您好，品牌目前有运营团队，但缺少外部复盘和优先级判断，想了解月度顾问陪跑如何合作。']
];

export function ContactForm() {
  const [copied, setCopied] = useState(-1);

  const copyTemplate = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      window.setTimeout(() => setCopied(-1), 2400);
    } catch {
      setCopied(-1);
    }
  };

  return (
    <section className="contact-direct-panel" aria-labelledby="wechatConsultTitle">
      <div className="form-heading">
        <Icon name="MessageCircle" size={26} />
        <h2 id="wechatConsultTitle">扫码添加微信，免费领取品牌 GEO 报告</h2>
      </div>
      <div className="direct-qr-block">
        <div className="wechat-qr-crop direct-qr"><img src="/assets/wechat-qr-mufeng.jpg" alt="添加品沐咨询微信，免费获取品牌 GEO 基础报告" loading="lazy" /></div>
        <div>
          <strong>微信 / 手机同号：{SITE.phoneDisplay}</strong>
          <p>备注“品牌GEO报告”，发送品牌名称、官网或店铺链接、主要平台和目标市场，可先免费获取一份基于公开信息的品牌 GEO 基础报告。</p>
          <div className="direct-intents">{intents.map((item) => <span key={item}>{item}</span>)}</div>
          <a className="direct-phone-link" href={'tel:' + SITE.phone}><Icon name="Phone" size={18} />拨打电话</a>
        </div>
      </div>
      <div className="direct-service-box"><h3>品牌 GEO 报告会先看什么</h3><ul>{reportChecks.map(([icon, label]) => <li key={label}><Icon name={icon} size={20} /><span>{label}</span></li>)}</ul></div>
      <div className="inquiry-template-box">
        <h3>不知道怎么开口，可以直接复制后发送</h3>
        <div>{templates.map(([title, text], index) => (
          <article key={title}>
            <strong>{title}</strong><p>{text}</p>
            <button type="button" className="copy-template-button" onClick={() => copyTemplate(text, index)}><Icon name={copied === index ? 'Check' : 'Copy'} size={16} />{copied === index ? '已复制，可粘贴到微信' : '复制这段话'}</button>
          </article>
        ))}</div>
      </div>
      <p className="direct-note">建议添加微信后，至少发送：品牌名称、官网或店铺链接、主要平台、目标市场，并备注“品牌GEO报告”。</p>
    </section>
  );
}
