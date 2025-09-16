// utils/storage.js
// 本地存储工具类

const STORAGE_KEYS = {
  WHEEL_SETS: 'wheel_sets',
  CURRENT_WHEEL_SET_ID: 'current_wheel_set_id',
  USER_INFO: 'user_info',
  ACCESS_TOKEN: 'access_token',
  LAST_RESULT: 'last_result',
  APP_SETTINGS: 'app_settings',
};

class StorageManager {
  // 获取转盘套餐数据
  static getWheelSets() {
    try {
      const data = wx.getStorageSync(STORAGE_KEYS.WHEEL_SETS);
      return data || [];
    } catch (error) {
      console.error('获取转盘套餐数据失败:', error);
      return [];
    }
  }

  // 保存转盘套餐数据
  static setWheelSets(wheelSets) {
    try {
      wx.setStorageSync(STORAGE_KEYS.WHEEL_SETS, wheelSets);
      console.log('转盘套餐数据保存成功');
      return true;
    } catch (error) {
      console.error('保存转盘套餐数据失败:', error);
      return false;
    }
  }

  // 获取当前转盘套餐ID
  static getCurrentWheelSetId() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.CURRENT_WHEEL_SET_ID);
    } catch (error) {
      console.error('获取当前转盘套餐ID失败:', error);
      return null;
    }
  }

  // 保存当前转盘套餐ID
  static setCurrentWheelSetId(id) {
    try {
      wx.setStorageSync(STORAGE_KEYS.CURRENT_WHEEL_SET_ID, id);
      console.log('当前转盘套餐ID保存成功:', id);
      return true;
    } catch (error) {
      console.error('保存当前转盘套餐ID失败:', error);
      return false;
    }
  }

  // 获取用户信息
  static getUserInfo() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.USER_INFO);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  // 保存用户信息
  static setUserInfo(userInfo) {
    try {
      wx.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo);
      console.log('用户信息保存成功');
      return true;
    } catch (error) {
      console.error('保存用户信息失败:', error);
      return false;
    }
  }

  // 获取访问令牌
  static getAccessToken() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('获取访问令牌失败:', error);
      return null;
    }
  }

  // 保存访问令牌
  static setAccessToken(token) {
    try {
      wx.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, token);
      console.log('访问令牌保存成功');
      return true;
    } catch (error) {
      console.error('保存访问令牌失败:', error);
      return false;
    }
  }

  // 获取最后结果
  static getLastResult() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.LAST_RESULT);
    } catch (error) {
      console.error('获取最后结果失败:', error);
      return null;
    }
  }

  // 保存最后结果
  static setLastResult(result) {
    try {
      wx.setStorageSync(STORAGE_KEYS.LAST_RESULT, result);
      console.log('最后结果保存成功');
      return true;
    } catch (error) {
      console.error('保存最后结果失败:', error);
      return false;
    }
  }

  // 获取应用设置
  static getAppSettings() {
    try {
      const settings = wx.getStorageSync(STORAGE_KEYS.APP_SETTINGS);
      return (
        settings || {
          soundEnabled: true,
          vibrationEnabled: true,
          autoSave: true,
          theme: 'light',
        }
      );
    } catch (error) {
      console.error('获取应用设置失败:', error);
      return {
        soundEnabled: true,
        vibrationEnabled: true,
        autoSave: true,
        theme: 'light',
      };
    }
  }

  // 保存应用设置
  static setAppSettings(settings) {
    try {
      wx.setStorageSync(STORAGE_KEYS.APP_SETTINGS, settings);
      console.log('应用设置保存成功');
      return true;
    } catch (error) {
      console.error('保存应用设置失败:', error);
      return false;
    }
  }

  // 清除所有数据
  static clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        wx.removeStorageSync(key);
      });
      console.log('所有本地数据清除成功');
      return true;
    } catch (error) {
      console.error('清除本地数据失败:', error);
      return false;
    }
  }

  // 清除用户相关数据
  static clearUserData() {
    try {
      wx.removeStorageSync(STORAGE_KEYS.USER_INFO);
      wx.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN);
      console.log('用户数据清除成功');
      return true;
    } catch (error) {
      console.error('清除用户数据失败:', error);
      return false;
    }
  }

  // 获取存储使用情况
  static getStorageInfo() {
    return new Promise((resolve, reject) => {
      wx.getStorageInfo({
        success: (res) => {
          resolve({
            keys: res.keys,
            currentSize: res.currentSize,
            limitSize: res.limitSize,
            usage: ((res.currentSize / res.limitSize) * 100).toFixed(2) + '%',
          });
        },
        fail: reject,
      });
    });
  }

  // 批量保存转盘数据
  static saveWheelData(wheelSets, currentWheelSetId) {
    const success1 = this.setWheelSets(wheelSets);
    const success2 = this.setCurrentWheelSetId(currentWheelSetId);
    return success1 && success2;
  }

  // 创建默认转盘数据
  static createDefaultWheelData() {
    const defaultWheelSet = {
      id: this.generateId(),
      name: '默认转盘',
      items: [
        { id: this.generateId(), name: '选项1', color: '#EADDFF', description: '' },
        { id: this.generateId(), name: '选项2', color: '#FFD8E4', description: '' },
        { id: this.generateId(), name: '选项3', color: '#D0BCFF', description: '' },
        { id: this.generateId(), name: '选项4', color: '#BDE0FE', description: '' },
        { id: this.generateId(), name: '选项5', color: '#F9DEC9', description: '' },
        { id: this.generateId(), name: '选项6', color: '#FCE1A8', description: '' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const wheelSets = [defaultWheelSet];
    const currentWheelSetId = defaultWheelSet.id;

    this.saveWheelData(wheelSets, currentWheelSetId);
    return { wheelSets, currentWheelSetId };
  }

  // 生成唯一ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 数据备份
  static backupData() {
    try {
      const backup = {
        wheelSets: this.getWheelSets(),
        currentWheelSetId: this.getCurrentWheelSetId(),
        userInfo: this.getUserInfo(),
        appSettings: this.getAppSettings(),
        timestamp: new Date().toISOString(),
      };

      wx.setStorageSync('data_backup', backup);
      console.log('数据备份成功');
      return backup;
    } catch (error) {
      console.error('数据备份失败:', error);
      return null;
    }
  }

  // 恢复数据
  static restoreData() {
    try {
      const backup = wx.getStorageSync('data_backup');
      if (backup) {
        this.setWheelSets(backup.wheelSets);
        this.setCurrentWheelSetId(backup.currentWheelSetId);
        this.setUserInfo(backup.userInfo);
        this.setAppSettings(backup.appSettings);
        console.log('数据恢复成功');
        return true;
      }
      return false;
    } catch (error) {
      console.error('数据恢复失败:', error);
      return false;
    }
  }
}

module.exports = StorageManager;
