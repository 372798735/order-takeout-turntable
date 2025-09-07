<template>
  <div class="wheel-wrap">
    <canvas
      ref="canvasRef"
      :width="size"
      :height="size"
      :class="{ spinning: spinning }"
      @click="handleCanvasClick"
    />
    <canvas ref="particleCanvasRef" :width="size" :height="size" class="particle-canvas" />
    <div class="pointer glow" :class="{ 'pointer-active': spinning }"></div>
    <div class="hub" :class="{ breathing: spinning }"></div>

    <!-- 特效层 -->
    <div class="effects-layer" :class="{ active: spinning }">
      <!-- 中心脉冲环 -->
      <div class="pulse-ring"></div>
      <div class="sparkles">
        <div v-for="i in 12" :key="i" class="sparkle" :style="{ '--delay': `${i * 0.1}s` }"></div>
      </div>
      <div class="light-rays">
        <div v-for="i in 8" :key="i" class="ray" :style="{ '--angle': `${i * 45}deg` }"></div>
      </div>
    </div>

    <!-- 音效 -->
    <audio ref="tickRef" preload="auto">
      <source
        src="https://cdn.jsdelivr.net/gh/AI-helpers/assets/audio/tick.mp3"
        type="audio/mpeg"
      />
    </audio>
    <audio ref="spinStartRef" preload="auto">
      <source
        src="https://cdn.jsdelivr.net/gh/AI-helpers/assets/audio/tick.mp3"
        type="audio/mpeg"
      />
    </audio>
    <audio ref="spinEndRef" preload="auto">
      <source
        src="https://cdn.jsdelivr.net/gh/AI-helpers/assets/audio/tick.mp3"
        type="audio/mpeg"
      />
    </audio>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, defineEmits, defineExpose } from 'vue';

interface WheelItem {
  id: string;
  name: string;
  color?: string;
}

const props = defineProps<{ items: WheelItem[]; size?: number }>();
const emit = defineEmits<{
  (e: 'end', item: WheelItem | null): void;
  (e: 'item-click', item: WheelItem): void;
}>();

const size = props.size ?? 520;
const radius = size / 2;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const particleCanvasRef = ref<HTMLCanvasElement | null>(null);
const tickRef = ref<HTMLAudioElement | null>(null);
const spinStartRef = ref<HTMLAudioElement | null>(null);
const spinEndRef = ref<HTMLAudioElement | null>(null);

let ctx: CanvasRenderingContext2D | null = null;
let particleCtx: CanvasRenderingContext2D | null = null;
let currentRotation = 0;
const spinningRef = ref(false);
let lastTickSector = -1;

// 粒子系统（包含烟花）
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity?: number;
}

let particles: Particle[] = [];
let animationId: number | null = null;

const spinning = spinningRef; // expose to template

const sectorColors = [
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

// 特效颜色
const effectColors = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

function drawWheel() {
  if (!ctx) return;
  const items = props.items && props.items.length ? props.items : [{ id: '0', name: '—' }];
  const count = items.length;
  ctx.clearRect(0, 0, size, size);

  // 外圈阴影渐变
  const gradient = ctx.createRadialGradient(radius, radius, radius * 0.6, radius, radius, radius);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,.12)');

  const anglePer = (Math.PI * 2) / count;
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(currentRotation);
  for (let i = 0; i < count; i++) {
    const start = i * anglePer;
    const end = start + anglePer;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 16, start, end);
    ctx.closePath();
    ctx.fillStyle = items[i]?.color || sectorColors[i % sectorColors.length];
    ctx.fill();

    // 扇形描边
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.stroke();

    // 文字沿弧（最小字号 15px）
    ctx.save();
    ctx.rotate(start + anglePer / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#333';
    ctx.font = '600 16px "Segoe UI", Roboto, "Microsoft Yahei", Arial, sans-serif';
    const label = items[i]?.name ?? '—';
    ctx.fillText(label, radius - 40, 6);
    ctx.restore();
  }

  // 外圈阴影
  ctx.beginPath();
  ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
  ctx.strokeStyle = gradient as unknown as CanvasGradient;
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.restore();
}

