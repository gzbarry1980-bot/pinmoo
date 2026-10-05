import {readAccessJSON,validRedemption,validSerialSession} from './validation.js';
const $ = (selector) => document.querySelector(selector);
const DEVICE_KEY = 'zk_serial_device_id';
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

async function restoreEntitledState() {
  try {
    const response = await fetch('/api/access/session', { credentials: 'include' });
    if (!response.ok) return;
    const session = await readAccessJSON(response);
    if (validSerialSession(session)) showEntitledState(session.serial);
  } catch {
    // 服务不可用时保留输入序列号入口。
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

restoreEntitledState();
