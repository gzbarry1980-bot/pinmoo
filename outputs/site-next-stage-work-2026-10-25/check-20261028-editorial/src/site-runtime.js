import { copyText } from './components/copy-text.js';

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
    button.setAttribute('aria-label', document.documentElement.lang.startsWith('en') ? 'Open navigation' : '打开导航');
    button.innerHTML = menuIcon(false);
    document.body.classList.remove('menu-open');
  };
  button.addEventListener('click', function() {
    const open = panel.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', document.documentElement.lang.startsWith('en') ? (open ? 'Close navigation' : 'Open navigation') : (open ? '关闭导航' : '打开导航'));
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
  const row = document.querySelector('.case-filter-controls') || document.querySelector('.filter-row');
  const grid = document.getElementById('casesGrid');
  if (!row || !grid) return;
  row.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));

  row.addEventListener('click', function(event) {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const filter = button.dataset.filter || '';
    row.querySelectorAll('button').forEach(function(item) {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
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
    button.setAttribute('aria-label', document.documentElement.lang.startsWith('en') ? (open ? 'Close WeChat contact' : 'Open WeChat contact') : (open ? '关闭微信咨询' : '打开微信咨询'));
  });
  document.addEventListener('pointerdown', function(event) {
    if (wrap.contains(event.target)) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', document.documentElement.lang.startsWith('en') ? 'Open WeChat contact' : '打开微信咨询');
  });
  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', document.documentElement.lang.startsWith('en') ? 'Open WeChat contact' : '打开微信咨询');
  });
}

