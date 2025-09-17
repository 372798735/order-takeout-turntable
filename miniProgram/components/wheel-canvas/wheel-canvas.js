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
    showFallback: false,
    winnerIndex: -1,
    showWinnerHighlight: false,
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

      // iOS特殊处理：检测iOS设备并进行特殊初始化
      if (systemInfo.platform === 'ios') {
        console.log('iOS device detected, applying iOS-specific fixes');
        // iOS设备上预先显示备用按钮，防止图片加载问题
        this.setData({
          showFallback: true,
        });
        // iOS设备延迟更长，确保DOM完全渲染
        setTimeout(() => {
          this.initCanvas();
          // 强制重绘一次确保所有元素显示
          setTimeout(() => {
            this.forceRedraw();
          }, 200);
        }, 200);
      } else {
        setTimeout(() => {
          this.initCanvas();
        }, 100);
      }
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

      // 确保Canvas背景透明
      ctx.globalCompositeOperation = 'source-over';

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
        const isWinner = this.data.showWinnerHighlight && i === this.data.winnerIndex;

        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 16, start, end);
        ctx.closePath();

        let fillColor =
          items[i]?.color || this.data.sectorColors[i % this.data.sectorColors.length];

        if (this.data.showWinnerHighlight) {
          if (!isWinner) {
            // 只让非选中区域变暗，选中区域保持原色
            fillColor = this.darkenColor(fillColor);
          }
          // 选中区域保持原始颜色不变
        }

        ctx.fillStyle = fillColor;
        ctx.fill();

        // 扇形描边
        ctx.lineWidth = isWinner && this.data.showWinnerHighlight ? 4 : 2;
        ctx.strokeStyle =
          isWinner && this.data.showWinnerHighlight
            ? 'rgba(255,255,255,.95)'
            : 'rgba(255,255,255,.85)';
        ctx.stroke();
      }

      // 绘制所有文字（在扇形绘制完成后）
      for (let i = 0; i < count; i++) {
        const start = i * anglePer;
        const isWinner = this.data.showWinnerHighlight && i === this.data.winnerIndex;

        ctx.save();
        ctx.rotate(start + anglePer / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // 确保文字背景透明
        ctx.globalCompositeOperation = 'source-over';

        // 根据是否为获胜者调整文字样式
        if (this.data.showWinnerHighlight) {
          if (isWinner) {
            ctx.fillStyle = '#1a1a1a';
            ctx.font = `bold 18px Arial`;
          } else {
            ctx.fillStyle = 'rgba(51,51,51,0.3)';
            ctx.font = `bold 16px Arial`;
          }
        } else {
          ctx.fillStyle = '#333';
          ctx.font = `bold 16px Arial`;
        }

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

      // 绘制三角形指针（在中心圆圈之前绘制，确保层级正确）
      this.drawTrianglePointer(ctx, radius);

      // 绘制中心圆圈和GO文字
      this.drawCenterCircle(ctx, radius);

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

      // 确保粒子Canvas背景透明
      ctx.globalCompositeOperation = 'source-over';

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

      // 中心圆的半径（更新为新的半径20）
      const hubRadius = 20;

      // 如果点击在中心圆区域，触发转盘开始事件
      if (distance < hubRadius) {
        console.log('Center circle clicked, starting spin');
        this.triggerEvent('hub-click');
        return;
      }

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

    // 清除高亮状态（当开始新转动时）
    clearHighlight() {
      if (this.data.showWinnerHighlight) {
        this.setData({
          showWinnerHighlight: false,
          winnerIndex: -1,
        });
        this.drawWheel();
      }
    },

    // 处理图片加载错误
    onImageError() {
      console.log('Center image failed to load, showing fallback');
      this.setData({
        showFallback: true,
      });
    },

    // 增强颜色亮度
    enhanceColor(color) {
      // 将十六进制颜色转换为RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      // 增强亮度和饱和度
      const enhancedR = Math.min(255, Math.floor(r * 1.3 + 30));
      const enhancedG = Math.min(255, Math.floor(g * 1.3 + 30));
      const enhancedB = Math.min(255, Math.floor(b * 1.3 + 30));

      return `rgb(${enhancedR}, ${enhancedG}, ${enhancedB})`;
    },

    // 降低颜色亮度
    darkenColor(color) {
      // 将十六进制颜色转换为RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      // 降低亮度
      const darkenedR = Math.floor(r * 0.3);
      const darkenedG = Math.floor(g * 0.3);
      const darkenedB = Math.floor(b * 0.3);

      return `rgba(${darkenedR}, ${darkenedG}, ${darkenedB}, 0.3)`;
    },

    // 绘制中心圆圈和GO文字
    drawCenterCircle(ctx, radius) {
      ctx.save();

      // 移动到画布中心
      ctx.translate(radius, radius);

      // 根据旋转状态调整圆圈大小（呼吸效果）
      const scale = this.data.isSpinning ? 1.05 : 1;
      ctx.scale(scale, scale);

      // 绘制中心圆圈背景（缩小一半：半径从40改为20）
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);

      // 由于Canvas不直接支持渐变字符串，使用createRadialGradient
      if (ctx.createRadialGradient) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        gradient.addColorStop(0, this.data.isSpinning ? '#a78bfa' : '#7c5ce8');
        gradient.addColorStop(1, this.data.isSpinning ? '#8b5cf6' : '#6750a4');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = this.data.isSpinning ? '#8b5cf6' : '#6750a4';
      }

      ctx.fill();

      // 绘制圆圈边框
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制GO文字（调整字体大小适应更小的圆圈）
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GO', 0, 0);

      // 添加文字阴影效果
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 1;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;
      ctx.fillText('GO', 0, 0);

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.restore();
    },

    // 绘制三角形指针
    drawTrianglePointer(ctx, radius) {
      ctx.save();

      // 移动到画布中心
      ctx.translate(radius, radius);

      // 根据旋转状态调整指针位置和大小
      const offsetY = this.data.isSpinning ? -4 : 0;
      const scale = this.data.isSpinning ? 1.1 : 1;
      ctx.scale(scale, scale);

      // 绘制三角形指针（底部贴着中心圆圈，缩短长度）
      ctx.beginPath();
      ctx.moveTo(0, -30 + offsetY); // 顶点（缩短到距离圆圈顶部10px）
      ctx.lineTo(-8, -20 + offsetY); // 左下角（底部贴着圆圈顶部）
      ctx.lineTo(8, -20 + offsetY); // 右下角（底部贴着圆圈顶部）
      ctx.closePath();

      // 添加三角形阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      // 填充三角形
      ctx.fillStyle = this.data.isSpinning ? '#a78bfa' : '#6750a4';
      ctx.fill();

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 三角形边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    },

    // 强制重绘方法（iOS兼容性）
    forceRedraw() {
      console.log('Force redraw for iOS compatibility');
      // 重绘转盘
      if (this.data.ctx) {
        this.drawWheel();
      }
      // 触发页面重绘
      this.setData({
        canvasSize: this.data.canvasSize,
      });
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

      // 清除之前的高亮状态
      this.clearHighlight();

      this.setData({
        isSpinning: true,
        lastResult: null,
        lastTickSector: -1,
        currentText: '转盘旋转中...',
        showWinnerHighlight: false,
        winnerIndex: -1,
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

          // 延迟显示高亮效果，让烟花先展示
          setTimeout(() => {
            this.setData({
              winnerIndex: targetIdx,
              showWinnerHighlight: true,
            });
            // 重新绘制转盘以显示高亮效果
            this.drawWheel();
          }, 500);

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
