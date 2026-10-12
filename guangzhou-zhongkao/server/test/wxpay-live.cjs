#!/usr/bin/env node
// 真实微信支付联调脚本 —— 只跑真实链路，绝不 mock。
//
// 前置：
//   1) 已完成配置安装：bash server/deploy/install-wxpay-env.sh
//   2) node scripts/check-wxpay-config.cjs 全绿
//   3) 真机（微信内小程序）已登录过一次，store 中存在真实 openid/token
//
// 运行（必须显式 LIVE=1，避免误把联调当验收）：
//   LIVE=1 DATA_DIR=/opt/zhongkao-pay-server/data node test/wxpay-live.cjs --mode=order
//   LIVE=1 DATA_DIR=/opt/zhongkao-pay-server/data node test/wxpay-live.cjs --mode=watch --order=ZK...
//   LIVE=1 DATA_DIR=/opt/zhongkao-pay-server/data node test/wxpay-live.cjs --mode=full --amount=1
//   LIVE=1 DATA_DIR=/opt/zhongkao-pay-server/data node test/wxpay-live.cjs --mode=close --order=ZK...
//
// 未设置 LIVE=1 时直接跳过并退出 0（不产生任何真实请求、不影响 CI）。
// 金额默认 1 分（联调），正式验收请用 --amount=990。
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const cfg = require('../src/config.js');
const store = require('../src/store.js');
const wxpay = require('../src/wxpay.js');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const MODE = arg('mode', 'full');
const TIMEOUT_MS = Number(arg('timeout', 300)) * 1000;
const AMOUNT = Number(arg('amount', process.env.LIVE_AMOUNT || 1));
const BASE = process.env.LIVE_BASE || 'http://127.0.0.1:8799';

const results = [];
function check(name, pass, detail) { results.push({ name, pass: !!pass, detail: detail || '' }); }

if (process.env.LIVE !== '1') {
  console.log('SKIP: 未设置 LIVE=1，真实联调脚本不执行（不会产生任何真实请求）。');
  process.exit(0);
}

