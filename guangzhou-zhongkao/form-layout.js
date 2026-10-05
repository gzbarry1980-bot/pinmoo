// Align control rows without clipping long labels or reserving arbitrary blank space.
const groups = '.profile-grid,.direction-form,.qualification-form,.filter-bar,.filters,.quota-grid,.quota-slots,.quota-details,.autonomous-checker-form,.talent-project-picker';
let queued = false;
function alignFields() {
  queued = false;
  for (const group of document.querySelectorAll(groups)) {
    const fields = [...group.children].filter(el => el.matches('label') &&
      el.querySelector(':scope > select,:scope > input:not([type=checkbox]):not([type=radio])'));
    for (const field of fields) {
      field.classList.add('aligned-field');
      let title = field.querySelector(':scope > .field-title');
      if (!title) {
        const existing = [...field.children].find(el => el.matches('span') && !el.querySelector('input,select'));
        if (existing) { title = existing; title.classList.add('field-title'); }
        else {
          title = document.createElement('span'); title.className = 'field-title';
          for (const node of [...field.childNodes]) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) title.append(node);
          }
          field.prepend(title);
        }
      }
      title.style.removeProperty('min-height');
    }
    const rows = new Map();
    for (const field of fields) {
      if (!field.getClientRects().length) continue;
      const top = Math.round(field.getBoundingClientRect().top);
      const row = rows.get(top) || [];
      row.push(field); rows.set(top, row);
    }
    for (const row of rows.values()) {
      const height = Math.max(...row.map(field => field.querySelector('.field-title').getBoundingClientRect().height));
      for (const field of row) field.querySelector('.field-title').style.minHeight = `${height}px`;
    }
    // A standalone action in a filter grid aligns with the controls, not the notes.
    for (const button of group.querySelectorAll(':scope > button')) {
      const title = fields.find(field => field.getClientRects().length)?.querySelector('.field-title');
      button.style.setProperty('--field-action-offset', title ? `${title.getBoundingClientRect().height + 8}px` : '0px');
    }
  }
}
function schedule() { if (!queued) { queued = true; requestAnimationFrame(alignFields); } }
export function installFormLayout() {
  schedule();
  window.addEventListener('resize', schedule);
  document.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  new MutationObserver(schedule).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
}
