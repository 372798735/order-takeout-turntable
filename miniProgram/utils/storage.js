// utils/storage.js - 存储工具类

/**
 * 存储工具类
 * 封装微信小程序的存储API，提供更便捷的数据操作方法
 */
class Storage {
  /**
   * 设置存储数据
   * @param {string} key 存储键名
   * @param {*} data 存储数据
   * @returns {boolean} 是否成功
   */
  static set(key, data) {
    try {
      wx.setStorageSync(key, data);
      return true;
    } catch (error) {
      console.error('存储数据失败:', error);
      return false;
    }
  }

  /**
   * 获取存储数据
   * @param {string} key 存储键名
   * @param {*} defaultValue 默认值
   * @returns {*} 存储的数据或默认值
   */
  static get(key, defaultValue = null) {
    try {
      const data = wx.getStorageSync(key);
      return data !== '' ? data : defaultValue;
    } catch (error) {
      console.error('获取数据失败:', error);
      return defaultValue;
    }
  }

  /**
   * 删除存储数据
   * @param {string} key 存储键名
   * @returns {boolean} 是否成功
   */
  static remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (error) {
      console.error('删除数据失败:', error);
      return false;
    }
  }

  /**
   * 清空所有存储数据
   * @returns {boolean} 是否成功
   */
  static clear() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }

  /**
   * 获取存储信息
   * @returns {Object} 存储信息
   */
  static getInfo() {
    try {
      return wx.getStorageInfoSync();
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return { keys: [], currentSize: 0, limitSize: 0 };
    }
  }

  /**
   * 检查存储空间是否充足
   * @param {number} requiredSize 需要的空间大小(KB)
   * @returns {boolean} 是否充足
   */
  static checkSpace(requiredSize = 100) {
    const info = this.getInfo();
    const availableSize = info.limitSize - info.currentSize;
    return availableSize >= requiredSize;
  }
}

/**
 * 转盘数据管理器
 */
class WheelDataManager {
  static KEYS = {
    WHEEL_SETS: 'wheel_sets',
    CURRENT_SET_ID: 'current_wheel_set_id',
    SPIN_STATS: 'spin_statistics',
    USER_INFO: 'user_info',
    APP_SETTINGS: 'app_settings',
  };

  /**
   * 保存转盘套餐数据
   * @param {Array} wheelSets 转盘套餐数组
   */
  static saveWheelSets(wheelSets) {
    return Storage.set(this.KEYS.WHEEL_SETS, wheelSets);
  }

  /**
   * 获取转盘套餐数据
   * @returns {Array} 转盘套餐数组
   */
  static getWheelSets() {
    return Storage.get(this.KEYS.WHEEL_SETS, []);
  }

  /**
   * 保存当前套餐ID
   * @param {string} setId 套餐ID
   */
  static setCurrentSetId(setId) {
    return Storage.set(this.KEYS.CURRENT_SET_ID, setId);
  }

  /**
   * 获取当前套餐ID
   * @returns {string|null} 套餐ID
   */
  static getCurrentSetId() {
    return Storage.get(this.KEYS.CURRENT_SET_ID);
  }

  /**
   * 更新转动统计
   * @param {Object} stats 统计数据
   */
  static updateSpinStats(stats) {
    const currentStats = this.getSpinStats();
    const today = new Date().toDateString();

    // 如果日期变了，重置今日统计
    if (currentStats.lastDate !== today) {
      currentStats.today = 0;
      currentStats.lastDate = today;
    }

    // 更新统计
    currentStats.total += stats.total || 0;
    currentStats.today += stats.today || 1;

    return Storage.set(this.KEYS.SPIN_STATS, currentStats);
  }

  /**
   * 获取转动统计
   * @returns {Object} 统计数据
   */
  static getSpinStats() {
    return Storage.get(this.KEYS.SPIN_STATS, {
      total: 0,
      today: 0,
      lastDate: new Date().toDateString(),
    });
  }

  /**
   * 保存用户信息
   * @param {Object} userInfo 用户信息
   */
  static saveUserInfo(userInfo) {
    return Storage.set(this.KEYS.USER_INFO, userInfo);
  }

  /**
   * 获取用户信息
   * @returns {Object} 用户信息
   */
  static getUserInfo() {
    return Storage.get(this.KEYS.USER_INFO, {});
  }

  /**
   * 保存应用设置
   * @param {Object} settings 设置数据
   */
  static saveSettings(settings) {
    return Storage.set(this.KEYS.APP_SETTINGS, settings);
  }

  /**
   * 获取应用设置
   * @returns {Object} 设置数据
   */
  static getSettings() {
    return Storage.get(this.KEYS.APP_SETTINGS, {
      soundEnabled: true,
      vibrationEnabled: true,
      autoSave: true,
    });
  }

  /**
   * 导出所有数据
   * @returns {Object} 导出的数据
   */
  static exportAllData() {
    return {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      wheelSets: this.getWheelSets(),
      currentSetId: this.getCurrentSetId(),
      spinStats: this.getSpinStats(),
      userInfo: this.getUserInfo(),
      settings: this.getSettings(),
    };
  }

  /**
   * 导入数据
   * @param {Object} data 导入的数据
   * @returns {boolean} 是否成功
   */
  static importData(data) {
    try {
      if (data.wheelSets) {
        this.saveWheelSets(data.wheelSets);
      }
      if (data.currentSetId) {
        this.setCurrentSetId(data.currentSetId);
      }
      if (data.spinStats) {
        Storage.set(this.KEYS.SPIN_STATS, data.spinStats);
      }
      if (data.userInfo) {
        this.saveUserInfo(data.userInfo);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  /**
   * 清空所有转盘数据
   */
  static clearWheelData() {
    Storage.remove(this.KEYS.WHEEL_SETS);
    Storage.remove(this.KEYS.CURRENT_SET_ID);
    Storage.remove(this.KEYS.SPIN_STATS);
  }

  /**
   * 获取数据统计信息
   * @returns {Object} 统计信息
   */
  static getDataStats() {
    const wheelSets = this.getWheelSets();
    const spinStats = this.getSpinStats();

    const totalSets = wheelSets.length;
    const totalItems = wheelSets.reduce((sum, set) => sum + (set.items ? set.items.length : 0), 0);

    return {
      totalSets,
      totalItems,
      totalSpins: spinStats.total,
      todaySpins: spinStats.today,
    };
  }
}

module.exports = {
  Storage,
  WheelDataManager,
};
