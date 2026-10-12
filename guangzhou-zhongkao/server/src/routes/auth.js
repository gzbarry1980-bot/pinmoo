// server/src/routes/auth.js
// POST /api/auth/login         { code } -> { openid, token, entitled, vipExpireAt, orderNo }
// POST /api/auth/session-code  (Bearer token) -> { code, expiresIn }  一次性短期凭证（P0-5）
const https = require('https');
const cfg = require('../config.js');
const store = require('../store.js');

function wxLogin(code) {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${cfg.appid}&secret=${cfg.appSecret}&js_code=${code}&grant_type=authorization_code`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function authOf(req) {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
}

async function login(req, res) {
  // P0-1：禁止任何“本地演示”登录通道。无真实配置直接拒绝，避免公网伪造开通。
  if (!cfg.appid || !cfg.appSecret) {
    return res.status(503).json({ message: '登录服务未配置，暂不可用' });
  }
  const code = req.body && req.body.code;
  if (!code) return res.status(400).json({ message: '缺少 code' });
  let session;
  try {
    session = await wxLogin(code);
  } catch (e) {
    return res.status(502).json({ message: '微信登录接口异常' });
  }
  if (!session || !session.openid) {
    return res.status(400).json({ message: '微信登录失败：' + (session && session.errmsg || '未知错误') });
  }
  let user = store.getUser(session.openid);
  if (!user) user = store.saveUser(session.openid, { openid: session.openid, createdAt: Date.now() });
  // 仅在尚无有效令牌时签发（保留既有令牌的过期时间）
  if (!store.isTokenValid(user.token)) {
    user = store.saveUser(session.openid, { issueToken: true });
  }
  res.json({
    openid: session.openid,
    token: user.token,
    entitled: store.isEntitled(session.openid),
    vipExpireAt: user.vipExpireAt || null,
    orderNo: user.orderNo || null
  });
}

// P0-5：用长期令牌换一次性短期会话码，供 web-view 注入 URL，避免长期令牌进入 URL/日志。
async function sessionCode(req, res) {
  const token = authOf(req);
  if (!store.isTokenValid(token)) return res.status(401).json({ message: '未登录或会话已过期' });
  const user = store.findByToken(token);
  if (!user) return res.status(401).json({ message: '未登录' });
  const code = store.issueSessionCode(user.openid);
  res.json({ code, expiresIn: cfg.sessionCodeTTLSec });
}

module.exports = { login, sessionCode };
