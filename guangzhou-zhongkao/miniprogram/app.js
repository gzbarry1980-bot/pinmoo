App({
  globalData: {
    // 正式发布前替换为已备案、已配置为 request 合法域名的 HTTPS 域名。
    dataBaseUrl: 'https://zhongkao.pinmooconsulting.com',
    webBaseUrl: 'https://zhongkao.pinmooconsulting.com',
    dataVersion: '20260722-d38b3ec0',
    accessMode: 'experience'
  },
  onLaunch() {
    try {
      const saved = wx.getStorageSync('miniDataBaseUrl');
      if (saved) this.globalData.dataBaseUrl = saved;
    } catch (error) {
      // 隐私模式或开发工具禁用存储时继续使用默认地址。
    }
  }
});
