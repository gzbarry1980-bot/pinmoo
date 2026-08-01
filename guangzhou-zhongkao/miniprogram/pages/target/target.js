Page({
  data: { src: '', error: '' },
  onLoad() { this.setWebviewUrl('/target/'); },
  setWebviewUrl(path) { const app = getApp(); const base = String((app.globalData && app.globalData.webBaseUrl) || '').replace(/\/$/, ''); this.setData({ src: `${base}${path}`, error: '' }); },
  onWebError() { this.setData({ error: '完整版页面暂时无法打开，请检查小程序业务域名配置。' }); },
  retry() { this.setWebviewUrl('/target/'); }
});
