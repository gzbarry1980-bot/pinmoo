/**
 * access-gate.js — 权益与付费闸门（纯前端，内容级马赛克）
 * ----------------------------------------------------------------
 * 设计目标：
 *  - 未付费用户可进入系统，但指定的「高价值输出区块」以马赛克模糊呈现
 *    （隐约可见轮廓），点击解锁浮层即弹出付费引导；付费后对应区块清晰可用。
 *  - 真实扣款依赖后端（/api/access/*，见 unlock/）。本模块是“前端拦截层”，
 *    在权益尚未就绪（无后端 / 未付费）时对 [data-gate] 区块打码。
 *
 * 打码区块（在 HTML 中以 data-gate 标记）：
 *  direction  → 第3 / 4 批方向推荐（方向版输出详情）
 *  volunteer  → 2026 结构模拟志愿表
 *  score      → 方案评分与补强清单
 *  chance     → 逐志愿录取机会
 *  advice     → 可执行调整建议
 *
 * 权益解析优先级：
 *  1) 后端在线且 accessMode === 'enforce'：以 /api/access/session.entitled 为准（真实付费放行）。
 *  2) 后端在线但非 enforce（软模式）：全站开放（上线灰度 / 后端维护期间不锁站）。
 *  3) 无后端：先读根目录静态开关 access-config.json（enforce===false → 全站开放）；
 *     enforce 时保持锁定，不能由本地存储自行授予使用权。
 *
 * 暴露 window.ZhongkaoAccess：
 *  isEntitled() / getState() / guard() / showPaywall() / hidePaywall()
 *  openUnlock() / onChange() / applyContentGating() / resolve()
 */