// 创建粒子
function createParticles(
  x: number,
  y: number,
  count: number = 20,
  opts?: {
    speedMin?: number;
    speedMax?: number;
    sizeMin?: number;
    sizeMax?: number;
    lifeMin?: number;
    lifeMax?: number;
    gravity?: number;
    radiusJitter?: number;
  },
) {
  const speedMin = opts?.speedMin ?? 1.5;
  const speedMax = opts?.speedMax ?? 4;
  const sizeMin = opts?.sizeMin ?? 2;
  const sizeMax = opts?.sizeMax ?? 3.5;
  const lifeMin = opts?.lifeMin ?? 80;
  const lifeMax = opts?.lifeMax ?? 160;
  const gravity = opts?.gravity ?? 0.1;
  const jitter = opts?.radiusJitter ?? 8;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.15;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const r = Math.random() * jitter;
    const particle: Particle = {
      x: x + Math.cos(angle) * r,
      y: y + Math.sin(angle) * r,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: lifeMin + Math.random() * (lifeMax - lifeMin),
      color: effectColors[Math.floor(Math.random() * effectColors.length)],
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      gravity,
    };
    particles.push(particle);
  }
}

function createFireworkBurst(
  cx: number,
  cy: number,
  spikes: number = 32,
  options?: {
    speedMin?: number;
    speedMax?: number;
    sizeMin?: number;
    sizeMax?: number;
    lifeMin?: number;
    lifeMax?: number;
    gravity?: number;
  },
) {
  createParticles(cx, cy, spikes, {
    speedMin: options?.speedMin ?? 2.2,
    speedMax: options?.speedMax ?? 4.2,
    sizeMin: options?.sizeMin ?? 2,
    sizeMax: options?.sizeMax ?? 4,
    lifeMin: options?.lifeMin ?? 90,
    lifeMax: options?.lifeMax ?? 160,
    gravity: options?.gravity ?? 0.12,
    radiusJitter: 2,
  });
}

// 更新粒子
function updateParticles() {
  particles = particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity ?? 0.1; // 重力
    particle.life--;

    return particle.life > 0;
  });
  // 控制最大粒子数量，避免过载
  if (particles.length > 2000) {
    particles.splice(0, particles.length - 2000);
  }
}

// 绘制粒子
function drawParticles() {
  if (!particleCtx) return;

  particleCtx.clearRect(0, 0, size, size);

  particles.forEach((particle) => {
    const alpha = particle.life / particle.maxLife;
    particleCtx!.save();
    particleCtx!.globalAlpha = alpha;
    particleCtx!.fillStyle = particle.color;
    particleCtx!.beginPath();
    particleCtx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    particleCtx!.fill();

    // 添加光晕效果
    const gradient = particleCtx!.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.size * 3,
    );
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, 'transparent');
    particleCtx!.fillStyle = gradient;
    particleCtx!.beginPath();
    particleCtx!.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
    particleCtx!.fill();
    particleCtx!.restore();
  });
}

// 粒子动画循环
function animateParticles() {
  updateParticles();
  drawParticles();

  if (spinningRef.value || particles.length > 0) {
    animationId = requestAnimationFrame(animateParticles);
  }
}

// 播放音效
function playSound(audioRef: HTMLAudioElement | null) {
  if (!audioRef) return;
  audioRef.currentTime = 0;
  audioRef.play().catch(() => {});
}

