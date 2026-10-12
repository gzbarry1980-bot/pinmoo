// 回归：网页刷新 / 跳页 / 分享链接 / 会话过期与撤销 / 退款乱序与重复 /
//       付款中断恢复 / 旧序列号 / 并发下单占位 / 回调解密协议向量。
// 全程离线：系统临时目录、虚构身份与订单、桩化微信与 8787，不访问真实网络或生产数据。
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const cfgPath = require.resolve('../src/config.js');
const cfg = {
  apiV3Key: '01234567890123456789012345678901',
  appid: 'fixture-app',
  mchid: 'fixture-merchant',
  dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'zk-reg-')),
  tokenTTLDays: 30,
  webSessionTTLDays: 30,
  sessionCodeTTLSec: 60,
  priceFen: 990,
  productName: '广州中考志愿模拟会员',
  paymentConfigured: true,
  baseUrl: 'https://zhongkao.pinmooconsulting.com',
  serialBackendUrl: 'http://127.0.0.1:1'
};
require.cache[cfgPath] = { id: cfgPath, filename: cfgPath, loaded: true, exports: cfg };

// 桩化微信商户 API：POST 下单返回 prepay_id，GET 查单返回 SUCCESS。
const https = require('node:https');
let stubOpenid = 'fixture-user';
https.request = (opts, cb) => {
  const query = String(opts.path || '').includes('out-trade-no');
  const payload = query
    ? { trade_state: 'SUCCESS', appid: cfg.appid, mchid: cfg.mchid, transaction_id: 'stub-tx',
        amount: { total: 990, currency: 'CNY' }, payer: { openid: stubOpenid } }
    : { prepay_id: 'stub-prepay-' + crypto.randomBytes(4).toString('hex') };
  const req = { on() { return this; }, write() {}, end() {}, destroy() {}, setTimeout() {} };
  setImmediate(() => {
    cb({
      statusCode: 200,
      on(ev, handler) {
        if (ev === 'data') handler(JSON.stringify(payload));
        if (ev === 'end') handler();
      }
    });
  });
  return req;
};

const wxpay = require('../src/wxpay.js');
wxpay.buildAuthorization = () => 'stub-auth';
wxpay.buildPaySign = () => ({ timeStamp: '1', nonceStr: 'n', package: 'prepay_id=stub', signType: 'RSA', paySign: 's' });

const store = require('../src/store.js');
const access = require('../src/routes/access.js');
const pay = require('../src/routes/pay.js');

function response() {
  return {
    headers: {}, statusCode: 200, body: undefined,
    status(n) { this.statusCode = n; return this; },
    setHeader(k, v) { this.headers[k] = v; },
    json(v) { this.body = v; return this; }
  };
}
function sidOf(res) {
  const raw = res.headers['Set-Cookie'] || '';
  const m = /zk_web_session=([^;]+)/.exec(raw);
  return m ? m[1] : '';
}
function cookieHeader(sid) { return { cookie: 'zk_web_session=' + sid }; }

// ---- 8787 桩：返回真实 8787 的响应形态 ----
function startSerialStub() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const cookie = req.headers.cookie || '';
      if (cookie.includes('zk_serial_session=good')) {
        res.end(JSON.stringify({
          authenticated: true, entitled: true, accessSource: 'serial',
          entitlement: { source: 'serial', status: 'active' },
          serial: { deviceCount: 2, maxDevices: 2, remainingDevices: 0 }
        }));
      } else {
        res.end(JSON.stringify({ authenticated: false, entitled: false }));
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, pass: true }); }
  catch (e) { results.push({ name, pass: false, detail: e.message }); }
}