(() => {
  'use strict';
  const state = { resolved: false, entitled: false, loading: true, backend: null };
  const listeners = new Set();

  // 各打码区块的浮层文案
  const GATE_META = {
    direction: { title: '第 3 / 4 批方向推荐', desc: '完整填报方向与梯度结构' },
    volunteer: { title: '2026 结构模拟志愿表', desc: '完整志愿表与一键补强' },
    score: { title: '方案评分与补强清单', desc: '资格 / 结构 / 顺序维度评分' },
    chance: { title: '逐志愿录取机会', desc: '各志愿录取概率区间' },
    advice: { title: '可执行调整建议', desc: '针对性优化建议' }
  };

  function emit() {
    listeners.forEach((cb) => { try { cb(state); } catch (_) { /* 忽略单个订阅者异常 */ } });
  }

  // 从小程序 web-view 透传的查询参数中读取一次性会话码（zk_code）。
  // P0-5：不再读取/缓存长期令牌或 openid，避免敏感凭证进入 URL/日志/本地存储。
  function readUrlToken() {
    try {
      const params = new URLSearchParams(location.search);
      return params.get('zk_code') || '';
    } catch (_) {
      return '';
    }
  }

  // R2：交换完成后立刻把 zk_code 从地址栏抹掉。
  // 短码是一次性的，留在 URL 里既会被分享出去，也会进入浏览器历史与 referer。
  function clearUrlToken() {
    try {
      const url = new URL(location.href);
      if (!url.searchParams.has('zk_code')) return;
      url.searchParams.delete('zk_code');
      const next = url.pathname + (url.search ? url.search : '') + (url.hash || '');
      if (history && typeof history.replaceState === 'function') history.replaceState({}, '', next);
    } catch (_) { /* 不支持时忽略，短码本身 60 秒后也会失效 */ }
  }

  async function fetchJson(url, timeout = 2500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { credentials: 'include', signal: controller.signal });
      if (!res.ok) return null;
      return await res.json().catch(() => null);
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function resolve() {
    state.loading = true;
    try {
      const cfg = await fetchJson('/api/access/config');
      state.backend = cfg;
      if (cfg && cfg.accessMode === 'enforce') {
        // R2：web-view 注入的是一次性会话码（zk_code）。先用专用交换接口换成服务端
        // 网页会话（HttpOnly Cookie），刷新 / 跳页 / 返回都靠它保持权益；
        // 随后清理 URL，再由普通 session 接口查询该会话。
        const code = readUrlToken();
        if (code) {
          await fetchJson('/api/access/exchange?code=' + encodeURIComponent(code));
          clearUrlToken();
        }
        const sess = await fetchJson('/api/access/session');
        state.entitled = Boolean(sess && sess.authenticated && sess.entitled);
      } else if (cfg) {
        // 后端在线但处于软模式：全站开放，不强制付费
        state.entitled = true;
      } else {
        // 无后端：先读根目录静态开关 access-config.json（部署期无需后端即可控闸门）
        const staticCfg = await fetchJson('/access-config.json');
        if (staticCfg && staticCfg.enforce === false) {
          state.entitled = true; // 开关关闭 → 全站开放（灰度 / 维护期间）
        } else state.entitled = false;
      }
    } catch (_) {
      state.entitled = false;
    } finally {
      state.loading = false;
      state.resolved = true;
      emit();
    }
  }

  function isEntitled() { return state.entitled; }
  function getState() { return Object.assign({}, state); }

  function openUnlock() {
    const path = location.pathname || '/';
    if (path.startsWith('/unlock/')) { window.location.href='/'; return; }
    const back=new URL(location.href);
    if(path.startsWith('/verify/')) {
      try {
        const workspace=JSON.parse(localStorage.getItem('pinmoo-zk-workspace-v2')||'null');
        if(workspace?.activePlanId&&workspace.plans?.some(p=>p.id===workspace.activePlanId)) {
          back.searchParams.delete('new');back.searchParams.set('plan',workspace.activePlanId);
        }
      } catch (_) {}
      back.searchParams.set('step',document.body.dataset.workflowStep||'profile');
    }
    window.location.href = `/unlock/?returnTo=${encodeURIComponent(back.pathname+back.search+back.hash)}`;
  }

  // ---- 付费引导弹层（9.9 元会员付费解锁） ----
  let overlayEl = null;

  // 是否运行在微信小程序 web-view 内：优先认我们自己注入的 URL 标记（最可靠，
  // 兼容开发者工具模拟器里 wx 对象缺失的情况），再退化为 wx 对象探测。
  function isInMiniProgram() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('zk_inmini') === '1') return true;
    } catch (_) {}
    try {
      if (typeof wx !== 'undefined' && wx && wx.miniProgram) {
        if (typeof wx.miniProgram.navigateTo === 'function') return true;
        if (window.__wxjs_environment === 'miniprogram') return true;
      }
    } catch (_) {}
    return false;
  }

  // 跳转到小程序原生支付页；失败时尝试 redirectTo，最后才放弃
  function goNativePay() {
    try {
      const mp = wx && wx.miniProgram;
      if (!mp || typeof mp.navigateTo !== 'function') return false;
      mp.navigateTo({
        url: '/pages/pay/pay',
        fail: (err) => {
          try {
            if (mp.redirectTo) mp.redirectTo({ url: '/pages/pay/pay' });
          } catch (_) {
            console.warn('wx.miniProgram redirectTo pay failed', err);
          }
        }
      });
      return true;
    } catch (_) {}
    return false;
  }

  // 点击“立即开通”的统一入口：小程序内走原生支付（不再回退到序列号页），否则回退到解锁页
  function handleUnlockClick() {
    if (isInMiniProgram()) {
      goNativePay();
      return; // 即使在极端情况下 wx 不可用，也不要掉回旧序列号页
    }
    openUnlock();
  }

  function buildOverlay() {
    if (overlayEl) return overlayEl;
    const el = document.createElement('div');
    el.className = 'paywall-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '解锁完整志愿分析');
    const mini=isInMiniProgram();
    el.innerHTML = `
      <div class="paywall-card">
        <button class="paywall-close" type="button" aria-label="关闭">×</button>
        <span class="paywall-eyebrow">广州中考志愿模拟助手</span>
        <h2 class="paywall-title">解锁完整志愿分析</h2>
        <p class="paywall-sub">${mini?'查看小程序开通方式，解锁完整分析。':'输入有效序列号，可查看整份志愿与分析。每个序列号最多绑定两台设备，使用期限以序列号权益为准。'}</p>
        <ul class="paywall-benefits">
          <li>完整学校顺序与方案合理度</li>
          <li>历史依据、模拟去向与具体调整建议</li>
          <li>发挥变化对比、保存方案与打印报告</li>
        </ul>
        <button class="paywall-pay" type="button">${mini?'查看开通方式':'输入序列号解锁'}</button>
        <details class="wechat-consult">
          <summary>需要了解使用方式？联系品沐</summary>
          <p>可通过原咨询渠道联系客服，或扫描下方微信二维码。</p>
          <img src="/assets/wechat-serial-consult-20261005.png" alt="品沐使用咨询微信二维码" width="180" height="230" style="display:block;width:180px;max-width:100%;height:auto;margin:12px auto" loading="lazy" />
        </details>
        <button class="paywall-later" type="button">稍后再说</button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('.paywall-close').addEventListener('click', hidePaywall);
    el.querySelector('.paywall-later').addEventListener('click', hidePaywall);
    el.addEventListener('click', (event) => { if (event.target === el) hidePaywall(); });
    el.querySelector('.paywall-pay').addEventListener('click', handleUnlockClick);
    overlayEl = el;
    return el;
  }

  function showPaywall() {
    if (isEntitled()) return;
    previousFocus=document.activeElement;
    buildOverlay().classList.add('show');
    document.body.classList.add('paywall-open');
    overlayEl.querySelector('.paywall-pay').focus();
  }

  function hidePaywall() {
    if (overlayEl) overlayEl.classList.remove('show');
    document.body.classList.remove('paywall-open');
    previousFocus?.focus?.({preventScroll:true});
  }

  /** 单点拦截（保留接口，当前内容级打码为主路径）：已授权返回 true，否则弹付费引导并返回 false。 */
  function guard() {
    if (isEntitled()) return true;
    showPaywall();
    return false;
  }

  let previousFocus=null;
  document.addEventListener('keydown',event=>{
    if(!overlayEl?.classList.contains('show'))return;
    if(event.key==='Escape'){event.preventDefault();hidePaywall();}
    if(event.key==='Tab'){
      const items=[...overlayEl.querySelectorAll('button,summary,a[href]')].filter(e=>e.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });

  // ---- 内容级马赛克 ----
  function buildVeil(gate) {
    const meta = GATE_META[gate] || { title: '付费内容', desc: '解锁后查看' };
    const el = document.createElement('div');
    el.className = 'gate-veil';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `解锁${meta.title}`);
    el.innerHTML = `
      <div class="gate-veil-card">
        <span class="gate-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
        </span>
        <strong>${meta.title}</strong>
        <span class="gate-desc">${meta.desc}</span>
        <span class="gate-price">开通会员后查看</span>
      </div>`;
    const trigger = () => showPaywall();
    el.addEventListener('click', trigger);
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); trigger(); }
    });
    return el;
  }

  /**
   * 对所有 [data-gate] 区块按权益状态注入 / 移除马赛克浮层。
   * 无后端、未付费 → 打码；已授权 → 清晰。应在每次渲染后调用（区块可能被 innerHTML 重建）。
   */
  function applyContentGating() {
    if (typeof document === 'undefined' || !document.querySelectorAll) return;
    const entitled = isEntitled();
    document.querySelectorAll('[data-gate]').forEach((node) => {
      const existing = node.querySelector('.gate-veil');
      if (entitled) {
        if (existing) existing.remove();
        node.classList.remove('gated');
      } else {
        node.classList.add('gated');
        if (!existing) node.appendChild(buildVeil(node.getAttribute('data-gate')));
      }
    });
  }

  function onChange(cb) {
    if (typeof cb === 'function') listeners.add(cb);
    return () => listeners.delete(cb);
  }

  window.ZhongkaoAccess = {
    isEntitled,
    getState,
    guard,
    showPaywall,
    hidePaywall,
    openUnlock,
    onChange,
    applyContentGating,
    resolve
  };

  // 自动解析权益（页面加载即开始，不阻塞渲染）；每次权益变化自动重算打码
  onChange(() => applyContentGating());

  // 页面自身脚本（如 app.js 生成志愿方向时）会重写 [data-gate] 节点的 innerHTML，
  // 把已注入的 .gate-veil 整块抹掉。用 MutationObserver 在内容变动后自动重新打码，
  // 保证「生成后模糊 + 点击解锁浮层」始终生效（app.js 为禁区，不可改，只能在此侧兜底）。
  let _gatingScheduled = false;
  function scheduleGating() {
    if (_gatingScheduled) return;
    _gatingScheduled = true;
    Promise.resolve().then(() => {
      _gatingScheduled = false;
      applyContentGating();
    });
  }
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.documentElement) {
    const gatingObserver = new MutationObserver(scheduleGating);
    gatingObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  resolve();
})();
