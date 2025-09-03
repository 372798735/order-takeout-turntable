<template>
  <div class="bar">
    <div class="brand" @click="goHome">
      <el-icon><MagicStick /></el-icon>
      <span class="title">幸运大转盘</span>
    </div>
    <div class="actions">
      <!-- 自定义操作按钮插槽 -->
      <slot name="actions" />

      <!-- 用户头像下拉菜单 -->
      <el-dropdown v-if="auth.user" trigger="click" @command="handleUserCommand">
        <el-avatar :size="36" :src="auth.user?.avatar || defaultAvatar" class="avatar clickable" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MagicStick, User, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const defaultAvatar =
  'https://cdn.nlark.com/yuque/0/2025/png/2488285/1755621011638-55f138ac-e500-45aa-8618-193902552145.png?x-oss-process=image%2Fformat%2Cwebp';

function goHome() {
  router.push('/');
}

// 处理用户下拉菜单命令
async function handleUserCommand(command: string) {
  if (command === 'profile') {
    await router.push('/profile');
  } else if (command === 'logout') {
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
}
</script>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  width: 100%;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.brand:hover {
  transform: scale(1.02);
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

.avatar.clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.avatar.clickable:hover {
  transform: scale(1.05);
}
</style>
