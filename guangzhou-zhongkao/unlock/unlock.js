const $ = (selector) => document.querySelector(selector);
const DEVICE_KEY = 'zk_serial_device_id';

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
}

async function restoreEntitledState() {
  try {
    const response = await fetch('/api/access/session', { credentials: 'include' });
    if (!response.ok) return;
    const session = await response.json();
    if (session.entitled && session.accessSource === 'serial') showEntitledState(session.serial);
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
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      $('#serialStatus').textContent = payload.error || '序列号暂时无法验证，请稍后重试。';
      return toast(payload.error || '验证未通过。');
    }
    $('#serialStatus').textContent = `验证成功：当前序列号已绑定 ${payload.deviceCount}/${payload.maxDevices} 台设备，完整功能已解锁。`;
    showEntitledState({
      deviceCount: payload.deviceCount,
      maxDevices: payload.maxDevices,
      remainingDevices: payload.maxDevices - payload.deviceCount
    });
    await window.ZhongkaoAccess?.resolve();
    toast('已解锁，可直接进入志愿助手。');
  } catch {
    $('#serialStatus').textContent = '验证服务暂不可用，请检查是否已通过中考服务端访问本站。';
    toast('无法连接验证服务。');
  } finally {
    button.disabled = false;
  }
});

restoreEntitledState();
