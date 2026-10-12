// server/src/config.js
// 配置加载：环境变量优先，其次 config.json；二者皆无时使用占位默认值。
// 注意：真实商户密钥严禁进入代码仓库；生产环境通过环境变量注入。
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const env = process.env;
  let file = {};
  try {
    file = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));
  } catch (e) {
    file = {};
  }

  const c = {
    port: Number(env.PORT || file.port || 8799),
    // 监听地址。生产必须 127.0.0.1：支付接口只经 nginx 暴露，避免绕过限流/HTTPS 直连后端。
    host: env.HOST || file.host || '127.0.0.1',
    appid: env.WX_APPID || file.appid || '',
    appSecret: env.WX_APPSECRET || file.appSecret || '',
    mchid: env.WX_MCHID || file.mchid || '',
    serialNo: env.WX_MCH_SERIAL || file.serialNo || '',
    privateKey: env.WX_MCH_PRIVATE_KEY || file.privateKey || '',
    apiV3Key: env.WX_API_V3_KEY || file.apiV3Key || '',
    platformPublicKey: env.WX_PLATFORM_PUBLIC_KEY || file.platformPublicKey || '',
    jwtSecret: env.JWT_SECRET || file.jwtSecret || 'change-me-in-prod',
    baseUrl: env.PUBLIC_BASE_URL || file.baseUrl || 'https://zhongkao.pinmooconsulting.com',
    productName: env.PAY_PRODUCT_NAME || file.productName || '广州中考志愿模拟会员',
    priceFen: Number(env.PAY_PRICE_FEN || file.priceFen || 990),
    dataDir: env.DATA_DIR || path.join(__dirname, '..', 'data'),

    // P0-4：旧序列号后端（8787）地址，统一权益查询时做服务端代理。
    serialBackendUrl: env.SERIAL_BACKEND_URL || file.serialBackendUrl || 'http://127.0.0.1:8787',

    // P0-1：浏览器本地演示开关。正式环境必须为 false，禁止仅凭 accessMode 显示伪支付演示入口。
    // 仅本地预览 / 隔离测试环境显式置 true。
    demoEnabled: String(env.DEMO_ENABLED || file.demoEnabled || 'false') === 'true',

    // P0-5：会员令牌有效期（天）。过期需重新登录换取，避免长期令牌泄露风险。
    tokenTTLDays: Number(env.TOKEN_TTL_DAYS || file.tokenTTLDays || 30),

    // R2：H5 网页会话有效期（天）。一次性码交换后建立，过期需重新登录恢复。
    webSessionTTLDays: Number(env.WEB_SESSION_TTL_DAYS || file.webSessionTTLDays || 30),
    // 网页会话 Cookie 是否带 Secure。生产全站 HTTPS，默认开启；本地 http 调试可置 false。
    cookieSecure: String(env.COOKIE_SECURE || file.cookieSecure || 'true') === 'true',

    // P0-5：web-view 单次会话凭证有效期（秒）。一次性使用，过期即作废，不进 URL 长期驻留。
    sessionCodeTTLSec: Number(env.SESSION_CODE_TTL_SEC || file.sessionCodeTTLSec || 60),

    // P0-2：限流默认参数（每令牌/IP 每分钟）。
    rateLimit: {
      windowMs: Number(env.RATE_WINDOW_MS || file.rateLimit?.windowMs || 60000),
      max: Number(env.RATE_MAX || file.rateLimit?.max || 20)
    }
  };

  // 私钥 / 平台公钥：若配置的是文件路径则读取内容
  if (c.privateKey && !c.privateKey.includes('-----BEGIN')) {
    try { c.privateKey = fs.readFileSync(c.privateKey, 'utf8'); } catch (e) { /* ignore */ }
  }
  if (c.platformPublicKey && !c.platformPublicKey.includes('-----BEGIN')) {
    try { c.platformPublicKey = fs.readFileSync(c.platformPublicKey, 'utf8'); } catch (e) { /* ignore */ }
  }

  // 真实支付能力是否就绪：商户关键配置齐全才允许下单，否则服务端拒绝并提示“未配置”。
  c.paymentConfigured =
    !!(c.appid && c.appSecret && c.mchid && c.serialNo && c.privateKey && c.apiV3Key && c.platformPublicKey);

  return c;
}

module.exports = loadConfig();
