// server/src/routes/access.js
// GET /api/access/config                 -> { accessMode, priceFen, productName, demoEnabled }
// GET /api/access/exchange?code=         -> 消费一次性码 + 建立网页会话（Set-Cookie），随后应清理 URL
// GET /api/access/session                -> 查询当前会话权益（网页会话 / 令牌 / 旧序列号）
// POST /api/access/logout                -> 退出：撤销网页会话
//
// 统一权益入口（P0-4 / R2）：
//   1) H5 网页会话 Cookie（一次性码交换后建立，服务端持有）
//   2) 一次性会话码（兼容旧调用路径：消费并立即建立网页会话）
//   3) 长期令牌（小程序内已登录）
//   4) 旧序列号 Cookie（服务端代理 8787）
const cfg = require('../config.js');
const store = require('../store.js');
const serialClient = require('../serialClient.js');

function config(req, res) {
  // P0-1：演示开关不再用 accessMode 推断，单独由 config.demoEnabled 控制（正式环境 false）。
  res.json({
    accessMode: 'enforce',
    priceFen: cfg.priceFen,
    productName: cfg.productName,
    demoEnabled: !!cfg.demoEnabled
  });
}

function parseCookie(header, name) {
  if (!header) return '';
  const hit = String(header).split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
}

// R2：网页会话 Cookie。Secure + HttpOnly + SameSite=Lax + Path=/ 。
function setWebSessionCookie(res, sid) {
  const ttl = Math.floor((cfg.webSessionTTLDays || 30) * 86400);
  const parts = [
    `${store.WEB_SESSION_COOKIE}=${sid}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${ttl}`
  ];
  if (cfg.cookieSecure) parts.push('Secure');
  // 用 setHeader 直接写完整属性串，express 与测试桩都可用。
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearWebSessionCookie(res) {
  const parts = [`${store.WEB_SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (cfg.cookieSecure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

// R2：一次性码 -> 网页会话。授权全程在服务端完成，浏览器只持有一个随机会话标识。
function exchange(req, res) {
  const code = (req.query && req.query.code) || (req.body && req.body.code);
  if (!code) return res.status(400).json({ authenticated: false, entitled: false, message: '缺少 code' });

  const openid = store.consumeSessionCode(code);
  if (!openid) {
    // 已消费 / 过期 / 不存在：分享出去的旧链接不能复制身份。
    return res.status(401).json({ authenticated: false, entitled: false, message: '会话码无效或已使用' });
  }

  const sid = store.issueWebSession(openid);
  setWebSessionCookie(res, sid);
  store.appendEvent('web_session_exchanged', { openid });
  // accessSource 为规范字段（前端 validation.js 据此判定）；source 保留为兼容别名。
  return res.json({ authenticated: true, entitled: store.isEntitled(openid), accessSource: 'membership', source: 'membership' });
}

// 网页会话 -> 用户。会话存在且对应令牌仍有效（撤销/退出即时生效）。
function userFromWebSession(req) {
  const sid = parseCookie(req.headers.cookie, store.WEB_SESSION_COOKIE);
  if (!sid) return null;
  const rec = store.getWebSession(sid);
  if (!rec) return null;
  const u = store.getUser(rec.openid);
  if (!u) return null;
  if (!store.isTokenValid(u.token)) return null; // 令牌被撤销或过期 -> 会话失效，需重新登录
  return u;
}

async function session(req, res) {
  const q = req.query || {};

  // 兼容：仍带一次性码时直接走交换（消费 + 建会话），保证刷新前也能落地会话。
  if (q.code) return exchange(req, res);

  // 1) H5 网页会话（刷新 / 跳页 / 返回 都靠它保持权益）
  const webUser = userFromWebSession(req);
  if (webUser) {
    return res.json({
      authenticated: true,
      entitled: store.isEntitled(webUser.openid),
      accessSource: 'membership',
      source: 'membership',
      sessionKind: 'web'
    });
  }

  // 2) 长期令牌（小程序内已登录）：身份仅由令牌确定。
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = q.token || bearer;
  if (token && store.isTokenValid(token)) {
    const u = store.findByToken(token);
    if (u) {
      return res.json({
        authenticated: true,
        entitled: store.isEntitled(u.openid),
        accessSource: 'membership',
        source: 'membership',
        sessionKind: 'token'
      });
    }
  }

  // 3) 旧序列号：浏览器/ web-view 携带 8787 写入的序列号会话 Cookie，服务端代理查询。
  const cookie = req.headers.cookie;
  if (cookie) {
    const serial = await serialClient.checkSerialSession(cookie);
    if (serial.entitled) {
      // 前端 validation.js 校验要求 accessSource==='serial' 且 serial.{deviceCount,maxDevices}
      return res.json({
        authenticated: true,
        entitled: true,
        accessSource: 'serial',
        source: 'serial',
        sessionKind: 'serial',
        serial: serial.serial
      });
    }
  }

  return res.json({ authenticated: false, entitled: false });
}

function logout(req, res) {
  const sid = parseCookie(req.headers.cookie, store.WEB_SESSION_COOKIE);
  if (sid) store.revokeWebSession(sid);
  clearWebSessionCookie(res);
  res.json({ ok: true });
}

module.exports = { config, session, exchange, logout };
