<template>
  <el-container class="page" :class="{ 'mobile-column': isMobile }">
    <!-- 响应式侧边栏 - 移动端变为顶部，PC端保持左侧 -->
    <el-aside
      :width="isMobile ? '100%' : '320px'"
      class="side"
      :class="{ 'mobile-side': isMobile }"
    >
      <el-card shadow="hover" class="side-card">
        <template #header>
          <div class="card-header small">
            <span>套餐列表</span>
            <el-button type="primary" text size="small" @click="addSet" class="add-btn">
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
              <el-button link type="danger" @click.stop="removeSet(s.id)" class="delete-btn">
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

        <!-- 用户信息和操作 -->
        <div v-if="auth.user" class="user-section">
          <div class="user-info">
            <el-avatar :size="32" :src="auth.user?.avatar || defaultAvatar" />
            <span class="user-name">{{ auth.user?.nickname || '用户' }}</span>
          </div>
          <div class="user-actions">
            <el-button text type="primary" @click="$router.push('/profile')" size="small">
              个人资料
            </el-button>
            <el-button text type="danger" @click="handleLogout" size="small"> 退出登录 </el-button>
          </div>
        </div>

        <el-divider />
        <el-button text type="primary" @click="$router.push('/')" class="back-btn">
          返回首页
        </el-button>
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
              placeholder="备注信息(可选)"
              size="small"
              class="new-item-description"
              type="textarea"
              :rows="2"
            />
          </div>
          <el-button
            type="primary"
            size="small"
            :disabled="buffer.items.length >= 15"
            @click="addItem"
            class="add-item-btn"
          >
            添加
          </el-button>
        </div>

        <transition-group name="list" tag="ul" class="item-list">
          <li
            v-for="(it, idx) in buffer.items"
            :key="it.id"
            draggable="true"
            @dragstart="onDragStart(idx, $event)"
            @dragover.prevent
            @drop="onDrop(idx)"
            class="item-row"
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
                size="small"
                class="item-description"
                placeholder="备注信息(可选)"
                type="textarea"
                :rows="1"
              />
            </div>
            <div class="row-actions">
              <el-button size="small" :disabled="idx === 0" @click="move(idx, -1)" class="move-btn">
                上移
              </el-button>
              <el-button
                size="small"
                :disabled="idx === buffer.items.length - 1"
                @click="move(idx, 1)"
                class="move-btn"
              >
                下移
              </el-button>
              <el-button size="small" type="danger" @click="removeItem(idx)" class="remove-btn">
                删除
              </el-button>
            </div>
          </li>
        </transition-group>

        <div class="actions">
          <el-button @click="cancel" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="save" class="save-btn">保存</el-button>
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
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useWheelStore, type WheelItem } from '@/stores/wheel';
import WheelCanvas from '@/components/wheel/WheelCanvas.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const store = useWheelStore();
const auth = useAuthStore();
const router = useRouter();

// 默认头像
const defaultAvatar =
  'https://cdn.nlark.com/yuque/0/2025/png/2488285/1755621011638-55f138ac-e500-45aa-8618-193902552145.png?x-oss-process=image%2Fformat%2Cwebp';

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

// 处理登出
async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    });

    await auth.logout();
    ElMessage.success('已退出登录');
    await router.push('/login');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Logout error:', error);
      ElMessage.error('退出登录失败，请重试');
    }
  }
}

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

  const id = `${Date.now()}`;
  const description = newItemDescription.value.trim();

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
function save() {
  if (!buffer.value) return;
  const name = buffer.value.name.trim().slice(0, 20) || '未命名';
  const items = buffer.value.items
    .map((i: WheelItem) => ({
      ...i,
      name: (i.name || '').trim().slice(0, 12), // 修改为12个字符限制
      description: (i.description || '').trim() || undefined,
    }))
    .filter((i: WheelItem) => i.name);
  store.updateSet(buffer.value.id, { name, items });
  buffer.value = snapshotFromStore();
  ElMessage.success('已保存');
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

/* 移动端将容器改为纵向堆叠，避免 aside 占满宽度挤掉主内容 */
.mobile-column {
  flex-direction: column;
}

/* 侧边栏样式 */
.side {
  padding: 8px;
  transition: all 0.3s ease;
}

.side-card {
  height: 100%;
}

.mobile-side {
  padding: 12px;
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

/* 用户信息样式 */
.user-section {
  margin: 8px 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-actions .el-button {
  justify-content: flex-start;
  padding: 4px 0;
}

/* 主内容区域 */
.main {
  padding: 8px;
  transition: all 0.3s ease;
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

.new-item-input {
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

.item-input {
  width: 100%;
}

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

  .new-item-input {
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

  .new-item-input {
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
