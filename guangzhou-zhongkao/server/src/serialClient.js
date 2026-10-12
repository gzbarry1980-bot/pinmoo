// server/src/serialClient.js
// 服务端代理旧序列号后端（8787）的唯一通道，用于统一权益查询（P0-4）。
// 旧序列号用户的会话以 cookie 形式保存在 8787，本模块把浏览器带来的 Cookie
// 头原样转发给 8787 的 /api/access/session，取回序列号权益（含两台设备约束）。
// 不在本服务内复刻“两台设备”等业务规则，规则继续由 8787 权威持有。
const http = require('http');
const cfg = require('./config.js');

function get(urlPath, headers) {
  return new Promise((resolve) => {
    const u = new URL(cfg.serialBackendUrl);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: urlPath,
      method: 'GET',
      timeout: 4000,
      headers: Object.assign({ 'Accept': 'application/json' }, headers || {})
    }, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => {
        try { resolve({ status: resp.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: resp.statusCode, body: null }); }
      });
    });
    req.on('error', () => resolve({ status: 0, body: null }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: null }); });
    req.end();
  });
}

// 用浏览器传入的 Cookie 头查询 8787 序列号会话；仅在 8787 可达且返回已授权时视为有效。
// 注意 8787 真实返回形态（见 /opt/zhongkao-access 的 server.mjs）：
//   序列号会话 -> { accessSource:'serial', entitlement:{status:'active'}, serial:{deviceCount,maxDevices,remainingDevices} }
//   顶层不带 authenticated / entitled（由 entitlement.status 决定）。同时兼容旧模拟 {authenticated,entitled}。
async function checkSerialSession(cookieHeader) {
  if (!cookieHeader) return { entitled: false, source: null, serial: null };
  try {
    const r = await get('/api/access/session', { 'Cookie': cookieHeader });
    const b = r.body || {};
    let entitled = false;
    if (b.accessSource === 'serial') {
      entitled = !!(b.entitlement && b.entitlement.status === 'active');
    } else if (b.authenticated === true && b.entitled === true) {
      entitled = true; // 旧模拟形态
    }
    if (r.status === 200 && entitled) {
      return {
        entitled: true,
        source: 'serial',
        serial: b.serial || null
      };
    }
  } catch (e) { /* 8787 不可用时不影响新会员链路 */ }
  return { entitled: false, source: null, serial: null };
}

module.exports = { checkSerialSession };
