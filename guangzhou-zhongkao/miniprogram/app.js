// 小程序运行环境配置（R5：开发 / 测试 / 生产严格分离）
// ------------------------------------------------------------------
// BUILD_ENV 是发版前唯一需要确认的开关，取值：'production' | 'test' | 'development'。
// - production 必须 payMock=false、域名为正式 HTTPS、不得出现 mock 路径或长期令牌透传。
// - test/development 指向独立后端与本地站点，且禁止复用生产会员数据与生产存储键。
// 任何一条不满足：运行时拒绝发起支付，构建脚本 scripts/assert-env.cjs 直接以非 0 退出。

const PRODUCTION_HOST = 'zhongkao.pinmooconsulting.com';

const ENV_PROFILES = {
  production: {
    label: '生产',
    dataBaseUrl: 'https://zhongkao.pinmooconsulting.com',
    webBaseUrl: 'https://zhongkao.pinmooconsulting.com',
    payMock: false,
    storageNs: 'prod'
  },
  test: {
    label: '测试',
    dataBaseUrl: 'http://127.0.0.1:8799',
    webBaseUrl: 'http://127.0.0.1:8799',
    payMock: false,
    storageNs: 'test'
  },
  development: {
    label: '开发',
    dataBaseUrl: 'http://127.0.0.1:8799',
    webBaseUrl: 'http://127.0.0.1:8799',
    payMock: false,
    storageNs: 'dev'
  }
};

// ⚠️ 发版前确认：提审 / 上传体验版之外的正式发布必须为 'production'。
const BUILD_ENV = 'production';

function assertEnv(name, profile) {
  const problems = [];
  const isProd = name === 'production';
  const hosts = [profile.dataBaseUrl, profile.webBaseUrl];

  if (isProd) {
    if (profile.payMock) problems.push('生产环境禁止 payMock');
    hosts.forEach((u) => {
      if (!/^https:\/\//.test(u)) problems.push('生产环境必须使用 HTTPS：' + u);
      if (/mock/i.test(u)) problems.push('生产环境 URL 不得包含 mock 路径：' + u);
      if (/127\.0\.0\.1|localhost/i.test(u)) problems.push('生产环境不得指向回环地址：' + u);
    });
    if (profile.storageNs !== 'prod') problems.push('生产环境存储命名空间必须为 prod');
  } else {
    hosts.forEach((u) => {
      if (u.includes(PRODUCTION_HOST)) problems.push('测试/开发环境不得复用生产域名（会串用生产会员数据）：' + u);
    });
    if (profile.payMock) problems.push('测试/开发环境同样禁止 payMock（已无 mock 支付接口）');
  }
  return problems;
}

const ENV = ENV_PROFILES[BUILD_ENV] || ENV_PROFILES.production;
const ENV_PROBLEMS = assertEnv(BUILD_ENV, ENV);

App({
  globalData: {
    buildEnv: BUILD_ENV,
    envLabel: ENV.label,
    envProblems: ENV_PROBLEMS,
    // 环境校验未通过时，支付链路必须整体停用（不允许沿不可完成的链路付款）
    envSafe: ENV_PROBLEMS.length === 0,
    dataBaseUrl: ENV.dataBaseUrl,
    webBaseUrl: ENV.webBaseUrl,
    storageNs: ENV.storageNs,
    dataVersion: '20260722-d38b3ec0',
    accessMode: 'experience',
    // 9.9 元会员付费配置（金额以服务端为准，这里仅用于展示）
    payPriceFen: 990,
    payProductName: '广州中考志愿模拟会员',
    payMock: false, // R5：任何环境都不再存在 mock 支付通道
    memberUser: null
  },
  onLaunch() {
    if (ENV_PROBLEMS.length) {
      console.error('[env] 运行环境校验失败，已停用支付链路：', ENV_PROBLEMS);
    }
    try {
      // 测试/开发允许在开发者工具里覆盖后端地址，但禁止覆盖成生产域名。
      const saved = wx.getStorageSync(this.storageKey('miniDataBaseUrl'));
      if (saved && !String(saved).includes(PRODUCTION_HOST)) this.globalData.dataBaseUrl = saved;
    } catch (error) {
      // 隐私模式或开发工具禁用存储时继续使用默认地址。
    }
  },
  storageKey(name) {
    return `zk_${this.globalData.storageNs}_${name}`;
  },
  // 会员状态变化时由各页面调用，便于全局同步。
  onMembershipChange(user) {
    this.globalData.memberUser = user || null;
  }
});
