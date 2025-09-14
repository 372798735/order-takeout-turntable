// components/wheel-canvas/wheel-canvas.js
Component({
  properties: {
    items: {
      type: Array,
      value: [],
    },
    size: {
      type: Number,
      value: 580,
    },
  },

  data: {
    canvasSize: 580,
    actualCanvasSize: 300,
    currentRotation: 0,
    isSpinning: false,
    lastResult: null,
    lastTickSector: -1,
    currentText: '点击GO开始',
    ctx: null,
    particleCtx: null,
    sectorColors: [
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
    effectColors: [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
    ],
    particles: [],
  },

  lifetimes: {
    attached() {
      // 获取系统信息，动态设置canvas大小
      const systemInfo = wx.getSystemInfoSync();
      const screenWidth = systemInfo.screenWidth;
      // 使用rpx转px的比例
      const rpxToPx = screenWidth / 750;
      const maxSize = Math.min(screenWidth * 0.85, this.properties.size);

      this.setData({
        canvasSize: maxSize / rpxToPx, // 转换回rpx单位
      });

      setTimeout(() => {
        this.initCanvas();
      }, 100);
    },
  },

  observers: {
    items: function (items) {
      if (items && items.length > 0) {
        setTimeout(() => {
          this.drawWheel();
          this.emitCurrentChange();
        }, 200);
      }
    },
  },

  methods: {
    // 初始化Canvas
    initCanvas() {
      // 主转盘Canvas
      const query = this.createSelectorQuery();
      query
        .select('.wheel-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            // 新版Canvas API
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');

            const dpr = wx.getSystemInfoSync().pixelRatio;
            const systemInfo = wx.getSystemInfoSync();

            // 计算实际的Canvas尺寸（像素）
            const canvasPixelSize = this.data.canvasSize * (systemInfo.screenWidth / 750);

            canvas.width = canvasPixelSize * dpr;
            canvas.height = canvasPixelSize * dpr;
            ctx.scale(dpr, dpr);

            // 存储Canvas尺寸信息
            this.setData({
              ctx,
              actualCanvasSize: canvasPixelSize,
            });

            // 延迟绘制，确保Canvas完全初始化
            setTimeout(() => {
              this.drawWheel();
            }, 100);
          } else {
            // 兼容旧版本Canvas API
            const ctx = wx.createCanvasContext('wheelCanvas', this);
            const systemInfo = wx.getSystemInfoSync();
            const canvasPixelSize = this.data.canvasSize * (systemInfo.screenWidth / 750);

            this.setData({
              ctx,
              actualCanvasSize: canvasPixelSize,
            });
            setTimeout(() => {
              this.drawWheel();
            }, 300);
          }
        });

      // 粒子特效Canvas
      query
        .select('.particle-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');

            const dpr = wx.getSystemInfoSync().pixelRatio;
            const systemInfo = wx.getSystemInfoSync();

            // 计算实际的Canvas尺寸（像素）
            const canvasPixelSize = this.data.canvasSize * (systemInfo.screenWidth / 750);

            canvas.width = canvasPixelSize * dpr;
            canvas.height = canvasPixelSize * dpr;
            ctx.scale(dpr, dpr);

            this.setData({ particleCtx: ctx });
          } else {
            // 兼容旧版本
            const ctx = wx.createCanvasContext('particleCanvas', this);
            this.setData({ particleCtx: ctx });
          }
        });
    },

    // 绘制转盘
    drawWheel() {
      const ctx = this.data.ctx;
      if (!ctx) return;

      const items = this.properties.items.length ? this.properties.items : [{ id: '0', name: '—' }];
      const count = items.length;

      // 使用存储的实际Canvas尺寸
      const size = this.data.actualCanvasSize || 300;
      const radius = size / 2;

      ctx.clearRect(0, 0, size, size);

      // 外圈阴影渐变（兼容性处理）
      let gradient = null;
      if (ctx.createRadialGradient) {
        // 新版Canvas API
        gradient = ctx.createRadialGradient(radius, radius, radius * 0.6, radius, radius, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,.12)');
      }

      const anglePer = (Math.PI * 2) / count;
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(this.data.currentRotation);

      for (let i = 0; i < count; i++) {
        const start = i * anglePer;
        const end = start + anglePer;

        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 16, start, end);
        ctx.closePath();
        ctx.fillStyle =
          items[i]?.color || this.data.sectorColors[i % this.data.sectorColors.length];
        ctx.fill();

        // 扇形描边
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.stroke();
      }

      // 绘制所有文字（在扇形绘制完成后）
      for (let i = 0; i < count; i++) {
        const start = i * anglePer;

        ctx.save();
        ctx.rotate(start + anglePer / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#333';
        ctx.textBaseline = 'middle';

        // 使用固定字体大小进行测试
        const fontSize = 16;
        ctx.font = `bold ${fontSize}px Arial`;

        const label = items[i]?.name || `项目${i + 1}`;
        // 调整文字位置
        const textRadius = radius - 30;

        // 绘制文字
        ctx.fillText(label, textRadius, 0);

        ctx.restore();
      }

      // 外圈阴影
      ctx.beginPath();
      ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
      if (gradient) {
        ctx.strokeStyle = gradient;
      } else {
        // 旧版Canvas API的替代方案
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      }
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.restore();

      // 兼容旧版本绘制
      if (ctx.draw) {
        ctx.draw();
      }
    },

    // 获取当前指向的项目索引
    getFocusedIndex() {
      const items = this.properties.items.length ? this.properties.items : [{ id: '0', name: '—' }];
      const count = items.length;
      const anglePer = (Math.PI * 2) / count;
      const normalized = ((Math.PI * 3) / 2 - this.data.currentRotation) % (Math.PI * 2);
      const pos = (normalized + Math.PI * 2) % (Math.PI * 2);
      return Math.floor(pos / anglePer) % count;
    },

    // 更新实时文案
    updateRealtimeText(focusedIndex) {
      const items = this.properties.items.length ? this.properties.items : [{ id: '0', name: '—' }];
      const currentItem = items[focusedIndex];
      const itemName = currentItem ? currentItem.name : '未知项目';

      if (this.data.isSpinning) {
        // 旋转中显示当前指向的项目
        this.setData({ currentText: `正在转向: ${itemName}` });
      } else {
        // 停止时显示结果
        this.setData({ currentText: `结果: ${itemName}` });
      }
    },

    // 发送当前项变化事件
    emitCurrentChange() {
      const items = this.properties.items.length ? this.properties.items : [];
      if (items.length > 0) {
        const idx = this.getFocusedIndex();
        const currentItem = items[idx];

        // 更新实时文案
        this.updateRealtimeText(idx);

        if (currentItem) {
          this.triggerEvent('current-change', currentItem);
        }
      } else {
        this.triggerEvent('current-change', null);
      }
    },

    // 播放刻度音效（模拟）
    playTickIfNewSector() {
      const idx = this.getFocusedIndex();
      if (idx !== this.data.lastTickSector) {
        this.setData({ lastTickSector: idx });
        this.emitCurrentChange();
      }
    },

    // 创建粒子效果
    createParticles(x, y, count = 20) {
      const particles = [...this.data.particles];
      const colors = this.data.effectColors;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.15;
        const speed = 1.5 + Math.random() * 2.5;
        const r = Math.random() * 8;

        particles.push({
          x: x + Math.cos(angle) * r,
          y: y + Math.sin(angle) * r,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 80 + Math.random() * 80,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 1.5,
          gravity: 0.1,
        });
      }

      this.setData({ particles });
    },

    // 更新粒子
    updateParticles() {
      const particles = this.data.particles.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.life--;
        return particle.life > 0;
      });

      this.setData({ particles });
    },

    // 绘制粒子
    drawParticles() {
      const ctx = this.data.particleCtx;
      if (!ctx || this.data.particles.length === 0) return;

      // 使用存储的实际Canvas尺寸
      const size = this.data.actualCanvasSize || 300;

      ctx.clearRect(0, 0, size, size);

      this.data.particles.forEach((particle) => {
        const alpha = particle.life / particle.maxLife;
        ctx.save();

        // 兼容性处理globalAlpha
        if (ctx.globalAlpha !== undefined) {
          ctx.globalAlpha = alpha;
        }

        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 兼容旧版本绘制
      if (ctx.draw) {
        ctx.draw();
      }
    },

    // 粒子动画循环
    animateParticles() {
      this.updateParticles();
      this.drawParticles();

      if (this.data.isSpinning || this.data.particles.length > 0) {
        setTimeout(() => {
          this.animateParticles();
        }, 16); // 约60fps
      }
    },

    // 处理触摸开始
    onTouchStart(e) {
      if (this.data.isSpinning) return;

      const touch = e.touches[0];
      this.touchStartX = touch.x;
      this.touchStartY = touch.y;
    },

    // 处理触摸结束
    onTouchEnd(e) {
      if (this.data.isSpinning) return;

      const touch = e.changedTouches[0];
      // 使用存储的实际Canvas尺寸
      const size = this.data.actualCanvasSize || 300;
      const radius = size / 2;

      // 计算点击位置相对于画布中心的距离
      const dx = touch.x - radius;
      const dy = touch.y - radius;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 中心圆的半径
      const hubRadius = 40;

      // 如果点击在中心圆区域，不处理（让hub点击事件处理）
      if (distance < hubRadius) return;

      // 如果点击在转盘外圈，也不处理
      if (distance > radius - 10) return;

      // 点击在转盘内容区域时，触发项目点击事件
      this.handleItemClick(touch.x, touch.y);
    },

    // 处理项目点击
    handleItemClick(x, y) {
      const items = this.properties.items;
      if (!items || items.length === 0) return;

      // 使用存储的实际Canvas尺寸
      const size = this.data.actualCanvasSize || 300;
      const radius = size / 2;
      const dx = x - radius;
      const dy = y - radius;

      // 计算点击角度
      let clickAngle = Math.atan2(dy, dx);
      if (clickAngle < 0) clickAngle += 2 * Math.PI;

      // 减去当前旋转角度
      let adjustedAngle = clickAngle - this.data.currentRotation;
      adjustedAngle = ((adjustedAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      // 计算对应的扇形索引
      const count = items.length;
      const anglePer = (2 * Math.PI) / count;
      const clickedIndex = Math.floor(adjustedAngle / anglePer) % count;
      const item = items[clickedIndex];

      if (item) {
        this.triggerEvent('item-click', { item });
      }
    },

    // 处理中心按钮点击
    onHubClick() {
      if (this.data.isSpinning) return;
      this.triggerEvent('hub-click');
    },

    // 开始转动
    spin() {
      if (this.data.isSpinning) return;

      const items = this.properties.items;
      if (!items || items.length === 0) {
        wx.showToast({
          title: '请先添加选项',
          icon: 'none',
        });
        return;
      }

      this.setData({
        isSpinning: true,
        lastResult: null,
        lastTickSector: -1,
        currentText: '转盘旋转中...',
      });

      // 震动反馈
      wx.vibrateShort();

      // 创建开始粒子效果
      const size = this.data.actualCanvasSize || 300;
      const radius = size / 2;
      this.createParticles(radius, radius, 36);
      this.animateParticles();

      // 计算目标角度
      const baseRounds = 4 + Math.floor(Math.random() * 2);
      const targetIdx = Math.floor(Math.random() * items.length);
      const anglePer = (Math.PI * 2) / items.length;
      const targetAngle = (Math.PI * 3) / 2 - (targetIdx + 0.5) * anglePer;
      const finalRotation = baseRounds * Math.PI * 2 + targetAngle;

      const start = this.data.currentRotation;
      const delta = ((finalRotation - start) % (Math.PI * 2)) + baseRounds * Math.PI * 2;
      const duration = 3600 + Math.random() * 900;
      const startTime = Date.now();

      // 动画函数
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // 缓动函数
        const easeProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentRotation = start + delta * easeProgress;
        this.setData({ currentRotation });
        this.drawWheel();
        this.playTickIfNewSector();

        // 在转动过程中随机创建粒子
        if (Math.random() < 0.15) {
          const angle = Math.random() * Math.PI * 2;
          const distance = radius * 0.8 + Math.random() * radius * 0.2;
          const x = radius + Math.cos(angle) * distance;
          const y = radius + Math.sin(angle) * distance;
          this.createParticles(x, y, 3);
        }

        if (progress < 1) {
          setTimeout(animate, 16); // 约60fps
        } else {
          // 转动结束
          this.setData({
            isSpinning: false,
            lastResult: items[targetIdx],
          });

          // 更新结束文案
          const finalItem = items[targetIdx];
          this.setData({
            currentText: `恭喜！结果是: ${finalItem.name}`,
          });

          // 震动反馈
          wx.vibrateLong();

          // 创建结束烟花效果
          this.createFireworkBurst(radius, radius, 36);

          // 触发结束事件
          this.triggerEvent('end', {
            result: items[targetIdx],
          });
        }
      };

      animate();
    },

    // 创建烟花爆炸效果
    createFireworkBurst(cx, cy, spikes) {
      const particles = [...this.data.particles];
      const colors = this.data.effectColors;

      for (let i = 0; i < spikes; i++) {
        const angle = (Math.PI * 2 * i) / spikes;
        const speed = 2.2 + Math.random() * 2;

        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 90 + Math.random() * 70,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2,
          gravity: 0.12,
        });
      }

      // 创建环形多点爆炸
      const burstPoints = 6;
      for (let k = 0; k < burstPoints; k++) {
        const ang = (Math.PI * 2 * k) / burstPoints + Math.random() * 0.2;
        const dist = cx * 0.7;
        const bx = cx + Math.cos(ang) * dist;
        const by = cy + Math.sin(ang) * dist;

        for (let j = 0; j < 28; j++) {
          const angle = (Math.PI * 2 * j) / 28;
          const speed = 2.2 + Math.random() * 1.6;

          particles.push({
            x: bx,
            y: by,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 90 + Math.random() * 70,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 2 + Math.random() * 2,
            gravity: 0.12,
          });
        }
      }

      this.setData({ particles });
    },
  },
});
