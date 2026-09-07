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
    button.setAttribute('aria-label', open ? '关闭微信咨询' : '打开微信咨询');
  });
  document.addEventListener('pointerdown', function(event) {
    if (wrap.contains(event.target)) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '打开微信咨询');
  });
  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '打开微信咨询');
  });
}

function initTemplateCopy() {
  document.querySelectorAll('.copy-template-button[data-copy-target]').forEach(function(button) {
    button.addEventListener('click', async function() {
      const target = document.getElementById(button.dataset.copyTarget || '');
      const text = target?.textContent?.trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        if (!copied) {
          const label = button.querySelector('span');
          if (label) label.textContent = '请选中文字手动复制';
          return;
        }
      }
      const label = button.querySelector('span');
      if (!label) return;
      label.textContent = '已复制，可粘贴到微信';
      window.setTimeout(function() { label.textContent = '复制这段话'; }, 2400);
    });
  });
}

function eventPlacement(element) {
  if (element?.dataset.placement) return element.dataset.placement;
  if (element?.closest('header.site-header')) return 'header';
  if (element?.closest('footer')) return 'footer';
  return 'body';
}

function trackEvent(event, placement = 'body') {
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  if (!['pinmooconsulting.com', 'www.pinmooconsulting.com'].includes(location.hostname)) return;
  const page = document.querySelector('main[data-page-id]')?.dataset.pageId;
  if (!page) return;
  const query = new URLSearchParams({ event, page, placement });
  fetch('/_events?' + query, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', keepalive: true }).catch(() => {});
}

function initConversion() {
  trackEvent('page_view');
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (link.getAttribute('href')?.startsWith('tel:')) trackEvent('phone_click', eventPlacement(link));
    else if (link.dataset.event === 'report_open' || link.href.includes('service=geo-report')) trackEvent('report_open', eventPlacement(link));
  });
  document.querySelectorAll('[data-copy-wechat]').forEach(button => {
    button.addEventListener('click', async () => {
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(button.dataset.copyWechat);
        button.textContent = document.documentElement.lang.startsWith('en') ? 'Copied' : '已复制微信号';
        trackEvent('wechat_copy', eventPlacement(button));
      } catch {
        button.textContent = button.dataset.copyWechat;
        button.setAttribute('aria-label', '微信号 ' + button.dataset.copyWechat);
      }
      window.setTimeout(() => { button.textContent = original; }, 3000);
    });
  });
}

function initReportTabs() {
  const nav = document.querySelector('.geo-report-tabs');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('[data-report-tab]')];
  const panels = [...document.querySelectorAll('[data-report-panel]')];
  nav.setAttribute('role', 'tablist');
  const select = index => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  };
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', event => { event.preventDefault(); select(i); });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(index); tabs[index].focus();
    });
  });
  select(0);
}

function initInsightSearch() {
  const input = document.getElementById('insightSearch');
  if (!input) return;
  const clusters = [...document.querySelectorAll('.insight-cluster')];
  const links = [...document.querySelectorAll('.insight-cluster-nav a')];
  let category = 'all';
  const update = () => {
    const words = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    clusters.forEach(cluster => {
      let matches = 0;
      [...cluster.querySelector('.insight-card-grid').children].forEach(card => {
        const visible = (category === 'all' || category === cluster.id) && words.every(word => card.textContent.toLocaleLowerCase().includes(word));
        card.hidden = !visible;
        if (visible) matches++;
      });
      cluster.hidden = matches === 0;
      count += matches;
    });
    document.getElementById('insightCount').textContent = count + ' 篇文章';
    document.getElementById('insightEmpty').hidden = count !== 0;
    links.forEach(link => link.setAttribute('aria-current', String(link.hash.slice(1) === category)));
  };
  input.form.addEventListener('submit', event => event.preventDefault());
  input.addEventListener('input', update);
  links.forEach(link => link.addEventListener('click', event => { event.preventDefault(); category = link.hash.slice(1); update(); }));
  update();
}

function initMotion() {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  const configure = () => {
    observer?.disconnect();
    document.documentElement.classList.toggle('motion-ready', !preference.matches);
    if (preference.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('entering'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) observer.observe(element);
    });
  };
  preference.addEventListener('change', configure);
  configure();
}

document.documentElement.classList.add('js-ready');
initHeader();
initFaq();
initCaseFilters();
initFloatingContact();
initTemplateCopy();
initReportTabs();
initInsightSearch();
initMotion();
initConversion();
