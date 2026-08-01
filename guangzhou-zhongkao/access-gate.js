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
    const path = location.pathname || '';
    // 已在解锁页：回首页
    if (path.endsWith('/unlock/') || path.endsWith('/unlock/index.html')) { window.location.href = './'; return; }
    // 站点根（首页）：同目录解锁页
    if (path === '/' || path === '/index.html' || path === '') { window.location.href = './unlock/'; return; }
    // 其余所有子目录页（/direction/、/target/、/verify/、/special/ 等）回退到上一级的解锁页
    window.location.href = '../unlock/';
  }

  // ---- 付费引导弹层 ----
  let overlayEl = null;
  function buildOverlay() {
    if (overlayEl) return overlayEl;
    const el = document.createElement('div');
    el.className = 'paywall-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '解锁完整功能');
    el.innerHTML = `
      <div class="paywall-card">
        <button class="paywall-close" type="button" aria-label="关闭">×</button>
        <span class="paywall-eyebrow">广州中考志愿模拟助手</span>
        <h2 class="paywall-title">解锁完整志愿模拟</h2>
        <p class="paywall-sub">部分方案详情已打码预览。输入品沐提供的有效序列号后，可查看完整方向、志愿表、评分、录取机会与调整建议。</p>
        <ul class="paywall-benefits">
          <li>方向版 / 目标校版 / 求证版 完整生成与评分</li>
          <li>学校历史录取门槛、梯度保护与机会区间</li>
          <li>JSON 导入导出、打印 PDF 报告</li>
          <li>序列号最多支持两台设备使用</li>
        </ul>
        <button class="paywall-pay" type="button">输入序列号解锁</button>
        <button class="paywall-later" type="button">稍后再说</button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('.paywall-close').addEventListener('click', hidePaywall);
    el.querySelector('.paywall-later').addEventListener('click', hidePaywall);
    el.addEventListener('click', (event) => { if (event.target === el) hidePaywall(); });
    el.querySelector('.paywall-pay').addEventListener('click', openUnlock);
    overlayEl = el;
    return el;
  }

  function showPaywall() {
    if (isEntitled()) return;
    buildOverlay().classList.add('show');
    document.body.classList.add('paywall-open');
  }

  function hidePaywall() {
    if (overlayEl) overlayEl.classList.remove('show');
    document.body.classList.remove('paywall-open');
  }

  /** 单点拦截（保留接口，当前内容级打码为主路径）：已授权返回 true，否则弹付费引导并返回 false。 */
  function guard() {
    if (isEntitled()) return true;
    showPaywall();
    return false;
  }

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
        <span class="gate-price">输入序列号解锁查看</span>
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
  resolve();
})();
