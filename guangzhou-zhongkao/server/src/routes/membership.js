// server/src/routes/membership.js
// GET  /api/membership/status  (Bearer token) -> { entitled, user }
// POST /api/membership/activate (Bearer token) -> 乐观开通（最终以回调为准）
// P0-5：身份仅由有效令牌确定，移除 openid 查询兜底；过期/撤销令牌一律 401。
const store = require('../store.js');

function authOf(req) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

function resolveUser(req) {
  // 仅令牌，不再接受 URL 上的 openid（P0-5：openid 兜底会泄露他人权益查询面）。
  const token = authOf(req);
  if (!token) return null;
  if (!store.isTokenValid(token)) return null;
  return store.findByToken(token);
}

function publicUser(user) {
  if (!user) return null;
  return {
    openid: user.openid,
    entitled: store.isEntitled(user.openid),
    vipExpireAt: user.vipExpireAt || null,
    orderNo: user.orderNo || null
  };
}

function status(req, res) {
  const user = resolveUser(req);
  if (!user) return res.status(401).json({ message: '未登录或会话已过期' });
  const pu = publicUser(user);
  res.json({ entitled: pu.entitled, user: pu });
}

function activate(req, res) {
  const user = resolveUser(req);
  if (!user) return res.status(401).json({ message: '未登录或会话已过期' });
  // 以已支付订单为准，避免无支付记录却乐观开通。
  const db = store.read();
  const paid = Object.values(db.orders).find((o) => o.openid === user.openid && o.status === 'PAID');
  if (paid) {
    store.saveUser(user.openid, { entitled: true, vipExpireAt: null, orderNo: paid.outTradeNo });
  }
  res.json({ entitled: store.isEntitled(user.openid), user: publicUser(store.getUser(user.openid)) });
}

module.exports = { status, activate };
