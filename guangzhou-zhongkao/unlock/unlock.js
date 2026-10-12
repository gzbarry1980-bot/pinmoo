import {readAccessJSON,validRedemption,validSerialSession} from './validation.js';
const $ = (selector) => document.querySelector(selector);
const DEVICE_KEY = 'zk_serial_device_id';

function isInMiniProgram() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('zk_inmini') === '1') return true;
  } catch (_) {}
  try {
    if (document.documentElement.dataset.zkInmini === '1') return true;
  } catch (_) {}
  try {
    if (localStorage.getItem('zk_inmini') === '1') return true;
  } catch (_) {}
  try {
    if (window.__wxjs_environment === 'miniprogram') return true;
  } catch (_) {}
  try {
    if (typeof wx === 'undefined' || !wx || !wx.miniProgram) return false;
    if (typeof wx.miniProgram.navigateTo === 'function') return true;
    return false;
  } catch (_) { return false; }
}

function goMiniProgramPay() {
  try {
    const mp = wx && wx.miniProgram;
    if (!mp || typeof mp.navigateTo !== 'function') return false;
    mp.navigateTo({
      url: '/pages/pay/pay',
      fail: () => {
        try { if (mp.redirectTo) mp.redirectTo({ url: '/pages/pay/pay' }); } catch (_) {}
      }
    });
    return true;
  } catch (_) { return false; }
}
// Only permit a same-origin relative path, never a protocol-relative redirect.
const requestedReturn=new URLSearchParams(location.search).get('returnTo');
let returnPath='/plans/';
if(requestedReturn?.startsWith('/')&&!requestedReturn.startsWith('//')&&!requestedReturn.includes('\\')) {
  const resolved=new URL(requestedReturn,location.origin);
  if(resolved.origin===location.origin&&!resolved.pathname.startsWith('/unlock/'))returnPath=resolved.pathname+resolved.search+resolved.hash;
}

function deviceId() {
  let value = localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
}

