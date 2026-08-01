import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadConfig } from './config.mjs';
import { openDatabase } from './db.mjs';
import { clientIp, hmac, normalizeDeviceId, normalizePhone, normalizeSerialCode, parseCookies, randomCode, randomSerialCode, randomToken, serialSessionCookie, sessionCookie } from './security.mjs';

const config = loadConfig();
const db = openDatabase(config.dbPath);
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8']
]);

function setBaseHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Cache-Control', 'no-store');
}

function setCors(request, response) {
  const origin = request.headers.origin;
  if (origin && config.allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Vary', 'Origin');
  }
}

function json(response, status, body) {
  setBaseHeaders(response);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function empty(response, status, headers = {}) {
  setBaseHeaders(response);
  response.writeHead(status, headers);
  response.end();
}

async function readJson(request, maxBytes = 16_384) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('请求内容过大'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('请求格式不正确'), { status: 400 });
  }
}

function assertOrigin(request) {
  const origin = request.headers.origin;
  if (!origin || !config.allowedOrigins.has(origin)) {
    throw Object.assign(new Error('请求来源校验失败'), { status: 403 });
  }
}

function requestIdentity(request) {
  const ip = clientIp(request, config);
  return { ipHash: hmac(config.identityPepper, `ip:${ip}`) };
}

function currentSession(request) {
  const token = parseCookies(request.headers.cookie)[config.cookieName];
  if (!token) return null;
  return db.findSession(hmac(config.sessionSecret, `session:${token}`));
}

function currentSerialSession(request) {
  const token = parseCookies(request.headers.cookie)[config.serialCookieName];
  if (!token) return null;
  return db.findSerialSession(hmac(config.sessionSecret, `serial-session:${token}`));
}

function sessionPayload(session) {
  if (!session || session.user_status !== 'active') return { authenticated: false, entitled: false };
  const entitlement = db.activeEntitlement(session.user_id, config.productCode);
  return {
    authenticated: true,
    entitled: Boolean(entitlement),
    user: { phoneLast4: session.phone_last4 },
    entitlement: entitlement ? {
      source: entitlement.source,
      status: entitlement.status,
      startsAt: entitlement.starts_at,
      expiresAt: entitlement.expires_at
    } : null
  };
}

function serialSessionPayload(session) {
  if (!session) return { authenticated: false, entitled: false };
  const deviceCount = Number(session.device_count || 0);
  const maxDevices = Number(session.max_devices || 2);
  return {
    authenticated: true,
    entitled: true,
    accessSource: 'serial',
    entitlement: { source: 'serial', status: 'active', startsAt: session.created_at, expiresAt: session.expires_at },
    serial: { deviceCount, maxDevices, remainingDevices: Math.max(0, maxDevices - deviceCount) }
  };
}

function accessPayload(request) {
  const account = sessionPayload(currentSession(request));
  return account.entitled ? account : serialSessionPayload(currentSerialSession(request));
}

function adminAuthorized(request) {
  const submitted = String(request.headers['x-api-key'] || '');
  const expected = Buffer.from(config.serialAdminApiKey || '');
  const actual = Buffer.from(submitted);
  const apiKeyAccepted = expected.length > 0 && expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  const forwardedUser = String(request.headers['x-serial-manager-user'] || '');
  const remoteAddress = String(request.socket.remoteAddress || '');
  const localProxy = remoteAddress === '127.0.0.1' || remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1';
  const proxyExpected = Buffer.from(config.serialManagerProxyUser || '');
  const proxyActual = Buffer.from(forwardedUser);
  const proxyAccepted = localProxy && proxyExpected.length > 0 && proxyExpected.length === proxyActual.length && crypto.timingSafeEqual(proxyExpected, proxyActual);
  return apiKeyAccepted || proxyAccepted;
}

function requireAdmin(request) {
  if (!config.serialAdminApiKey && !config.serialManagerProxyUser) throw Object.assign(new Error('序列号管理接口尚未配置。'), { status: 503, code: 'SERIAL_ADMIN_NOT_CONFIGURED' });
  if (!adminAuthorized(request)) throw Object.assign(new Error('序列号管理身份验证失败。'), { status: 401, code: 'SERIAL_ADMIN_UNAUTHORIZED' });
}

