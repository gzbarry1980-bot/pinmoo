// server/src/index.js
// 广州中考志愿模拟助手 · 微信支付与会员服务（正式服务端，不含任何 mock 开通能力）
// 监听 8799，处理 /api/* （nginx: /api/{auth,pay,membership,access} -> 本服务；/api/access/serial/* -> 8787）
const express = require('express');
const auth = require('./routes/auth.js');
const pay = require('./routes/pay.js');
const membership = require('./routes/membership.js');
const access = require('./routes/access.js');
const store = require('./store.js');
const cfg = require('./config.js');

const app = express();
// 保留原始 body 用于回调签名校验
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString('utf8'); }
}));

// P0-2：轻量内存限流（每令牌/IP 每分钟窗口）。生产可换 Redis token bucket。
const buckets = new Map(); // key -> { count, resetAt }
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = (req.headers.authorization || '') + '|' + (req.ip || req.socket.remoteAddress || 'anon');
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.resetAt) { b = { count: 0, resetAt: now + windowMs }; buckets.set(key, b); }
    b.count += 1;
    if (b.count > max) return res.status(429).json({ message: '请求过于频繁，请稍后再试' });
    next();
  };
}
const rl = rateLimit(cfg.rateLimit.max, cfg.rateLimit.windowMs);

app.get('/api/access/config', access.config);
app.get('/api/access/session', access.session);
// R2：专用交换接口（消费一次性码 + 建立网页会话）；退出接口撤销会话。
app.get('/api/access/exchange', rl, access.exchange);
app.post('/api/access/exchange', rl, access.exchange);
app.post('/api/access/logout', rl, access.logout);
app.post('/api/auth/login', rl, auth.login);
app.post('/api/auth/session-code', rl, auth.sessionCode);
app.post('/api/pay/create', rl, pay.createOrder);
app.post('/api/pay/notify', pay.notify);          // 微信回调不限流（失败需重试）
app.get('/api/pay/query', rl, pay.queryOrder);
app.post('/api/pay/refund-notify', pay.refundNotify);
app.get('/api/membership/status', membership.status);
app.post('/api/membership/activate', membership.activate);
app.get('/healthz', (req, res) => res.json({ ok: true, paymentConfigured: !!cfg.paymentConfigured }));

if (require.main === module) {
  // R3：启动即按订单重算权益，修复「订单已付、权益缺失」的中断残留。
  try {
    const r = store.reconcileAll();
    if (r.changed > 0) console.log(`[zk-pay] 启动对账修正 ${r.changed}/${r.users} 个用户权益`);
  } catch (e) {
    console.warn('[zk-pay] 启动对账失败：', e.message);
  }
  const server = app.listen(cfg.port, cfg.host, () => {
    console.log(`[zk-pay] listening on ${cfg.host}:${cfg.port} (appid=${cfg.appid || '未配置'}, payment=${cfg.paymentConfigured ? 'ready' : 'NOT configured'})`);
  });
  server.setTimeout(15000);
}

module.exports = app;