function toast(message) {
  const element = $('#accessToast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 3500);
}

function showEntitledState(serial) {
  const panel = $('#serialEntitledPanel');
  if (!serial || !panel) return;
  const remaining = Math.max(0, Number(serial.remainingDevices || 0));
  const used = Number(serial.deviceCount || 0);
  const maximum = Number(serial.maxDevices || 2);
  $('#serialDeviceStatus').textContent = `此序列号已绑定 ${used}/${maximum} 台设备，还可绑定 ${remaining} 台设备。`;
  panel.hidden = false;
  $('#serialForm').hidden = true;
  $('.access-step').hidden = true;
  $('#serialStatus').textContent = '完整功能已解锁。若在另一台设备使用同一序列号，剩余绑定次数会同步更新。';
  const enter=panel.querySelector('a');if(enter){enter.href=returnPath;enter.textContent='返回原任务，继续使用';}
}

// 持久化小程序环境标记，避免 URL 跳转后丢失
if (isInMiniProgram()) {
  try { localStorage.setItem('zk_inmini', '1'); } catch (_) {}
}

function setHero(title, subtitle) {
  const h1 = document.querySelector('.serial-hero h1');
  const p = document.querySelector('.serial-hero p');
  if (h1) h1.textContent = title;
  if (p) p.textContent = subtitle;
}

function applyEntitledState(serial) {
  if (serial) showEntitledState(serial);
  $('#miniPayEntry')?.setAttribute('hidden', '');
  $('#browserDemoEntry')?.setAttribute('hidden', '');
  $('#serialEntry')?.setAttribute('hidden', '');
  $('#serialForm')?.setAttribute('hidden', '');
  document.querySelectorAll('.serial-hero .access-step, #serialEntry .access-step').forEach(el => el.hidden = true);
  setHero('当前设备已解锁', '完整功能已可用，点击下方按钮返回继续使用。');
}

function applyMiniPayState() {
  $('#miniPayEntry')?.removeAttribute('hidden');
  $('#serialEntry')?.setAttribute('hidden', '');
  $('#browserDemoEntry')?.setAttribute('hidden', '');
  setHero('开通会员，解锁完整功能', '支付 ¥9.9 即可解锁方向版、目标校版、求证版的完整生成与评分功能。');
}

function applySerialState() {
  $('#serialEntry')?.removeAttribute('hidden');
  $('#miniPayEntry')?.setAttribute('hidden', '');
  $('#browserDemoEntry')?.setAttribute('hidden', '');
  // 默认标题已在 HTML 中写好，无需覆盖
}

async function initUnlock() {
  let session = null;
  let config = null;
  try {
    const [sessionRes, configRes] = await Promise.all([
      fetch('/api/access/session', { credentials: 'include' }),
      fetch('/api/access/config', { credentials: 'include' })
    ]);
    if (sessionRes.ok) session = await readAccessJSON(sessionRes);
    if (configRes.ok) config = await configRes.json().catch(() => null);
  } catch {
    // 服务不可用，保留默认序列号入口
  }

  const mini = isInMiniProgram();

  // 已解锁：隐藏所有开通/序列号入口，只显示已解锁面板
  if (session && (session.entitled || validSerialSession(session))) {
    applyEntitledState(session.serial);
    return;
  }

  if (mini) {
    // 未解锁 + 小程序内：只保留 9.9 原生支付入口
    applyMiniPayState();
    const miniPayBtn = $('#miniPayBtn');
    if (miniPayBtn) {
      miniPayBtn.addEventListener('click', () => {
        if (!goMiniProgramPay()) {
          toast('跳转支付失败，请返回小程序首页进入“我的”再试');
        }
      });
    }
    return;
  }

  // 未解锁 + 非小程序：保留序列号入口；仅当后端明确开启演示开关（demoEnabled）时显示模拟支付演示入口。
  // P0-1：不再以 accessMode==='enforce' 推断演示入口；正式环境 demoEnabled 必须为 false，杜绝公网伪支付演示。
  applySerialState();
  if (config && config.demoEnabled === true) {
    const demo = $('#browserDemoEntry');
    if (demo) demo.hidden = false;
    const btn = $('#browserDemoBtn');
    if (btn) btn.addEventListener('click', doBrowserDemo);
    setHero('本地演示 · 模拟支付', '当前为本地浏览器预览，点击下方按钮模拟支付并开通会员。');
  }
}

async function doBrowserDemo() {
  const btn = $('#browserDemoBtn');
  if (btn) { btn.disabled = true; btn.textContent = '正在开通…'; }
  try {
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'local-demo', product: 'zk-vip' })
    });
    const loginData = await login.json().catch(() => ({}));
    const token = loginData.token;
    if (!token) throw new Error('login failed');
    // 登录时已 set-cookie（同源浏览器会话）；此处显式带 bearer，确保 mock-pay 认到用户
    await fetch('/api/pay/mock-pay', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: '{}'
    });
    toast('已模拟支付并开通会员，正在返回原页面…');
    setTimeout(() => { window.location.href = returnPath; }, 700);
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = '模拟支付并开通'; }
    toast('演示开通失败，请确认本地 mock 服务（server/mock.js）正在 8080 运行');
  }
}

$('#serialForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const serial = $('#serialCode').value.trim().replace(/\s+/g, '');
  if (!serial) return toast('请先粘贴完整序列号。');
  $('#serialCode').value = serial.toUpperCase();
  const button = $('#serialForm button[type="submit"]');
  button.disabled = true;
  $('#serialStatus').textContent = '正在验证序列号并绑定当前设备…';
  try {
    const response = await fetch('/api/access/serial/redeem', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: serial, deviceId: deviceId() })
    });
    const payload = await readAccessJSON(response);
    if (!response.ok) {
      $('#serialStatus').textContent = payload.error || '序列号暂时无法验证，请稍后重试。';
      return toast(payload.error || '验证未通过。');
    }
    if(!validRedemption(payload))throw new Error('验证服务没有确认使用权');
    const sessionResponse=await fetch('/api/access/session',{credentials:'include',cache:'no-store',signal:AbortSignal.timeout(10000)});
    const session=await readAccessJSON(sessionResponse);
    if(!sessionResponse.ok||!validSerialSession(session)){
      $('#serialStatus').textContent='序列号已验证，但当前浏览器会话未生效。请允许本站Cookie后，用同一序列号重试；同一设备重试不会新增绑定。';
      return toast('会话未生效，尚未解锁。');
    }
    showEntitledState(session.serial);
    await window.ZhongkaoAccess?.resolve();
    toast('已解锁，可直接进入志愿助手。');
  } catch {
    $('#serialStatus').textContent = '无法取得有效的服务端验证结果，尚未解锁。请检查验证服务连接后重试。';
    toast('无法连接验证服务。');
  } finally {
    button.disabled = false;
  }
});

initUnlock();