function getFocusedIndex(): number {
  const items = props.items && props.items.length ? props.items : [{ id: '0', name: '—' }];
  const count = items.length;
  const anglePer = (Math.PI * 2) / count;
  const normalized = ((Math.PI * 3) / 2 - currentRotation) % (Math.PI * 2);
  const pos = (normalized + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(pos / anglePer) % count;
}

function playTickIfNewSector() {
  const idx = getFocusedIndex();
  if (idx !== lastTickSector) {
    tickRef.value?.currentTime && (tickRef.value.currentTime = 0);
    tickRef.value?.play().catch(() => {});
    lastTickSector = idx;
  }
}

function spin() {
  if (spinningRef.value) return;

  // 开始特效
  spinningRef.value = true;
  lastTickSector = -1;

  // 播放开始音效
  playSound(spinStartRef.value);

  // 创建开始粒子与脉冲
  createParticles(radius, radius, 36, {
    speedMin: 2,
    speedMax: 3.5,
    sizeMin: 2,
    sizeMax: 4,
    lifeMin: 70,
    lifeMax: 120,
    gravity: 0.08,
  });

  // 启动粒子动画
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  animateParticles();

  const items = props.items && props.items.length ? props.items : [{ id: '0', name: '—' }];
  const baseRounds = 4 + Math.floor(Math.random() * 2);
  const targetIdx = Math.floor(Math.random() * Math.max(1, items.length));
  const anglePer = (Math.PI * 2) / Math.max(1, items.length);
  const targetAngle = (Math.PI * 3) / 2 - (targetIdx + 0.5) * anglePer;
  const finalRotation = baseRounds * Math.PI * 2 + targetAngle;

  const start = currentRotation;
  const delta = ((finalRotation - start) % (Math.PI * 2)) + baseRounds * Math.PI * 2;
  const duration = 3600 + Math.random() * 900;
  const startTs = performance.now();

  function animate(ts: number) {
    const t = Math.min(1, (ts - startTs) / duration);
    const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
    currentRotation = start + delta * k;
    drawWheel();
    playTickIfNewSector();

    // 在转动过程中随机创建粒子
    if (Math.random() < 0.15) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * 0.8 + Math.random() * radius * 0.2;
      const x = radius + Math.cos(angle) * distance;
      const y = radius + Math.sin(angle) * distance;
      createParticles(x, y, 3);
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // 结束特效
      spinningRef.value = false;

      // 播放结束音效
      playSound(spinEndRef.value);

      // 创建结束烟花效果：中心+环形多点爆炸
      createFireworkBurst(radius, radius, 36, {
        speedMin: 2.6,
        speedMax: 4.2,
        gravity: 0.14,
        lifeMin: 110,
        lifeMax: 180,
      });
      const burstPoints = 6;
      for (let k = 0; k < burstPoints; k++) {
        const ang = (Math.PI * 2 * k) / burstPoints + Math.random() * 0.2;
        const dist = radius * 0.7;
        const bx = radius + Math.cos(ang) * dist;
        const by = radius + Math.sin(ang) * dist;
        createFireworkBurst(bx, by, 28, {
          speedMin: 2.2,
          speedMax: 3.8,
          gravity: 0.12,
          lifeMin: 90,
          lifeMax: 160,
        });
      }

      const idx = getFocusedIndex();
      emit('end', items[idx] || null);
    }
  }
  requestAnimationFrame(animate);
}

// 处理画布点击事件
function handleCanvasClick(event: MouseEvent) {
  if (spinningRef.value) return; // 转盘旋转中不响应点击

  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 转换为画布坐标
  const canvasX = (x / rect.width) * size;
  const canvasY = (y / rect.height) * size;

  // 计算相对于圆心的位置
  const centerX = size / 2;
  const centerY = size / 2;
  const dx = canvasX - centerX;
  const dy = canvasY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 检查是否点击在转盘范围内（不包括中心圆）
  const hubRadius = 30;
  if (distance < hubRadius || distance > radius - 10) return;

  // 计算点击的角度
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += 2 * Math.PI;

  // 考虑当前旋转角度
  angle = (angle - (currentRotation * Math.PI) / 180 + 2 * Math.PI) % (2 * Math.PI);

  // 计算点击的扇形索引
  const items = props.items;
  if (items.length === 0) return;

  const sectorAngle = (2 * Math.PI) / items.length;
  const clickedIndex = Math.floor(angle / sectorAngle);
  const item = items[clickedIndex];

  if (item) {
    emit('item-click', item);
  }
}

defineExpose({ spin });

onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') ?? null;
  particleCtx = particleCanvasRef.value?.getContext('2d') ?? null;
  drawWheel();
});

watch(() => props.items, drawWheel, { deep: true });
</script>

<style scoped>
.wheel-wrap {
  position: relative;
  width: min(92vw, 520px);
  aspect-ratio: 1 / 1;
  margin-inline: auto;
}

