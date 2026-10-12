// utils/webpage.js
// 统一的 web-view 页面工厂：打开网页版并透传会员凭证；
// 当会员令牌/权益态变化时自动刷新 web-view，确保内容闸门状态同步。
// R5：不再存在「预览模式透传长期令牌」分支，任何环境都走一次性会话码。
const { buildEmbedUrl, getToken } = require('./embed.js');
const membership = require('../services/membership.js');

function createWebPage(getPath, errorMsg) {
  return {
    data: { src: '', error: '' },
    onLoad(options) {
      this._path = getPath(options);
      this._lastToken = getToken();
      this._lastEntitled = this.readEntitled();
      this.open();
    },
    onShow() {
      this.maybeRefresh();
    },
    readEntitled() {
      try {
        const app = getApp();
        const u = wx.getStorageSync(app.storageKey('zk_member_user'));
        return !!(u && u.entitled);
      } catch (e) { return false; }
    },
    async open() {
      // 一次性会话码由服务端签发，60 秒有效、消费一次即作废；取不到就无码打开，
      // 旧序列号用户仍可凭 8787 的 Cookie 通过。
      let code = '';
      try { code = await membership.requestSessionCode(); } catch (e) { /* 未登录 / 取码失败时降级为无码打开 */ }
      const src = buildEmbedUrl(this._path || '/', code);
      this.setData({ src, error: '' });
      this._lastToken = getToken();
      this._lastEntitled = this.readEntitled();
    },
    // 令牌或会员态发生变化时重载，确保支付成功后打码及时解除
    maybeRefresh() {
      const t = getToken();
      const e = this.readEntitled();
      if (t !== this._lastToken || e !== this._lastEntitled) {
        this._lastToken = t;
        this._lastEntitled = e;
        this.open();
      }
    },
    onWebError() {
      this.setData({ error: errorMsg || '完整版页面暂时无法打开，请检查小程序业务域名配置。' });
    },
    retry() {
      this.open();
    }
  };
}

module.exports = { createWebPage };
