// pages/login/login.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    showPrivacyModal: false,
  },

  onLoad() {
    // 检查是否已有用户信息
    const userInfo = wx.getStorageSync('user_info') || {};
    this.setData({ userInfo });
  },

  // 获取用户信息
  onGetUserProfile(e) {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;

        this.setData({ userInfo });

        // 保存用户信息到本地存储
        wx.setStorageSync('user_info', userInfo);

        // 更新全局用户信息
        app.globalData.userInfo = userInfo;

        wx.showToast({
          title: '登录成功',
          icon: 'success',
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          this.goToHome();
        }, 1500);
      },
      fail: (err) => {
        console.log('获取用户信息失败:', err);
        wx.showToast({
          title: '授权失败',
          icon: 'none',
        });
      },
    });
  },

  // 跳过登录
  skipLogin() {
    wx.showModal({
      title: '提示',
      content: '跳过登录将无法使用云端同步等功能，确定要跳过吗？',
      success: (res) => {
        if (res.confirm) {
          this.goToHome();
        }
      },
    });
  },

  // 前往首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  // 显示隐私政策
  showPrivacyPolicy() {
    this.setData({ showPrivacyModal: true });
  },

  // 显示用户协议
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content:
        '1. 服务条款\n本小程序提供转盘抽取服务，用户应合理使用。\n\n2. 用户责任\n用户应对自己的行为负责，不得滥用服务。\n\n3. 服务变更\n我们保留随时修改或终止服务的权利。\n\n4. 免责声明\n本服务仅供娱乐，不承担任何决策责任。',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  // 隐藏隐私政策弹窗
  hidePrivacyModal() {
    this.setData({ showPrivacyModal: false });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '转盘抽取 - 让选择变得有趣',
      path: '/pages/index/index',
    };
  },
});
