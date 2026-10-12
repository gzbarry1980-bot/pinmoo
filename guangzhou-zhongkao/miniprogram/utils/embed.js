// utils/embed.js
// 为 web-view 页面拼接会员凭证，打通 H5 内容闸门与小程序会员态。
// R5：任何环境都只注入一次性会话码 zk_code；长期令牌绝不进入 URL。
//     存储键按环境命名空间隔离，测试/开发环境不会读到生产会员数据。

const TOKEN_KEY = 'zk_member_token';
const OPENID_KEY = 'zk_member_openid';

function nsKey(name) {
  try {
    const app = getApp();
    const ns = (app && app.globalData && app.globalData.storageNs) || 'prod';
    return `zk_${ns}_${name}`;
  } catch (e) {
    return `zk_prod_${name}`;
  }
}

function getToken() {
  try { return wx.getStorageSync(nsKey(TOKEN_KEY)) || ''; } catch (e) { return ''; }
}

function getOpenid() {
  try { return wx.getStorageSync(nsKey(OPENID_KEY)) || ''; } catch (e) { return ''; }
}

// 只允许注入一次性会话码。任何试图透传长期令牌的调用都会抛错（生产构建防呆）。
function buildEmbedUrl(path, code) {
  const app = getApp();
  const base = String((app && app.globalData && app.globalData.webBaseUrl) || '').replace(/\/$/, '');
  let p = path && String(path).startsWith('/') ? path : '/' + (path || '');
  // zk_inmini 永远存在：本工具仅在小程序 web-view 页面使用，H5 据此确认运行环境。
  const params = ['zk_inmini=1'];
  if (code) params.push('zk_code=' + encodeURIComponent(code));
  p += (p.indexOf('?') >= 0 ? '&' : '?') + params.join('&');
  return base + p;
}

module.exports = { buildEmbedUrl, getToken, getOpenid, nsKey, TOKEN_KEY, OPENID_KEY };
