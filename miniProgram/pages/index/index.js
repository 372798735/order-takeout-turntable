// index.js
const app = getApp();
const StorageManager = require('../../utils/storage');

const MUSIC_TRACKS = [
  {
    title: '太多',
    url: 'https://joy4.jstools.net/uploads/mp3/202606/07/21066a256cece37c2191330.mp3',
  },
  {
    title: '皇后大道东',
    url: 'https://joy3.jstools.net/uploads/mp3/202507/10/1514686f684faef5a879219.mp3',
  },
  {
    title: '我是真的爱上你',
    url: 'https://joy3.jstools.net/uploads/mp3/202608/06/23546a74ae4f16db1781423.mp3',
  },
  {
    title: '平凡之路',
    url: 'https://joy3.jstools.net/uploads/mp3/202607/24/08196a62af7bdf7eb120809.mp3',
  },
  {
    title: '偏爱',
    url: 'https://joy3.jstools.net/uploads/mp3/202607/14/07246a5573afb17b3788160.mp3',
  },
  {
    title: '往事只能回味',
    url: 'https://joy3.jstools.net/uploads/mp3/202607/29/08076a694428775ec302065.mp3',
  },
];

Page({
  data: {
    showMusicButton: true,
    musicOn: false,
    musicNames: MUSIC_TRACKS.map((track) => track.title),
    currentMusicIndex: 0,
    currentMusicName: MUSIC_TRACKS[0].title,
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

    this.initBgm();
  },

  onShow() {
    // 每次显示页面时重新加载数据
    this.loadData();
    this.tryPlayBgm();
  },

  onUnload() {
    if (this._pendingBgm) {
      this._pendingBgm.destroy();
      this._pendingBgm = null;
    }
    if (this._bgm) {
      this._bgm.destroy();
      this._bgm = null;
    }
  },

  initBgm() {
    if (this._bgm) return;

    const settings = StorageManager.getAppSettings();
    const musicOn = !!settings.bgmEnabled;
    this._bgmShouldPlay = musicOn;
    this._bgmReady = false;

    // 2.3.0+ 需用全局接口，实例 obeyMuteSwitch 在真机上可能不生效
    try {
      wx.setInnerAudioOption({
        obeyMuteSwitch: false,
        mixWithOther: true,
      });
    } catch (e) {
      // 低版本基础库忽略
    }

    this._bgm = wx.createInnerAudioContext();
    this._bgm.obeyMuteSwitch = false;
    this._bgm.loop = true;
    this._bgm.volume = 0.45;

    this._bgm.onCanplay(() => {
      this._bgmReady = true;
      this._bgmLoadError = false;
      this.tryPlayBgm();
    });

    this._bgm.onPlay(() => {
      console.log('背景音乐开始播放');
    });

    this._bgm.onError((err) => {
      console.error('背景音乐播放失败:', err);
      this._bgmLoadError = true;
      if (!this._bgmShouldPlay) return;

      // 网络直链失败时，再尝试下载到本地后播放（安卓更稳）
      if (!this._bgmDownloadTried) {
        this._bgmDownloadTried = true;
        this.loadBgmViaDownload(this.getCurrentMusic());
      }
    });

    // 默认关闭音乐，但预缓冲第一首，用户点击后可立即播放。
    this.setBgmSource(this.getCurrentMusic());
    this.tryPlayBgm();
    this.setData({ musicOn });
  },

  getCurrentMusic() {
    return MUSIC_TRACKS[this.data.currentMusicIndex] || MUSIC_TRACKS[0];
  },

  setBgmSource(track) {
    if (!this._bgm || !track) return;

    this._bgmDownloadTried = false;
    this._bgmReady = false;
    this._bgmLoadError = false;
    this._bgmSourceTrackIndex = this.data.currentMusicIndex;
    this._bgm.src = track.url;
  },

  prepareMusicSwitch(track, trackIndex) {
    if (!track || !this._bgmShouldPlay) return;

    if (this._pendingBgm) {
      this._pendingBgm.destroy();
    }

    const pendingBgm = wx.createInnerAudioContext();
    this._pendingBgm = pendingBgm;
    this._pendingMusicIndex = trackIndex;
    pendingBgm.obeyMuteSwitch = false;
    pendingBgm.loop = true;
    pendingBgm.volume = 0.45;

    pendingBgm.onCanplay(() => {
      if (
        this._pendingBgm !== pendingBgm ||
        this._pendingMusicIndex !== this.data.currentMusicIndex ||
        !this._bgmShouldPlay
      ) {
        return;
      }

      const previousBgm = this._bgm;
      this._bgm = pendingBgm;
      this._pendingBgm = null;
      this._pendingMusicIndex = null;
      this._bgmReady = true;
      this._bgmLoadError = false;
      this._bgmSourceTrackIndex = this.data.currentMusicIndex;

      if (previousBgm) {
        previousBgm.stop();
        previousBgm.destroy();
      }

      this.tryPlayBgm();
    });

    pendingBgm.onError((err) => {
      console.error('切换背景音乐失败:', err);
      if (this._pendingBgm === pendingBgm) {
        this._pendingBgm.destroy();
        this._pendingBgm = null;
        this._pendingMusicIndex = null;
        wx.showToast({
          title: '新音乐加载失败',
          icon: 'none',
        });
      }
    });

    pendingBgm.src = track.url;
  },

  loadBgmViaDownload(track) {
    if (!track) return;

    wx.downloadFile({
      url: track.url,
      success: (res) => {
        if (
          res.statusCode === 200 &&
          this._bgm &&
          res.tempFilePath &&
          this.getCurrentMusic().url === track.url
        ) {
          this._bgm.src = res.tempFilePath;
          this.tryPlayBgm();
        } else {
          console.error('背景音乐下载异常:', res);
        }
      },
      fail: (err) => {
        console.error('背景音乐下载失败（请检查 downloadFile 合法域名）:', err);
        wx.showToast({
          title: '音乐加载失败，请配置域名',
          icon: 'none',
          duration: 2500,
        });
      },
    });
  },

  tryPlayBgm() {
    if (!this._bgmShouldPlay || !this._bgm) return;
    try {
      this._bgm.play();
    } catch (e) {
      console.error('背景音乐 play 异常:', e);
    }
  },

  onToggleMusic() {
    const next = !this.data.musicOn;
    const settings = StorageManager.getAppSettings();
    StorageManager.setAppSettings({ ...settings, bgmEnabled: next });

    this._bgmShouldPlay = next;

    if (next) {
      // 用户点击属于手势交互，可解锁 iOS/部分安卓的自动播放限制
      if (!this._bgm) {
        this.initBgm();
      } else {
        if (this._bgmSourceTrackIndex !== this.data.currentMusicIndex || this._bgmLoadError) {
          this.setBgmSource(this.getCurrentMusic());
        }
        this.tryPlayBgm();
      }
    } else if (this._bgm) {
      this._bgm.pause();
      if (this._pendingBgm) {
        this._pendingBgm.destroy();
        this._pendingBgm = null;
        this._pendingMusicIndex = null;
      }
    }

    this.setData({ musicOn: next });

    wx.showToast({
      title: next ? '音乐已开启' : '音乐已关闭',
      icon: 'none',
      duration: 1200,
    });
  },

  onMusicChange(e) {
    const currentMusicIndex = Number(e.detail.value);
    const track = MUSIC_TRACKS[currentMusicIndex];
    if (!track) return;

    const shouldContinuePlaying = this.data.musicOn;
    this.setData({
      currentMusicIndex,
      currentMusicName: track.title,
    });

    if (shouldContinuePlaying) {
      this.prepareMusicSwitch(track, currentMusicIndex);
    } else if (this._bgm) {
      // 关闭状态下提前缓冲所选歌曲，下一次点击播放无需重新请求。
      this.setBgmSource(track);
    }
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

    // 用户手势可解锁真机自动播放限制
    this.tryPlayBgm();

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

  // 首页点击扇区不再跳转详情
  onItemClick() {},

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
      title: '幸运大转盘 - 让选择变得有趣',
      path: '/pages/index/index',
    };
  },
});
