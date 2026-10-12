#!/usr/bin/env node
// 微信支付真实配置自检 —— 联调前的第一道闸。
//
// 目的：在真机下单之前，把所有「配置类」问题一次性暴露，避免把配置错误误判成代码缺陷。
// 检查分三层：
//   L1 本地存在性与格式（凭证齐全、PEM 可解析、长度/字符集正确）
//   L2 本地自洽（私钥可签名、平台公钥确实是公钥、平台公钥≠商户证书公钥）
//   L3 在线探针（Authorization 是否被微信接受、回调 URL 是否可达）
//
// 用法：
//   node scripts/check-wxpay-config.cjs                 # 本地 + 在线探针
//   node scripts/check-wxpay-config.cjs --offline       # 只做本地检查
//   node scripts/check-wxpay-config.cjs --probe-order   # 额外做一次假 openid 下单探针（诊断 appid↔mchid 绑定）
//
// 退出码：0 全部通过；1 有 FAIL；2 有 WARN 但无 FAIL 且 --strict
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cfg = require('../src/config.js');
const wxpay = require('../src/wxpay.js');

const argv = process.argv.slice(2);
const OFFLINE = argv.includes('--offline');
const PROBE_ORDER = argv.includes('--probe-order');
const STRICT = argv.includes('--strict');

const results = [];
function add(level, name, pass, detail) {
  results.push({ level, name, pass, detail: detail || '' });
}
function check(name, pass, detail) { add('CHECK', name, !!pass, detail); }
function warn(name, pass, detail) { add('WARN', name, !!pass, detail); }

// ---------- L1 存在性与格式 ----------
const REQUIRED = [
  ['WX_APPID', cfg.appid],
  ['WX_APPSECRET', cfg.appSecret],
  ['WX_MCHID', cfg.mchid],
  ['WX_MCH_SERIAL', cfg.serialNo],
  ['WX_MCH_PRIVATE_KEY', cfg.privateKey],
  ['WX_API_V3_KEY', cfg.apiV3Key],
  ['WX_PLATFORM_PUBLIC_KEY', cfg.platformPublicKey]
];
for (const [k, v] of REQUIRED) {
  check(`存在 ${k}`, !!v, v ? '' : '未提供，paymentConfigured 将为 false，下单返回 503');
}

check('paymentConfigured', !!cfg.paymentConfigured,
  cfg.paymentConfigured ? '七项关键配置齐全' : '不全：下单接口将返回 503「支付服务未配置」');

check('appid 格式', /^wx[0-9a-zA-Z]{16}$/.test(cfg.appid || ''),
  cfg.appid ? `当前=${cfg.appid}（期望 wx 开头共 18 位）` : '');
check('mchid 格式', /^\d{10}$/.test(cfg.mchid || ''),
  cfg.mchid ? `当前=${cfg.mchid}（期望 10 位数字）` : '');
check('商户证书序列号格式', /^[0-9A-Fa-f]{40}$/.test(cfg.serialNo || ''),
  cfg.serialNo ? `当前=${cfg.serialNo}（期望 40 位十六进制）` : '');
check('APIv3 密钥长度 32 字节', Buffer.byteLength(cfg.apiV3Key || '', 'utf8') === 32,
  cfg.apiV3Key ? `当前 ${Buffer.byteLength(cfg.apiV3Key, 'utf8')} 字节` : '');
warn('金额 PAY_PRICE_FEN', cfg.priceFen === 990 || String(process.env.PAY_PRICE_FEN || '') !== '',
  `当前=${cfg.priceFen} 分（正式应为 990；联调期可临时设 1 分，联调后必须改回）`);
check('DEMO_ENABLED 为 false（正式环境）', cfg.demoEnabled === false,
  `当前=${cfg.demoEnabled}`);

// ---------- L2 本地自洽 ----------
let merchantPubFingerprint = null;
if (cfg.privateKey) {
  let signed = false, signErr = '';
  try {
    const s = crypto.createSign('RSA-SHA256');
    s.update('zk-pay self check');
    const sig = s.sign(cfg.privateKey, 'base64');
    // 用私钥导出的公钥自验，证明 PEM 内容完好可用
    const pub = crypto.createPublicKey(cfg.privateKey).export({ type: 'spki', format: 'pem' });
    const v = crypto.createVerify('RSA-SHA256');
    v.update('zk-pay self check');
    signed = v.verify(pub, sig, 'base64');
    merchantPubFingerprint = crypto.createHash('sha256').update(String(pub)).digest('hex').slice(0, 16);
  } catch (e) {
    signErr = e.message;
  }
  check('商户私钥可用（签名并自验通过）', signed, signErr ? `PEM 解析/签名失败：${signErr}` : '私钥完好，可正常生成 RSA-SHA256 签名');
  check('私钥为 RSA 密钥', (() => {
    try { return crypto.createPrivateKey(cfg.privateKey).asymmetricKeyType === 'rsa'; } catch (e) { return false; }
  })(), '微信支付 v3 要求 RSA 2048');
}

