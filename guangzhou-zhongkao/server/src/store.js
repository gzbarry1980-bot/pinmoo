// server/src/store.js
// 轻量 JSON 文件存储（用户、订单、会员态、网页会话、单次会话码、撤销记录、事件日志）。
// 本文件只负责持久化与一致性，不负责安全校验（校验在 routes 层）。
//
// 2026-10-10 返工（R3）：
//  - 写入改为「临时文件 + rename」原子替换，避免进程中断留下半截文件。
//  - 提供 commit()：一次读-改-写完成「订单 + 权益」的成对更新，杜绝两者只写一半。
//  - 追加只增事件日志 events.jsonl，用于中断恢复与对账追溯。
//  - 权益改为「按有效订单重算」，避免一张退款单覆盖其他有效权益。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cfg = require('./config.js');

function file() { return path.join(cfg.dataDir, 'store.json'); }
function eventFile() { return path.join(cfg.dataDir, 'events.jsonl'); }

function emptyDb() {
  return { users: {}, orders: {}, sessionCodes: {}, webSessions: {}, revokedTokens: {} };
}

function read() {
  try {
    const db = JSON.parse(fs.readFileSync(file(), 'utf8'));
    return Object.assign(emptyDb(), db);
  } catch (e) {
    return emptyDb();
  }
}

// 原子写：先写临时文件再 rename，进程被杀也不会留下损坏的 store.json。
function write(db) {
  fs.mkdirSync(cfg.dataDir, { recursive: true });
  const target = file();
  const tmp = target + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, target);
}

// 一次读-改-写。mutator 内对 db 的修改要么整体落盘，要么整体不落盘。
function commit(mutator) {
  const db = read();
  const out = mutator(db);
  write(db);
  return out;
}

// 只增事件日志：中断后可用 events.jsonl 重放/对账。
function appendEvent(type, detail) {
  try {
    fs.mkdirSync(cfg.dataDir, { recursive: true });
    fs.appendFileSync(eventFile(), JSON.stringify({ at: Date.now(), type, detail }) + '\n');
  } catch (e) { /* 日志失败不得影响主流程 */ }
}

function getUser(openid) {
  const db = read();
  return db.users[openid] || null;
}

// 仅在 patch 含 issueToken 或用户尚无 token 时签发新令牌，并写入签发时间用于过期判断（P0-5）。
function saveUser(openid, patch) {
  return commit((db) => {
    const prev = db.users[openid] || {};
    const next = Object.assign({}, prev, patch || {}, { openid });
    if (patch && patch.issueToken) {
      next.token = crypto.randomBytes(24).toString('hex');
      next.tokenIssuedAt = Date.now();
      delete next.issueToken;
    } else if (!next.token) {
      next.token = crypto.randomBytes(24).toString('hex');
      next.tokenIssuedAt = Date.now();
    }
    db.users[openid] = next;
    return next;
  });
}

function getOrder(no) {
  const db = read();
  return db.orders[no] || null;
}

function saveOrder(no, order) {
  return commit((db) => {
    db.orders[no] = Object.assign({}, db.orders[no], order);
    return db.orders[no];
  });
}

// 订单是否有效（可支撑权益）：全额有效，或部分退款且退款额小于订单额。
function isOrderEffective(order) {
  if (!order) return false;
  if (order.status === 'PAID') return true;
  if (order.status === 'PARTIAL_REFUNDED') {
    return Number(order.refundedAmount || 0) < Number(order.amount || 0);
  }
  return false;
}

// 按该用户全部订单重算权益：只要还有一张有效订单即保留权益。
// 这样一张退款单不会覆盖其他有效订单带来的权益。
function recomputeEntitlement(openid) {
  const entitled = commit((db) => {
    const effective = Object.values(db.orders).filter((o) => o.openid === openid && isOrderEffective(o));
    const u = db.users[openid] || {};
    const next = Object.assign({}, u, {
      openid,
      entitled: effective.length > 0,
      orderNo: effective.length ? effective[effective.length - 1].outTradeNo : (u.orderNo || null),
      entitledUpdatedAt: Date.now()
    });
    db.users[openid] = next;
    return next.entitled;
  });
  appendEvent('entitlement_recomputed', { openid, entitled });
  return entitled;
}

// 启动恢复：把所有订单的权益重算一遍，修复「订单已付但权益缺失」的中断残留。
function reconcileAll() {
  const db = read();
  const openids = new Set();
  Object.values(db.orders).forEach((o) => { if (o.openid) openids.add(o.openid); });
  let fixed = 0;
  openids.forEach((openid) => {
    const before = (db.users[openid] || {}).entitled;
    const after = recomputeEntitlement(openid);
    if (Boolean(before) !== Boolean(after)) fixed += 1;
  });
  return { users: openids.size, changed: fixed };
}

