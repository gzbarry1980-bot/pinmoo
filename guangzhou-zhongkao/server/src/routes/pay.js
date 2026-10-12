// server/src/routes/pay.js
// POST /api/pay/create        (Bearer token) -> 真实微信下单（服务端固定金额 990 分）
// POST /api/pay/notify        微信支付回调（验签 + 解密 + 全字段核对 + 幂等开通）
// GET  /api/pay/query         (Bearer token) -> 服务端主动查微信订单（回调迟到时补开通）
// POST /api/pay/refund-notify 微信退款回调（核对商户/金额/币种 + 按退款单幂等累积）
//
// R3 返工要点：
//  - 明确的订单状态迁移表：已全额退款的订单不会被迟到的付款通知重新开通。
//  - 付款成功一律按「有效订单」重算权益，已 PAID 但权益缺失时重试可自愈。
//  - 退款按 refund_id/out_refund_no 幂等累积，只有累计退款 >= 订单额才撤销权益；
//    重复、乱序、部分为 1 分的退款都不会误撤销。
const https = require('https');
const crypto = require('crypto');
const cfg = require('../config.js');
const store = require('../store.js');
const wxpay = require('../wxpay.js');

const DUP_WINDOW_MS = 5 * 60 * 1000; // 重复点击窗口：窗口内已有活跃订单则复用，不再重复下单

// 订单状态迁移白名单。未列出的迁移一律拒绝（R3）。
const TRANSITIONS = {
  RESERVED: ['CREATED', 'PAID', 'CLOSED', 'PAYERROR', 'FAILED'],
  CREATED: ['PAID', 'CLOSED', 'PAYERROR', 'REVOKED'],
  PENDING: ['PAID', 'CLOSED', 'PAYERROR'],
  PAYERROR: ['PAID', 'CLOSED'],
  FAILED: ['PAID', 'CLOSED'],
  CLOSED: ['PAID'],               // 极少数「关闭后补付成功」由人工对账确认，这里仅记录不改权益
  PAID: ['PARTIAL_REFUNDED', 'REFUNDED'],
  PARTIAL_REFUNDED: ['PARTIAL_REFUNDED', 'REFUNDED'],
  REFUNDED: []                    // 终态：任何付款通知都不得重新开通
};

function canTransition(from, to) {
  const allowed = TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// 日志脱敏：订单号保留前后缀，openid / transaction_id 只留长度与尾 4 位。
function maskId(v) {
  const s = String(v || '');
  if (s.length <= 8) return s.slice(0, 2) + '***' + s.slice(-2);
  return s.slice(0, 4) + '***' + s.slice(-4);
}

function authOf(req) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

function genOrderNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return 'ZK' + ymd + crypto.randomBytes(6).toString('hex').toUpperCase();
}

