// pages/management/management.js
const app = getApp();
const StorageManager = require('../../utils/storage');

Page({
  data: {
    wheelSets: [],
    currentSetId: null,
    currentSet: null,
    debugInfo: '',

    // 套餐相关
    showSetModal: false,
    editingSet: null,
    setForm: {
      name: '',
    },

    // 选项相关
    showItemModal: false,
    editingItem: null,
    itemForm: {
      name: '',
      description: '',
      color: '#EADDFF',
    },

    // 颜色选项
    colorOptions: [
      '#EADDFF',
      '#FFD8E4',
      '#D0BCFF',
      '#BDE0FE',
      '#F9DEC9',
      '#FCE1A8',
      '#C8E6C9',
      '#FFCDD2',
      '#BBDEFB',
      '#FFE0B2',
      '#DCEDC8',
      '#F8BBD0',
    ],
  },

  onLoad() {
    console.log('管理页面加载');
    this.loadData();
    this.loadStorageInfo();
  },

  onShow() {
    console.log('管理页面显示');
    // 强制从app.globalData重新加载数据
    this.forceLoadData();
    this.loadStorageInfo();
  },

  // 强制加载数据
  forceLoadData() {
    console.log('强制加载数据');

    // 如果app.globalData没有数据，重新从本地存储加载
    if (!app.globalData.wheelSets || app.globalData.wheelSets.length === 0) {
      console.log('app.globalData没有数据，重新加载');
      app.loadLocalData();
    }

    // 如果还是没有数据，创建默认数据
    if (!app.globalData.wheelSets || app.globalData.wheelSets.length === 0) {
      console.log('仍然没有数据，创建默认数据');
      app.createDefaultData();
    }

    this.loadData();

    // wx.showToast({
    //   title: '数据已刷新',
    //   icon: 'success',
    //   duration: 1000,
    // });
  },

  // 创建紧急默认数据
  createEmergencyData() {
    console.log('创建紧急默认数据');

    // 直接创建默认数据
    app.createDefaultData();

    // 重新加载数据
    this.loadData();

    wx.showToast({
      title: '默认数据已创建',
      icon: 'success',
      duration: 1500,
    });
  },

  // 加载数据
  loadData() {
    const wheelSets = app.globalData.wheelSets || [];
    const currentWheelSetId = app.globalData.currentWheelSetId;

    console.log('loadData - 原始数据:', {
      wheelSets: wheelSets.length,
      currentWheelSetId,
      wheelSetsData: wheelSets,
    });

    let currentSet = null;
    if (currentWheelSetId) {
      currentSet = wheelSets.find((set) => set.id === currentWheelSetId);
    }
    if (!currentSet && wheelSets.length > 0) {
      currentSet = wheelSets[0];
      app.globalData.currentWheelSetId = currentSet.id;
      app.saveLocalData();
    }

    console.log('loadData - 处理后数据:', {
      wheelSets: wheelSets.length,
      currentWheelSetId,
      currentSet: currentSet
        ? {
            id: currentSet.id,
            name: currentSet.name,
            itemsCount: currentSet.items ? currentSet.items.length : 0,
          }
        : null,
    });

    const debugInfo = `套餐数量: ${wheelSets.length}, 当前套餐: ${currentSet ? currentSet.name : '无'}, 选项数量: ${currentSet && currentSet.items ? currentSet.items.length : 0}`;

    this.setData({
      wheelSets,
      currentSetId: currentSet ? currentSet.id : null,
      currentSet,
      debugInfo,
    });
  },

  // 选择套餐
  selectSet(e) {
    const { id, index } = e.currentTarget.dataset;
    const wheelSet = this.data.wheelSets[index];

    this.setData({
      currentSetId: id,
      currentSet: wheelSet,
    });

    // 更新全局数据
    app.globalData.currentWheelSetId = id;
    app.saveLocalData();
  },

  // 显示添加套餐弹窗
  showAddSetModal() {
    this.setData({
      showSetModal: true,
      editingSet: null,
      setForm: { name: '' },
    });
  },

  // 编辑套餐
  editSet(e) {
    const { id, index } = e.currentTarget.dataset;
    const wheelSet = this.data.wheelSets[index];

    this.setData({
      showSetModal: true,
      editingSet: wheelSet,
      setForm: { name: wheelSet.name },
    });
  },

  // 删除套餐
  deleteSet(e) {
    const { id, index } = e.currentTarget.dataset;
    const wheelSet = this.data.wheelSets[index];

    wx.showModal({
      title: '确认删除',
      content: `确定要删除套餐"${wheelSet.name}"吗？此操作不可恢复。`,
      success: (res) => {
        if (res.confirm) {
          const wheelSets = [...this.data.wheelSets];
          wheelSets.splice(index, 1);

          // 如果删除的是当前套餐，选择第一个套餐
          let currentSetId = this.data.currentSetId;
          let currentSet = this.data.currentSet;

          if (id === currentSetId) {
            if (wheelSets.length > 0) {
              currentSetId = wheelSets[0].id;
              currentSet = wheelSets[0];
            } else {
              currentSetId = null;
              currentSet = null;
            }
          }

          this.setData({
            wheelSets,
            currentSetId,
            currentSet,
          });

          // 更新全局数据
          app.globalData.wheelSets = wheelSets;
          app.globalData.currentWheelSetId = currentSetId;
          app.saveLocalData();

          wx.showToast({
            title: '删除成功',
            icon: 'success',
          });
        }
      },
    });
  },

  // 隐藏套餐弹窗
  hideSetModal() {
    this.setData({
      showSetModal: false,
      editingSet: null,
      setForm: { name: '' },
    });
  },

  // 套餐名称输入
  onSetNameInput(e) {
    this.setData({
      'setForm.name': e.detail.value,
    });
  },

  // 保存套餐
  saveSet() {
    const { name } = this.data.setForm;

    if (!name.trim()) {
      wx.showToast({
        title: '请输入套餐名称',
        icon: 'none',
      });
      return;
    }

    const wheelSets = [...this.data.wheelSets];

    if (this.data.editingSet) {
      // 编辑模式
      const index = wheelSets.findIndex((set) => set.id === this.data.editingSet.id);
      if (index !== -1) {
        wheelSets[index].name = name.trim();
        wheelSets[index].updatedAt = new Date().toISOString();
      }
    } else {
      // 新建模式
      const newSet = {
        id: app.generateId(),
        name: name.trim(),
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      wheelSets.push(newSet);

      // 如果是第一个套餐，设为当前套餐
      if (wheelSets.length === 1) {
        this.setData({
          currentSetId: newSet.id,
          currentSet: newSet,
        });
        app.globalData.currentWheelSetId = newSet.id;
      }
    }

    this.setData({
      wheelSets,
      showSetModal: false,
      editingSet: null,
      setForm: { name: '' },
    });

    // 更新全局数据
    app.globalData.wheelSets = wheelSets;
    app.saveLocalData();

    // 更新当前套餐
    if (this.data.currentSetId) {
      const currentSet = wheelSets.find((set) => set.id === this.data.currentSetId);
      this.setData({ currentSet });
    }

    wx.showToast({
      title: this.data.editingSet ? '编辑成功' : '创建成功',
      icon: 'success',
    });
  },

  // 显示添加选项弹窗
  showAddItemModal() {
    if (!this.data.currentSet) {
      wx.showToast({
        title: '请先选择一个套餐',
        icon: 'none',
      });
      return;
    }

    console.log('显示添加选项弹窗，当前套餐:', this.data.currentSet);

    this.setData({
      showItemModal: true,
      editingItem: null,
      itemForm: {
        name: '',
        description: '',
        color: this.data.colorOptions[0],
      },
    });
  },

  // 编辑选项
  editItem(e) {
    const { id, index } = e.currentTarget.dataset;
    const item = this.data.currentSet.items[index];

    console.log('编辑选项:', { id, index, item });

    this.setData({
      showItemModal: true,
      editingItem: item,
      itemForm: {
        name: item.name,
        description: item.description || '',
        color: item.color || this.data.colorOptions[0],
      },
    });
  },

  // 删除选项
  deleteItem(e) {
    const { id, index } = e.currentTarget.dataset;
    const item = this.data.currentSet.items[index];

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选项"${item.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const wheelSets = [...this.data.wheelSets];
          const setIndex = wheelSets.findIndex((set) => set.id === this.data.currentSetId);

          if (setIndex !== -1) {
            wheelSets[setIndex].items.splice(index, 1);
            wheelSets[setIndex].updatedAt = new Date().toISOString();

            this.setData({
              wheelSets,
              currentSet: wheelSets[setIndex],
            });

            // 更新全局数据
            app.globalData.wheelSets = wheelSets;
            app.saveLocalData();

            wx.showToast({
              title: '删除成功',
              icon: 'success',
            });
          }
        }
      },
    });
  },

  // 隐藏选项弹窗
  hideItemModal() {
    this.setData({
      showItemModal: false,
      editingItem: null,
      itemForm: {
        name: '',
        description: '',
        color: this.data.colorOptions[0],
      },
    });
  },

  // 阻止弹窗关闭
  preventClose() {
    // 空函数，用于阻止事件冒泡
  },

  // 选项名称输入
  onItemNameInput(e) {
    this.setData({
      'itemForm.name': e.detail.value,
    });
  },

  // 选项描述输入
  onItemDescInput(e) {
    this.setData({
      'itemForm.description': e.detail.value,
    });
  },

  // 选择颜色
  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      'itemForm.color': color,
    });
  },

  // 保存选项
  saveItem() {
    const { name, description, color } = this.data.itemForm;

    if (!name.trim()) {
      wx.showToast({
        title: '请输入选项名称',
        icon: 'none',
      });
      return;
    }

    const wheelSets = [...this.data.wheelSets];
    const setIndex = wheelSets.findIndex((set) => set.id === this.data.currentSetId);

    if (setIndex === -1) return;

    if (this.data.editingItem) {
      // 编辑模式
      const itemIndex = wheelSets[setIndex].items.findIndex(
        (item) => item.id === this.data.editingItem.id,
      );
      if (itemIndex !== -1) {
        wheelSets[setIndex].items[itemIndex] = {
          ...wheelSets[setIndex].items[itemIndex],
          name: name.trim(),
          description: description.trim(),
          color,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      // 新建模式
      const newItem = {
        id: app.generateId(),
        name: name.trim(),
        description: description.trim(),
        color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      wheelSets[setIndex].items.push(newItem);
    }

    wheelSets[setIndex].updatedAt = new Date().toISOString();

    // 更新全局数据
    app.globalData.wheelSets = wheelSets;
    app.saveLocalData();

    // 检查是否为编辑模式
    const isEditing = !!this.data.editingItem;

    const debugInfo = `套餐数量: ${wheelSets.length}, 当前套餐: ${wheelSets[setIndex].name}, 选项数量: ${wheelSets[setIndex].items.length}`;

    this.setData({
      wheelSets,
      currentSet: wheelSets[setIndex],
      showItemModal: false,
      editingItem: null,
      itemForm: {
        name: '',
        description: '',
        color: this.data.colorOptions[0],
      },
      debugInfo,
    });

    wx.showToast({
      title: isEditing ? '编辑成功' : '添加成功',
      icon: 'success',
    });
  },

  // 加载存储信息
  async loadStorageInfo() {
    try {
      const storageInfo = await StorageManager.getStorageInfo();
      this.setData({ storageInfo });
    } catch (error) {
      console.error('获取存储信息失败:', error);
    }
  },

  // 清除所有数据
  clearAllData() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有数据吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          app.clearAllData();
          this.loadData();
          this.loadStorageInfo();
          wx.showToast({
            title: '数据已清除',
            icon: 'success',
          });
        }
      },
    });
  },

  // 备份数据
  backupData() {
    const backup = StorageManager.backupData();
    if (backup) {
      wx.showToast({
        title: '备份成功',
        icon: 'success',
      });
    } else {
      wx.showToast({
        title: '备份失败',
        icon: 'error',
      });
    }
  },

  // 恢复数据
  restoreData() {
    wx.showModal({
      title: '确认恢复',
      content: '确定要恢复备份数据吗？当前数据将被覆盖！',
      success: (res) => {
        if (res.confirm) {
          const success = StorageManager.restoreData();
          if (success) {
            this.loadData();
            this.loadStorageInfo();
            wx.showToast({
              title: '恢复成功',
              icon: 'success',
            });
          } else {
            wx.showToast({
              title: '恢复失败',
              icon: 'error',
            });
          }
        }
      },
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '转盘抽取 - 管理你的选项',
      path: '/pages/management/management',
    };
  },
});
