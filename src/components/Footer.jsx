import { NAV_ITEMS, SITE } from '../data/site.js';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <span className="logo-frame logo-frame-footer">
            <img src={SITE.logo} alt="PINMOO 品沐咨询 Logo" onError={(event) => { event.currentTarget.src = SITE.logoFallback; }} />
          </span>
          <p>{SITE.company}</p>
          <p>专注电商战略咨询与品牌增长陪跑</p>
        </div>
        <div>
          <h2>导航链接</h2>
          <div className="footer-links">
            {NAV_ITEMS.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </div>
        </div>
        <div>
          <h2>联系方式</h2>
          <p>{SITE.contactLabel}</p>
          <p>{SITE.contactNote}</p>
          <p>ICP备案号：待补充</p>
        </div>
      </div>
      <div className="footer-bottom">© 2026 {SITE.company}. All rights reserved.</div>
    </footer>
  );
}
