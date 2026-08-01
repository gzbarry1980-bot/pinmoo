Page({
  data: { src: '', error: '' },
  onLoad(options) {
    const app = getApp();
    const base = String((app.globalData && app.globalData.webBaseUrl) || '').replace(/\/$/, '');
    const rawPath = options && options.path ? decodeURIComponent(options.path) : '/';
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    this.setData({ src: `${base}${path}` });
  },
  onError() { this.setData({ error: '网页端暂时无法打开，请检查业务域名配置。' }); }
});
