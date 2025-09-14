// utils/common.js - 通用工具函数

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 格式化时间
 * @param {string|Date} time 时间
 * @param {string} format 格式化字符串
 * @returns {string} 格式化后的时间
 */
function formatTime(time, format = 'YYYY-MM-DD HH:mm:ss') {
  const date = new Date(time);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} delay 延迟时间(ms)
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} delay 延迟时间(ms)
 * @returns {Function} 节流后的函数
 */
function throttle(func, delay = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      func.apply(this, args);
    }
  };
}

/**
 * 深度克隆对象
 * @param {*} obj 要克隆的对象
 * @returns {*} 克隆后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * 随机打乱数组
 * @param {Array} array 要打乱的数组
 * @returns {Array} 打乱后的新数组
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * 获取随机颜色
 * @returns {string} 随机颜色值
 */
function getRandomColor() {
  const colors = [
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
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 验证数据格式
 * @param {*} data 要验证的数据
 * @param {Object} rules 验证规则
 * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
 */
function validateData(data, rules) {
  const errors = [];

  for (const field in rules) {
    const rule = rules[field];
    const value = data[field];

    // 必填验证
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${rule.label || field} 不能为空`);
      continue;
    }

    // 如果不是必填且值为空，跳过其他验证
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // 类型验证
    if (rule.type && typeof value !== rule.type) {
      errors.push(`${rule.label || field} 类型错误`);
      continue;
    }

    // 长度验证
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${rule.label || field} 长度不能少于 ${rule.minLength} 个字符`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${rule.label || field} 长度不能超过 ${rule.maxLength} 个字符`);
    }

    // 数值范围验证
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${rule.label || field} 不能小于 ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${rule.label || field} 不能大于 ${rule.max}`);
    }

    // 正则验证
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${rule.label || field} 格式不正确`);
    }

    // 自定义验证
    if (rule.validator && typeof rule.validator === 'function') {
      const result = rule.validator(value);
      if (result !== true) {
        errors.push(result || `${rule.label || field} 验证失败`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 显示Toast提示
 * @param {string} title 提示文字
 * @param {string} icon 图标类型
 * @param {number} duration 显示时长
 */
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration,
  });
}

/**
 * 显示确认对话框
 * @param {string} title 标题
 * @param {string} content 内容
 * @returns {Promise<boolean>} 用户选择结果
 */
function showConfirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}

/**
 * 震动反馈
 * @param {string} type 震动类型 'short' | 'long'
 */
function vibrate(type = 'short') {
  try {
    if (type === 'long') {
      wx.vibrateLong();
    } else {
      wx.vibrateShort();
    }
  } catch (error) {
    console.warn('震动功能不可用:', error);
  }
}

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
function copyToClipboard(text) {
  return new Promise((resolve) => {
    wx.setClipboardData({
      data: text,
      success: () => {
        showToast('已复制到剪贴板', 'success');
        resolve(true);
      },
      fail: () => {
        showToast('复制失败', 'none');
        resolve(false);
      },
    });
  });
}

/**
 * 从剪贴板获取文本
 * @returns {Promise<string|null>} 剪贴板文本
 */
function getFromClipboard() {
  return new Promise((resolve) => {
    wx.getClipboardData({
      success: (res) => {
        resolve(res.data);
      },
      fail: () => {
        resolve(null);
      },
    });
  });
}

/**
 * 获取系统信息
 * @returns {Object} 系统信息
 */
function getSystemInfo() {
  try {
    return wx.getSystemInfoSync();
  } catch (error) {
    console.error('获取系统信息失败:', error);
    return {};
  }
}

/**
 * 检查是否为iPhone X系列（有安全区域）
 * @returns {boolean} 是否为iPhone X系列
 */
function isIPhoneX() {
  const systemInfo = getSystemInfo();
  const { model, screenHeight, statusBarHeight } = systemInfo;

  if (!model || !screenHeight || !statusBarHeight) return false;

  // iPhone X系列特征：状态栏高度44px，且屏幕高度较大
  return model.includes('iPhone') && statusBarHeight >= 44 && screenHeight >= 812;
}

/**
 * 获取安全区域高度
 * @returns {Object} 安全区域信息
 */
function getSafeArea() {
  const systemInfo = getSystemInfo();
  const isIPhoneXSeries = isIPhoneX();

  return {
    top: systemInfo.statusBarHeight || 0,
    bottom: isIPhoneXSeries ? 34 : 0,
  };
}

module.exports = {
  generateId,
  formatTime,
  debounce,
  throttle,
  deepClone,
  shuffleArray,
  getRandomColor,
  validateData,
  showToast,
  showConfirm,
  vibrate,
  copyToClipboard,
  getFromClipboard,
  getSystemInfo,
  isIPhoneX,
  getSafeArea,
};