if (cfg.platformPublicKey) {
  let isPub = false, type = '', fp = null;
  try {
    const k = crypto.createPublicKey(cfg.platformPublicKey);
    isPub = k.type === 'public';
    type = k.asymmetricKeyType;
    fp = crypto.createHash('sha256').update(k.export({ type: 'spki', format: 'pem' }).toString()).digest('hex').slice(0, 16);
  } catch (e) { /* ignore */ }
  check('平台公钥可解析且为公钥', isPub, isPub ? `类型=${type}` : '无法解析为公钥 PEM（注意：应为微信支付**平台公钥/平台证书**，不是商户证书）');
  // 常见致命错误：把商户证书公钥当成平台公钥
  if (isPub && merchantPubFingerprint && fp === merchantPubFingerprint) {
    check('平台公钥 ≠ 商户证书公钥', false,
      '两者指纹相同，说明误把 apiclient_cert.pem 当作平台公钥。必须换成微信支付平台公钥（商户平台→API安全→平台证书/微信支付公钥）');
  } else if (isPub && merchantPubFingerprint) {
    check('平台公钥 ≠ 商户证书公钥', true, `商户证书指纹=${merchantPubFingerprint}，平台公钥指纹=${fp}`);
  }
  // 验签能力自检（用自己的私钥签，平台公钥必然验不过，此处只验证 verify 调用不被底层拒绝）
  let verifyCallable = false;
  try {
    const s = crypto.createSign('RSA-SHA256'); s.update('x');
    const sig = s.sign(cfg.privateKey, 'base64');
    const v = crypto.createVerify('RSA-SHA256'); v.update('x');
    v.verify(cfg.platformPublicKey, sig, 'base64'); // 期望 false，只要不抛错即可
    verifyCallable = true;
  } catch (e) { /* ignore */ }
  check('回调验签链路可调用', verifyCallable, verifyCallable ? 'verifyNotify 底层调用正常' : '验签调用抛错，检查平台公钥格式');
}

// ---------- 小程序侧一致性 ----------
const mpRoot = path.join(__dirname, '..', '..', 'miniprogram');
if (!fs.existsSync(mpRoot)) {
  // 服务器部署目录不含小程序源码，该检查只在本地仓库有意义，跳过而不误报。
  add('WARN', '小程序侧一致性检查', true, `未找到 ${mpRoot}（服务器部署目录通常不含小程序源码），跳过；请在本地仓库执行本检查`);
}
if (fs.existsSync(mpRoot)) {
  try {
    const appJs = fs.readFileSync(path.join(mpRoot, 'app.js'), 'utf8');
    const embed = fs.readFileSync(path.join(mpRoot, 'utils', 'embed.js'), 'utf8');
    check('小程序生产配置 payMock 为 false', !/production:\s*\{[^}]*payMock:\s*true/s.test(appJs), '');
    check('小程序不注入长期令牌 zk_token', !/zk_token/.test(embed), '');
    const m = appJs.match(/PRODUCTION_HOST\s*=\s*['"]([^'"]+)['"]/);
    if (m && cfg.baseUrl) {
      const hostOk = cfg.baseUrl.includes(m[1]);
      check('PUBLIC_BASE_URL 与小程序业务域名一致', hostOk, `baseUrl=${cfg.baseUrl}，小程序=${m[1]}`);
    }
  } catch (e) {
    warn('小程序侧一致性检查', false, '读取失败：' + e.message);
  }
}

