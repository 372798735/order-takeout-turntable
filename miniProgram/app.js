// app.js
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
      const wheelSets = wx.getStorageSync('wheel_sets');
      const currentWheelSetId = wx.getStorageSync('current_wheel_set_id');

      if (wheelSets) {
        this.globalData.wheelSets = wheelSets;
      }
      if (currentWheelSetId) {
        this.globalData.currentWheelSetId = currentWheelSetId;
      }

      // 如果没有本地数据，创建默认数据
      if (!wheelSets || wheelSets.length === 0) {
        this.createDefaultData();
      }
    } catch (error) {
      console.error('加载本地数据失败:', error);
      this.createDefaultData();
    }
  },

  // 创建默认数据
  createDefaultData() {
    const defaultWheelSet = {
      id: this.generateId(),
      name: '默认转盘',
      items: [
        { id: this.generateId(), name: '选项1', color: '#EADDFF' },
        { id: this.generateId(), name: '选项2', color: '#FFD8E4' },
        { id: this.generateId(), name: '选项3', color: '#D0BCFF' },
        { id: this.generateId(), name: '选项4', color: '#BDE0FE' },
        { id: this.generateId(), name: '选项5', color: '#F9DEC9' },
        { id: this.generateId(), name: '选项6', color: '#FCE1A8' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.globalData.wheelSets = [defaultWheelSet];
    this.globalData.currentWheelSetId = defaultWheelSet.id;

    // 保存到本地存储
    this.saveLocalData();
  },

  // 保存本地数据
  saveLocalData() {
    try {
      wx.setStorageSync('wheel_sets', this.globalData.wheelSets);
      wx.setStorageSync('current_wheel_set_id', this.globalData.currentWheelSetId);
    } catch (error) {
      console.error('保存本地数据失败:', error);
    }
  },

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // 获取当前转盘套餐
  getCurrentWheelSet() {
    return (
      this.globalData.wheelSets.find((set) => set.id === this.globalData.currentWheelSetId) || null
    );
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
