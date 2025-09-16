// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    statistics: {
      totalSets: 0,
      totalItems: 0,
      totalSpins: 0,
      todaySpins: 0,
    },
    settings: {
      soundEnabled: true,
      vibrationEnabled: true,
      autoSave: true,
    },
    showNicknameModal: false,
    nicknameForm: '',
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStatistics();
    this.loadSettings();
  },

  onShow() {
    this.loadStatistics();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('user_info') || {};
    this.setData({ userInfo });
  },

  // 加载统计数据
  loadStatistics() {
    const wheelSets = app.globalData.wheelSets || [];
    const totalSets = wheelSets.length;
    const totalItems = wheelSets.reduce((sum, set) => sum + (set.items ? set.items.length : 0), 0);

    // 从本地存储获取转动统计
    const spinStats = wx.getStorageSync('spin_statistics') || { total: 0, today: 0, lastDate: '' };
    const today = new Date().toDateString();

    // 如果日期变了，重置今日统计
    const todaySpins = spinStats.lastDate === today ? spinStats.today : 0;

    this.setData({
      statistics: {
        totalSets,
        totalItems,
        totalSpins: spinStats.total,
        todaySpins,
      },
    });
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('app_settings') || {
      soundEnabled: true,
      vibrationEnabled: true,
      autoSave: true,
    };
    this.setData({ settings });
  },

  // 保存设置
  saveSettings() {
    wx.setStorageSync('app_settings', this.data.settings);
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const userInfo = { ...this.data.userInfo, avatarUrl };

    this.setData({ userInfo });
    wx.setStorageSync('user_info', userInfo);

    wx.showToast({
      title: '头像更新成功',
      icon: 'success',
    });
  },

  // 显示昵称编辑弹窗
  showNicknameModal() {
    this.setData({
      showNicknameModal: true,
      nicknameForm: this.data.userInfo.nickName || '',
    });
  },

  // 隐藏昵称编辑弹窗
  hideNicknameModal() {
    this.setData({
      showNicknameModal: false,
      nicknameForm: '',
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      nicknameForm: e.detail.value,
    });
  },

  // 阻止弹窗关闭
  preventClose() {
    // 空函数，用于阻止事件冒泡
  },

  // 保存昵称
  saveNickname() {
    const nickname = this.data.nicknameForm.trim();

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none',
      });
      return;
    }

    const userInfo = { ...this.data.userInfo, nickName: nickname };

    this.setData({
      userInfo,
      showNicknameModal: false,
    });

    wx.setStorageSync('user_info', userInfo);

    wx.showToast({
      title: '昵称更新成功',
      icon: 'success',
    });
  },

  // 音效开关
  onSoundToggle(e) {
    this.setData({
      'settings.soundEnabled': e.detail.value,
    });
    this.saveSettings();
  },

  // 震动反馈开关
  onVibrationToggle(e) {
    this.setData({
      'settings.vibrationEnabled': e.detail.value,
    });
    this.saveSettings();
  },

  // 自动保存开关
  onAutoSaveToggle(e) {
    this.setData({
      'settings.autoSave': e.detail.value,
    });
    this.saveSettings();
  },

  // 导出数据
  exportData() {
    const wheelSets = app.globalData.wheelSets || [];

    if (wheelSets.length === 0) {
      wx.showToast({
        title: '没有数据可导出',
        icon: 'none',
      });
      return;
    }

    const exportData = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      wheelSets: wheelSets,
    };

    // 将数据转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);

    // 复制到剪贴板
    wx.setClipboardData({
      data: jsonString,
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: '数据已复制到剪贴板，您可以粘贴到文本编辑器中保存为文件。',
          showCancel: false,
        });
      },
    });
  },

  // 导入数据
  importData() {
    wx.showModal({
      title: '导入数据',
      content: '请先复制包含转盘数据的JSON文本，然后确认导入。',
      success: (res) => {
        if (res.confirm) {
          // 从剪贴板获取数据
          wx.getClipboardData({
            success: (clipRes) => {
              try {
                const importData = JSON.parse(clipRes.data);

                if (!importData.wheelSets || !Array.isArray(importData.wheelSets)) {
                  throw new Error('数据格式不正确');
                }

                // 确认导入
                wx.showModal({
                  title: '确认导入',
                  content: `将导入 ${importData.wheelSets.length} 个转盘套餐，这将覆盖现有数据。`,
                  success: (confirmRes) => {
                    if (confirmRes.confirm) {
                      app.globalData.wheelSets = importData.wheelSets;
                      app.globalData.currentWheelSetId =
                        importData.wheelSets.length > 0 ? importData.wheelSets[0].id : null;
                      app.saveLocalData();

                      this.loadStatistics();

                      wx.showToast({
                        title: '导入成功',
                        icon: 'success',
                      });
                    }
                  },
                });
              } catch (error) {
                wx.showToast({
                  title: '数据格式错误',
                  icon: 'none',
                });
              }
            },
            fail: () => {
              wx.showToast({
                title: '剪贴板无数据',
                icon: 'none',
              });
            },
          });
        }
      },
    });
  },

  // 清空数据
  clearData() {
    wx.showModal({
      title: '确认清空',
      content: '此操作将删除所有转盘数据，无法恢复。确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          // 清空全局数据
          app.globalData.wheelSets = [];
          app.globalData.currentWheelSetId = null;
          app.globalData.lastResult = null;

          // 清空本地存储
          wx.removeStorageSync('wheel_sets');
          wx.removeStorageSync('current_wheel_set_id');
          wx.removeStorageSync('spin_statistics');

          // 重新创建默认数据
          app.createDefaultData();

          this.loadStatistics();

          wx.showToast({
            title: '数据已清空',
            icon: 'success',
          });
        }
      },
    });
  },

  // 分享小程序
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  },

  // 意见反馈
  contactUs() {
    wx.showModal({
      title: '意见反馈',
      content:
        '如有问题或建议，请通过以下方式联系我们：\n\n邮箱：feedback@example.com\n微信：wheel-support',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '转盘抽取 - 让选择变得有趣',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.jpg',
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '转盘抽取小程序，让选择变得有趣！',
      imageUrl: '/images/share-image.jpg',
    };
  },
});