(async () => {
  const serial = await startSerialStub();
  cfg.serialBackendUrl = 'http://127.0.0.1:' + serial.address().port;

  // ---------- 1. 回调解密协议向量（R1） ----------
  await check('R1 官方格式 raw UTF-8 nonce 可解密（12 字符）', () => {
    const nonce = 'wCq51qZv4Yfg', aad = 'transaction', plain = 'official-format-fixture';
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(cfg.apiV3Key), Buffer.from(nonce, 'utf8'));
    cipher.setAAD(Buffer.from(aad));
    const enc = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]).toString('base64');
    assert.equal(wxpay.decryptResource(enc, nonce, aad), plain);
  });
  await check('R1 非 ASCII associated_data + 长 nonce 同样可解密', () => {
    const nonce = 'a1B2c3D4e5F6g7H8', aad = '退款-refund', plain = JSON.stringify({ out_trade_no: 'ZK1', amount: { total: 990 } });
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(cfg.apiV3Key), Buffer.from(nonce, 'utf8'));
    cipher.setAAD(Buffer.from(aad, 'utf8'));
    const enc = Buffer.concat([cipher.update(Buffer.from(plain, 'utf8')), cipher.final(), cipher.getAuthTag()]).toString('base64');
    assert.equal(wxpay.decryptResource(enc, nonce, aad), plain);
  });

  // ---------- 2. 网页会话：首次打开 / 刷新 / 跳页 ----------
  store.saveUser('u-nav', { entitled: true, issueToken: true });
  const navCode = store.issueSessionCode('u-nav');
  let navSid = '';
  await check('首次打开：交换一次性码并建立网页会话', async () => {
    const r = response();
    await access.session({ query: { code: navCode }, headers: {} }, r);
    assert.equal(r.body.authenticated, true);
    assert.equal(r.body.entitled, true);
    navSid = sidOf(r);
    assert(navSid, '未下发网页会话 Cookie');
    assert(/HttpOnly/.test(r.headers['Set-Cookie']), 'Cookie 缺少 HttpOnly');
    assert(/SameSite=Lax/.test(r.headers['Set-Cookie']), 'Cookie 缺少 SameSite');
  });
  await check('刷新：仅凭会话 Cookie 保持权益（不再需要 code）', async () => {
    const r = response();
    await access.session({ query: {}, headers: cookieHeader(navSid) }, r);
    assert.equal(r.body.authenticated, true);
    assert.equal(r.body.entitled, true);
    assert.equal(r.body.sessionKind, 'web');
  });
  await check('跳页：连续三次导航（首页/学校详情/解锁页）权益不丢', async () => {
    for (const p of ['/', '/schools/detail.html', '/unlock/']) {
      const r = response();
      await access.session({ query: {}, headers: cookieHeader(navSid) }, r);
      assert.equal(r.body.entitled, true, '跳到 ' + p + ' 后权益丢失');
    }
  });

  // ---------- 3. 已消费链接不能复制身份 ----------
  await check('分享已消费链接：二次交换被拒，不复制身份', async () => {
    const r = response();
    await access.session({ query: { code: navCode }, headers: {} }, r);
    assert.equal(r.body.authenticated, false);
    assert.equal(r.statusCode, 401);
    assert.equal(r.headers['Set-Cookie'], undefined, '失败路径不应下发会话 Cookie');
  });

  // ---------- 4. 过期与撤销 ----------
  await check('令牌过期 -> 会话失效；重新登录后同一会话恢复', async () => {
    store.saveUser('u-exp', { entitled: true, issueToken: true });
    const code = store.issueSessionCode('u-exp');
    const r1 = response();
    await access.session({ query: { code }, headers: {} }, r1);
    const sid = sidOf(r1);
    // 让令牌过期
    store.commit((db) => { db.users['u-exp'].tokenIssuedAt = Date.now() - 31 * 86400 * 1000; });
    const r2 = response();
    await access.session({ query: {}, headers: cookieHeader(sid) }, r2);
    assert.equal(r2.body.authenticated, false, '令牌过期后会话仍被接受');
    // 重新登录签发新令牌
    store.saveUser('u-exp', { issueToken: true });
    const r3 = response();
    await access.session({ query: {}, headers: cookieHeader(sid) }, r3);
    assert.equal(r3.body.entitled, true, '重新登录后会话未恢复');
  });
  await check('撤销令牌 -> 已建立的网页会话立即失效', async () => {
    store.saveUser('u-rev', { entitled: true, issueToken: true });
    const code = store.issueSessionCode('u-rev');
    const r1 = response();
    await access.session({ query: { code }, headers: {} }, r1);
    const sid = sidOf(r1);
    store.revokeToken(store.getUser('u-rev').token);
    const r2 = response();
    await access.session({ query: {}, headers: cookieHeader(sid) }, r2);
    assert.equal(r2.body.authenticated, false, '撤销后会话仍有效');
  });
  await check('退出：logout 撤销会话并清除 Cookie', async () => {
    store.saveUser('u-out', { entitled: true, issueToken: true });
    const code = store.issueSessionCode('u-out');
    const r1 = response();
    await access.session({ query: { code }, headers: {} }, r1);
    const sid = sidOf(r1);
    const r2 = response();
    access.logout({ headers: cookieHeader(sid) }, r2);
    assert(/Max-Age=0/.test(r2.headers['Set-Cookie'] || ''), 'logout 未清除 Cookie');
    const r3 = response();
    await access.session({ query: {}, headers: cookieHeader(sid) }, r3);
    assert.equal(r3.body.authenticated, false, '退出后会话仍可用');
  });

  // ---------- 5. 退款乱序 / 重复 / 部分 ----------
  wxpay.verifyNotify = () => true;
  wxpay.decryptResource = (c) => c;
  const invoke = async (fn, payload) => {
    const res = response();
    await fn({ headers: {}, rawBody: JSON.stringify({ resource: { ciphertext: JSON.stringify(payload) } }) }, res);
    return res;
  };
  const refundPayload = (no, refundKey, refund) => ({
    mchid: cfg.mchid, out_trade_no: no, refund_status: 'SUCCESS', out_refund_no: refundKey,
    amount: { total: 990, refund, currency: 'CNY' }
  });

  await check('退款乱序 + 重复投递：累计金额正确，仅在覆盖全额时撤销', async () => {
    const no = 'ord-refund-seq';
    store.saveOrder(no, { outTradeNo: no, openid: 'u-rf', amount: 990, status: 'PAID' });
    store.saveUser('u-rf', { entitled: true, orderNo: no, issueToken: true });

    // 乱序到达：R3(290) -> R1(300) -> R2(400)；随后 R1、R2 重复投递
    const seq = [['R3', 290], ['R1', 300], ['R2', 400], ['R1', 300], ['R2', 400]];
    const expected = [290, 590, 990, 990, 990];
    const entitledExpected = [true, true, false, false, false];
    for (let i = 0; i < seq.length; i += 1) {
      const r = await invoke(pay.refundNotify, refundPayload(no, seq[i][0], seq[i][1]));
      const order = store.getOrder(no);
      assert.equal(r.body.refundedAmount, expected[i], `第 ${i + 1} 笔累计退款错误（重复投递被重复计数）`);
      assert.equal(order.refundedAmount, expected[i]);
      assert.equal(store.isEntitled('u-rf'), entitledExpected[i], `第 ${i + 1} 笔后权益错误`);
    }
    assert.equal(store.getOrder(no).status, 'REFUNDED');
  });
  await check('退款字段不符（商户号/币种/超额）一律不处理', async () => {
    const no = 'ord-refund-bad';
    store.saveOrder(no, { outTradeNo: no, openid: 'u-rb', amount: 990, status: 'PAID' });
    store.saveUser('u-rb', { entitled: true, orderNo: no, issueToken: true });
    const badMch = await invoke(pay.refundNotify, { mchid: 'other-mch', out_trade_no: no, refund_status: 'SUCCESS', out_refund_no: 'B1', amount: { total: 990, refund: 990, currency: 'CNY' } });
    assert.equal(badMch.body.code, 'FAIL');
    const badCur = await invoke(pay.refundNotify, { mchid: cfg.mchid, out_trade_no: no, refund_status: 'SUCCESS', out_refund_no: 'B2', amount: { total: 990, refund: 990, currency: 'USD' } });
    assert.equal(badCur.body.code, 'FAIL');
    const over = await invoke(pay.refundNotify, { mchid: cfg.mchid, out_trade_no: no, refund_status: 'SUCCESS', out_refund_no: 'B3', amount: { total: 990, refund: 9999, currency: 'CNY' } });
    assert.equal(over.body.code, 'FAIL');
    assert.equal(store.isEntitled('u-rb'), true, '被拒的退款回调不应撤销权益');
    assert.equal(store.getOrder(no).status, 'PAID');
  });
  await check('全额退款后迟到的付款通知不得重新开通', async () => {
    const no = 'ord-refunded-late';
    store.saveOrder(no, { outTradeNo: no, openid: 'u-rl', amount: 990, status: 'REFUNDED', refundedAmount: 990 });
    store.saveUser('u-rl', { entitled: false, orderNo: no, issueToken: true });
    await invoke(pay.notify, { appid: cfg.appid, mchid: cfg.mchid, out_trade_no: no, trade_state: 'SUCCESS', transaction_id: 'tx', payer: { openid: 'u-rl' }, amount: { total: 990, currency: 'CNY' } });
    assert.equal(store.isEntitled('u-rl'), false);
    assert.equal(store.getOrder(no).status, 'REFUNDED');
  });

  // ---------- 6. 付款中断恢复 ----------
  await check('中断场景一：订单已 PAID 但权益缺失，回调重试可自愈', async () => {
    const no = 'ord-int-1';
    store.saveOrder(no, { outTradeNo: no, openid: 'u-i1', amount: 990, status: 'PAID' });
    store.saveUser('u-i1', { entitled: false, orderNo: no, issueToken: true });
    await invoke(pay.notify, { appid: cfg.appid, mchid: cfg.mchid, out_trade_no: no, trade_state: 'SUCCESS', transaction_id: 'tx', payer: { openid: 'u-i1' }, amount: { total: 990, currency: 'CNY' } });
    assert.equal(store.isEntitled('u-i1'), true, '中断后重试未补齐权益');
  });
  await check('中断场景二：重启对账 reconcileAll 修复残留', async () => {
    const no = 'ord-int-2';
    store.saveOrder(no, { outTradeNo: no, openid: 'u-i2', amount: 990, status: 'PAID' });
    store.saveUser('u-i2', { entitled: false, orderNo: no, issueToken: true });
    assert.equal(store.isEntitled('u-i2'), false);
    store.reconcileAll();
    assert.equal(store.isEntitled('u-i2'), true, '启动对账未修复权益');
  });
  await check('中断场景三：回调丢失，主动查单补开通', async () => {
    const no = 'ord-int-3';
    store.saveOrder(no, { outTradeNo: no, openid: 'u-i3', amount: 990, status: 'CREATED' });
    store.saveUser('u-i3', { entitled: false, orderNo: no, issueToken: true });
    stubOpenid = 'u-i3';
    const r = response();
    await pay.queryOrder({ headers: { authorization: 'Bearer ' + store.getUser('u-i3').token }, query: { orderNo: no } }, r);
    assert.equal(r.body.status, 'PAID');
    assert.equal(store.isEntitled('u-i3'), true, '查单补单未开通权益');
  });
  await check('一张退款单不覆盖其他有效订单的权益', async () => {
    // u-multi 有 A、B 两张已付订单，只退 A
    store.saveOrder('ordA', { outTradeNo: 'ordA', openid: 'u-multi', amount: 990, status: 'PAID' });
    store.saveOrder('ordB', { outTradeNo: 'ordB', openid: 'u-multi', amount: 990, status: 'PAID' });
    store.saveUser('u-multi', { entitled: true, orderNo: 'ordB', issueToken: true });
    await invoke(pay.refundNotify, refundPayload('ordA', 'RA', 990));
    assert.equal(store.getOrder('ordA').status, 'REFUNDED');
    assert.equal(store.isEntitled('u-multi'), true, '退掉 A 之后 B 带来的权益被误撤销');
  });

  // ---------- 7. 旧序列号回归 ----------
  await check('旧序列号 Cookie 识别为已授权（含两台设备约束）', async () => {
    const r = response();
    await access.session({ query: {}, headers: { cookie: 'zk_serial_session=good' } }, r);
    assert.equal(r.body.authenticated, true);
    assert.equal(r.body.entitled, true);
    assert.equal(r.body.accessSource, 'serial');
    assert.equal(r.body.serial.deviceCount, 2);
    assert.equal(r.body.serial.maxDevices, 2);
  });
  await check('旧序列号无效 Cookie / 无 Cookie 一律未授权', async () => {
    const r1 = response();
    await access.session({ query: {}, headers: { cookie: 'zk_serial_session=bad' } }, r1);
    assert.equal(r1.body.authenticated, false);
    const r2 = response();
    await access.session({ query: {}, headers: {} }, r2);
    assert.equal(r2.body.authenticated, false);
  });
  await check('新会员与旧序列号互不干扰', async () => {
    store.saveUser('u-member', { entitled: true, issueToken: true });
    const r = response();
    await access.session({ query: { token: store.getUser('u-member').token }, headers: {} }, r);
    assert.equal(r.body.accessSource, 'membership');
    assert.equal(r.body.entitled, true);
  });

  // ---------- 8. 并发下单占位 ----------
  await check('并发下单：占位记录使并发请求复用同一订单', async () => {
    store.saveUser('u-conc', { issueToken: true });
    const token = store.getUser('u-conc').token;
    const mk = () => ({ headers: { authorization: 'Bearer ' + token }, body: {}, query: {} });
    const [a, b, c] = await Promise.all([
      pay.createOrder(mk(), response()),
      pay.createOrder(mk(), response()),
      pay.createOrder(mk(), response())
    ]);
    assert(a.body && a.body.orderNo, '下单失败');
    assert.equal(b.body.orderNo, a.body.orderNo, '并发请求未复用占位订单');
    assert.equal(c.body.orderNo, a.body.orderNo, '并发请求未复用占位订单');
    const mine = store.ordersOf('u-conc').filter((o) => Date.now() - Number(o.createdAt || 0) < 60000);
    assert.equal(mine.length, 1, '并发创建了 ' + mine.length + ' 张订单');
  });

  serial.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(JSON.stringify({
    scope: 'offline, synthetic data + stubbed wechat/8787',
    total: results.length, passed, failed: results.length - passed, results
  }, null, 2));
  process.exitCode = results.some((r) => !r.pass) ? 1 : 0;
})();