function ordersOf(openid) {
  const db = read();
  return Object.values(db.orders).filter((o) => o.openid === openid);
}

function findByToken(token) {
  if (!token) return null;
  const db = read();
  return Object.values(db.users).find((u) => u.token === token) || null;
}

// P0-5：令牌有效性 = 存在 + 未撤销 + 未过期。
function isTokenValid(token) {
  if (!token) return false;
  const db = read();
  if (db.revokedTokens && db.revokedTokens[token]) return false;
  const u = Object.values(db.users).find((x) => x.token === token);
  if (!u || !u.tokenIssuedAt) return false;
  const ttl = (cfg.tokenTTLDays || 30) * 86400 * 1000;
  return Date.now() < Number(u.tokenIssuedAt) + ttl;
}

// 撤销令牌：同时踢掉该用户已建立的网页会话，确保退出/撤销即时生效。
function revokeToken(token) {
  return commit((db) => {
    db.revokedTokens = db.revokedTokens || {};
    db.revokedTokens[token] = Date.now();
    const u = Object.values(db.users).find((x) => x.token === token);
    if (u && db.webSessions) {
      Object.keys(db.webSessions).forEach((sid) => {
        if (db.webSessions[sid].openid === u.openid) delete db.webSessions[sid];
      });
    }
  });
}

// P0-5：签发一次性短期会话码，供 web-view 注入 URL 代替长期令牌。
function issueSessionCode(openid) {
  return commit((db) => {
    const code = crypto.randomBytes(18).toString('hex');
    db.sessionCodes = db.sessionCodes || {};
    db.sessionCodes[code] = { openid, expiresAt: Date.now() + (cfg.sessionCodeTTLSec || 60) * 1000, used: false };
    return code;
  });
}

// 消费一次性码：有效且未用则标记已用并返回 openid；否则返回 null。
function consumeSessionCode(code) {
  if (!code) return null;
  return commit((db) => {
    db.sessionCodes = db.sessionCodes || {};
    const rec = db.sessionCodes[code];
    if (!rec || rec.used || Date.now() > rec.expiresAt) return null;
    rec.used = true;
    return rec.openid;
  });
}

// ---- R2：H5 网页会话（一次性码交换后建立，服务端持有，浏览器只拿 Cookie） ----
const WEB_SESSION_COOKIE = 'zk_web_session';

function webSessionTTLms() {
  return (cfg.webSessionTTLDays || 30) * 86400 * 1000;
}

function pruneWebSessions(db) {
  if (!db.webSessions) return;
  const now = Date.now();
  Object.keys(db.webSessions).forEach((sid) => {
    if (now > Number(db.webSessions[sid].expiresAt || 0)) delete db.webSessions[sid];
  });
}

function issueWebSession(openid) {
  return commit((db) => {
    db.webSessions = db.webSessions || {};
    pruneWebSessions(db);
    const sid = crypto.randomBytes(32).toString('hex');
    db.webSessions[sid] = { openid, createdAt: Date.now(), expiresAt: Date.now() + webSessionTTLms() };
    return sid;
  });
}

function getWebSession(sid) {
  if (!sid) return null;
  const db = read();
  const rec = db.webSessions && db.webSessions[sid];
  if (!rec) return null;
  if (Date.now() > Number(rec.expiresAt || 0)) return null;
  return rec;
}

function revokeWebSession(sid) {
  if (!sid) return;
  commit((db) => { if (db.webSessions) delete db.webSessions[sid]; });
}

function revokeWebSessionsForUser(openid) {
  commit((db) => {
    if (!db.webSessions) return;
    Object.keys(db.webSessions).forEach((sid) => {
      if (db.webSessions[sid].openid === openid) delete db.webSessions[sid];
    });
  });
}

function isEntitled(openid) {
  const u = getUser(openid);
  if (!u) return false;
  if (u.vipExpireAt) return Date.now() < Number(u.vipExpireAt);
  return !!u.entitled;
}

module.exports = {
  read, write, commit, appendEvent,
  getUser, saveUser, getOrder, saveOrder, ordersOf,
  isOrderEffective, recomputeEntitlement, reconcileAll,
  findByToken, isTokenValid, revokeToken,
  issueSessionCode, consumeSessionCode,
  WEB_SESSION_COOKIE,
  issueWebSession, getWebSession, revokeWebSession, revokeWebSessionsForUser,
  isEntitled
};
