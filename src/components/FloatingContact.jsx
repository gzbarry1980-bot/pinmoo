import { useState } from 'react';
import { SITE } from '../data/site.js';
import { Icon } from './Icon.jsx';

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  return (
    <div className="floating-contact">
      <button type="button" className="floating-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Icon name="MessageCircle" size={20} />
        <span>微信咨询</span>
      </button>
      {open && (
        <div className="floating-panel">
          <strong>{SITE.contactLabel}</strong>
          <p>{SITE.contactNote}</p>
          <a href={'tel:' + SITE.phone}>拨打电话</a>
        </div>
      )}
    </div>
  );
}
