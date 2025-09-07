<template>
  <el-container class="page" direction="vertical">
    <!-- 统一头部 -->
    <el-header height="56px">
      <AppHeader>
        <template #actions>
          <el-button type="primary" text class="home-btn" @click="$router.push('/')">
            回到首页
          </el-button>
        </template>
      </AppHeader>
    </el-header>

    <!-- 主内容区域：侧边栏+主要内容 -->
    <el-container class="content-container" :class="{ 'mobile-column': isMobile }">
      <!-- 响应式侧边栏 - 移动端变为顶部，PC端保持左侧 -->
      <el-aside
        :width="isMobile ? '100%' : '280px'"
        class="side"
        :class="{ 'mobile-side': isMobile }"
      >
        <el-card shadow="hover" class="side-card">
          <template #header>
            <div class="card-header small">
              <span>套餐列表</span>
              <el-button type="primary" text size="small" class="add-btn" @click="addSet">
                新建
              </el-button>
            </div>
          </template>

          <!-- 移动端显示套餐选择器，PC端显示菜单列表 -->
          <div v-if="isMobile" class="mobile-set-selector">
            <el-select
              v-model="activeId"
              placeholder="选择套餐"
              size="large"
              class="mobile-set-dropdown"
              @change="selectSet"
            >
              <el-option v-for="s in wheelSets" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
            <el-alert
              v-if="!buffer"
              class="mt8"
              title="请选择套餐或创建新套餐后即可在下方编辑"
              type="info"
              show-icon
              :closable="false"
            />
          </div>

          <el-scrollbar v-else max-height="50vh" class="set-scrollbar">
            <el-menu :default-active="activeId || ''" class="set-menu" @select="selectSet">
              <el-menu-item v-for="s in wheelSets" :key="s.id" :index="s.id">
                <span class="name">{{ s.name }}</span>
                <el-button link type="danger" class="delete-btn" @click.stop="removeSet(s.id)">
                  删除
                </el-button>
              </el-menu-item>
            </el-menu>
          </el-scrollbar>

          <div class="add">
            <el-input
              v-model.trim="newSetName"
              placeholder="新建套餐名称(≤20)"
              size="small"
              maxlength="20"
              class="new-set-input"
            />
            <el-button class="mt8 new-set-btn" type="primary" size="small" @click="addSet">
              新建套餐
            </el-button>
          </div>

          <el-divider />
        </el-card>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main v-if="buffer" class="main" :class="{ 'mobile-main': isMobile }">
        <el-card shadow="hover" class="edit-card">
          <template #header>
            <div class="card-header small">
              <span>编辑套餐</span>
              <el-tag type="info" effect="plain" class="item-count">
                {{ buffer.items.length }}/15
              </el-tag>
            </div>
          </template>

          <el-form label-width="80px" size="small" class="mb12">
            <el-form-item label="名称">
              <el-input
                v-model.trim="buffer.name"
                maxlength="20"
                show-word-limit
                class="name-input"
              />
            </el-form-item>
          </el-form>

          <div class="add-item">
            <div class="add-item-form">
              <el-input
                v-model.trim="newItemName"
                placeholder="选项名称(≤12字)"
                maxlength="12"
                size="small"
                class="new-item-input"
                show-word-limit
              />
              <el-input
                v-model.trim="newItemDescription"
                placeholder="备注信息(可选，≤50字)"
                maxlength="50"
                size="small"
                class="new-item-description"
                show-word-limit
              />
            </div>
            <el-button
              type="primary"
              size="small"
              class="add-item-btn"
              :disabled="buffer.items.length >= 15"
              @click="addItem"
            >
              添加
            </el-button>
          </div>

          <transition-group name="list" tag="ul" class="item-list">
            <li
              v-for="(it, idx) in buffer.items"
              :key="it.id"
              draggable="true"
              class="item-row"
              @dragstart="onDragStart(idx, $event)"
              @dragover.prevent
              @drop="onDrop(idx)"
            >
              <div class="item-content">
                <el-input
                  v-model.trim="it.name"
                  maxlength="12"
                  size="small"
                  class="item-input"
                  placeholder="选项名称"
                  show-word-limit
                />
                <el-input
                  v-model.trim="it.description"
                  maxlength="50"
                  size="small"
                  class="item-description"
                  placeholder="备注信息(可选)"
                  show-word-limit
                />
              </div>
              <div class="row-actions">
                <el-button
                  size="small"
                  class="move-btn"
                  :disabled="idx === 0"
                  @click="move(idx, -1)"
                >
                  上移
                </el-button>
                <el-button
                  size="small"
                  class="move-btn"
                  :disabled="idx === buffer.items.length - 1"
                  @click="move(idx, 1)"
                >
                  下移
                </el-button>
                <el-button size="small" type="danger" class="remove-btn" @click="removeItem(idx)">
                  删除
                </el-button>
              </div>
            </li>
          </transition-group>

          <div class="actions">
            <el-button class="cancel-btn" @click="cancel">取消</el-button>
            <el-button type="primary" class="save-btn" @click="save">保存</el-button>
          </div>
        </el-card>

        <el-card class="mt12 preview-card" shadow="hover">
          <template #header>
            <div class="card-header small">
              <span>预览</span>
            </div>
          </template>
          <div class="preview">
            <WheelCanvas :items="buffer.items" :size="isMobile ? 280 : 360" />
          </div>
        </el-card>
      </el-main>

      <!-- 移动端无内容时的提示 -->
      <el-main v-else-if="isMobile" class="mobile-empty-main">
        <el-empty description="请选择一个套餐进行编辑">
          <el-button type="primary" @click="addSet">创建新套餐</el-button>
        </el-empty>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useWheelStore, type WheelItem } from '@/stores/wheel';
