import { useRef } from 'react';
import { copyText } from './copy-text.js';

export function SharedMarkup({ html }) {
  const root = useRef(null);
  async function onClick(event) {
    const button = event.target.closest('[data-copy-wechat], [data-copy-target]');
    if (!button || !root.current.contains(button)) return;
    const text = button.dataset.copyWechat || root.current.querySelector('#' + button.dataset.copyTarget)?.textContent?.trim();
    if (!text) return;
    const original = button.textContent;
    const en = document.documentElement.lang.startsWith('en');
    const copied = await copyText(text);
    const status = root.current.querySelector('.copy-status');
    button.textContent = copied ? (en ? 'Copied' : '已复制') : (en ? 'Select the text to copy' : '请选择文字手动复制');
    if (status) status.textContent = copied ? (en ? 'Copied successfully.' : '已复制，可粘贴发送。') : (en ? 'Copy unavailable. Select the text above.' : '复制未成功，请选中上方文字手动复制。');
    window.setTimeout(() => { if (button.isConnected) button.textContent = original; if (status) status.textContent = ''; }, 3000);
  }
  return <div ref={root} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
