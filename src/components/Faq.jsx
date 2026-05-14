import { useState } from 'react';
import { Icon } from './Icon.jsx';

export function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <div className={'faq-item ' + (open === index ? 'open' : '')} key={item.q}>
          <button type="button" onClick={() => setOpen(open === index ? -1 : index)}>
            <span>{item.q}</span>
            <Icon name="ChevronDown" size={18} />
          </button>
          <div className="faq-answer"><p>{item.a}</p></div>
        </div>
      ))}
    </div>
  );
}
