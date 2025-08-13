<template>
  <div class="wheel-wrap">
    <canvas ref="canvasRef" :width="size" :height="size" />
    <div class="pointer glow"></div>
    <div class="hub" :class="{ breathing: spinning }"></div>
    <audio ref="tickRef" preload="auto">
      <source src="https://cdn.jsdelivr.net/gh/AI-helpers/assets/audio/tick.mp3" type="audio/mpeg" />
    </audio>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, defineEmits, defineExpose } from 'vue';

interface WheelItem { id: string; name: string; color?: string }

const props = defineProps<{ items: WheelItem[]; size?: number }>();
const emit = defineEmits<{ (e: 'end', item: WheelItem | null): void }>();

const size = props.size ?? 520;
const radius = size / 2;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const tickRef = ref<HTMLAudioElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let currentRotation = 0;
const spinningRef = ref(false);
let lastTickSector = -1;

const spinning = spinningRef; // expose to template

const sectorColors = [
  '#EADDFF', '#FFD8E4', '#D0BCFF', '#BDE0FE',
  '#F9DEC9', '#FCE1A8', '#C8E6C9', '#FFCDD2',
  '#BBDEFB', '#FFE0B2', '#DCEDC8', '#F8BBD0',
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

function getFocusedIndex(): number {
  const items = props.items && props.items.length ? props.items : [{ id: '0', name: '—' }];
  const count = items.length;
  const anglePer = (Math.PI * 2) / count;
  const normalized = (Math.PI * 3/2 - currentRotation) % (Math.PI * 2);
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
  spinningRef.value = true;
  lastTickSector = -1;
  const items = props.items && props.items.length ? props.items : [{ id: '0', name: '—' }];
  const baseRounds = 4 + Math.floor(Math.random() * 2);
  const targetIdx = Math.floor(Math.random() * Math.max(1, items.length));
  const anglePer = (Math.PI * 2) / Math.max(1, items.length);
  const targetAngle = (Math.PI * 3/2) - (targetIdx + 0.5) * anglePer;
  const finalRotation = baseRounds * Math.PI * 2 + targetAngle;

  const start = currentRotation;
  const delta = ((finalRotation - start) % (Math.PI * 2)) + baseRounds * Math.PI * 2;
  const duration = 3600 + Math.random() * 900;
  const startTs = performance.now();

  function animate(ts: number) {
    const t = Math.min(1, (ts - startTs) / duration);
    const k = t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; // easeInOutCubic
    currentRotation = start + delta * k;
    drawWheel();
    playTickIfNewSector();
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      spinningRef.value = false;
      const idx = getFocusedIndex();
      emit('end', items[idx] || null);
    }
  }
  requestAnimationFrame(animate);
}

defineExpose({ spin });

onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') ?? null;
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
canvas { width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 12px 24px rgba(0,0,0,.16); }
.pointer { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.pointer::after { content: ''; width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent; border-bottom: 22px solid #6750A4; filter: drop-shadow(0 4px 4px rgba(0,0,0,.25)); transform: translateY(-44%); }
.glow::after { filter: drop-shadow(0 0 10px rgba(103,80,164,.6)) drop-shadow(0 4px 4px rgba(0,0,0,.25)); }

/* 中心同心环（纯样式覆盖 Canvas 中心） */
.hub { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.hub::before { content: ''; width: 40px; height: 40px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #fff, #c9b7ff 70%, #7a5ce6); box-shadow: 0 6px 12px rgba(0,0,0,.18); }
.hub::after { content: ''; position: absolute; width: 70px; height: 70px; border-radius: 50%; border: 6px solid rgba(103,80,164,.25); }
.breathing::after { animation: breathe 1.6s ease-in-out infinite; }
@keyframes breathe { 0%,100% { transform: scale(1); opacity: .6; } 50% { transform: scale(1.06); opacity: 1; } }
</style>
