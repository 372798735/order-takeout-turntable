// pages/management/management.js
const app = getApp();

Page({
  data: {
    wheelSets: [],
    currentSetId: null,
    currentSet: null,

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
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    const wheelSets = app.globalData.wheelSets || [];
    const currentWheelSetId = app.globalData.currentWheelSetId;

    let currentSet = null;
    if (currentWheelSetId) {
      currentSet = wheelSets.find((set) => set.id === currentWheelSetId);
    }
    if (!currentSet && wheelSets.length > 0) {
      currentSet = wheelSets[0];
      app.globalData.currentWheelSetId = currentSet.id;
    }

    this.setData({
      wheelSets,
      currentSetId: currentSet ? currentSet.id : null,
      currentSet,
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
    });

    // 更新全局数据
    app.globalData.wheelSets = wheelSets;
    app.saveLocalData();

    wx.showToast({
      title: this.data.editingItem ? '编辑成功' : '添加成功',
      icon: 'success',
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
