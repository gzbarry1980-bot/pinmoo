// pages/pay/pay.js — 9.9 元会员付费解锁流程
const membership = require('../../services/membership.js');

Page({
  data: {
    productName: '广州中考志愿模拟会员',
    priceText: '9.9',
    benefits: [
      { title: '完整志愿模拟填报', desc: '15 个普通高中志愿槽与梯度结构' },
      { title: '智能评分与五维分析', desc: '资格 / 结构 / 顺序等维度评分' },
      { title: '逐志愿录取机会', desc: '各志愿录取概率区间与去向预测' },
      { title: '可执行调整建议', desc: '针对性优化与风险提示' },
      { title: '报告导出与打印', desc: '方案 JSON 导出、PDF 报告' }
    ],
    stage: 'idle', // idle | logging | ordering | paying | activating | refreshing | success | fail
    errorMsg: '',
    showPrivacy: false
  },

  onLoad() {
    const app = getApp();
    this.setData({
      productName: membership.productName(),
      priceText: (membership.priceFen() / 100).toFixed(1)
    });
  },

  openPrivacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); },

  noop() {},

  onPay() {
    if (this.data.stage === 'paying' || this.data.stage === 'ordering' || this.data.stage === 'logging') return;
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          if (res.needAuthorization) this.setData({ showPrivacy: true });
          else this.doPay();
        },
        fail: () => this.doPay()
      });
    } else {
      this.doPay();
    }
  },

  confirmPrivacy() {
    const that = this;
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => { that.setData({ showPrivacy: false }); that.doPay(); },
        fail: () => { that.setData({ showPrivacy: false }); }
      });
    } else {
      that.setData({ showPrivacy: false });
      that.doPay();
    }
  },

  cancelPrivacy() { this.setData({ showPrivacy: false }); },

  async doPay() {
    this.setData({ stage: 'logging', errorMsg: '' });
    const stageMap = {
      login: 'logging', order: 'ordering', paying: 'paying',
      activate: 'activating', refresh: 'refreshing'
    };
    try {
      const user = await membership.purchase((s) => this.setData({ stage: stageMap[s] || 'paying' }));
      if (membership.isMember()) {
        this.setData({ stage: 'success' });
        if (getApp().onMembershipChange) getApp().onMembershipChange(user);
      } else {
        this.setData({ stage: 'fail', errorMsg: '支付已完成，权益将在数秒内生效，可到“我的”恢复购买同步。' });
      }
    } catch (e) {
      const canceled = e && (e.errCode === -2 || (e.errMsg || '').indexOf('cancel') >= 0);
      this.setData({ stage: 'fail', errorMsg: canceled ? '你已取消支付' : (e.message || '支付失败，请重试') });
    }
  },

  goSimulate() { wx.switchTab({ url: '/pages/home/home' }); },
  goMy() { wx.switchTab({ url: '/pages/my/my' }); }
});