function initTemplateCopy() {
  document.querySelectorAll('.copy-template-button[data-copy-target]').forEach(function(button) {
    button.addEventListener('click', async function() {
      const target = document.getElementById(button.dataset.copyTarget || '');
      const text = target?.textContent?.trim();
      if (!text) return;
      const label = button.querySelector('span');
      if (!label) return;
      const original = label.textContent;
      const en = document.documentElement.lang.startsWith('en');
      const copied = await copyText(text);
      const status = button.closest('.contact-conversation')?.querySelector('.copy-status');
      label.textContent = copied ? (en ? 'Copied' : '已复制，可粘贴到微信') : (en ? 'Select the message to copy' : '请选择文字手动复制');
      if (status) status.textContent = copied ? (en ? 'Message copied.' : '咨询说明已复制。') : (en ? 'Copy unavailable. Select the message above.' : '复制未成功，请选中上方咨询说明手动复制。');
      window.setTimeout(function() { label.textContent = original; if (status) status.textContent = ''; }, 3000);
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
    else if (link.dataset.event === 'resource_download') trackEvent('resource_download', eventPlacement(link));
    else if (link.dataset.event === 'consult_open' || /\/(?:en\/)?contact\/$/.test(new URL(link.href).pathname)) trackEvent('consult_open', eventPlacement(link));
  });
  document.querySelectorAll('[data-copy-wechat]').forEach(button => {
    button.addEventListener('click', async () => {
      const original = button.textContent;
      const originalLabel = button.getAttribute('aria-label');
      const copied = await copyText(button.dataset.copyWechat);
      if (copied) {
        button.textContent = document.documentElement.lang.startsWith('en') ? 'Copied' : '已复制微信号';
        const status = button.closest('.contact-conversation')?.querySelector('.copy-status');
        if (status) status.textContent = document.documentElement.lang.startsWith('en') ? 'WeChat number copied.' : '已复制微信号，可粘贴到微信。';
        trackEvent('wechat_copy', eventPlacement(button));
      } else {
        const status = button.closest('.contact-conversation')?.querySelector('.copy-status');
        if (status) status.textContent = document.documentElement.lang.startsWith('en') ? 'Copy unavailable. Select the WeChat number above.' : '复制未成功，请选中上方微信号手动复制。';
        else button.textContent = button.dataset.copyWechat;
        button.setAttribute('aria-label', (document.documentElement.lang.startsWith('en') ? 'WeChat number ' : '微信号 ') + button.dataset.copyWechat);
      }
      window.setTimeout(() => {
        button.textContent = original;
        if (originalLabel === null) button.removeAttribute('aria-label'); else button.setAttribute('aria-label', originalLabel);
        const status = button.closest('.contact-conversation')?.querySelector('.copy-status');
        if (status) status.textContent = '';
      }, 3000);
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

function initPaginatedInsightSearch() {
  const input = document.getElementById('insightSearch');
  const grid = document.getElementById('insightResults');
  const template = document.getElementById('insightSearchCards');
  const pagination = document.querySelector('.insight-pagination');
  const output = document.getElementById('insightCount');
  const reset = document.getElementById('insightReset');
  const initial = grid.innerHTML;
  const initialCount = output.textContent;
  const query = new URLSearchParams(location.search);
  const aliases = { 'brand-answers': 'decision', 'guangzhou-services': 'decision' };
  const legacyTopic = query.get('topic') || location.hash.slice(1);
  const topic = aliases[legacyTopic] || legacyTopic;
  const topicLink = [...document.querySelectorAll('[data-cluster]')].find(link => link.dataset.cluster === topic);
  if (topicLink && topic !== grid.dataset.topic) {
    const target = new URL(topicLink.href);
    if (query.get('q')) target.searchParams.set('q', query.get('q'));
    location.replace(target.href);
    return;
  }
  const update = () => {
    const words = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    if (words.length) {
      const fragment = template.content.cloneNode(true);
      for (const wrapper of [...fragment.children]) {
        const matches = (grid.dataset.topic === 'all' || wrapper.dataset.searchTopic === grid.dataset.topic) && words.every(word => wrapper.textContent.toLocaleLowerCase().includes(word));
        if (!matches) wrapper.remove();
        else { wrapper.querySelector('.reveal')?.classList.remove('reveal'); count++; }
      }
      grid.replaceChildren(fragment);
      output.textContent = count + ' 篇匹配文章';
    } else {
      grid.innerHTML = initial;
      grid.querySelectorAll('.reveal').forEach(card => card.classList.remove('reveal'));
      count = grid.children.length;
      output.textContent = initialCount;
    }
    pagination.hidden = words.length > 0;
    document.getElementById('insightEmpty').hidden = count !== 0;
    reset.hidden = words.length === 0;
    document.querySelectorAll('[data-cluster]').forEach(link => {
      const target = new URL(link.href);
      target.search = '';
      if (words.length) target.searchParams.set('q', input.value.trim());
      link.href = target.pathname + target.search;
    });
    const url = new URL(location.href);
    url.search = '';
    if (words.length) url.searchParams.set('q', input.value.trim());
    history.replaceState(history.state, '', url);
    try { sessionStorage.setItem('pinmoo-insights-return', url.pathname + url.search); } catch {}
  };
  input.value = query.get('q') || '';
  input.form.addEventListener('submit', event => { event.preventDefault(); update(); });
  input.addEventListener('input', update);
  const clear = () => { input.value = ''; update(); input.focus(); };
  reset.addEventListener('click', clear);
  document.querySelector('[data-reset-insights]')?.addEventListener('click', clear);
  window.addEventListener('popstate', () => { input.value = new URLSearchParams(location.search).get('q') || ''; update(); });
  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem('pinmoo-insights-scroll', String(window.scrollY)); } catch {}
  });
  if (input.value) update();
  else {
    try { sessionStorage.setItem('pinmoo-insights-return', location.pathname); } catch {}
  }
  if (query.has('resume')) {
    try { requestAnimationFrame(() => scrollTo(0, Number(sessionStorage.getItem('pinmoo-insights-scroll')) || 0)); } catch {}
  }
}

function initInsightSearch() {
  if (document.getElementById('insightSearchCards')) initPaginatedInsightSearch();
}

function initInsightReturn() {
  const back = document.querySelector('.insight-article .back-link');
  if (!back) return;
  try {
    const saved = sessionStorage.getItem('pinmoo-insights-return');
    if (!saved) return;
    const url = new URL(saved, location.origin);
    if (url.origin !== location.origin || !/^\/insights\/(?:page\/\d+\/|topic\/[a-z-]+\/(?:page\/\d+\/)?)?$/.test(url.pathname)) return;
    url.searchParams.set('resume', '1');
    back.href = url.pathname + url.search;
  } catch {}
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
initInsightReturn();
initMotion();
initConversion();
