// server/mock.js
// 本地预览用的「伪支付」后端：既 serve 静态 H5，又假实现微信支付 v3 的各 API，
// 让小程序可在开发者工具里走通「登录 → 下单 → 支付 → 开通 → 打码解除」完整闭环，
// 无需真实商户号 / 证书 / 后端部署。仅用于本地预览，禁止用于生产环境。
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // 项目根 E:/pinmoo/guangzhou-zhongkao
// P0-1：仅绑定回环地址，默认 8801，绝不暴露到公网。nginx 不得代理此端口。
const PORT = Number(process.env.PORT) || 8801;
const BIND = process.env.MOCK_BIND || '127.0.0.1';
// 若设置了 MOCK_KEY，伪支付与本地演示登录必须携带 x-mock-key 头，进一步防止误用。
const MOCK_KEY = process.env.MOCK_KEY || '';
const VIP_EXPIRE_MS = 5 * 365 * 24 * 3600 * 1000; // 会员有效期：5 年

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.wasm': 'application/wasm', '.woff2': 'font/woff2',
  '.map': 'application/json', '.txt': 'text/plain; charset=utf-8'
};

// ---- 内存用户态（单进程，重启即清空）----
const users = new Map();        // token -> { openid, entitled, vipExpireAt, orderNo }
const openidIndex = new Map();  // openid -> token
function genToken() {
  return 'mock_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function getUser(token) { return users.get(token) || null; }

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(body);
}
function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
  });
}
function bearer(req) {
  const h = req.headers['authorization'] || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : '';
}

// P0-1：伪支付/本地演示授权检查。MOCK_KEY 未设置时仅允许回环地址；设置后还需匹配请求头。
function mockAllowed(req) {
  const isLocal = (req.socket.remoteAddress === '127.0.0.1' || req.socket.remoteAddress === '::1' || req.socket.remoteAddress === '::ffff:127.0.0.1');
  if (!MOCK_KEY) return isLocal;
  return isLocal && (req.headers['x-mock-key'] || '') === MOCK_KEY;
}

// ---- API ----
async function handleApi(req, res, pathname) {
  if (req.method === 'OPTIONS') return sendJSON(res, 204, {});
  const token = bearer(req);
  const body = ['POST', 'PUT'].includes(req.method) ? await readBody(req) : {};
  const url = new URL(req.url, 'http://localhost');

  // 登录（wx.login code 换 token）
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    if (!mockAllowed(req)) return sendJSON(res, 403, { message: '本地演示服务未授权' });
    const openid = 'mock_openid_' + (body.code || 'x');
    const t = genToken();
    const user = { openid, entitled: false, vipExpireAt: null, orderNo: null };
    users.set(t, user);
    openidIndex.set(openid, t);
    // 同时下发 cookie，让「纯浏览器（非小程序）」演示也能维持会话（小程序端优先用 URL token，cookie 仅冗余兜底）
    res.setHeader('Set-Cookie', `zk_token=${t}; Path=/; Max-Age=2592000; SameSite=Lax`);
    return sendJSON(res, 200, { token: t, openid, entitled: false, vipExpireAt: null, orderNo: null });
  }

  // 下单
  if (pathname === '/api/pay/create' && req.method === 'POST') {
    const u = getUser(token);
    if (!u) return sendJSON(res, 401, { message: '未登录' });
    const orderNo = 'MOCK' + Date.now() + Math.floor(Math.random() * 1000);
    u.orderNo = orderNo;
    return sendJSON(res, 200, {
      orderNo,
      prepayId: 'mock_prepay_' + orderNo,
      payParams: { timeStamp: String(Date.now()), nonceStr: 'mock', package: 'prepay_id=mock', signType: 'RSA', paySign: 'mock' }
    });
  }

  // 伪支付完成（等同微信支付回调，直接开通会员）
  if (pathname === '/api/pay/mock-pay' && req.method === 'POST') {
    if (!mockAllowed(req)) return sendJSON(res, 403, { message: '本地演示服务未授权' });
    const cookieToken = (req.headers.cookie || '').match(/zk_token=([^;\s]+)/);
    const tk = token || (cookieToken && cookieToken[1]);
    const u = getUser(tk);
    if (!u) return sendJSON(res, 401, { message: '未登录' });
    u.entitled = true;
    u.vipExpireAt = Date.now() + VIP_EXPIRE_MS;
    if (!u.orderNo) u.orderNo = 'MOCK' + Date.now();
    return sendJSON(res, 200, { ok: true, orderNo: u.orderNo });
  }

  // 激活
  if (pathname === '/api/membership/activate' && req.method === 'POST') {
    const u = getUser(token);
    if (!u) return sendJSON(res, 401, { message: '未登录' });
    u.entitled = true;
    u.vipExpireAt = Date.now() + VIP_EXPIRE_MS;
    return sendJSON(res, 200, {
      user: { openid: u.openid, token, entitled: true, vipExpireAt: u.vipExpireAt, orderNo: u.orderNo }
    });
  }

  // 会员状态
  if (pathname === '/api/membership/status' && req.method === 'GET') {
    const openid = url.searchParams.get('openid');
    const t = openid ? openidIndex.get(openid) : null;
    const u = t ? users.get(t) : null;
    if (!u) return sendJSON(res, 200, { user: null });
    return sendJSON(res, 200, {
      user: { openid: u.openid, token: t, entitled: u.entitled, vipExpireAt: u.vipExpireAt, orderNo: u.orderNo }
    });
  }

  // 闸门配置（enforce = 启用付费打码）
  if (pathname === '/api/access/config' && req.method === 'GET') {
    return sendJSON(res, 200, { accessMode: 'enforce' });
  }

  // 会话校验（H5 access-gate 用 token 查权益）
  if (pathname === '/api/access/session' && req.method === 'GET') {
    const cookieToken = (req.headers.cookie || '').match(/zk_token=([^;\s]+)/);
    const tk = url.searchParams.get('token') || token || (cookieToken && cookieToken[1]);
    const u = getUser(tk);
    if (!u) return sendJSON(res, 200, { authenticated: false, entitled: false });
    return sendJSON(res, 200, { authenticated: true, entitled: !!u.entitled, vipExpireAt: u.vipExpireAt });
  }

  return sendJSON(res, 404, { message: 'not found' });
}

// ---- 静态文件 ----
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(ROOT, rel);
  if (!filePath.startsWith(ROOT)) return send404(res); // 防目录穿越
  let target = filePath;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return send404(res);
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
}

const server = http.createServer((req, res) => {
  const pathname = (req.url.split('?')[0]) || '/';
  if (pathname.startsWith('/api/')) {
    Promise.resolve(handleApi(req, res, pathname)).catch((err) => {
      console.error('[mock] api error', err);
      if (!res.headersSent) sendJSON(res, 500, { message: 'mock server error' });
    });
  } else {
    serveStatic(req, res, pathname);
  }
});

server.listen(PORT, BIND, () => {
  console.log('[mock] serving ' + ROOT + ' on http://' + BIND + ':' + PORT + ' (pseudo-pay mode, NOT for production)');
});
