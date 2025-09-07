<template>
  <el-config-provider>
    <el-container class="page">
      <!-- 响应式头部 -->
      <el-header height="56px">
        <AppHeader>
          <template #actions>
            <el-button type="primary" text class="manage-btn" @click="$router.push('/manage')">
              管理转盘
            </el-button>
          </template>
        </AppHeader>
      </el-header>

      <el-main class="main">
        <!-- 响应式布局 -->
        <el-row :gutter="12" class="content-row">
          <!-- 转盘区域 - 移动端占满，PC端占主要区域 -->
          <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
            <el-card class="wheel-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <!-- 移动端垂直布局，PC端水平布局 -->
                  <div class="set-select-container">
                    <div class="set-select">
                      <span class="set-label">当前套餐：</span>
                      <el-select
                        v-model="currentId"
                        size="small"
                        class="set-dropdown"
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
                      class="spin-btn"
                      :disabled="isSpinning || itemsForWheel.length === 0"
                      @click="spin"
                    >
                      <el-icon class="mr"><Refresh /></el-icon>
                      <span class="btn-text">开始转动</span>
                    </el-button>
                  </div>
                </div>
              </template>

              <transition name="fade-up" appear>
                <div class="wheel-wrap">
                  <WheelCanvas
                    ref="wheelRef"
                    class="wheel"
                    :items="itemsForWheel"
                    @end="onSpinEnd"
                    @item-click="onItemClick"
                  />
                </div>
              </transition>

              <transition name="pop">
                <p v-if="lastResult" class="result" :class="{ celebration: showCelebration }">
                  <el-icon color="#67C23A"><SuccessFilled /></el-icon>
                  结果：<strong>{{ lastResult.name }}</strong>
                </p>
              </transition>
            </el-card>
          </el-col>

          <!-- 状态信息区域 - 移动端显示在转盘下方，PC端显示在右侧 -->
          <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
            <el-card shadow="hover" class="status-card">
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
                  isSpinning ? '是' : '否'
                }}</el-descriptions-item>
                <el-descriptions-item label="上次结果">{{
                  lastResult?.name || '—'
                }}</el-descriptions-item>
              </el-descriptions>
              <el-divider />
              <el-alert title="小提示" type="info" show-icon :closable="false">
                <p>使用管理页可添加/排序选项，建议保持 6~12 个扇区获得更佳视觉与节奏。</p>
                <p>💡 点击转盘上的任意选项可查看详情信息！</p>
              </el-alert>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useWheelStore } from '@/stores/wheel';
import WheelCanvas from '@/components/wheel/WheelCanvas.vue';
import { ElMessage } from 'element-plus';
import { Refresh, SuccessFilled } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import AppHeader from '@/components/common/AppHeader.vue';

const store = useWheelStore();
const wheelRef = ref(null);
const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  store.load();
  auth.fetchMe().catch(() => {});
  // 避免刷新或中途离开页面时 isSpinning 被持久化导致按钮一直禁用
  store.setSpinning(false);
  // 若当前套餐无效（为空或已被删除），自动选中第一个
  if (!store.currentSet && store.wheelSets.length > 0) {
    store.setCurrentSet(store.wheelSets[0].id);
  }
  // 若当前套餐为空，但存在非空套餐，则自动切换到第一个非空套餐
  if (store.currentSet && store.currentSet.items.length === 0) {
    const nonEmpty = store.wheelSets.find((s) => s.items.length > 0);
    if (nonEmpty) {
      store.setCurrentSet(nonEmpty.id);
    }
  }
});

const wheelSets = computed(() => store.wheelSets);
const currentId = computed({
  get: () => store.currentWheelSetId,
  set: (v) => store.setCurrentSet(v || ''),
});
const itemsForWheel = computed(() => store.currentSet?.items ?? []);
const isSpinning = computed(() => store.isSpinning);
const lastResult = computed(() => store.lastResult);

// 庆祝动画状态
const showCelebration = ref(false);

function onChangeSet() {}

function spin() {
  if (!wheelRef.value) return;
  if (!itemsForWheel.value.length) return ElMessage.warning('请先在管理页添加选项');

  // 添加震动效果
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }

  store.setSpinning(true);
  wheelRef.value.spin();
}

// 转盘结束处理
function onSpinEnd(item) {
  store.setResult(item);
  store.setSpinning(false);

  if (item) {
    // 显示庆祝效果
    showCelebration.value = true;

    // 震动反馈
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // 3秒后隐藏庆祝效果
    setTimeout(() => {
      showCelebration.value = false;
    }, 3000);
  }
}

// 处理转盘项目点击
function onItemClick(item) {
  const currentSetId = store.currentWheelSetId;
  if (currentSetId && item.id) {
    router.push(`/item/${currentSetId}/${item.id}`);
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
}

.manage-btn {
  flex-shrink: 0;
}

/* 主内容区域 */
.main {
  padding: 8px;
}

.content-row {
  margin: 0;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.card-header.small {
  justify-content: flex-start;
  gap: 8px;
}

/* 套餐选择容器 */
.set-select-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.set-select {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.set-label {
  white-space: nowrap;
  font-weight: 500;
}

.set-dropdown {
  flex: 1;
  min-width: 200px;
}

.spin-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

.btn-text {
  margin-left: 4px;
}

/* 转盘卡片 */
.wheel-card :deep(.el-card__body) {
  padding: 8px;
}

.wheel-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  min-height: 300px;
}

.wheel {
  max-width: 100%;
  height: auto;
}

/* 结果显示 */
.result {
  margin-top: 12px;
  text-align: center;
  font-size: 16px;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
  transition: all 0.3s ease;
}

.result.celebration {
  animation: celebration 0.6s ease-in-out;
  transform: scale(1.05);
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  border-color: #ff6b6b;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

@keyframes celebration {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1.05);
  }
}

/* 状态卡片 */
.status-card {
  height: fit-content;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .bar {
    padding: 0 12px;
  }

  .title {
    font-size: 18px;
  }

  .main {
    padding: 12px;
  }

  .set-select-container {
    gap: 16px;
  }

  .set-select {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .set-dropdown {
    min-width: 100%;
  }

  .spin-btn {
    height: 48px;
    font-size: 18px;
  }

  .wheel-wrap {
    min-height: 320px;
    padding: 16px;
  }

  .wheel {
    max-width: 95%;
    width: 320px;
    height: 320px;
  }

  .result {
    font-size: 18px;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .bar {
    padding: 0 16px;
  }

  .title {
    font-size: 20px;
  }

  .main {
    padding: 16px;
  }

  .set-select-container {
    gap: 20px;
  }

  .spin-btn {
    height: 52px;
    font-size: 20px;
  }

  .wheel-wrap {
    min-height: 300px;
    padding: 20px 16px;
  }

  .wheel {
    max-width: 90%;
    width: 300px;
    height: 300px;
  }
}

@media (min-width: 769px) {
  .set-select-container {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .set-select {
    flex: 0 0 auto;
  }

  .spin-btn {
    width: auto;
    min-width: 120px;
  }

  .wheel-wrap {
    min-height: 440px;
    padding: 20px;
  }

  .wheel {
    max-width: 100%;
    width: 420px;
    height: 420px;
  }
}

@media (min-width: 1024px) {
  .main {
    padding: 16px;
  }

  .wheel-wrap {
    min-height: 500px;
    padding: 24px;
  }

  .wheel {
    max-width: 100%;
    width: 480px;
    height: 480px;
  }
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

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .spin-btn {
    min-height: 44px;
  }

  .manage-btn {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>