function wxpayRequest(method, apiPath, bodyStr) {
  return new Promise((resolve, reject) => {
    const auth = wxpay.buildAuthorization(method, apiPath, bodyStr || '');
    const req = https.request({
      hostname: 'api.mch.weixin.qq.com',
      port: 443,
      path: apiPath,
      method,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'Accept': 'application/json',
        'User-Agent': 'zk-pay/1.0'
      }
    }, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => {
        try { resolve({ status: resp.statusCode, body: d ? JSON.parse(d) : null }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('wechat timeout')); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function activeOrderFor(openid) {
  const db = store.read();
  return Object.values(db.orders).find(
    (o) => o.openid === openid &&
           ['RESERVED', 'CREATED', 'PENDING'].includes(o.status) &&
           Date.now() - Number(o.createdAt || 0) < DUP_WINDOW_MS
  ) || null;
}

// P0-2：下单。身份仅由令牌确定；金额服务端固定；拒绝客户端金额/openid；窗口内重复下单复用。
async function createOrder(req, res) {
  const token = authOf(req);
  const user = store.isTokenValid(token) ? store.findByToken(token) : null;
  if (!user) return res.status(401).json({ message: '未登录或会话已过期' });

  if (!cfg.paymentConfigured) {
    return res.status(503).json({ message: '支付服务未配置，暂不可购买' });
  }

  // P0-2：忽略并拒绝客户端价格，服务端固定商品金额。
  const amount = cfg.priceFen; // 始终 990 分
  const description = cfg.productName;

  // 重复点击防护：窗口内已有活跃订单直接复用，避免无控制地重复创建。
  const recent = activeOrderFor(user.openid);
  if (recent) {
    return res.json({ orderNo: recent.outTradeNo, prepayId: recent.prepayId, payParams: recent.payParams, reused: true });
  }

  const outTradeNo = genOrderNo();
  // 并发占位：在发起网络请求之前同步落一条 RESERVED 记录（commit 为同步读-改-写），
  // 后到的并发请求在同一窗口内会命中它并复用，无法各自越过检查重复下单。
  store.saveOrder(outTradeNo, {
    outTradeNo,
    openid: user.openid,          // 身份仅来自令牌对应的用户，绝不取客户端
    amount,                       // 固定 990
    currency: 'CNY',
    description,
    status: 'RESERVED',
    createdAt: Date.now()
  });
  store.appendEvent('order_reserved', { outTradeNo, openid: maskId(user.openid), amount });

  const bodyObj = {
    appid: cfg.appid,
    mchid: cfg.mchid,
    description,
    out_trade_no: outTradeNo,
    notify_url: cfg.baseUrl.replace(/\/$/, '') + '/api/pay/notify',
    amount: { total: amount, currency: 'CNY' },
    payer: { openid: user.openid }
  };
  const bodyStr = JSON.stringify(bodyObj);
  const apiPath = '/v3/pay/transactions/jsapi';

  let result;
  try {
    result = await wxpayRequest('POST', apiPath, bodyStr);
  } catch (e) {
    store.saveOrder(outTradeNo, { status: 'FAILED', failedAt: Date.now(), reason: 'network' });
    return res.status(502).json({ message: '微信下单失败' });
  }
  if (!result || result.status !== 200 || !result.body || !result.body.prepay_id) {
    store.saveOrder(outTradeNo, { status: 'FAILED', failedAt: Date.now(), reason: 'no_prepay_id' });
    return res.status(502).json({ message: '微信下单失败：' + (result && result.body && result.body.message || '无 prepay_id') });
  }

  const payParams = wxpay.buildPaySign(result.body.prepay_id);
  store.saveOrder(outTradeNo, {
    prepayId: result.body.prepay_id,
    payParams,
    status: 'CREATED',
    createdAt: Date.now()
  });

  return res.json({ orderNo: outTradeNo, prepayId: result.body.prepay_id, payParams });
}

// 读取并解密回调报文；失败统一返回 null。
function decryptCallback(req) {
  const bodyStr = req.rawBody || JSON.stringify(req.body || {});
  const timestamp = req.headers['wechatpay-timestamp'];
  const nonce = req.headers['wechatpay-nonce'];
  const signature = req.headers['wechatpay-signature'];
  if (!wxpay.verifyNotify(timestamp, nonce, signature, bodyStr)) return null;
  let resource;
  try { resource = JSON.parse(bodyStr).resource; } catch (e) { return null; }
  try {
    return JSON.parse(wxpay.decryptResource(resource.ciphertext, resource.nonce, resource.associated_data));
  } catch (e) {
    return null;
  }
}

// 付款成功落地：状态迁移 + 按有效订单重算权益。
// 已 PAID 的订单再次收到通知时不做状态迁移，但仍重算权益 —— 用于修复「订单已付、权益缺失」的中断残留。
// via 标记开通来源（'notify' = 微信回调；'query' = 服务端主动查单补单），用于联调时区分真实回调是否到达。
function applyPaymentSuccess(order, transactionId, via) {
  if (order.status === 'REFUNDED') {
    store.appendEvent('payment_rejected_refunded', { outTradeNo: order.outTradeNo });
    return { reopened: false, entitled: store.isEntitled(order.openid) };
  }
  if (order.status !== 'PAID' && canTransition(order.status, 'PAID')) {
    store.saveOrder(order.outTradeNo, { status: 'PAID', paidAt: Date.now(), transactionId, via: via || 'unknown' });
    store.appendEvent('order_paid', { outTradeNo: order.outTradeNo, transactionId: maskId(transactionId), via: via || 'unknown' });
  } else if (order.status !== 'PAID') {
    store.appendEvent('payment_state_blocked', { outTradeNo: order.outTradeNo, from: order.status });
  }
  const entitled = store.recomputeEntitlement(order.openid);
  return { reopened: true, entitled };
}

// P0-3 / R3：支付回调。
async function notify(req, res) {
  const decrypted = decryptCallback(req);
  if (!decrypted) return res.status(200).json({ code: 'FAIL', message: '签名或解密失败' });

  const { appid, mchid, out_trade_no, trade_state, transaction_id, payer, amount: amt } = decrypted;
  // 回调到达留痕（脱敏）：联调时用于证明「微信侧确实把通知送到了」。
  store.appendEvent('notify_received', {
    outTradeNo: maskId(out_trade_no),
    tradeState: trade_state,
    transactionId: maskId(transaction_id)
  });
  const order = store.getOrder(out_trade_no);
  if (!order) {
    // 未知订单：拒绝开通，避免凭回调凭空授权。
    return res.status(200).json({ code: 'FAIL', message: 'unknown order' });
  }

  // 全字段核对，任一不符即拒绝（不开放权益、不标记已付）。
  const fails = [];
  if (appid !== cfg.appid) fails.push('appid');
  if (mchid !== cfg.mchid) fails.push('mchid');
  if (!payer || payer.openid !== order.openid) fails.push('payer');
  if (!amt || Number(amt.total) !== Number(order.amount)) fails.push('amount');
  if (!amt || amt.currency !== 'CNY') fails.push('currency');
  if (fails.length) {
    console.warn('[pay/notify] 回调字段核对失败，拒绝开通：', { out_trade_no: maskId(out_trade_no), fails });
    return res.status(200).json({ code: 'FAIL', message: 'field mismatch: ' + fails.join(',') });
  }

  if (trade_state === 'SUCCESS') {
    applyPaymentSuccess(order, transaction_id);
    return res.status(200).json({ code: 'SUCCESS', message: '成功' });
  }

  // 非成功状态（CLOSED/PAYERROR 等）按迁移表记录，不开放权益。
  if (canTransition(order.status, trade_state)) {
    store.saveOrder(out_trade_no, { status: trade_state });
  } else {
    store.appendEvent('payment_state_blocked', { outTradeNo: out_trade_no, from: order.status, to: trade_state });
  }
  return res.status(200).json({ code: 'SUCCESS', message: '已记录非成功状态' });
}

// P0-3 / 后续补项：回调迟到或丢失时，服务端主动查微信订单并补开通。
// 查询接口需带商户号参数；响应需核对状态、金额与付款人。
async function queryOrder(req, res) {
  const token = authOf(req);
  const user = store.isTokenValid(token) ? store.findByToken(token) : null;
  if (!user) return res.status(401).json({ message: '未登录' });
  const outTradeNo = req.query && req.query.orderNo;
  if (!outTradeNo) return res.status(400).json({ message: '缺少 orderNo' });
  const order = store.getOrder(outTradeNo);
  if (!order || order.openid !== user.openid) return res.status(404).json({ message: '订单不存在' });

  // 已付款：直接重算权益，用于修复中断残留（订单 PAID 但权益未开通）。
  if (order.status === 'PAID' || order.status === 'PARTIAL_REFUNDED') {
    const entitled = store.recomputeEntitlement(user.openid);
    return res.json({ status: order.status, entitled });
  }
  if (order.status === 'REFUNDED') {
    return res.json({ status: 'REFUNDED', entitled: store.isEntitled(user.openid) });
  }
  if (!cfg.paymentConfigured) {
    return res.status(503).json({ status: order.status, message: '支付服务未配置' });
  }

  const apiPath = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${encodeURIComponent(cfg.mchid)}`;
  let result;
  try {
    result = await wxpayRequest('GET', apiPath, '');
  } catch (e) {
    return res.status(502).json({ status: order.status, message: '查询失败' });
  }
  if (!result || !result.body) return res.status(502).json({ status: order.status, message: '查询失败' });
  if (result.status !== 200) return res.status(502).json({ status: order.status, message: '查询失败：' + (result.body.message || result.status) });

  const body = result.body;
  if (body.trade_state === 'SUCCESS') {
    // 与 notify 同样的全字段核对
    const amt = body.amount;
    const fails = [];
    if (body.appid !== cfg.appid) fails.push('appid');
    if (body.mchid !== cfg.mchid) fails.push('mchid');
    if (!body.payer || body.payer.openid !== order.openid) fails.push('payer');
    if (!amt || Number(amt.total) !== Number(order.amount)) fails.push('amount');
    if (!amt || amt.currency !== 'CNY') fails.push('currency');
    if (fails.length) {
      return res.json({ status: 'MISMATCH', entitled: store.isEntitled(user.openid), message: '字段核对失败：' + fails.join(',') });
    }
    applyPaymentSuccess(order, body.transaction_id, 'query');
    return res.json({ status: 'PAID', entitled: store.isEntitled(user.openid) });
  }
  return res.json({ status: body.trade_state, entitled: store.isEntitled(user.openid) });
}

// R3：退款回调。按退款单幂等累积，只有累计退款覆盖订单全额才撤销权益。
async function refundNotify(req, res) {
  const decrypted = decryptCallback(req);
  if (!decrypted) return res.status(200).json({ code: 'FAIL', message: '签名或解密失败' });

  const {
    mchid, out_trade_no, refund_status, out_refund_no, refund_id,
    amount: amt
  } = decrypted;

  const order = store.getOrder(out_trade_no);
  if (!order) return res.status(200).json({ code: 'SUCCESS', message: 'unknown order' });

  // 字段核对：商户号、币种、订单金额、退款额合理性，任一项不符不处理。
  const fails = [];
  if (mchid && mchid !== cfg.mchid) fails.push('mchid');
  if (amt && amt.currency && amt.currency !== 'CNY') fails.push('currency');
  if (amt && Number(amt.total) !== Number(order.amount)) fails.push('amount');
  const refundValue = amt ? Number(amt.refund) : NaN;
  if (!Number.isFinite(refundValue) || refundValue <= 0) fails.push('refund');
  if (Number.isFinite(refundValue) && refundValue > Number(order.amount)) fails.push('refund_exceed');
  if (fails.length) {
    console.warn('[pay/refund] 退款回调字段核对失败，拒绝处理：', { out_trade_no: maskId(out_trade_no), fails });
    return res.status(200).json({ code: 'FAIL', message: 'field mismatch: ' + fails.join(',') });
  }

  if (refund_status !== 'SUCCESS') {
    store.appendEvent('refund_state', { outTradeNo: out_trade_no, status: refund_status });
    return res.status(200).json({ code: 'SUCCESS', message: '已记录非成功退款状态' });
  }

  // 退款单幂等键：同一张退款单重复/乱序到达只计一次。
  const refundKey = out_refund_no || refund_id || ('legacy:' + String(refundValue) + ':' + String(decrypted.success_time || ''));
  const refunds = Object.assign({}, order.refunds || {});
  refunds[refundKey] = refundValue;
  const refundedAmount = Object.values(refunds).reduce((a, b) => a + Number(b || 0), 0);

  const fullRefund = refundedAmount >= Number(order.amount);
  const nextStatus = fullRefund ? 'REFUNDED' : 'PARTIAL_REFUNDED';
  if (canTransition(order.status, nextStatus) || order.status === nextStatus || order.status === 'PARTIAL_REFUNDED') {
    store.saveOrder(out_trade_no, {
      status: nextStatus,
      refunds,
      refundedAmount,
      refundedAt: Date.now()
    });
    store.appendEvent('refund_applied', {
      outTradeNo: out_trade_no, refundKey, refundValue, refundedAmount, fullRefund
    });
  }
  // 按全部有效订单重算：一张退款单不会覆盖其他有效订单带来的权益。
  const entitled = store.recomputeEntitlement(order.openid);
  return res.status(200).json({ code: 'SUCCESS', message: '成功', refundedAmount, fullRefund, entitled });
}

module.exports = { createOrder, notify, queryOrder, refundNotify, canTransition, maskId };