function serialRecord(record) {
  return {
    code: record.code,
    status: record.status,
    maxDevices: record.max_devices,
    deviceCount: Number(record.device_count || 0),
    createdAt: record.created_at,
    invalidatedAt: record.invalidated_at || null
  };
}

async function handleApi(request, response, url) {
  setCors(request, response);
  if (request.method === 'OPTIONS') {
    const origin = request.headers.origin;
    if (!origin || !config.allowedOrigins.has(origin)) return empty(response, 403);
    return empty(response, 204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '600'
    });
  }

  if (request.method === 'GET' && url.pathname === '/api/access/health') {
    return json(response, 200, { ok: true, service: 'zhongkao-access', accessMode: config.accessMode });
  }
  if (request.method === 'GET' && url.pathname === '/api/access/config') {
    return json(response, 200, {
      productCode: config.productCode,
      productName: config.productName,
      priceFen: config.priceFen,
      accessMode: config.accessMode,
      otpReady: config.otpProvider !== 'disabled',
      paymentReady: config.paymentProvider !== 'disabled'
    });
  }
  if (request.method === 'GET' && url.pathname === '/api/access/session') {
    return json(response, 200, accessPayload(request));
  }
  if (request.method === 'GET' && url.pathname === '/api/access/auth/check') {
    const payload = accessPayload(request);
    return empty(response, payload.authenticated && payload.entitled ? 204 : 401);
  }

  if (request.method === 'POST') assertOrigin(request);

  if (request.method === 'POST' && url.pathname === '/api/access/auth/request-code') {
    if (config.otpProvider === 'disabled') return json(response, 503, { error: '短信登录尚未配置，请稍后再试。', code: 'OTP_NOT_READY' });
    const body = await readJson(request);
    const phone = normalizePhone(body.phone);
    if (!phone) return json(response, 400, { error: '请输入正确的中国大陆手机号。', code: 'INVALID_PHONE' });
    const phoneHash = hmac(config.identityPepper, `phone:${phone}`);
    const { ipHash } = requestIdentity(request);
    const rate = db.otpRate(phoneHash, ipHash);
    if (rate.phone >= 5 || rate.ip >= 20) return json(response, 429, { error: '验证码请求过于频繁，请一小时后再试。', code: 'OTP_RATE_LIMIT' });
    const code = randomCode();
    const codeHash = hmac(config.sessionSecret, `otp:${phoneHash}:${code}`);
    db.createOtp({ phoneHash, codeHash, ipHash, ttlSeconds: config.otpTtlSeconds });
    db.audit({ action: 'otp_requested', ipHash, detail: { phoneLast4: phone.slice(-4), provider: config.otpProvider } });
    if (config.otpProvider === 'console') console.log(`[otp] phone=***${phone.slice(-4)} code=${code}`);
    return json(response, 200, {
      ok: true,
      expiresIn: config.otpTtlSeconds,
      ...(config.allowDevOtp ? { debugCode: code } : {})
    });
  }

  if (request.method === 'POST' && url.pathname === '/api/access/auth/verify-code') {
    const body = await readJson(request);
    const phone = normalizePhone(body.phone);
    const code = String(body.code || '').trim();
    if (!phone || !/^\d{6}$/.test(code)) return json(response, 400, { error: '手机号或验证码格式不正确。', code: 'INVALID_OTP_INPUT' });
    const phoneHash = hmac(config.identityPepper, `phone:${phone}`);
    const challenge = db.latestOtp(phoneHash);
    if (!challenge || challenge.expires_at <= new Date().toISOString()) return json(response, 400, { error: '验证码已失效，请重新获取。', code: 'OTP_EXPIRED' });
    if (challenge.attempts >= 5) return json(response, 429, { error: '验证码尝试次数过多，请重新获取。', code: 'OTP_ATTEMPTS' });
    db.incrementOtp(challenge.id);
    const submittedHash = hmac(config.sessionSecret, `otp:${phoneHash}:${code}`);
    const correct = crypto.timingSafeEqual(Buffer.from(submittedHash, 'hex'), Buffer.from(challenge.code_hash, 'hex'));
    if (!correct) return json(response, 400, { error: '验证码不正确。', code: 'OTP_MISMATCH' });
    db.consumeOtp(challenge.id);
    const user = db.findOrCreateUser(phoneHash, phone.slice(-4));
    const token = randomToken();
    const tokenHash = hmac(config.sessionSecret, `session:${token}`);
    db.createSession(tokenHash, user.id, config.sessionDays * 86400);
    const { ipHash } = requestIdentity(request);
    db.audit({ userId: user.id, action: 'login_succeeded', ipHash });
    response.setHeader('Set-Cookie', sessionCookie(config, token));
    return json(response, 200, sessionPayload(db.findSession(tokenHash)));
  }

  if (request.method === 'POST' && url.pathname === '/api/access/auth/logout') {
    const token = parseCookies(request.headers.cookie)[config.cookieName];
    if (token) db.revokeSession(hmac(config.sessionSecret, `session:${token}`));
    const serialToken = parseCookies(request.headers.cookie)[config.serialCookieName];
    if (serialToken) db.revokeSerialSession(hmac(config.sessionSecret, `serial-session:${serialToken}`));
    response.setHeader('Set-Cookie', [sessionCookie(config, '', 0), serialSessionCookie(config, '', 0)]);
    return json(response, 200, { ok: true });
  }

  if (request.method === 'POST' && url.pathname === '/api/access/serial/redeem') {
    const body = await readJson(request);
    const code = normalizeSerialCode(body.code);
    const deviceId = normalizeDeviceId(body.deviceId);
    if (!code || !deviceId) return json(response, 400, { error: '序列号或设备识别信息格式不正确。', code: 'INVALID_SERIAL_INPUT' });
    const { ipHash } = requestIdentity(request);
    const binding = db.bindSerialDevice({ code, deviceHash: hmac(config.identityPepper, `serial-device:${deviceId}`) });
    if (!binding.ok) {
      const messages = {
        not_found: ['序列号不存在，请检查后重试。', 'SERIAL_NOT_FOUND'],
        invalid: ['该序列号已作废，请联系品沐获取新的序列号。', 'SERIAL_INVALID'],
        device_limit: ['该序列号已绑定两台设备；第 3 台设备需要使用新的序列号。', 'SERIAL_DEVICE_LIMIT']
      };
      const [error, codeName] = messages[binding.reason] || ['序列号暂时无法使用。', 'SERIAL_REDEEM_FAILED'];
      db.audit({ action: `serial_redeem_${binding.reason}`, ipHash, detail: { deviceCount: binding.deviceCount || 0 } });
      return json(response, binding.reason === 'device_limit' ? 409 : 400, { error, code: codeName, maxDevices: binding.maxDevices || 2, deviceCount: binding.deviceCount || 0 });
    }
    const token = randomToken();
    db.createSerialSession(hmac(config.sessionSecret, `serial-session:${token}`), code, hmac(config.identityPepper, `serial-device:${deviceId}`), config.serialSessionDays * 86400);
    db.audit({ action: binding.reused ? 'serial_redeemed_existing_device' : 'serial_redeemed_new_device', ipHash, detail: { deviceCount: binding.deviceCount, maxDevices: binding.maxDevices } });
    response.setHeader('Set-Cookie', serialSessionCookie(config, token));
    return json(response, 200, { ok: true, entitled: true, deviceCount: binding.deviceCount, maxDevices: binding.maxDevices, expiresInDays: config.serialSessionDays });
  }

  if (request.method === 'POST' && url.pathname === '/api/access/orders') {
    const session = currentSession(request);
    if (!session || session.user_status !== 'active') return json(response, 401, { error: '请先登录。', code: 'LOGIN_REQUIRED' });
    const entitlement = db.activeEntitlement(session.user_id, config.productCode);
    if (entitlement) return json(response, 409, { error: '当前账号已经解锁，无需重复购买。', code: 'ALREADY_ENTITLED' });
    if (config.paymentProvider === 'disabled') return json(response, 503, { error: '微信支付通道尚未配置，当前不会产生扣款。', code: 'PAYMENT_NOT_READY' });
    const order = db.createOrder(session.user_id, config.productCode, config.priceFen, config.paymentProvider);
    return json(response, 201, { order: { id: order.id, amountFen: order.amount_fen, status: order.status } });
  }

  const orderMatch = url.pathname.match(/^\/api\/access\/orders\/([A-Za-z0-9_-]+)$/);
  if (request.method === 'GET' && orderMatch) {
    const session = currentSession(request);
    if (!session) return json(response, 401, { error: '请先登录。', code: 'LOGIN_REQUIRED' });
    const order = db.findOrder(orderMatch[1], session.user_id);
    if (!order) return json(response, 404, { error: '订单不存在。', code: 'ORDER_NOT_FOUND' });
    return json(response, 200, { order: { id: order.id, amountFen: order.amount_fen, status: order.status, createdAt: order.created_at } });
  }

  return json(response, 404, { error: '接口不存在。', code: 'NOT_FOUND' });
}

