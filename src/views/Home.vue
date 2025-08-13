<template>
  <el-config-provider>
    <el-container class="page">
      <el-header height="56px" class="bar">
        <div class="brand">
          <el-icon><MagicStick /></el-icon>
          <span class="title">幸运大转盘</span>
        </div>
        <div class="actions">
          <el-tooltip content="背景音乐开关" placement="bottom">
            <el-button circle @click="toggleMute">
              <el-icon v-if="isMuted"><Mute /></el-icon>
              <el-icon v-else><Headset /></el-icon>
            </el-button>
          </el-tooltip>
          <el-button type="primary" text @click="$router.push('/manage')"
            >管理转盘</el-button
          >
        </div>
      </el-header>

      <el-main class="main">
        <el-row :gutter="12">
          <el-col :xs="24" :md="16">
            <el-card class="wheel-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <div class="set-select nowrap">
                    <span>当前套餐：</span>
                    <el-select
                      v-model="currentId"
                      size="small"
                      style="min-width: 220px"
                      @change="onChangeSet"
                    >
                      <el-option
                        v-for="s in wheelSets"
                        :key="s.id"
                        :label="s.name"
                        :value="s.id"
                      />
                    </el-select>
                  </div>
                  <el-button
                    type="primary"
                    :disabled="isSpinning || itemsForWheel.length === 0"
                    @click="spin"
                  >
                    <el-icon class="mr"><Refresh /></el-icon> 开始转动
                  </el-button>
                </div>
              </template>

              <transition name="fade-up" appear>
                <div class="wheel-wrap">
                  <WheelCanvas
                    ref="wheelRef"
                    class="wheel"
                    :items="itemsForWheel"
                    @end="onSpinEnd"
                  />
                </div>
              </transition>

              <transition name="pop">
                <p v-if="lastResult" class="result">
                  <el-icon color="#67C23A"><SuccessFilled /></el-icon>
                  结果：<strong>{{ lastResult.name }}</strong>
                </p>
              </transition>
            </el-card>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header small">
                  <span>提示与状态</span>
                </div>
              </template>
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item label="选项数量">{{
                  itemsForWheel.length
                }}</el-descriptions-item>
                <el-descriptions-item label="是否旋转中">{{
                  isSpinning ? "是" : "否"
                }}</el-descriptions-item>
                <el-descriptions-item label="上次结果">{{
                  lastResult?.name || "—"
                }}</el-descriptions-item>
              </el-descriptions>
              <el-divider />
              <el-alert title="小提示" type="info" show-icon :closable="false">
                使用管理页可添加/排序选项，建议保持 6~12
                个扇区获得更佳视觉与节奏。
              </el-alert>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <!-- 背景音乐（循环） -->
    <audio ref="bgRef" loop autoplay muted>
      <source
        src="https://cdn.jsdelivr.net/gh/AI-helpers/assets/audio/lofi-loop.mp3"
        type="audio/mpeg"
      />
    </audio>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useWheelStore, type WheelItem } from "@/stores/wheel";
import WheelCanvas from "@/components/wheel/WheelCanvas.vue";
import { ElMessage } from "element-plus";
import {
  MagicStick,
  Refresh,
  SuccessFilled,
  Headset,
  Mute,
} from "@element-plus/icons-vue";

const store = useWheelStore();
const wheelRef = ref<InstanceType<typeof WheelCanvas> | null>(null);
const bgRef = ref<HTMLAudioElement | null>(null);
const isMuted = ref(true);

onMounted(() => {
  store.load();
  setTimeout(
    () =>
      bgRef.value?.play().catch(() => {
        bgRef.value!.muted = true;
        isMuted.value = true;
      }),
    300,
  );
});

const wheelSets = computed(() => store.wheelSets);
const currentId = computed({
  get: () => store.currentWheelSetId,
  set: (v: string | null) => store.setCurrentSet(v || ""),
});
const itemsForWheel = computed<WheelItem[]>(
  () => store.currentSet?.items ?? [],
);
const isSpinning = computed(() => store.isSpinning);
const lastResult = computed(() => store.lastResult);

function onChangeSet() {}

function spin() {
  if (!wheelRef.value) return;
  if (!itemsForWheel.value.length)
    return ElMessage.warning("请先在管理页添加选项");
  store.setSpinning(true);
  wheelRef.value.spin();
}

function onSpinEnd(item: WheelItem | null) {
  store.setSpinning(false);
  store.setResult(item || null);
  if (item) {
    ElMessage.success(`今天推荐：${item.name}`);
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  if (bgRef.value) {
    bgRef.value.muted = isMuted.value;
    if (!isMuted.value) bgRef.value.play().catch(() => {});
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.title {
  font-weight: 700;
  font-size: 16px;
}
.actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.main {
  padding: 8px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card-header.small {
  justify-content: flex-start;
  gap: 8px;
}
.set-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.nowrap {
  white-space: nowrap;
}
.wheel-card :deep(.el-card__body) {
  padding: 8px;
}
.wheel-wrap {
  display: grid;
  place-items: center;
  padding: 6px;
}
.result {
  margin-top: 6px;
  text-align: center;
}

/* 过渡动画 */
.fade-up-enter-active {
  transition: all 0.36s cubic-bezier(0.2, 0, 0, 1);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.pop-enter-active {
  transition:
    transform 0.24s ease,
    opacity 0.24s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: scale(0.98);
}
</style>
