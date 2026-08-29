import { useEffect, useRef, useState } from 'react';
import { SITE } from '../data/site.js';
import { Icon } from './Icon.jsx';

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && wrapRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  return (
    <div className="floating-contact" ref={wrapRef}>
      <button type="button" className="floating-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Icon name="MessageCircle" size={20} />
        <span>微信咨询</span>
      </button>
      {open && (
        <div className="floating-panel">
          <div className="floating-qr-crop"><img src="/assets/wechat-qr-mufeng.jpg" alt="添加品沐咨询微信" loading="lazy" /></div>
          <strong>{SITE.contactLabel}</strong>
          <p>{SITE.contactNote}</p>
          <a href={'tel:' + SITE.phone}>拨打电话</a>
        </div>
      )}
    </div>
  );
}
