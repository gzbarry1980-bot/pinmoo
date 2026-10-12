// services/membership.js
// 会员与微信支付服务（小程序端）。
// 流程：wx.login 换 openid/token -> 本地缓存 -> 下单(/api/pay/create)
//       -> wx.requestPayment -> 后端异步通知开通 -> 前端激活/刷新权益。
// 所有请求都带 Bearer token；web-view 通过 utils/embed.js 透传 token 给 H5。

const { getToken, getOpenid, nsKey } = require('../utils/embed.js');

const TOKEN_KEY = 'zk_member_token';
const OPENID_KEY = 'zk_member_openid';
const USER_KEY = 'zk_member_user';

// R5：存储键按环境命名空间隔离，测试/开发不会读到生产会员数据。
function key(name) { return nsKey(name); }

function apiBase() {
  const app = getApp();
  const base = String((app && app.globalData && app.globalData.dataBaseUrl) || '').replace(/\/$/, '');
  return base + '/api';
}

function priceFen() {
  const app = getApp();
  return (app && app.globalData && app.globalData.payPriceFen) || 990;
}

function productName() {
  const app = getApp();
  return (app && app.globalData && app.globalData.payProductName) || '广州中考志愿模拟会员';
}

// R5：商户配置缺失（503）时给出明确文案，不让用户沿不可完成的链路付款。
function normalizeError(err, statusCode) {
  if (statusCode === 503) return new Error('暂未开放购买，请稍后再来');
  const raw = (err && err.message) || '';
  if (typeof raw === 'string' && raw.indexOf('未配置') >= 0) return new Error('暂未开放购买，请稍后再来');
  return err;
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request(Object.assign({ timeout: 15000, dataType: 'json' }, options, {
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject(normalizeError(new Error((res.data && res.data.message) || ('网络请求失败 ' + res.statusCode)), res.statusCode));
      },
      fail: (err) => reject(new Error((err && err.errMsg) || '网络错误'))
    }));
  });
}

function saveSession(token, openid, user) {
  try {
    if (token) wx.setStorageSync(key(TOKEN_KEY), token);
    if (openid) wx.setStorageSync(key(OPENID_KEY), openid);
    if (user) wx.setStorageSync(key(USER_KEY), user);
  } catch (e) { /* 隐私模式忽略 */ }
}

function getLocalUser() {
  try { return wx.getStorageSync(key(USER_KEY)) || null; } catch (e) { return null; }
}

function clearSession() {
  try {
    wx.removeStorageSync(key(TOKEN_KEY));
    wx.removeStorageSync(key(OPENID_KEY));
    wx.removeStorageSync(key(USER_KEY));
  } catch (e) {}
}

// 环境校验未通过时，任何购买动作都必须停下。
function assertEnvSafe() {
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.envSafe === false) {
      throw new Error('当前运行环境未通过校验，已停用支付');
    }
  } catch (e) {
    if (e && e.message && e.message.indexOf('未通过校验') >= 0) throw e;
  }
}

// 确保已登录并拿到 token / openid；本地已有则直接返回。
async function ensureLogin() {
  const local = getLocalUser();
  const token = getToken();
  if (local && local.openid && token) return local;
  const login = await new Promise((resolve, reject) => {
    wx.login({ success: resolve, fail: reject });
  });
  if (!login || !login.code) throw new Error('微信登录失败，请重试');
  const data = await request({
    url: apiBase() + '/auth/login',
    method: 'POST',
    data: { code: login.code, product: 'zk-vip' }
  });
  if (!data || !data.token || !data.openid) throw new Error('登录服务异常');
  const user = Object.assign({}, local, {
    openid: data.openid,
    token: data.token,
    entitled: !!data.entitled,
    vipExpireAt: data.vipExpireAt || null,
    orderNo: data.orderNo || null
  });
  saveSession(data.token, data.openid, user);
  return getLocalUser();
}

function isMember() {
  const u = getLocalUser();
  if (!u) return false;
  if (u.vipExpireAt) return Date.now() < Number(u.vipExpireAt);
  return !!u.entitled;
}

async function createOrder() {
  assertEnvSafe();
  const user = await ensureLogin();
  // P0-2：身份与金额完全由服务端决定（令牌 + 固定 990 分），不发送 openid / amount 给后端。
  const data = await request({
    url: apiBase() + '/pay/create',
    method: 'POST',
    header: { 'Authorization': 'Bearer ' + getToken() },
    data: {}
  });
  if (!data || !data.payParams) throw new Error('创建订单失败');
  return data; // { orderNo, prepayId, payParams }
}

async function activate(orderNo) {
  const data = await request({
    url: apiBase() + '/membership/activate',
    method: 'POST',
    header: { 'Authorization': 'Bearer ' + getToken() },
    data: { orderNo: orderNo || '' }
  });
  if (data && data.user) {
    saveSession(getToken(), getOpenid(), Object.assign({}, getLocalUser(), data.user));
  }
  return data;
}

async function refreshStatus() {
  const user = await ensureLogin();
  // P0-5：身份仅由令牌确定，不再以 openid 作为查询参数兜底。
  const data = await request({
    url: apiBase() + '/membership/status',
    method: 'GET',
    header: { 'Authorization': 'Bearer ' + getToken() }
  });
  if (data && data.user) {
    saveSession(getToken(), user.openid, Object.assign({}, getLocalUser(), data.user));
  }
  return getLocalUser();
}

// R5：伪支付通道已彻底移除，正式后端不再注册任何模拟支付接口。
// 任何调用方都不得再走模拟支付闭环，否则属于回归缺陷。

// P0-5：用长期令牌换一次性会话码，供 web-view URL 透传，避免把长期令牌放进 URL / 日志。
async function requestSessionCode() {
  const user = await ensureLogin();
  const data = await request({
    url: apiBase() + '/auth/session-code',
    method: 'POST',
    header: { 'Authorization': 'Bearer ' + getToken() }
  });
  if (!data || !data.code) throw new Error('获取会话码失败');
  return data.code;
}

// 完整购买流程：登录 -> 下单 -> 拉起支付 -> 激活(乐观) -> 刷新
async function purchase(onProgress) {
  const report = (s) => { if (onProgress && typeof onProgress === 'function') onProgress(s); };
  assertEnvSafe();
  report('login');
  await ensureLogin();
  report('order');
  const order = await createOrder();
  report('paying');
  // R5：只有真实 wx.requestPayment 一条链路，不存在 mock 分支。
  await new Promise((resolve, reject) => {
    wx.requestPayment(Object.assign({}, order.payParams, {
      success: resolve,
      fail: (err) => reject(err)
    }));
  });
  report('activate');
  try { await activate(order.orderNo); } catch (e) { /* 微信回调会兜底开通 */ }
  report('refresh');
  await refreshStatus();
  return getLocalUser();
}

module.exports = {
  ensureLogin,
  isMember,
  createOrder,
  activate,
  refreshStatus,
  requestSessionCode,
  purchase,
  getLocalUser,
  clearSession,
  getToken,
  getOpenid,
  priceFen,
  productName
};