canvas {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

canvas:hover:not(.spinning) {
  transform: scale(1.02);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
}

canvas:active:not(.spinning) {
  transform: scale(0.98);
}

canvas.spinning {
  cursor: default;
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
}

.pointer {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 20;
}

.pointer::after {
  content: '';
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-bottom: 22px solid #6750a4;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
  transform: translateY(-44%);
  transition: all 0.3s ease;
}

.glow::after {
  filter: drop-shadow(0 0 10px rgba(103, 80, 164, 0.6)) drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
}

.pointer-active::after {
  filter: drop-shadow(0 0 20px rgba(103, 80, 164, 0.8))
    drop-shadow(0 0 30px rgba(103, 80, 164, 0.6)) drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
  transform: translateY(-44%) scale(1.1);
}

/* 中心同心环（纯样式覆盖 Canvas 中心） */
.hub {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 15;
}

.hub::before {
  content: '';
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, #c9b7ff 70%, #7a5ce6);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.18);
  transition: all 0.3s ease;
}

.hub::after {
  content: '';
  position: absolute;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 6px solid rgba(103, 80, 164, 0.25);
  transition: all 0.3s ease;
}

.breathing::after {
  animation: breathe 1.6s ease-in-out infinite;
}

.breathing::before {
  animation: pulse 0.8s ease-in-out infinite;
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.18),
    0 0 20px rgba(103, 80, 164, 0.4);
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 特效层 */
.effects-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.effects-layer.active {
  opacity: 1;
}

/* 闪光效果 */
.sparkles {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}
.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 0 0 rgba(103, 80, 164, 0.25),
    0 0 0 0 rgba(103, 80, 164, 0.15),
    0 0 0 0 rgba(103, 80, 164, 0.1);
  animation: pulse-ring 1.6s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    box-shadow:
      0 0 0 0 rgba(103, 80, 164, 0.35),
      0 0 0 0 rgba(103, 80, 164, 0.2),
      0 0 0 0 rgba(103, 80, 164, 0.1);
  }
  70% {
    box-shadow:
      0 0 0 18px rgba(103, 80, 164, 0),
      0 0 0 36px rgba(103, 80, 164, 0.06),
      0 0 0 54px rgba(103, 80, 164, 0.02);
  }
  100% {
    box-shadow:
      0 0 0 0 rgba(103, 80, 164, 0),
      0 0 0 0 rgba(103, 80, 164, 0),
      0 0 0 0 rgba(103, 80, 164, 0);
  }
}

.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #ffd700;
  border-radius: 50%;
  animation: sparkle 2s ease-in-out infinite;
  animation-delay: var(--delay);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
}

.sparkle:nth-child(1) {
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
}
.sparkle:nth-child(2) {
  top: 20%;
  right: 20%;
}
.sparkle:nth-child(3) {
  top: 50%;
  right: 10%;
}
.sparkle:nth-child(4) {
  bottom: 20%;
  right: 20%;
}
.sparkle:nth-child(5) {
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
}
.sparkle:nth-child(6) {
  bottom: 20%;
  left: 20%;
}
.sparkle:nth-child(7) {
  top: 50%;
  left: 10%;
}
.sparkle:nth-child(8) {
  top: 20%;
  left: 20%;
}
.sparkle:nth-child(9) {
  top: 30%;
  right: 30%;
}
.sparkle:nth-child(10) {
  bottom: 30%;
  right: 30%;
}
.sparkle:nth-child(11) {
  bottom: 30%;
  left: 30%;
}
.sparkle:nth-child(12) {
  top: 30%;
  left: 30%;
}

.sparkle:nth-child(odd) {
  background: #ff6b6b;
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.8);
}

.sparkle:nth-child(3n) {
  background: #4ecdc4;
  box-shadow: 0 0 8px rgba(78, 205, 196, 0.8);
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

/* 光线效果 */
.light-rays {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.ray {
  position: absolute;
  bottom: 50%;
  left: 50%;
  width: 3px;
  height: 58%;
  background: linear-gradient(
    to top,
    transparent,
    rgba(255, 215, 0, 0.6),
    rgba(255, 215, 0, 0.8),
    rgba(255, 215, 0, 0.6),
    transparent
  );
  transform-origin: center bottom;
  transform: translate(-50%, 0) rotate(var(--angle));
  animation: ray 4s ease-in-out infinite;
  animation-delay: calc(var(--angle) * 0.2s);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}

@keyframes ray {
  0%,
  100% {
    opacity: 0;
    transform: translate(-50%, 0) rotate(var(--angle)) scaleY(0);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, 0) rotate(var(--angle)) scaleY(1.1);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sparkle {
    width: 4px;
    height: 4px;
  }

  .ray {
    width: 2px;
    height: 54%;
  }
}

@media (max-width: 480px) {
  .sparkle {
    width: 3px;
    height: 3px;
  }

  .ray {
    width: 1px;
    height: 50%;
  }
}
</style>
