<template>
  <el-container class="page">
    <el-aside width="300px" class="side">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header small">
            <span>套餐列表</span>
            <el-button type="primary" text size="small" @click="addSet"
              >新建</el-button
            >
          </div>
        </template>
        <el-scrollbar max-height="50vh">
          <el-menu
            :default-active="activeId || ''"
            class="set-menu"
            @select="selectSet"
          >
            <el-menu-item v-for="s in wheelSets" :key="s.id" :index="s.id">
              <span class="name">{{ s.name }}</span>
              <el-button link type="danger" @click.stop="removeSet(s.id)"
                >删除</el-button
              >
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
        <div class="add">
          <el-input
            v-model.trim="newSetName"
            placeholder="新建套餐名称(≤20)"
            size="small"
            maxlength="20"
          />
          <el-button class="mt8" type="primary" size="small" @click="addSet"
            >新建套餐</el-button
          >
        </div>
        <el-divider />
        <el-button text type="primary" @click="$router.push('/')"
          >返回首页</el-button
        >
      </el-card>
    </el-aside>

    <el-main v-if="buffer" class="main">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header small">
            <span>编辑套餐</span>
            <el-tag type="info" effect="plain"
              >{{ buffer.items.length }}/15</el-tag
            >
          </div>
        </template>

        <el-form label-width="80px" size="small" class="mb12">
          <el-form-item label="名称">
            <el-input
              v-model.trim="buffer.name"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div class="add-item">
          <el-input
            v-model.trim="newItemName"
            placeholder="新增选项(≤10)"
            maxlength="10"
            size="small"
          />
          <el-button
            type="primary"
            size="small"
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
            @dragstart="onDragStart(idx, $event)"
            @dragover.prevent
            @drop="onDrop(idx)"
          >
            <el-input
              v-model.trim="it.name"
              maxlength="10"
              size="small"
              class="item-input"
            />
            <div class="row-actions">
              <el-button
                size="small"
                :disabled="idx === 0"
                @click="move(idx, -1)"
                >上移</el-button
              >
              <el-button
                size="small"
                :disabled="idx === buffer.items.length - 1"
                @click="move(idx, 1)"
                >下移</el-button
              >
              <el-button size="small" type="danger" @click="removeItem(idx)"
                >删除</el-button
              >
            </div>
          </li>
        </transition-group>

        <div class="actions">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </div>
      </el-card>

      <el-card class="mt12" shadow="hover">
        <template #header>
          <div class="card-header small">
            <span>预览</span>
          </div>
        </template>
        <div class="preview">
          <WheelCanvas :items="buffer.items" :size="360" />
        </div>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useWheelStore, type WheelItem } from "@/stores/wheel";
import WheelCanvas from "@/components/wheel/WheelCanvas.vue";
import { ElMessage } from "element-plus";

const store = useWheelStore();

const wheelSets = computed(() => store.wheelSets);
const activeId = computed(() => store.currentWheelSetId);
const newSetName = ref("");
const newItemName = ref("");

type Buffer = { id: string; name: string; items: WheelItem[] };
const buffer = ref<Buffer | null>(null);

function snapshotFromStore(): Buffer | null {
  const s = store.currentSet;
  if (!s) return null;
  return { id: s.id, name: s.name, items: s.items.map((i) => ({ ...i })) };
}

function selectSet(id: string) {
  store.setCurrentSet(id);
  buffer.value = snapshotFromStore();
}

function addSet() {
  const name = newSetName.value.trim();
  if (!name) return ElMessage.warning("请输入套餐名称");
  store.addSet(name.slice(0, 20));
  newSetName.value = "";
  buffer.value = snapshotFromStore();
}

function removeSet(id: string) {
  store.deleteSet(id);
  buffer.value = snapshotFromStore();
}

function addItem() {
  if (!buffer.value) return;
  if (buffer.value.items.length >= 15)
    return ElMessage.warning("最多 15 个选项");
  const name = newItemName.value.trim();
  if (!name) return;
  const id = `${Date.now()}`;
  buffer.value.items.push({ id, name: name.slice(0, 10) });
  newItemName.value = "";
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
  e.dataTransfer?.setData("text/plain", String(idx));
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
  const name = buffer.value.name.trim().slice(0, 20) || "未命名";
  const items = buffer.value.items
    .map((i) => ({ ...i, name: (i.name || "").trim().slice(0, 10) }))
    .filter((i) => i.name);
  store.updateSet(buffer.value.id, { name, items });
  buffer.value = snapshotFromStore();
  ElMessage.success("已保存");
}

watch(
  wheelSets,
  () => {
    buffer.value = snapshotFromStore();
  },
  { immediate: true },
);
</script>

<style scoped>
.page {
  min-height: 100vh;
}
.side {
  padding: 8px;
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
  justify-content: space-between;
}
.add {
  margin-top: 8px;
}
.mt8 {
  margin-top: 8px;
}
.mt12 {
  margin-top: 12px;
}
.mb12 {
  margin-bottom: 12px;
}
.set-menu :deep(.el-menu-item) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 6px;
  margin-top: 8px;
}
.item-list li {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: #fff;
}
.row-actions :deep(.el-button + .el-button) {
  margin-left: 4px;
}
.preview {
  display: grid;
  place-items: center;
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
</style>