// ---------- L3 在线探针 ----------
function httpsJson(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => {
        let parsed = null;
        try { parsed = d ? JSON.parse(d) : null; } catch (e) { /* ignore */ }
        resolve({ status: resp.statusCode, body: parsed, raw: d, headers: resp.headers });
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function wxRequest(method, apiPath, bodyStr) {
  const auth = wxpay.buildAuthorization(method, apiPath, bodyStr || '');
  return httpsJson({
    hostname: 'api.mch.weixin.qq.com', port: 443, path: apiPath, method,
    headers: {
      'Content-Type': 'application/json', 'Authorization': auth,
      'Accept': 'application/json', 'User-Agent': 'zk-pay/1.0'
    }
  }, bodyStr);
}

async function onlineProbes() {
  if (!cfg.paymentConfigured) {
    add('CHECK', '在线探针（Authorization）', false, '配置不全，跳过；补齐后重跑');
    return;
  }

  // Probe A：平台证书下载接口。200 = 商户私钥 + 证书序列号被微信接受。
  try {
    const r = await wxRequest('GET', '/v3/certificates', '');
    const code = r.body && r.body.code;
    check('在线探针 A：/v3/certificates 签名被接受', r.status === 200,
      r.status === 200 ? 'Authorization 有效，私钥与证书序列号匹配'
        : `HTTP ${r.status} ${code || ''} ${(r.body && r.body.message) || ''}` +
          (r.status === 401 ? ' → 多为私钥与证书序列号不匹配、或服务器时间偏差超过 5 分钟' : ''));
  } catch (e) {
    check('在线探针 A：/v3/certificates 签名被接受', false, '网络异常：' + e.message);
  }

  // Probe B：查询一个必定不存在的订单。404 = 鉴权通过（只是没有该订单）；401 = 鉴权失败。
  const noOrder = 'ZKNOPE' + Date.now();
  try {
    const p = `/v3/pay/transactions/out-trade-no/${noOrder}?mchid=${encodeURIComponent(cfg.mchid)}`;
    const r = await wxRequest('GET', p, '');
    const code = r.body && r.body.code;
    check('在线探针 B：查单接口鉴权通过', r.status === 404 || r.status === 200,
      `HTTP ${r.status} ${code || ''} ${(r.body && r.body.message) || ''}` +
        (r.status === 404 ? '（预期：订单不存在即证明鉴权通过）' : '') +
        (r.status === 401 ? ' → 鉴权失败，检查私钥/序列号/服务器时间' : ''));
  } catch (e) {
    check('在线探针 B：查单接口鉴权通过', false, '网络异常：' + e.message);
  }

  // Probe C（可选）：假 openid 下单，用于诊断 appid 与 mchid 是否已绑定。
  if (PROBE_ORDER) {
    const outTradeNo = 'ZKCHK' + Date.now();
    const body = JSON.stringify({
      appid: cfg.appid, mchid: cfg.mchid, description: '配置自检',
      out_trade_no: outTradeNo,
      notify_url: cfg.baseUrl.replace(/\/$/, '') + '/api/pay/notify',
      amount: { total: 1, currency: 'CNY' },
      payer: { openid: 'oSELFCHECK0000000000000000000000' }
    });
    try {
      const r = await wxRequest('POST', '/v3/pay/transactions/jsapi', body);
      const code = r.body && r.body.code;
      // 假 openid 必然失败；我们只看错误码区分「未绑定」与「参数问题」
      const bound = code !== 'APPID_MCHID_NOT_MATCH' && r.status !== 401 && r.status !== 403;
      check('在线探针 C：appid 与 mchid 绑定', bound,
        `HTTP ${r.status} ${code || ''} ${(r.body && r.body.message) || ''}` +
          (code === 'APPID_MCHID_NOT_MATCH' ? ' → 需在微信支付商户平台「AppID账号管理」绑定该小程序' : ''));
    } catch (e) {
      check('在线探针 C：appid 与 mchid 绑定', false, '网络异常：' + e.message);
    }
  }

  // Probe D：回调 URL 可达性。微信只能走公网 HTTPS 打回来，这里模拟一次 POST。
  try {
    const u = new URL(cfg.baseUrl.replace(/\/$/, '') + '/api/pay/notify');
    const r = await httpsJson({
      hostname: u.hostname, port: 443, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/4.0 zk-pay-selfcheck' }
    }, JSON.stringify({ id: 'selfcheck', resource: {} }));
    check('回调 URL 公网可达（HTTPS）', r.status === 200,
      `${u.href} → HTTP ${r.status}。期望 200（验签失败也返回 200 + code:FAIL，微信才不会判定通知失败）`);
    if (r.status === 404) {
      warn('回调路由被 nginx 丢弃', false, 'HTTP 404：检查 nginx 是否存在 = /api/pay/notify 精确路由且已 reload');
    }
    if (r.status === 429) {
      warn('回调被限流', false, 'HTTP 429：回调路由不得挂 limit_req，否则微信重试会拖慢开通');
    }
  } catch (e) {
    check('回调 URL 公网可达（HTTPS）', false, '网络异常：' + e.message);
  }
}

(async () => {
  if (!OFFLINE) await onlineProbes();

  const fails = results.filter((r) => r.level === 'CHECK' && !r.pass);
  const warns = results.filter((r) => r.level === 'WARN' && !r.pass);
  console.log('=== 微信支付配置自检 ===');
  console.log(`时间: ${new Date().toISOString()}  模式: ${OFFLINE ? 'offline' : 'online'}${PROBE_ORDER ? ' +probe-order' : ''}`);
  for (const r of results) {
    const mark = r.pass ? (r.level === 'WARN' ? 'WARN' : 'PASS') : (r.level === 'WARN' ? 'WARN' : 'FAIL');
    console.log(`[${mark}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  }
  console.log(`--- 汇总: ${results.length} 项，FAIL ${fails.length}，WARN ${warns.length} ---`);
  if (fails.length) {
    console.log('结论：配置未就绪，真实支付联调不能开始。');
    process.exitCode = 1;
  } else if (STRICT && warns.length) {
    console.log('结论：配置可用，但存在告警（--strict 视为失败）。');
    process.exitCode = 2;
  } else {
    console.log('结论：配置就绪，可进入真实支付联调。');
    process.exitCode = 0;
  }
})();