import WheelCanvas from '@/components/wheel/WheelCanvas.vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';

import AppHeader from '@/components/common/AppHeader.vue';

const store = useWheelStore();
const auth = useAuthStore();

// 响应式检测
const isMobile = ref(false);

function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
}

onMounted(() => {
  // 确保刷新或直达管理页时能从本地存储加载数据
  store.load();
  auth.fetchMe().catch(() => {});
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const wheelSets = computed(() => store.wheelSets);
const activeId = computed({
  get: () => store.currentWheelSetId,
  set: (id: string | null) => {
    if (id) store.setCurrentSet(id);
  },
});
const newSetName = ref('');
const newItemName = ref('');
const newItemDescription = ref('');

type Buffer = { id: string; name: string; items: WheelItem[] };
const buffer = ref<Buffer | null>(null);

function snapshotFromStore(): Buffer | null {
  const s = store.currentSet;
  if (!s) return null;
  return { id: s.id, name: s.name, items: s.items.map((i: WheelItem) => ({ ...i })) };
}

function selectSet(id: string) {
  store.setCurrentSet(id);
  buffer.value = snapshotFromStore();
}

function addSet() {
  const name = newSetName.value.trim();
  if (!name) return ElMessage.warning('请输入套餐名称');
  store.addSet(name.slice(0, 20));
  newSetName.value = '';
  buffer.value = snapshotFromStore();
}

function removeSet(id: string) {
  store.deleteSet(id);
  buffer.value = snapshotFromStore();
}

function addItem() {
  if (!buffer.value) return;
  if (buffer.value.items.length >= 15) return ElMessage.warning('最多 15 个选项');
  const name = newItemName.value.trim();
  if (!name) return ElMessage.warning('请输入选项名称');
  if (name.length > 12) return ElMessage.warning('选项名称不能超过12个字');

  const description = newItemDescription.value.trim();
  if (description && description.length > 50) return ElMessage.warning('备注信息不能超过50个字');

  const id = `${Date.now()}`;

  buffer.value.items.push({
    id,
    name,
    description: description || undefined,
  });

  newItemName.value = '';
  newItemDescription.value = '';
}

function removeItem(idx: number) {
  if (!buffer.value) return;
  buffer.value.items.splice(idx, 1);
}

function move(idx: number, delta: number) {
  if (!buffer.value) return;
  const items = buffer.value.items;
  const to = idx + delta;
  if (to < 0 || to >= items.length) return;
  const [m] = items.splice(idx, 1);
  items.splice(to, 0, m);
}

let dragFrom = -1;
function onDragStart(idx: number, e: DragEvent) {
  dragFrom = idx;
  e.dataTransfer?.setData('text/plain', String(idx));
}
function onDrop(idx: number) {
  if (!buffer.value) return;
  if (dragFrom < 0 || dragFrom === idx) {
    dragFrom = -1;
    return;
  }
  move(dragFrom, idx - dragFrom);
  dragFrom = -1;
}

function cancel() {
  buffer.value = snapshotFromStore();
}

async function save() {
  if (!buffer.value) return;

  try {
    const setId = buffer.value.id;
    const name = buffer.value.name.trim().slice(0, 20) || '未命名';

    // 1. 更新套餐名称
    await api.patch(`/wheel-sets/${setId}`, { name });

    // 2. 获取当前数据库中的项目
    const currentSet = await api.get<{ items: WheelItem[] }>(`/wheel-sets/${setId}`);
    const currentItems = currentSet.items || [];
    const currentItemIds = new Set(currentItems.map((i: WheelItem) => i.id));

    // 3. 处理前端的项目数据
    const frontendItems = buffer.value.items
      .map((i: WheelItem) => ({
        id: i.id,
        name: (i.name || '').trim().slice(0, 12),
        description: i.description?.trim().slice(0, 50) || null,
        color: i.color || null,
      }))
      .filter((i: any) => i.name);

    const frontendItemIds = new Set(frontendItems.map((i) => i.id));

    // 4. 删除不存在的项目
    for (const item of currentItems) {
      if (!frontendItemIds.has(item.id)) {
        await api.delete(`/wheel-sets/${setId}/items/${item.id}`);
      }
    }

    // 5. 新增或更新项目
    for (const [index, item] of frontendItems.entries()) {
      if (currentItemIds.has(item.id)) {
        // 更新现有项目
        await api.patch(`/wheel-sets/${setId}/items/${item.id}`, {
          name: item.name,
          description: item.description,
          color: item.color,
        });
      } else {
        // 新增项目
        await api.post(`/wheel-sets/${setId}/items`, {
          name: item.name,
          description: item.description,
          color: item.color,
          order: index,
        });
      }
    }

    // 6. 重新排序
    await api.post(`/wheel-sets/${setId}/items:reorder`, {
      items: frontendItems.map((item: any, index: number) => ({
        id: item.id,
        order: index,
      })),
    });

    // 重新加载数据
    await store.load();
    buffer.value = snapshotFromStore();
    ElMessage.success('已保存');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败，请重试');
  }
}

watch(
  wheelSets,
  () => {
    buffer.value = snapshotFromStore();
    if (!store.currentWheelSetId && store.wheelSets.length > 0) {
      store.setCurrentSet(store.wheelSets[0].id);
      buffer.value = snapshotFromStore();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.page {
  min-height: 100vh;
}

/* 内容容器 */
.content-container {
  flex: 1;
  min-height: 0; /* 防止flex子项撑开父容器 */
}

/* 移动端将容器改为纵向堆叠，避免 aside 占满宽度挤掉主内容 */
.mobile-column {
  flex-direction: column;
}

/* 侧边栏样式 */
.side {
  padding: 8px;
  transition: all 0.3s ease;
  border-right: 1px solid #e4e7ed;
}

.side-card {
  height: 100%;
}

.mobile-side {
  padding: 12px;
  border-right: none;
  border-bottom: 1px solid #e4e7ed;
}

/* 移动端套餐选择器 */
.mobile-set-selector {
  margin-bottom: 16px;
}

.mobile-set-dropdown {
  width: 100%;
}

/* 套餐菜单 */
.set-scrollbar {
  margin-bottom: 16px;
}

.set-menu :deep(.el-menu-item) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.name {
  flex: 1;
  margin-right: 8px;
}

.delete-btn {
  flex-shrink: 0;
}

/* 新建套餐区域 */
.add {
  margin-top: 16px;
}

.new-set-input {
  margin-bottom: 8px;
}

.new-set-btn {
  width: 100%;
}

.back-btn {
  width: 100%;
}

.home-btn {
  flex-shrink: 0;
}

/* 主内容区域 */
.main {
  padding: 8px;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

.mobile-main {
  padding: 12px;
}

/* 编辑卡片 */
.edit-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-header.small {
  justify-content: space-between;
}

.item-count {
  flex-shrink: 0;
}

/* 表单样式 */
.mb12 {
  margin-bottom: 12px;
}

.name-input {
  width: 100%;
}

/* 添加选项区域 */
.add-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.add-item-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.new-item-input,
.new-item-description {
  flex: 1;
  min-width: 200px;
}

.add-item-btn {
  flex-shrink: 0;
}

/* 选项列表 */
.item-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s ease;
}

.item-row:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-right: 8px;
}

.item-input,
.item-description {
  width: 100%;
}

.row-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.move-btn,
.remove-btn {
  flex-shrink: 0;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-btn,
.save-btn {
  min-width: 80px;
}

/* 预览卡片 */
.preview-card {
  margin-top: 16px;
}

.preview {
  display: grid;
  place-items: center;
  padding: 16px;
}

/* 移动端空状态 */
.mobile-empty-main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .side {
    padding: 12px 12px 0 12px;
  }

  .main {
    padding: 12px;
  }

  .add-item {
    flex-direction: column;
    align-items: stretch;
  }

  .new-item-input,
  .new-item-description {
    min-width: 100%;
  }

  .add-item-btn {
    width: 100%;
  }

  .item-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .row-actions {
    justify-content: center;
  }

  .actions {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
  }

  .preview {
    padding: 8px;
  }
}

@media (max-width: 480px) {
  .side {
    padding: 12px 12px 0 12px;
  }

  .main {
    padding: 12px;
  }

  .set-menu :deep(.el-menu-item) {
    padding: 16px 20px;
  }

  .item-row {
    padding: 16px;
  }

  .preview {
    padding: 4px;
  }
}

@media (min-width: 769px) {
  .side {
    padding: 12px;
  }

  .main {
    padding: 12px;
  }

  .add-item {
    align-items: center;
  }

  .new-item-input,
  .new-item-description {
    min-width: 300px;
  }
}

@media (min-width: 1024px) {
  .side {
    padding: 16px;
  }

  .main {
    padding: 16px;
  }

  .preview {
    padding: 24px;
  }
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.24s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .set-menu :deep(.el-menu-item) {
    min-height: 48px;
  }

  .delete-btn,
  .move-btn,
  .remove-btn {
    min-height: 36px;
    min-width: 60px;
  }

  .new-set-btn,
  .add-item-btn,
  .cancel-btn,
  .save-btn {
    min-height: 44px;
  }

  .item-row {
    padding: 16px;
  }
}
</style>
