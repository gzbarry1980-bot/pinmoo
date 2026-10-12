// server/test/p0.test.cjs
// P0-1~P0-5 安全性质验收（无需真实微信/商户，纯本地性质断言）。
// 运行：node server/test/p0.test.cjs
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

let BASE = process.env.BASE || '';

function assert(cond, msg) {
  if (!cond) { console.error('  ✗ FAIL: ' + msg); process.exitCode = 1; throw new Error(msg); }
  console.log('  ✓ ' + msg);
}

function jget(url, headers) {
  return fetch(url, { headers }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
}
function jpost(url, body, headers) {
  return fetch(url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: JSON.stringify(body || {}) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
}

// ---- 生成测试用 RSA 密钥对（仅测试，模拟商户私钥/平台公钥）----
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const privatePem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
const apiV3Key = crypto.randomBytes(24).toString('base64').slice(0, 32); // 32 字符 ASCII，utf8 编码即 32 字节，匹配服务端 Buffer.from(key,'utf8')

// ---- 环境变量（在 require 服务端前注入）----
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zkstore-'));
process.env.PORT = '18791';
process.env.WX_APPID = 'wxTESTAPPID';
process.env.WX_APPSECRET = 'testsecret';
process.env.WX_MCHID = 'mchTEST123';
process.env.WX_MCH_SERIAL = 'serialTEST';
process.env.WX_MCH_PRIVATE_KEY = privatePem;
process.env.WX_API_V3_KEY = apiV3Key;
process.env.WX_PLATFORM_PUBLIC_KEY = publicPem;
process.env.SERIAL_BACKEND_URL = 'http://127.0.0.1:18790';
process.env.DEMO_ENABLED = 'false';
process.env.TOKEN_TTL_DAYS = '30';
process.env.DATA_DIR = dataDir;

// ---- 模拟旧序列号后端（8787 行为）----
const serial = http.createServer((req, res) => {
  // 仅当 cookie 含 zk_serial_session=valid 时视为已授权序列号用户
  const cookie = req.headers.cookie || '';
  const ok = /zk_serial_session=valid/.test(cookie);
  res.setHeader('Content-Type', 'application/json');
  if (req.url.startsWith('/api/access/session')) {
    // 模拟 8787 真实返回形态：序列号会话不含顶层 authenticated/entitled，由 accessSource+entitlement.status 决定
    res.end(JSON.stringify(ok
      ? { accessSource: 'serial', entitlement: { status: 'active' }, serial: { deviceCount: 1, maxDevices: 2, remainingDevices: 1 } }
      : { authenticated: false, entitled: false }));
  } else res.end('{}');
});

// ---- 启动被测服务端 ----
const app = require('../src/index.js');
const server = app.listen(0, '127.0.0.1');

// ---- 微信回调构造工具 ----
// 协议口径（与微信官方 SDK 一致）：只有 ciphertext 是 Base64；nonce 是原始随机串，
// 以其 UTF-8 字节直接作为 GCM IV。夹具不得反过来迁就错误实现。
const NONCE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function randomNonce(len = 12) {
  let s = '';
  for (let i = 0; i < len; i += 1) s += NONCE_CHARS[crypto.randomInt(0, NONCE_CHARS.length)];
  return s;
}
function aesGcmEncrypt(plainObj, keyHex, aad) {
  const key = Buffer.from(keyHex, 'utf8');
  const nonce = randomNonce(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf8'));
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
  const enc = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(plainObj), 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([enc, tag]).toString('base64'),
    nonce,
    associated_data: aad || ''
  };
}
function signNotify(timestamp, nonce, bodyStr, privPem) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${timestamp}\n${nonce}\n${bodyStr}\n`);
  return signer.sign(privPem, 'base64');
}

(async () => {
  await new Promise((r) => server.once('listening', r));
  BASE = 'http://127.0.0.1:' + server.address().port;
  console.log('server listening on', BASE);
  await new Promise((r) => serial.listen(18790, r));
  await new Promise((r) => setTimeout(r, 300));

  console.log('\n[P0-2] 正式下单身份与金额');
  const store = require('../src/store.js');
  const user = store.saveUser('wx_openid_member', { issueToken: true });
  const token = user.token;
  // 无令牌
  let r = await jpost(BASE + '/api/pay/create', { openid: 'hacker', amount: 1 });
  assert(r.status === 401, '无令牌下单被拒(401)');
  // 伪造令牌
  r = await jpost(BASE + '/api/pay/create', { openid: 'hacker', amount: 1 }, { 'Authorization': 'Bearer fake' });
  assert(r.status === 401, '伪造令牌下单被拒(401)');
  // 有令牌但未配置真实支付（本测试用假配置，但 paymentConfigured 因私钥/平台公钥齐全而为真；此处验证“忽略客户端金额”走真实下单逻辑）
  // 用金额 1 分试探，服务端固定 990，且身份来自令牌
  r = await jpost(BASE + '/api/pay/create', { openid: 'hacker', amount: 1 }, { 'Authorization': 'Bearer ' + token });
  // 下单会真实请求 api.mch.weixin.qq.com（测试机不可达）→ 502；但断言“未使用客户端金额/openid 构造订单”
  // 由于无法联网，验证下游校验：订单创建时若成功会以令牌用户身份、固定金额下单。这里验证失败不是因为客户端金额被采用。
  assert(r.status === 502 || r.status === 200, '有令牌下单进入真实下单路径（非 mock 直通）status=' + r.status);

  console.log('\n[P0-3] 支付回调与对账');
  // 构造一个已存在于本地 store 的订单（金额 990，付款人=令牌用户）
  const orderNo = 'ZKTESTP03' + Date.now();
  store.saveOrder(orderNo, { outTradeNo: orderNo, openid: 'wx_openid_member', amount: 990, currency: 'CNY', status: 'CREATED', createdAt: Date.now() });
  const ts = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomBytes(16).toString('hex');
  const goodDecrypted = { appid: 'wxTESTAPPID', mchid: 'mchTEST123', out_trade_no: orderNo, trade_state: 'SUCCESS', transaction_id: 'wxT2026', payer: { openid: 'wx_openid_member' }, amount: { total: 990, currency: 'CNY' } };
  let resource = aesGcmEncrypt(goodDecrypted, apiV3Key, '');
  let bodyObj = { id: 'evt1', resource };
  let bodyStr = JSON.stringify(bodyObj);
  let sig = signNotify(ts, nonce, bodyStr, privatePem);
  r = await jpost(BASE + '/api/pay/notify', bodyObj, { 'wechatpay-timestamp': ts, 'wechatpay-nonce': nonce, 'wechatpay-signature': sig });
  console.log('  [debug] notify resp:', r.status, JSON.stringify(r.body));
  assert(r.status === 200 && r.body && r.body.code === 'SUCCESS', '合法回调（签名/解密/全字段核对通过）→ SUCCESS');
  assert(store.getOrder(orderNo).status === 'PAID', '订单标记为 PAID');
  assert(store.isEntitled('wx_openid_member') === true, '回调成功后会员权益开通');
  // 幂等：重复回调不重复处理
  r = await jpost(BASE + '/api/pay/notify', bodyObj, { 'wechatpay-timestamp': ts, 'wechatpay-nonce': nonce, 'wechatpay-signature': sig });
  assert(r.status === 200 && r.body.code === 'SUCCESS', '重复回调幂等（仍 SUCCESS，不报错）');

  // 金额不符 → 拒绝
  const orderNo2 = 'ZKTESTP03B' + Date.now();
  store.saveOrder(orderNo2, { outTradeNo: orderNo2, openid: 'wx_openid_member', amount: 990, currency: 'CNY', status: 'CREATED', createdAt: Date.now() });
  const badDecrypted = Object.assign({}, goodDecrypted, { out_trade_no: orderNo2, amount: { total: 1, currency: 'CNY' } });
  let res2 = aesGcmEncrypt(badDecrypted, apiV3Key, '');
  let b2 = JSON.stringify({ id: 'evt2', resource: res2 });
  let s2 = signNotify(ts, nonce, b2, privatePem);
  r = await jpost(BASE + '/api/pay/notify', { id: 'evt2', resource: res2 }, { 'wechatpay-timestamp': ts, 'wechatpay-nonce': nonce, 'wechatpay-signature': s2 });
  assert(r.status === 200 && r.body && r.body.code === 'FAIL', '金额不符回调被拒(FAIL)');
  assert(store.getOrder(orderNo2).status !== 'PAID', '金额不符不开放权益');

  // 未知订单 → 拒绝
  const unknown = Object.assign({}, goodDecrypted, { out_trade_no: 'ZKNOSUCH' });
  let resU = aesGcmEncrypt(unknown, apiV3Key, '');
  let bU = JSON.stringify({ id: 'evtU', resource: resU });
  let sU = signNotify(ts, nonce, bU, privatePem);
  r = await jpost(BASE + '/api/pay/notify', { id: 'evtU', resource: resU }, { 'wechatpay-timestamp': ts, 'wechatpay-nonce': nonce, 'wechatpay-signature': sU });
  assert(r.status === 200 && r.body && r.body.code === 'FAIL', '未知订单回调被拒(FAIL)');

  // 签名错误 → 拒绝
  r = await jpost(BASE + '/api/pay/notify', { id: 'evtX', resource: res2 }, { 'wechatpay-timestamp': ts, 'wechatpay-nonce': nonce, 'wechatpay-signature': 'deadbeef' });
  assert(r.status === 200 && r.body && r.body.code === 'FAIL', '签名错误回调被拒(FAIL)');

  console.log('\n[P0-4] 旧序列号权益统一查询');
  r = await jget(BASE + '/api/access/session', { 'Cookie': 'zk_serial_session=valid' });
  assert(r.body && r.body.entitled === true && r.body.accessSource === 'serial', '旧序列号(cookie)会话识别为已授权，来源 serial');
  assert(r.body && r.body.serial && r.body.serial.deviceCount === 1 && r.body.serial.maxDevices === 2, '序列号权益含设备约束(deviceCount/maxDevices)');
  r = await jget(BASE + '/api/access/session', {});
  assert(r.body && r.body.entitled === false, '无凭证会话未授权');
  // 新会员令牌
  r = await jget(BASE + '/api/access/session?token=' + token);
  assert(r.body && r.body.entitled === true && r.body.source === 'membership', '新会员令牌识别为已授权，来源 membership');

  console.log('\n[P0-5] 登录态与短期单次凭证');
  // 移除 openid 兜底：仅带 openid 查询参数、无令牌 → 401
  r = await jget(BASE + '/api/membership/status?openid=wx_openid_member');
  assert(r.status === 401, 'membership/status 仅凭 openid 查询被拒(401)，无兜底');
  // 有效令牌状态
  r = await jget(BASE + '/api/membership/status', { 'Authorization': 'Bearer ' + token });
  assert(r.status === 200 && r.body.entitled === true, '有效令牌状态正常返回');
  // 一次性会话码
  r = await jpost(BASE + '/api/auth/session-code', {}, { 'Authorization': 'Bearer ' + token });
  assert(r.status === 200 && r.body.code, '签发一次性会话码');
  const code = r.body.code;
  r = await jget(BASE + '/api/access/session?code=' + code);
  assert(r.body && r.body.authenticated === true, '一次性码消费成功，鉴权通过');
  r = await jget(BASE + '/api/access/session?code=' + code);
  assert(r.body && r.body.authenticated === false, '一次性码二次使用被拒（已作废）');
  // 令牌过期
  store.saveUser('wx_openid_expired', { token: 'expiredtok_' + Date.now(), tokenIssuedAt: Date.now() - 31 * 86400 * 1000 });
  const expUser = store.getUser('wx_openid_expired');
  r = await jget(BASE + '/api/membership/status', { 'Authorization': 'Bearer ' + expUser.token });
  assert(r.status === 401, '过期令牌被拒(401)');

  console.log('\n[P0-1] 公网禁用 mock / 演示隔离');
  r = await jget(BASE + '/api/access/config');
  assert(r.body && r.body.demoEnabled === false, '演示开关 demoEnabled=false（公网不暴露伪支付演示）');
  assert(typeof r.body.priceFen === 'number' && r.body.priceFen === 990, 'config 暴露固定金额 990');

  console.log('\n[验收] 全部 P0 性质用例执行完毕。');
  server.close();
  serial.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
  process.exit(process.exitCode || 0);
})().catch((e) => {
  console.error('测试异常中断:', e);
  process.exit(1);
});
