(() => {
  const scrollHistory = [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resolveTarget(target) {
    if (target instanceof Element) return target;
    if (typeof target !== 'string' || !target) return null;
    try { return document.querySelector(target); } catch { return null; }
  }

  function rememberPosition() {
    const last = scrollHistory.at(-1);
    if (!last || Math.abs(last.top - window.scrollY) > 24) {
      scrollHistory.push({ top: window.scrollY, left: window.scrollX });
      if (scrollHistory.length > 30) scrollHistory.shift();
    }
  }

  function scrollToTarget(target, options = {}) {
    const element = resolveTarget(target);
    if (!element || element.hidden) return false;
    if (options.remember !== false) rememberPosition();
    element.scrollIntoView({
      behavior: options.behavior || (prefersReducedMotion ? 'auto' : 'smooth'),
      block: options.block || 'start'
    });
    return true;
  }

  function sameOriginReferrer() {
    if (!document.referrer) return false;
    try { return new URL(document.referrer).origin === window.location.origin; }
    catch { return false; }
  }

  function goBack() {
    const previous = scrollHistory.pop();
    if (previous) {
      window.scrollTo({ ...previous, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      return;
    }
    if (sameOriginReferrer() && window.history.length > 1) {
      window.history.back();
      return;
    }
    const home = document.documentElement.dataset.appHome || './';
    if (!document.body.classList.contains('zhongkao-home') && window.location.pathname !== '/') {
      window.location.assign(home);
      return;
    }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', (event) => {
    const scrollControl = event.target.closest('[data-scroll-target]');
    if (scrollControl) {
      const target = scrollControl.dataset.scrollTarget || scrollControl.getAttribute('href');
      if (target?.startsWith('#')) {
        // 独立页面架构下不再有“切工作区”概念；同页锚点元素可见时平滑滚动即可
        if (scrollToTarget(target)) event.preventDefault();
      }
      return;
    }

    const backControl = event.target.closest('[data-smart-back]');
    if (backControl) {
      event.preventDefault();
      goBack();
      return;
    }

    const homeReturn = event.target.closest('[data-home-return]');
    if (homeReturn && !document.body.classList.contains('zhongkao-home')) {
      event.preventDefault();
      // “助手首页”是固定目的地，不应受浏览历史影响。否则从方向版采用草案后，
      // 在 Step 3 点击首页会退回“采用这份草案”，而不是真正的产品首页。
      window.location.assign(homeReturn.href);
      return;
    }

    const topControl = event.target.closest('[data-scroll-top]');
    if (topControl) {
      event.preventDefault();
      rememberPosition();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });

  window.ZhongkaoNavigation = { scrollTo: scrollToTarget, back: goBack };
})();