// ---------- 工具 ----------
function localRequest(method, apiPath, headers, bodyStr) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + apiPath);
    const req = http.request({
      hostname: u.hostname, port: u.port || 80, path: u.pathname + u.search,
      method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {})
    }, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => {
        let parsed = null;
        try { parsed = d ? JSON.parse(d) : null; } catch (e) { /* ignore */ }
        resolve({ status: resp.statusCode, body: parsed, raw: d });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function wxRequest(method, apiPath, bodyStr) {
  return new Promise((resolve, reject) => {
    const auth = wxpay.buildAuthorization(method, apiPath, bodyStr || '');
    const req = https.request({
      hostname: 'api.mch.weixin.qq.com', port: 443, path: apiPath, method,
      headers: {
        'Content-Type': 'application/json', 'Authorization': auth,
        'Accept': 'application/json', 'User-Agent': 'zk-pay/1.0'
      }
    }, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => {
        let parsed = null;
        try { parsed = d ? JSON.parse(d) : null; } catch (e) { /* ignore */ }
        resolve({ status: resp.statusCode, body: parsed, raw: d });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function mask(v) {
  const s = String(v || '');
  return s.length <= 8 ? s.slice(0, 2) + '***' + s.slice(-2) : s.slice(0, 4) + '***' + s.slice(-4);
}

function readEvents(limit = 400) {
  const f = path.join(cfg.dataDir, 'events.jsonl');
  if (!fs.existsSync(f)) return [];
  const lines = fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).slice(-limit);
  return lines.map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 选一个真实用户（真机登录过才会有） ----------
function pickUser() {
  if (process.env.LIVE_OPENID) {
    const u = store.getUser(process.env.LIVE_OPENID);
    if (u && u.token) return u;
  }
  const db = store.read();
  const users = Object.values(db.users || {}).filter((u) => u && u.openid && u.token);
  if (!users.length) return null;
  return users[users.length - 1];
}

// ---------- 模式：下单 ----------
async function modeOrder() {
  const user = pickUser();
  if (!user) {
    check('选取真实用户', false, 'store 中无可用 openid/token；请先在真机小程序中登录一次');
    return null;
  }
  console.log(`[order] 使用用户 openid=${mask(user.openid)}  金额=${AMOUNT} 分  baseUrl=${cfg.baseUrl}`);
  if (cfg.priceFen !== AMOUNT) {
    console.log(`[order] 注意：当前服务端固定金额=${cfg.priceFen} 分，本次请求金额参数=${AMOUNT} 分。`);
    console.log('[order] 服务端以 priceFen 为准（P0-2：忽略客户端金额），如需 1 分联调请在 env 中设置 PAY_PRICE_FEN=1 后重启服务。');
  }
  const r = await localRequest('POST', '/api/pay/create',
    { Authorization: 'Bearer ' + user.token }, JSON.stringify({}));
  check('下单接口返回 200', r.status === 200, `HTTP ${r.status} ${r.raw}`);
  if (r.status !== 200) return null;
  const data = r.body || {};
  check('返回 prepay_id', !!data.prepayId, data.prepayId ? mask(data.prepayId) : '');
  check('返回支付参数 payParams', !!(data.payParams && data.payParams.paySign), '');
  console.log('[order] orderNo=' + data.orderNo);
  console.log('[order] payParams=' + JSON.stringify(data.payParams));
  console.log('[order] 请用真机小程序完成支付（或把上述 payParams 用于 wx.requestPayment）。');
  return data.orderNo;
}

// ---------- 模式：等待并校验 ----------
async function modeWatch(orderNo) {
  const user = pickUser();
  if (!user) { check('选取真实用户', false, 'store 中无可用 openid/token'); return; }
  if (!orderNo) { check('提供订单号', false, '缺少 --order'); return; }

  const started = Date.now();
  let local = null, wx = null;
  while (Date.now() - started < TIMEOUT_MS) {
    const q = await localRequest('GET', '/api/pay/query?orderNo=' + encodeURIComponent(orderNo),
      { Authorization: 'Bearer ' + user.token });
    if (q.status === 200 && q.body && (q.body.status === 'PAID' || q.body.status === 'REFUNDED')) {
      local = q.body; break;
    }
    await sleep(5000);
  }
  if (!local) {
    check('等待支付完成', false, `超时 ${TIMEOUT_MS / 1000}s 仍未付款（或订单不存在）`);
    return;
  }
  check('本地订单状态 PAID', local.status === 'PAID', `status=${local.status}`);
  check('本地权益已开通', local.entitled === true, `entitled=${local.entitled}`);

  // 微信侧查单核对
  const order = store.getOrder(orderNo);
  const p = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${encodeURIComponent(cfg.mchid)}`;
  wx = await wxRequest('GET', p, '');
  const b = wx.body || {};
  check('微信侧 trade_state=SUCCESS', b.trade_state === 'SUCCESS', `HTTP ${wx.status} ${b.trade_state || ''} ${b.message || ''}`);
  check('微信侧金额与本地订单一致',
    order && b.amount && Number(b.amount.total) === Number(order.amount),
    order ? `本地=${order.amount} 微信=${b.amount && b.amount.total}` : '本地订单缺失');
  check('微信侧 appid 一致', b.appid === cfg.appid, `${b.appid} vs ${cfg.appid}`);
  check('微信侧 mchid 一致', b.mchid === cfg.mchid, `${b.mchid} vs ${cfg.mchid}`);
  check('微信侧付款人与订单一致', !!(b.payer && order && b.payer.openid === order.openid),
    b.payer ? mask(b.payer.openid) + ' vs ' + mask(order && order.openid) : '');

  // 回调是否真的到达（真实支付验收的硬证据）
  const events = readEvents();
  const received = events.filter((e) => e.type === 'notify_received' && String(e.detail && e.detail.outTradeNo || '').includes(orderNo.slice(4, -4)));
  const paid = events.filter((e) => e.type === 'order_paid' && String(e.detail && e.detail.outTradeNo || '') === orderNo);
  check('收到微信回调（notify_received）', received.length > 0, `匹配 ${received.length} 条`);
  check('由回调开通权益（order_paid via=notify）',
    paid.some((e) => e.detail && e.detail.via === 'notify'),
    `order_paid ${paid.length} 条，via=${paid.map((e) => e.detail && e.detail.via).join(',') || '无'}`);
}

// ---------- 模式：关单（清理未支付订单） ----------
async function modeClose(orderNo) {
  if (!orderNo) { check('提供订单号', false, '缺少 --order'); return; }
  const r = await wxRequest('POST', `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}/close`,
    JSON.stringify({ mchid: cfg.mchid }));
  check('关单成功', r.status === 204 || r.status === 200, `HTTP ${r.status} ${r.raw}`);
}

(async () => {
  console.log('=== 真实微信支付联调 ===');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`模式: ${MODE}  金额参数: ${AMOUNT} 分  dataDir: ${cfg.dataDir}`);
  console.log(`paymentConfigured: ${cfg.paymentConfigured}  mchid: ${cfg.mchid || '<空>'}  appid: ${cfg.appid || '<空>'}`);
  if (!cfg.paymentConfigured) {
    check('支付配置就绪', false, 'paymentConfigured=false，无法联调；请先跑 install-wxpay-env.sh 与 check-wxpay-config.cjs');
  } else {
    if (MODE === 'order') await modeOrder();
    else if (MODE === 'watch') await modeWatch(arg('order', process.env.LIVE_ORDER || ''));
    else if (MODE === 'close') await modeClose(arg('order', process.env.LIVE_ORDER || ''));
    else {
      const no = await modeOrder();
      if (no) await modeWatch(no);
    }
  }

  console.log('--- 结果 ---');
  for (const r of results) console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  const fails = results.filter((r) => !r.pass);
  console.log(`--- 汇总: ${results.length} 项，FAIL ${fails.length} ---`);
  if (AMOUNT !== 990) {
    console.log(`注意：本次金额为 ${AMOUNT} 分，属联调小额。正式验收须用 990 分并另出报告。`);
  }
  process.exitCode = fails.length ? 1 : 0;
})();
