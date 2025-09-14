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
        <div class="avatar clickable">
          <img
            :src="currentAvatarSrc"
            :alt="auth.user?.nickname || '用户头像'"
            class="avatar-img"
            @error="handleImageError"
          />
        </div>
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
import { computed, ref, watch } from 'vue';
import { MagicStick, User, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png';
const imageError = ref(false);
const failedUrls = ref(new Set<string>());

// 计算头像源，确保总是有有效的图片URL
const avatarSrc = computed(() => {
  const userAvatar = auth.user?.avatar;
  if (userAvatar && userAvatar.trim() !== '') {
    return userAvatar;
  }
  return defaultAvatar;
});

// 当前显示的头像源（考虑错误状态）
const currentAvatarSrc = computed(() => {
  const src = avatarSrc.value;
  // 如果这个URL曾经加载失败过，直接使用默认头像
  if (failedUrls.value.has(src)) {
    return defaultAvatar;
  }
  return src;
});

// 监听用户头像变化，清除失败缓存
watch(
  () => auth.user?.avatar,
  (newAvatar, oldAvatar) => {
    if (newAvatar !== oldAvatar) {
      // 用户头像更新时，清除错误状态和失败URL缓存
      imageError.value = false;
      failedUrls.value.clear();
    }
  },
);

function goHome() {
  router.push('/');
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  const src = img.src;

  // 将失败的URL添加到失败列表中，避免重复尝试
  failedUrls.value.add(src);

  // 如果失败的不是默认头像，切换到默认头像
  if (src !== defaultAvatar) {
    imageError.value = true;
    // 强制使用默认头像
    img.src = defaultAvatar;
  }
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e4e7ed;
}

.avatar.clickable:hover {
  transform: scale(1.05);
  border-color: #409eff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
