// pages/my/my.js — 原生会员中心
const membership = require('../../services/membership.js');

Page({
  data: {
    stage: 'loading',
    isMember: false,
    expireText: '',
    orderNo: '',
    errorMsg: '',
    benefits: [
      { title: '完整志愿模拟填报', desc: '15 个普通高中志愿槽与梯度结构' },
      { title: '智能评分与五维分析', desc: '资格 / 结构 / 顺序等维度评分' },
      { title: '逐志愿录取机会', desc: '各志愿录取概率区间与去向预测' },
      { title: '可执行调整建议', desc: '针对性优化与风险提示' },
      { title: '报告导出与打印', desc: '方案 JSON 导出、PDF 报告' }
    ]
  },

  onShow() { this.loadStatus(); },

  async loadStatus() {
    this.setData({ stage: 'loading' });
    try {
      const user = await membership.refreshStatus();
      const member = membership.isMember();
      this.setData({
        stage: 'ready',
        isMember: member,
        orderNo: (user && user.orderNo) || '',
        expireText: member ? '长期有效' : ''
      });
      if (getApp().onMembershipChange) getApp().onMembershipChange(user);
    } catch (e) {
      this.setData({ stage: 'ready', isMember: membership.isMember(), errorMsg: e.message });
    }
  },

  goPay() { wx.navigateTo({ url: '/pages/pay/pay' }); },

  async restore() {
    wx.showLoading({ title: '同步中' });
    try {
      await this.loadStatus();
      wx.showToast({ title: '已同步', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message || '同步失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  openPrivacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }); },

  contact() {
    if (wx.openCustomerServiceConversation) {
      wx.openCustomerServiceConversation({ sessionFrom: 'miniprogram' });
    } else {
      wx.showModal({ title: '联系客服', content: '请在微信中搜索“品沐咨询”企业微信，或于公众号留言。', showCancel: false });
    }
  },

  goSimulate() { wx.switchTab({ url: '/pages/home/home' }); }
});
