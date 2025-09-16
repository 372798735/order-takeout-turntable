// app.js
const StorageManager = require('./utils/storage');

App({
  globalData: {
    userInfo: null,
    wheelSets: [],
    currentWheelSetId: null,
    isSpinning: false,
    lastResult: null,
    baseUrl: 'http://localhost:3000/api', // 后端API地址，需要根据实际情况修改
  },

  onLaunch() {
    console.log('转盘抽取小程序启动');

    // 检查登录状态
    this.checkLoginStatus();

    // 加载本地数据
    this.loadLocalData();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('access_token');
    if (token) {
      // 验证token有效性
      this.verifyToken(token);
    }
  },

  // 验证token
  verifyToken(token) {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/me`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.globalData.userInfo = res.data;
        } else {
          // token无效，清除本地存储
          wx.removeStorageSync('access_token');
        }
      },
      fail: (err) => {
        console.error('验证token失败:', err);
        wx.removeStorageSync('access_token');
      },
    });
  },

  // 加载本地数据
  loadLocalData() {
    try {
      const wheelSets = StorageManager.getWheelSets();
      const currentWheelSetId = StorageManager.getCurrentWheelSetId();
      const userInfo = StorageManager.getUserInfo();
      const lastResult = StorageManager.getLastResult();

      this.globalData.wheelSets = wheelSets;
      this.globalData.currentWheelSetId = currentWheelSetId;
      this.globalData.userInfo = userInfo;
      this.globalData.lastResult = lastResult;

      // 如果没有本地数据，创建默认数据
      if (!wheelSets || wheelSets.length === 0) {
        this.createDefaultData();
      }

      // 创建数据备份
      StorageManager.backupData();
    } catch (error) {
      console.error('加载本地数据失败:', error);
      this.createDefaultData();
    }
  },

  // 创建默认数据
  createDefaultData() {
    const { wheelSets, currentWheelSetId } = StorageManager.createDefaultWheelData();

    this.globalData.wheelSets = wheelSets;
    this.globalData.currentWheelSetId = currentWheelSetId;
  },

  // 保存本地数据
  saveLocalData() {
    try {
      StorageManager.saveWheelData(this.globalData.wheelSets, this.globalData.currentWheelSetId);

      // 保存其他数据
      if (this.globalData.userInfo) {
        StorageManager.setUserInfo(this.globalData.userInfo);
      }
      if (this.globalData.lastResult) {
        StorageManager.setLastResult(this.globalData.lastResult);
      }

      // 创建备份
      StorageManager.backupData();
    } catch (error) {
      console.error('保存本地数据失败:', error);
    }
  },

  // 生成唯一ID
  generateId() {
    return StorageManager.generateId();
  },

  // 获取当前转盘套餐
  getCurrentWheelSet() {
    return (
      this.globalData.wheelSets.find((set) => set.id === this.globalData.currentWheelSetId) || null
    );
  },

  // 获取存储信息
  async getStorageInfo() {
    return await StorageManager.getStorageInfo();
  },

  // 清除所有数据
  clearAllData() {
    StorageManager.clearAll();
    this.globalData = {
      userInfo: null,
      wheelSets: [],
      currentWheelSetId: null,
      isSpinning: false,
      lastResult: null,
      baseUrl: 'http://localhost:3000/api',
    };
    this.createDefaultData();
  },

  // 清除用户数据
  clearUserData() {
    StorageManager.clearUserData();
    this.globalData.userInfo = null;
  },

  // 恢复数据
  restoreData() {
    return StorageManager.restoreData();
  },

  // API请求封装
  request(options) {
    const token = wx.getStorageSync('access_token');

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
          ...options.header,
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(res);
          }
        },
        fail: reject,
      });
    });
  },
});