async function handleSerialAdminApi(request, response, url) {
  setCors(request, response);
  if (request.method === 'OPTIONS') return empty(response, 204, { 'Access-Control-Allow-Headers': 'Content-Type, X-API-Key', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
  requireAdmin(request);
  if (request.method === 'GET' && url.pathname === '/api/serial-keys') return json(response, 200, { records: db.listSerials().map(serialRecord) });
  if (request.method === 'POST' && url.pathname === '/api/serial-keys/generate') {
    assertOrigin(request);
    const body = await readJson(request);
    const count = Number.parseInt(body.count || 1, 10);
    if (!Number.isInteger(count) || count < 1 || count > 100) return json(response, 400, { error: '每次可生成 1 至 100 个序列号。', code: 'INVALID_COUNT' });
    const records = [];
    for (let index = 0; index < count; index += 1) {
      let record;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const code = randomSerialCode();
        try { record = db.createSerial(code); break; } catch (error) { if (!String(error.message).includes('UNIQUE constraint failed')) throw error; }
      }
      if (!record) throw new Error('无法生成唯一序列号，请重试。');
      records.push(serialRecord(record));
    }
    db.audit({ action: 'serial_generated', detail: { count } });
    return json(response, 201, { records });
  }
  const codeMatch = url.pathname.match(/^\/api\/serial-keys\/([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10})(?:\/invalidate)?$/);
  if (codeMatch) {
    const code = codeMatch[1];
    if (request.method === 'GET' && !url.pathname.endsWith('/invalidate')) {
      const record = db.findSerial(code);
      return record ? json(response, 200, { record: serialRecord(record) }) : json(response, 404, { error: '序列号不存在。', code: 'SERIAL_NOT_FOUND' });
    }
    if (request.method === 'POST' && url.pathname.endsWith('/invalidate')) {
      assertOrigin(request);
      if (!db.invalidateSerial(code)) return json(response, 409, { error: '序列号不存在或已作废。', code: 'SERIAL_NOT_ACTIVE' });
      db.audit({ action: 'serial_invalidated', detail: {} });
      return json(response, 200, { ok: true });
    }
  }
  return json(response, 404, { error: '接口不存在。', code: 'NOT_FOUND' });
}

function serveStatic(request, response, url) {
  if (!config.staticDir || !['GET', 'HEAD'].includes(request.method)) return false;
  let decoded;
  try { decoded = decodeURIComponent(url.pathname); } catch { return false; }
  let target = path.resolve(config.staticDir, `.${decoded}`);
  const relativeTarget = path.relative(config.staticDir, target);
  if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) return false;
  let stat;
  try { stat = fs.statSync(target); } catch { stat = null; }
  if (stat?.isDirectory()) target = path.join(target, 'index.html');
  try { stat = fs.statSync(target); } catch { return false; }
  if (!stat.isFile()) return false;
  response.writeHead(200, {
    'Content-Type': contentTypes.get(path.extname(target)) || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': path.extname(target) === '.html' ? 'no-cache' : 'public, max-age=300'
  });
  if (request.method === 'HEAD') return response.end();
  fs.createReadStream(target).pipe(response);
  return true;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', config.publicOrigin);
  try {
    if (url.pathname.startsWith('/api/access/')) return await handleApi(request, response, url);
    if (url.pathname.startsWith('/api/serial-keys')) return await handleSerialAdminApi(request, response, url);
    if (serveStatic(request, response, url)) return;
    return json(response, 404, { error: '页面不存在。', code: 'NOT_FOUND' });
  } catch (error) {
    console.error(error);
    if (!response.headersSent) return json(response, error.status || 500, { error: error.status ? error.message : '服务器暂时无法处理请求。', code: 'SERVER_ERROR' });
    response.end();
  }
});

server.listen(config.port, config.host, () => {
  console.log(`zhongkao-access listening on http://${config.host}:${config.port} mode=${config.accessMode}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { server };
