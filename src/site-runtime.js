function menuIcon(open) {
  const path = open
    ? '<path d="M6 6l12 12M18 6 6 18"/>'
    : '<path d="M4 6h16M4 12h16M4 18h16"/>';
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">' + path + '</svg>';
}

function initHeader() {
  const header = document.querySelector('.site-header');
  const button = document.querySelector('.mobile-menu-btn');
  const panel = document.querySelector('.mobile-nav-panel');
  if (!header) return;

  let ticking = false;
  const updateHeader = function() {
    header.classList.toggle('site-header-scrolled', window.scrollY > 18);
    ticking = false;
  };
  window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();

  if (!button || !panel) return;
  const closeMenu = function() {
    panel.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '打开导航');
    button.innerHTML = menuIcon(false);
    document.body.classList.remove('menu-open');
  };
  button.addEventListener('click', function() {
    const open = panel.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    button.innerHTML = menuIcon(open);
    document.body.classList.toggle('menu-open', open);
  });
  panel.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeMenu();
  });
}

function initFaq() {
  document.querySelectorAll('.faq-item button').forEach(function(button) {
    button.setAttribute('aria-expanded', String(button.closest('.faq-item')?.classList.contains('open')));
    button.addEventListener('click', function() {
      const item = button.closest('.faq-item');
      const open = item?.classList.toggle('open') || false;
      button.setAttribute('aria-expanded', String(open));
    });
  });
}

function initCaseFilters() {
  const row = document.querySelector('.filter-row');
  const grid = document.getElementById('casesGrid');
  if (!row || !grid) return;

  row.addEventListener('click', function(event) {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const filter = button.dataset.filter || '';
    row.querySelectorAll('button').forEach(function(item) {
      item.classList.toggle('active', item === button);
    });
    grid.querySelectorAll(':scope > [data-case-filters]').forEach(function(card) {
      const values = (card.dataset.caseFilters || '').split('|');
      card.hidden = filter !== '全部' && filter !== 'All' && !values.includes(filter);
    });
  });
}

function initFloatingContact() {
  const wrap = document.querySelector('.floating-contact');
  if (!wrap) return;
  const button = wrap.querySelector('.floating-button');
  const panel = wrap.querySelector('.floating-panel');
  if (!button || !panel) return;
  button.addEventListener('click', function() {
    const open = panel.hidden;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  });
}

initHeader();
initFaq();
initCaseFilters();
initFloatingContact();
