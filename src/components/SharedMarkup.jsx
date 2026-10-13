import { useRef } from 'react';

export function SharedMarkup({ html }) {
  const root = useRef(null);
  async function onClick(event) {
    const button = event.target.closest('[data-copy-wechat], [data-copy-target]');
    if (!button || !root.current.contains(button)) return;
    const text = button.dataset.copyWechat || root.current.querySelector('#' + button.dataset.copyTarget)?.textContent?.trim();
    if (!text) return;
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = '已复制';
    } catch {
      const status = root.current.querySelector('.copy-status');
      if (status) status.textContent = '复制未成功，请选中文字手动复制。';
      else button.textContent = '请选择文字手动复制';
    }
    window.setTimeout(() => { if (button.isConnected) button.textContent = original; }, 2400);
  }
  return <div ref={root} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
