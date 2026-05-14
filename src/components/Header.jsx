import { useEffect, useState } from 'react';
import { NAV_ITEMS, SITE } from '../data/site.js';
import { Icon } from './Icon.jsx';

function isActive(item, pathname) {
  if (item.match === '/') return pathname === '/';
  return pathname.startsWith(item.match);
}

export function Header({ pathname }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    return () => document.body.classList.remove('menu-open');
  }, [open]);

  return (
    <header className={'site-header ' + (scrolled ? 'site-header-scrolled' : '')}>
      <div className="container header-shell">
        <a className="brand-link" href="/" aria-label="PINMOO 品沐咨询首页">
          <span className="logo-frame logo-frame-header">
            <img src={SITE.logo} alt="PINMOO 品沐咨询 Logo" onError={(event) => { event.currentTarget.src = SITE.logoFallback; }} />
          </span>
        </a>
        <nav className="desktop-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} className={isActive(item, pathname) ? 'active' : ''} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <a className="header-cta" href="/contact/">预约咨询</a>
        <button className="mobile-menu-btn" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? '关闭导航' : '打开导航'} aria-expanded={open}>
          <Icon name={open ? 'X' : 'Menu'} size={24} />
        </button>
      </div>
      <div className={'mobile-nav-panel ' + (open ? 'open' : '')}>
        <nav aria-label="移动端导航">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} className={isActive(item, pathname) ? 'active' : ''} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
          ))}
          <a className="mobile-nav-cta" href="/contact/" onClick={() => setOpen(false)}>预约咨询</a>
        </nav>
      </div>
    </header>
  );
}
