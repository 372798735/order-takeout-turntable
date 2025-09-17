// index.js
const app = getApp();

Page({
  data: {
    wheelSets: [],
    currentSetIndex: 0,
    currentSetId: null,
    currentSetName: '',
    wheelSetNames: [],
    currentItems: [],
    isSpinning: false,
    lastResult: null,
    showResult: false,
    wheelSize: 580,
    hasItems: false,
    currentItemText: '??',
    realtimeText: '点击GO开始',
    showFallback: false,
  },

  onLoad() {
    // 获取系统信息，调整转盘大小
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.screenWidth;
    // 设置合适的转盘大小
    const wheelSize = Math.min(screenWidth * 0.85, 580);

    this.setData({ wheelSize });

    // iOS特殊处理：预先显示备用按钮
    if (systemInfo.platform === 'ios') {
      console.log('iOS device detected, enabling fallback button');
      console.log('System info:', systemInfo);
      this.setData({
        showFallback: true,
      });

      // 延迟强制更新，确保iOS真机显示
      setTimeout(() => {
        console.log('iOS: Force update layout');
        this.setData({
          showFallback: true,
          wheelSize: this.data.wheelSize,
        });
      }, 500);
    }

    // 加载数据
    this.loadData();

    // 设置初始状态
    app.globalData.isSpinning = false;
  },

  onShow() {
    // 每次显示页面时重新加载数据
    this.loadData();
  },

  // 加载数据
  loadData() {
    const wheelSets = app.globalData.wheelSets || [];
    const currentWheelSetId = app.globalData.currentWheelSetId;

    if (wheelSets.length === 0) {
      // 如果没有数据，提示用户去管理页添加
      wx.showModal({
        title: '提示',
        content: '还没有转盘数据，是否前往管理页添加？',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/management/management',
            });
          }
        },
      });
      return;
    }

    // 更新数据
    const wheelSetNames = wheelSets.map((set) => set.name);
    let currentSetIndex = 0;
    let currentSet = wheelSets[0];

    // 查找当前选中的套餐
    if (currentWheelSetId) {
      const index = wheelSets.findIndex((set) => set.id === currentWheelSetId);
      if (index !== -1) {
        currentSetIndex = index;
        currentSet = wheelSets[index];
      }
    }

    // 如果当前套餐为空，尝试找一个非空的
    if (!currentSet.items || currentSet.items.length === 0) {
      const nonEmptySet = wheelSets.find((set) => set.items && set.items.length > 0);
      if (nonEmptySet) {
        currentSet = nonEmptySet;
        currentSetIndex = wheelSets.indexOf(nonEmptySet);
        app.globalData.currentWheelSetId = nonEmptySet.id;
        app.saveLocalData();
      }
    }

    this.setData({
      wheelSets,
      wheelSetNames,
      currentSetIndex,
      currentSetId: currentSet.id,
      currentSetName: currentSet.name,
      currentItems: currentSet.items || [],
      hasItems: (currentSet.items || []).length > 0,
      isSpinning: false,
    });
  },

  // 套餐选择改变
  onSetChange(e) {
    const index = parseInt(e.detail.value);
    const wheelSet = this.data.wheelSets[index];

    if (wheelSet) {
      this.setData({
        currentSetIndex: index,
        currentSetId: wheelSet.id,
        currentSetName: wheelSet.name,
        currentItems: wheelSet.items || [],
        hasItems: (wheelSet.items || []).length > 0,
      });

      // 更新全局数据
      app.globalData.currentWheelSetId = wheelSet.id;
      app.saveLocalData();
    }
  },

  // 开始转动
  onSpin() {
    if (this.data.isSpinning) return;
    if (!this.data.hasItems) {
      wx.showToast({
        title: '请先添加选项',
        icon: 'none',
      });
      return;
    }

    this.setData({
      isSpinning: true,
      realtimeText: '转盘旋转中...',
    });

    // 调用转盘组件的转动方法
    const wheelCanvas = this.selectComponent('#wheelCanvas');
    if (wheelCanvas) {
      wheelCanvas.spin();
    }
  },

  // 转动结束
  onSpinEnd(e) {
    const result = e.detail.result;

    this.setData({
      isSpinning: false,
      lastResult: result,
      showResult: true,
      realtimeText: `${result.name}`,
    });

    // 更新全局数据
    app.globalData.lastResult = result;
    app.globalData.isSpinning = false;

    // 显示结果提示
    if (result) {
      wx.showToast({
        title: `🎉 ${result.name}`,
        icon: 'none',
        duration: 2000,
      });
    }
  },

  // 项目点击
  onItemClick(e) {
    const item = e.detail.item;
    if (item && this.data.currentSetId) {
      wx.navigateTo({
        url: `/pages/detail/detail?setId=${this.data.currentSetId}&itemId=${item.id}`,
      });
    }
  },

  // 处理当前项变化
  onCurrentChange(e) {
    const item = e.detail;
    if (item && item.name && !this.data.isSpinning) {
      this.setData({
        currentItemText: item.name,
        realtimeText: `${item.name}`,
      });
    } else if (this.data.isSpinning && item && item.name) {
      this.setData({
        currentItemText: '??',
        realtimeText: `${item.name}`,
      });
    } else {
      this.setData({
        currentItemText: '??',
        realtimeText: '点击GO开始',
      });
    }
  },

  // 隐藏结果弹窗
  hideResult() {
    this.setData({ showResult: false });
  },

  // 查看详情
  viewDetail() {
    if (this.data.lastResult && this.data.currentSetId) {
      wx.navigateTo({
        url: `/pages/detail/detail?setId=${this.data.currentSetId}&itemId=${this.data.lastResult.id}`,
      });
    }
    this.hideResult();
  },

  // 处理图片加载错误
  onImageError() {
    console.log('Center image failed to load, showing fallback');
    this.setData({
      showFallback: true,
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '转盘抽取 - 让选择变得有趣',
      path: '/pages/index/index',
    };
  },
});
