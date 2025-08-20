<template>
  <ResponsiveWrapper spacing>
    <div class="auth-card">
      <h2 class="title">登录</h2>
      <form @submit.prevent="onSubmit">
        <div class="form-item">
          <label>手机号码</label>
          <input v-model.trim="phone" type="tel" placeholder="请输入手机号" @blur="validatePhone" />
          <p v-if="phoneError" class="error">{{ phoneError }}</p>
        </div>
        <div class="form-item">
          <label>密码</label>
          <input
            v-model.trim="password"
            :type="showPwd ? 'text' : 'password'"
            placeholder="至少6位"
            @blur="validatePassword"
          />
          <p v-if="passwordError" class="error">{{ passwordError }}</p>
        </div>
        <button class="submit" :disabled="submitting">
          {{ submitting ? '登录中...' : '登录' }}
        </button>
      </form>
      <div class="switch">还没有账号？ <router-link to="/register">去注册</router-link></div>
    </div>
  </ResponsiveWrapper>
  <div class="page-bg" />
  <button class="toggle-visibility" @click="showPwd = !showPwd">
    {{ showPwd ? '隐藏密码' : '显示密码' }}
  </button>
  <p v-if="submitError" class="toast">{{ submitError }}</p>
  <p v-if="submitSuccess" class="toast success">登录成功</p>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ResponsiveWrapper from '@/components/common/ResponsiveWrapper.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const phone = ref('');
const password = ref('');
const phoneError = ref('');
const passwordError = ref('');
const submitError = ref('');
const submitSuccess = ref(false);
const submitting = ref(false);
const showPwd = ref(false);

const phoneRegex = /^(?:(?:\+?86)?1[3-9]\d{9})$/;

function validatePhone() {
  if (!phone.value) {
    phoneError.value = '请输入手机号码';
  } else if (!phoneRegex.test(phone.value)) {
    phoneError.value = '请输入有效的中国大陆手机号码';
  } else {
    phoneError.value = '';
  }
}

function validatePassword() {
  if (!password.value || password.value.length < 6) {
    passwordError.value = '密码至少6位';
  } else {
    passwordError.value = '';
  }
}

async function onSubmit() {
  validatePhone();
  validatePassword();
  if (phoneError.value || passwordError.value) return;
  submitting.value = true;
  submitError.value = '';
  submitSuccess.value = false;
  try {
    await auth.loginWithPhone(phone.value, password.value);
    submitSuccess.value = true;
    const q = route.query || {};
    const redirect = typeof q.redirect === 'string' ? q.redirect : '/';
    setTimeout(() => router.replace(redirect), 400);
  } catch (e) {
    submitError.value = (e && e.message) || '登录失败';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-card {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  margin-top: 6vh;
}
.title {
  margin: 0 0 16px;
  font-size: 22px;
}
.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}
label {
  font-size: 14px;
  color: #555;
  margin-bottom: 6px;
}
input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}
.error {
  color: #d93025;
  font-size: 12px;
  margin: 6px 0 0;
}
.submit {
  width: 100%;
  height: 40px;
  background: #3f7cff;
  color: #fff;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.switch {
  margin-top: 12px;
  font-size: 14px;
  text-align: center;
}
.page-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #f6f9ff, #fff);
  z-index: -1;
}
.toggle-visibility {
  position: fixed;
  right: 16px;
  bottom: 16px;
  background: #eee;
  border: none;
  border-radius: 20px;
  padding: 8px 12px;
}
.toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 70px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}
.toast.success {
  background: #0a8f08;
}

@media (max-width: 576px) {
  .auth-card {
    margin: 4vh 8px 0;
    padding: 20px;
  }
}
</style>
