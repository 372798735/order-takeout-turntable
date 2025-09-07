<template>
  <el-container class="page">
    <el-header height="56px" class="bar">
      <div class="brand">
        <el-icon><User /></el-icon>
        <span class="title">个人资料</span>
      </div>
      <div class="actions">
        <el-button type="primary" text @click="$router.push('/')">返回首页</el-button>
      </div>
    </el-header>

    <el-main class="main">
      <el-card shadow="hover" class="card">
        <template #header>
          <div class="card-header small">
            <span>编辑资料</span>
          </div>
        </template>

        <el-form label-width="80px" class="form" :model="form">
          <el-form-item label="头像">
            <div class="avatar-display">
              <div class="avatar-preview">
                <img
                  :src="currentAvatarSrc"
                  alt="用户头像"
                  class="avatar-img"
                  @error="handleImageError"
                />
              </div>
            </div>
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model.trim="form.nickname" maxlength="20" show-word-limit />
          </el-form-item>
          <el-form-item label="性别">
            <el-select v-model="form.gender" placeholder="选择性别">
              <el-option label="保密" value="UNKNOWN" />
              <el-option label="男" value="MALE" />
              <el-option label="女" value="FEMALE" />
            </el-select>
          </el-form-item>
          <div class="actions">
            <el-button @click="reset">重置</el-button>
            <el-button type="primary" :loading="saving" @click="save">保存</el-button>
          </div>
        </el-form>
      </el-card>

      <!-- 登出卡片 -->
      <el-card shadow="hover" class="card logout-card">
        <template #header>
          <div class="card-header small">
            <span>账户操作</span>
          </div>
        </template>

        <div class="logout-section">
          <p class="logout-desc">退出登录后，您需要重新输入用户名和密码才能使用应用。</p>
          <div class="logout-actions">
            <el-button type="danger" :loading="loggingOut" @click="handleLogout" class="logout-btn">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>
        </div>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup>
import { reactive, onMounted, ref, computed } from 'vue';
import { User, SwitchButton } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png';
const imageError = ref(false);

const form = reactive({
  nickname: '',
  gender: 'UNKNOWN',
});
const saving = ref(false);
const loggingOut = ref(false);

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
  if (imageError.value) {
    return defaultAvatar;
  }
  return avatarSrc.value;
});

function handleImageError() {
  imageError.value = true;
  // 重置错误状态，以便用户头像更新后能重新尝试加载
  setTimeout(() => {
    imageError.value = false;
  }, 1000);
}

function load() {
  const u = auth.user || {};
  form.nickname = u.nickname || '';
  form.gender = u.gender || 'UNKNOWN';
}

onMounted(async () => {
  await auth.fetchMe().catch(() => {});
  load();
});

async function save() {
  saving.value = true;
  try {
    const updated = await api.patch('/me', {
      nickname: form.nickname.trim() || null,
      gender: form.gender || null,
    });
    auth.user = updated;
    auth.saveToStorage();
    ElMessage.success('已保存');
  } catch (e) {
    ElMessage.error((e && e.message) || '保存失败');
  } finally {
    saving.value = false;
  }
}

function reset() {
  load();
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？退出后需要重新登录才能使用应用。', '确认退出', {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    });

    loggingOut.value = true;

    // 调用登出方法
    await auth.logout();

    ElMessage.success('已退出登录');

    // 跳转到登录页面
    await router.push('/login');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Logout error:', error);
      ElMessage.error('退出登录失败，请重试');
    }
  } finally {
    loggingOut.value = false;
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
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
.main {
  padding: 12px;
}
.card {
  max-width: 640px;
  margin: 0 auto;
}
.form {
  padding-top: 4px;
}
.avatar-display {
  display: flex;
  justify-content: flex-start;
}

.avatar-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e4e7ed;
  transition: border-color 0.2s ease;
  flex-shrink: 0;
}

.avatar-preview:hover {
  border-color: #409eff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
/* 登出卡片样式 */
.logout-card {
  max-width: 640px;
  margin: 16px auto 0;
}

.logout-section {
  padding: 8px 0;
}

.logout-desc {
  color: #666;
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.5;
}

.logout-actions {
  display: flex;
  justify-content: center;
}

.logout-btn {
  min-width: 120px;
}

@media (max-width: 768px) {
  .main {
    padding: 12px;
  }
  .card {
    margin: 0 8px;
  }
  .logout-card {
    margin: 16px 8px 0;
  }
}
</style>
