// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    loading: true,
    item: null,
    setName: '',
    setId: '',
    itemId: '',
    relatedItems: [],
  },

  onLoad(options) {
    const { setId, itemId } = options;

    if (!setId || !itemId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      setId,
      itemId,
    });

    this.loadItemDetail();
  },

  // 加载选项详情
  loadItemDetail() {
    this.setData({ loading: true });

    const wheelSets = app.globalData.wheelSets || [];
    const wheelSet = wheelSets.find((set) => set.id === this.data.setId);

    if (!wheelSet) {
      this.setData({
        loading: false,
        item: null,
      });
      wx.showToast({
        title: '套餐不存在',
        icon: 'none',
      });
      return;
    }

    const item = wheelSet.items.find((item) => item.id === this.data.itemId);

    if (!item) {
      this.setData({
        loading: false,
        item: null,
      });
      wx.showToast({
        title: '选项不存在',
        icon: 'none',
      });
      return;
    }

    // 获取相关选项（同套餐的其他选项）
    const relatedItems = wheelSet.items.filter((relatedItem) => relatedItem.id !== item.id);

    this.setData({
      loading: false,
      item,
      setName: wheelSet.name,
      relatedItems,
    });
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return '';

    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 前往管理页面
  goToManagement() {
    wx.switchTab({
      url: '/pages/management/management',
    });
  },

  // 前往主页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  // 查看相关选项
  viewRelatedItem(e) {
    const itemId = e.currentTarget.dataset.id;

    // 替换当前页面，避免页面栈过深
    wx.redirectTo({
      url: `/pages/detail/detail?setId=${this.data.setId}&itemId=${itemId}`,
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      fail: () => {
        // 如果没有上一页，跳转到首页
        wx.switchTab({
          url: '/pages/index/index',
        });
      },
    });
  },

  // 分享功能
  onShareAppMessage() {
    const item = this.data.item;
    const setName = this.data.setName;

    return {
      title: `转盘选项：${item ? item.name : '详情'} - ${setName}`,
      path: `/pages/detail/detail?setId=${this.data.setId}&itemId=${this.data.itemId}`,
    };
  },
});
