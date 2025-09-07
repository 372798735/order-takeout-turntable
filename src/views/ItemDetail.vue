<template>
  <el-container class="page">
    <el-header height="56px">
      <AppHeader>
        <template #actions>
          <el-button type="primary" text @click="$router.back()" class="back-btn"> 返回 </el-button>
        </template>
      </AppHeader>
    </el-header>

    <el-main class="main">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="item" class="item-detail">
        <el-card shadow="hover" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>选项详情</span>
            </div>
          </template>

          <div class="item-info">
            <div class="item-name">
              <h2>{{ item.name }}</h2>
              <el-tag v-if="item.color" :color="item.color" class="color-tag">
                颜色: {{ item.color }}
              </el-tag>
            </div>

            <div v-if="item.description" class="item-description">
              <h3>备注</h3>
              <p>{{ item.description }}</p>
            </div>

            <div class="item-meta">
              <div class="meta-item">
                <span class="label">所属套餐:</span>
                <span class="value">{{ setName }}</span>
              </div>
              <div class="meta-item">
                <span class="label">创建时间:</span>
                <span class="value">{{ formatDate(item.createdAt || '') }}</span>
              </div>
              <div class="meta-item">
                <span class="label">最后更新:</span>
                <span class="value">{{ formatDate(item.updatedAt || '') }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="actions-card">
          <template #header>
            <div class="card-header">
              <span>操作</span>
            </div>
          </template>

          <div class="action-buttons">
            <el-button type="primary" @click="goToManagement">
              <el-icon><Edit /></el-icon>
              编辑此套餐
            </el-button>
            <el-button @click="$router.push('/')">
              <el-icon><MagicStick /></el-icon>
              开始转盘
            </el-button>
          </div>
        </el-card>
      </div>

      <div v-else class="error">
        <el-empty description="未找到该选项" />
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useWheelStore } from '@/stores/wheel';
import type { WheelItem } from '@/stores/wheel';
import AppHeader from '@/components/common/AppHeader.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const wheelStore = useWheelStore();

const loading = ref(true);
const item = ref<WheelItem | null>(null);
const setName = ref('');

onMounted(async () => {
  try {
    await wheelStore.load();
    await auth.fetchMe().catch(() => {});

    const setId = route.params.setId as string;
    const itemId = route.params.itemId as string;

    // 查找对应的套餐和选项
    const wheelSet = wheelStore.wheelSets.find((set: any) => set.id === setId);
    if (wheelSet) {
      setName.value = wheelSet.name;
      item.value = wheelSet.items.find((it: any) => it.id === itemId) || null;
    }
  } catch (error) {
    console.error('Load item detail error:', error);
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN');
}

function goToManagement() {
  const setId = route.params.setId as string;
  router.push(`/manage?setId=${setId}`);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #fffbfe;
}

.back-btn {
  flex-shrink: 0;
}

/* 主内容样式 */
.main {
  padding: 16px;
}

.loading {
  max-width: 800px;
  margin: 0 auto;
}

.item-detail {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  background: #fff;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 16px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.item-name {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-name h2 {
  margin: 0;
  font-size: 24px;
  color: #1f1f1f;
}

.color-tag {
  align-self: flex-start;
}

.item-description {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.item-description h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.item-description p {
  margin: 0;
  line-height: 1.6;
  color: #666;
  white-space: pre-wrap;
  font-size: 14px;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.value {
  color: #333;
}

.actions-card {
  background: #fff;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.error {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main {
    padding: 12px;
  }

  .item-name h2 {
    font-size: 20px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
